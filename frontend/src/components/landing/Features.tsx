import { Mic, Brain, CheckCircle, Zap, Clock, Shield } from 'lucide-react';

const features = [
  {
    icon: Mic,
    title: 'Automatic Recording',
    description: 'AI bot joins your meetings on Zoom, Google Meet, or Teams to record and transcribe in real-time.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Summaries',
    description: 'GPT-4 analyzes conversations to generate concise summaries with key points and decisions.',
  },
  {
    icon: CheckCircle,
    title: 'Task Extraction',
    description: 'Automatically identifies action items, assignees, and due dates from meeting discussions.',
  },
  {
    icon: Zap,
    title: 'ClickUp Integration',
    description: 'Seamlessly sync extracted tasks directly to your ClickUp workspace with one click.',
  },
  {
    icon: Clock,
    title: 'Save Hours Weekly',
    description: 'Eliminate manual note-taking and task creation. Focus on what matters during meetings.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Enterprise-grade encryption ensures your meeting data stays confidential and protected.',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 md:py-32 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything you need to automate meeting notes
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful AI features that transform how your team captures and acts on meeting outcomes.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                >
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br from-[#8b7eeb] to-[#FF9190] opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />

                  {/* Icon */}
                  <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br from-[#8b7eeb] to-[#FF9190] flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 relative">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed relative">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
