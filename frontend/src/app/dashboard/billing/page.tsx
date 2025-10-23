'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { billingAPI } from '@/lib/api';
import { Clock, DollarSign, TrendingUp, CreditCard, Check, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

interface Plan {
  id: string;
  name: string;
  price: number;
  credits: number;
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    credits: 120,
    features: [
      '2 hours of recording per month',
      'Basic AI summaries',
      'Manual task extraction',
      'ClickUp integration',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    credits: 1200,
    features: [
      '20 hours of recording per month',
      'Advanced AI summaries with GPT-4',
      'Automatic task extraction',
      'Priority ClickUp sync',
      'Advanced analytics',
      'Priority support',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    price: 99,
    credits: -1,
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
];

export default function BillingPage() {
  const [billingSummary, setBillingSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseHours, setPurchaseHours] = useState(10);
  const [autoTopUp, setAutoTopUp] = useState(false);
  const [autoTopUpAmount, setAutoTopUpAmount] = useState(600);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      const res = await billingAPI.getSummary();
      setBillingSummary(res.data.data);
      setAutoTopUp(res.data.data.autoTopUp);
      setAutoTopUpAmount(res.data.data.autoTopUpAmount);
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseCredits = async () => {
    toast.info('Stripe integration required. This will open a payment modal.');
    // TODO: Integrate with Stripe Elements
  };

  const handleUpgradePlan = async (planId: string) => {
    toast.info('Stripe integration required. This will open a payment modal.');
    // TODO: Integrate with Stripe Elements
  };

  const handleToggleAutoTopUp = async () => {
    try {
      await billingAPI.configureAutoTopUp(!autoTopUp, autoTopUpAmount);
      setAutoTopUp(!autoTopUp);
      toast.success(`Auto top-up ${!autoTopUp ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update auto top-up settings');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#5e72eb] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading billing information...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const currentPlan = billingSummary?.plan || PLANS[0];
  const creditsHours = Math.round((billingSummary?.credits || 0) / 60);
  const usageHours = Math.round((billingSummary?.monthlyUsage?.minutes || 0) / 60);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Usage</h1>
          <p className="text-gray-600 mt-2">Manage your subscription and track your usage</p>
        </div>

        {/* Current Plan & Credits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-[#5e72eb]" />
              <h3 className="text-sm font-medium text-gray-600">Current Plan</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{currentPlan.name}</p>
            <p className="text-sm text-gray-600 mt-1">${currentPlan.price}/month</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-green-600" />
              <h3 className="text-sm font-medium text-gray-600">Credits Remaining</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{creditsHours}h</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{
                  width: `${Math.min(100, (creditsHours / (currentPlan.credits / 60)) * 100)}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-medium text-gray-600">Usage This Month</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{usageHours}h</p>
            <p className="text-sm text-gray-600 mt-1">
              ${billingSummary?.monthlyUsage?.cost?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>

        {/* Purchase Credits */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Purchase Additional Credits</h2>
          <p className="text-gray-600 mb-6">Add more recording hours at $5 per hour</p>

          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Hours</label>
              <input
                type="number"
                value={purchaseHours}
                onChange={(e) => setPurchaseHours(parseInt(e.target.value) || 0)}
                min="1"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5e72eb] focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Cost</label>
              <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-lg font-semibold text-gray-900">
                ${(purchaseHours * 5).toFixed(2)}
              </div>
            </div>
            <button
              onClick={handlePurchaseCredits}
              className="px-6 py-2 bg-[#5e72eb] text-white rounded-lg hover:bg-[#4d5fd1] transition-colors duration-200"
            >
              <CreditCard className="w-5 h-5 inline mr-2" />
              Purchase
            </button>
          </div>

          {/* Auto Top-up */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Auto Top-up</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Automatically purchase credits when balance is low
                </p>
              </div>
              <button
                onClick={handleToggleAutoTopUp}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  autoTopUp ? 'bg-[#5e72eb]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    autoTopUp ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Plans */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Subscription Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const isCurrentPlan = currentPlan.id === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-xl p-6 border-2 ${
                    isCurrentPlan
                      ? 'border-[#5e72eb] shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  } transition-all duration-200`}
                >
                  {plan.id === 'pro' && (
                    <div className="inline-block px-3 py-1 bg-[#5e72eb] text-white text-xs font-semibold rounded-full mb-4">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-4 mb-6">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600">/month</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <button
                      disabled
                      className="w-full py-3 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed font-semibold"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgradePlan(plan.id)}
                      className="w-full py-3 bg-[#5e72eb] text-white rounded-lg hover:bg-[#4d5fd1] transition-colors duration-200 font-semibold"
                    >
                      {plan.price > currentPlan.price ? 'Upgrade' : 'Downgrade'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions */}
        {billingSummary?.recentTransactions && billingSummary.recentTransactions.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {billingSummary.recentTransactions.map((transaction: any) => (
                <div key={transaction.id} className="p-6 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-semibold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">{transaction.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
