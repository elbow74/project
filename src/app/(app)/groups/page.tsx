"use client";
import { useAppState } from "@/state/AppStateContext";
import { Button } from "@/components/ui/button";
import Collapsible from "@/components/groups/collapse-box";
import { useState } from "react";

export default function GroupsPage() {
  const { groups } = useAppState();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Groups</h1>
      <ul className="list-disc pl-6">
        {groups.map((g) => (
          <li key={g.id}>
            {g.name} · {g.members.length} members
          </li>
        ))}
      </ul>
      <Button onClick={() => alert("Add group flow")}>New Group</Button>
    </div>
  );
}
