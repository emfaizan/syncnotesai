export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to SyncNotesAI
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI-powered meeting assistant that records, transcribes, and extracts tasks
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/auth/login"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Get Started
            </a>
            <a
              href="/auth/register"
              className="px-6 py-3 bg-white text-primary-600 border-2 border-primary-600 rounded-lg hover:bg-primary-50 transition"
            >
              Sign Up
            </a>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">🎙️</div>
            <h3 className="text-xl font-semibold mb-2">Record Meetings</h3>
            <p className="text-gray-600">
              Automatically record and transcribe meetings via Recall.ai
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">AI Summaries</h3>
            <p className="text-gray-600">
              Get intelligent summaries powered by GPT-4
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-xl font-semibold mb-2">Task Extraction</h3>
            <p className="text-gray-600">
              Automatically sync action items to ClickUp
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
