"use client";
import { useAppState } from "@/state/AppStateContext";

export default function CalendarPage() {
  const { events } = useAppState();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Calendar</h1>
      {/* Replace with your real <CalendarView /> when moved to components */}
      <pre className="rounded-xl border p-4 text-sm overflow-auto">
        {JSON.stringify(events, null, 2)}
      </pre>
    </div>
  );
}
