"use client";
import { Button } from "@/components/ui/button";

export default function AIAssistantPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">AI Assistant</h1>
      <p className="text-muted-foreground">
        Hook your existing AI Assistant component here.
      </p>
      <Button onClick={() => alert("Open AI panel")}>Open Assistant</Button>
    </div>
  );
}
