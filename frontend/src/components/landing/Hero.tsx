import { ArrowRight, Play } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-tr from-[#5e72eb] to-[#FF9190] from-background/10 to-background/10 py-20 md:py-24 max-w-[1470px] rounded-2xl my-10 mx-auto">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-white opacity-60 border border-[rgba(0,0,0,0.15)] rounded-2xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/40 rounded-full px-4 py-2 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF9190] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF9190]" />
            </span>
            <span className="text-sm font-medium text-gray-700">Now in Early Access</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-700 mb-6 leading-tight">
            From meeting to action,{' '}
            <span className="bg-white inline-block p-2 relative -z-10">
              <span className="bg-gradient-to-r from-[#5e72eb] to-[#ffb3b2] bg-clip-text text-transparent">
              automatically</span>
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Record, summarize, and turn your conversations into ClickUp tasks — all without lifting a finger.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button className="inline-flex items-center justify-center whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-10 bg-white text-[#5e72eb] hover:bg-white/90 font-semibold px-8 py-6 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              Start Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            <button className="inline-flex items-center justify-center whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border shadow-sm hover:text-accent-foreground h-10 bg-white/30 backdrop-blur-sm text-gray-600 border-white/30 hover:bg-white/20 font-semibold px-8 py-6 text-lg rounded-xl transition-all duration-300">
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </button>
          </div>

          {/* Feature badges */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-gray/80 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#5e72eb]" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#5e72eb]" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>2 hours free forever</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#5e72eb]" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
