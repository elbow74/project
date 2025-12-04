"use client";
import { Button } from "@/components/ui/button";

export default function AIAssistantPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">AI Assistant</h1>
        <p className="mt-1 text-sm text-gray-400">
          Get help with your calendar and schedule
        </p>
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 p-12 text-center border border-gray-700 shadow-lg">
        <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6">
          <svg
            className="h-10 w-10 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          AI Assistant Coming Soon
        </h2>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          Hook your existing AI Assistant component here. This feature will help
          you manage your calendar and schedule more efficiently.
        </p>
        <Button
          onClick={() => alert("Open AI panel")}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Open Assistant
        </Button>
      </div>
    </div>
  );
}
