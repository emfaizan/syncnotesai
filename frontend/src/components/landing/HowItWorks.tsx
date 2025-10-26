import { UserPlus, FileText, CheckSquare, RefreshCw, ArrowRight } from 'lucide-react';

const steps = [
  {
    number: 1,
    icon: UserPlus,
    title: 'SyncNotesAI Joins Your Meeting',
    description: 'Our AI assistant automatically joins your scheduled meetings via Recall.ai integration.',
  },
  {
    number: 2,
    icon: FileText,
    title: 'AI Transcribes & Extracts',
    description: 'Real-time transcription captures everything while AI identifies key points and action items.',
  },
  {
    number: 3,
    icon: CheckSquare,
    title: 'Review Suggested Tasks',
    description: 'Quickly review and confirm the AI-suggested tasks and assignments in a clean interface.',
  },
  {
    number: 4,
    icon: RefreshCw,
    title: 'Auto-Sync to ClickUp',
    description: 'Approved tasks are instantly created in ClickUp with all details, assignees, and due dates.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-[#F8F9FB]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Four simple steps from meeting to action. No manual work required.
            </p>
          </div>

          {/* Steps grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connection line - only visible on large screens */}
            <div className="hidden lg:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-[#5e72eb] via-[#8b7eeb] to-[#FF9190] opacity-20" />

            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="relative">
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 h-full">
                    {/* Icon and number */}
                    <div className="relative mb-6">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#5e72eb] to-[#FF9190] flex items-center justify-center shadow-lg">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#FF9190] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {step.number}
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      <p className="text-sm font-semibold text-[#5e72eb] mb-2">
                        Step {step.number}
                      </p>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Arrow between steps - only visible on large screens and not after last step */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-16 -right-4 z-10 -mt-4">
                      <ArrowRight className="w-8 h-8 text-[#8b7eeb]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
