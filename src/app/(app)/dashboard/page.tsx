"use client";
import { useAppState } from "@/state/AppStateContext";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { users, events, groups, linkStatus } = useAppState();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Stat title="Users" value={users.length} />
        <Stat title="Events" value={events.length} />
        <Stat title="Groups" value={groups.length} />
      </div>
      <div className="rounded border p-4">
        <div className="mb-2 font-medium">Calendar Link</div>
        <p className="text-sm text-muted-foreground">
          {linkStatus ? "Linked" : "Not linked"}
        </p>
        {!linkStatus && (
          <Button
            className="mt-3"
            onClick={() => alert("Open link dialog here")}
          >
            Link Calendar
          </Button>
        )}
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="mt-1 text-3xl font-semibold">{value}</div>
    </div>
  );
}
