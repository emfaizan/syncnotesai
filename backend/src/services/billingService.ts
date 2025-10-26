import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  credits: number; // Monthly credits in minutes
  pricePerHour: number;
  features: string[];
}

export const PRICING_PLANS: { [key: string]: PricingPlan } = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    credits: 120, // 2 hours
    pricePerHour: 0,
    features: [
      '2 hours of recording per month',
      'Basic AI summaries',
      'Manual task extraction',
      'ClickUp integration',
      'Email support',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29,
    credits: 1200, // 20 hours
    pricePerHour: 1.45, // ~$29/20 hours
    features: [
      '20 hours of recording per month',
      'Advanced AI summaries with GPT-4',
      'Automatic task extraction',
      'Priority ClickUp sync',
      'Advanced analytics',
      'Priority support',
    ],
  },
  team: {
    id: 'team',
    name: 'Team',
    price: 99,
    credits: -1, // Unlimited
    pricePerHour: 0,
    features: [
      'Unlimited recording hours',
      'Premium AI summaries',
      'Automatic task assignment',
      'Team workspace',
      'Custom integrations',
      'Advanced security',
      'Dedicated support',
    ],
  },
};

// Pay-as-you-go pricing
export const PAYG_RATE = 5; // $5 per hour ($0.0833 per minute)
export const PAYG_MINUTE_RATE = PAYG_RATE / 60;

class BillingService {
  private stripe: Stripe;

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY;

    if (!apiKey) {
      logger.error('STRIPE_SECRET_KEY is not set');
      throw new Error('Stripe API key is required');
    }

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Create Stripe customer for user
   */
  async createCustomer(userId: string, email: string, name: string): Promise<string> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id },
      });

      logger.info('Stripe customer created', { userId, customerId: customer.id });
      return customer.id;
    } catch (error: any) {
      logger.error('Failed to create Stripe customer', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get or create Stripe customer
   */
  async getOrCreateCustomer(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    return this.createCustomer(userId, user.email, user.name);
  }

  /**
   * Deduct credits for meeting usage
   */
  async deductCredits(userId: string, minutes: number, meetingId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        throw new Error('User not found');
      }

      const cost = this.calculateCost(minutes, user.plan);
      const newCredits = Math.max(0, user.credits - minutes);

      // Update user credits
      await prisma.user.update({
        where: { id: userId },
        data: { credits: newCredits },
      });

      // Create usage record
      await prisma.usage.create({
        data: {
          userId,
          meetingId,
          minutes,
          cost,
        },
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          userId,
          type: 'usage',
          amount: -cost,
          credits: -minutes,
          status: 'completed',
          description: `Meeting recording (${minutes} minutes)`,
        },
      });

      logger.info('Credits deducted', { userId, minutes, newCredits });

      // Check for auto top-up
      if (user.autoTopUp && newCredits < 60) {
        // Less than 1 hour remaining
        await this.autoTopUp(userId, user.autoTopUpAmount);
      }
    } catch (error: any) {
      logger.error('Failed to deduct credits', { userId, minutes, error: error.message });
      throw error;
    }
  }

  /**
   * Calculate cost for minutes based on plan
   */
  calculateCost(minutes: number, plan: string): number {
    const planInfo = PRICING_PLANS[plan];

    if (plan === 'team') {
      return 0; // Unlimited for team plan
    }

    if (plan === 'free') {
      return 0; // Free plan doesn't charge
    }

    // For Pro plan, cost is included in subscription
    // For PAYG, charge per minute
    return minutes * PAYG_MINUTE_RATE;
  }

  /**
   * Purchase credits
   */
  async purchaseCredits(
    userId: string,
    hours: number,
    paymentMethodId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const customerId = await this.getOrCreateCustomer(userId);
      const credits = hours * 60; // Convert to minutes
      const amount = Math.round(hours * PAYG_RATE * 100); // Convert to cents

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethodId,
        off_session: false,
        confirm: true,
        description: `Purchase ${hours} hours of recording credits`,
        metadata: {
          userId,
          credits: credits.toString(),
          hours: hours.toString(),
        },
      });

      if (paymentIntent.status === 'succeeded') {
        await this.addCredits(userId, credits, paymentIntent.id);
      }

      return paymentIntent;
    } catch (error: any) {
      logger.error('Failed to purchase credits', { userId, hours, error: error.message });
      throw error;
    }
  }

  /**
   * Add credits to user account
   */
  async addCredits(userId: string, credits: number, paymentIntentId?: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        throw new Error('User not found');
      }

      const newCredits = user.credits + credits;
      const amount = (credits / 60) * PAYG_RATE;

      await prisma.user.update({
        where: { id: userId },
        data: { credits: newCredits },
      });

      await prisma.transaction.create({
        data: {
          userId,
          type: 'purchase',
          amount,
          credits,
          status: 'completed',
          stripePaymentIntentId: paymentIntentId,
          description: `Purchased ${credits / 60} hours of credits`,
        },
      });

      logger.info('Credits added', { userId, credits, newCredits });
    } catch (error: any) {
      logger.error('Failed to add credits', { userId, credits, error: error.message });
      throw error;
    }
  }

  /**
   * Auto top-up credits
   */
  async autoTopUp(userId: string, minutes: number): Promise<void> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user || !user.stripeCustomerId || !user.autoTopUp) {
        return;
      }

      logger.info('Triggering auto top-up', { userId, minutes });

      // Get default payment method
      const customer = await this.stripe.customers.retrieve(user.stripeCustomerId);

      if (customer.deleted || !customer.invoice_settings?.default_payment_method) {
        logger.warn('No default payment method for auto top-up', { userId });
        return;
      }

      const paymentMethodId =
        typeof customer.invoice_settings.default_payment_method === 'string'
          ? customer.invoice_settings.default_payment_method
          : customer.invoice_settings.default_payment_method.id;

      await this.purchaseCredits(userId, minutes / 60, paymentMethodId);
    } catch (error: any) {
      logger.error('Failed to auto top-up', { userId, error: error.message });
    }
  }

  /**
   * Create subscription for Pro or Team plan
   */
  async createSubscription(
    userId: string,
    planId: string,
    paymentMethodId: string
  ): Promise<Stripe.Subscription> {
    try {
      const customerId = await this.getOrCreateCustomer(userId);

      const plan = PRICING_PLANS[planId];
      if (!plan || plan.id === 'free') {
        throw new Error('Invalid plan');
      }

      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Create price if not exists (you should create these in Stripe Dashboard)
      const priceId = process.env[`STRIPE_PRICE_${planId.toUpperCase()}`];

      if (!priceId) {
        throw new Error(`Price ID not configured for plan: ${planId}`);
      }

      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user plan and credits
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: planId,
          credits: plan.credits,
          stripeSubscriptionId: subscription.id,
        },
      });

      // Create subscription record
      await prisma.subscription.create({
        data: {
          userId,
          plan: planId,
          status: subscription.status,
          amount: plan.price,
          currency: 'usd',
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          stripeProductId: subscription.items.data[0].price.product as string,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });

      logger.info('Subscription created', { userId, planId, subscriptionId: subscription.id });

      return subscription;
    } catch (error: any) {
      logger.error('Failed to create subscription', { userId, planId, error: error.message });
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string, immediate: boolean = false): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscriptions: { where: { status: 'active' }, take: 1 } },
      });

      if (!user || !user.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      if (immediate) {
        await this.stripe.subscriptions.cancel(user.stripeSubscriptionId);
      } else {
        await this.stripe.subscriptions.update(user.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      }

      // Update subscription record
      if (user.subscriptions[0]) {
        await prisma.subscription.update({
          where: { id: user.subscriptions[0].id },
          data: {
            cancelAtPeriodEnd: !immediate,
            canceledAt: immediate ? new Date() : null,
            status: immediate ? 'canceled' : 'active',
          },
        });
      }

      logger.info('Subscription canceled', { userId, immediate });
    } catch (error: any) {
      logger.error('Failed to cancel subscription', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get user billing summary
   */
  async getBillingSummary(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          usage: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          subscriptions: {
            where: { status: 'active' },
            take: 1,
          },
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const currentPlan = PRICING_PLANS[user.plan];

      // Calculate usage this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthlyUsage = await prisma.usage.aggregate({
        where: {
          userId,
          createdAt: { gte: startOfMonth },
        },
        _sum: {
          minutes: true,
          cost: true,
        },
      });

      return {
        plan: currentPlan,
        credits: user.credits,
        autoTopUp: user.autoTopUp,
        autoTopUpAmount: user.autoTopUpAmount,
        subscription: user.subscriptions[0] || null,
        monthlyUsage: {
          minutes: monthlyUsage._sum.minutes || 0,
          cost: monthlyUsage._sum.cost || 0,
        },
        recentUsage: user.usage,
        recentTransactions: user.transactions,
      };
    } catch (error: any) {
      logger.error('Failed to get billing summary', { userId, error: error.message });
      throw error;
    }
  }
}

export const billingService = new BillingService();
