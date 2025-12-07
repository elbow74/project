"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { storage } from "@/utils/storage";
import type { Event, Group, User, Availability } from "@/types";

interface Ctx {
  users: User[];
  events: Event[];
  groups: Group[];
  availability: Availability[];
  linkStatus: boolean;
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
}

const AppState = createContext<Ctx | null>(null);

const DEMO = {
  users: [
    { id: "u_1", name: "Alex", email: "alex@example.com" },
    { id: "u_2", name: "Riley", email: "riley@example.com" },
  ],
  events: [
    {
      id: "e_1",
      title: "Standup",
      start: new Date().toISOString(),
      end: new Date(Date.now() + 3.6e6).toISOString(),
      attendees: ["u_1", "u_2"],
    },
  ],
  groups: [
    {
      id: "g_1",
      name: "Core Team",
      ownerId: "u_1",
      code: "CORE",
      memberIds: ["u_1", "u_2"],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  availability: [],
  linkStatus: false,
};

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(() =>
    storage.get("users", DEMO.users)
  );
  const [events, setEvents] = useState<Event[]>(() =>
    storage.get("events", DEMO.events)
  );
  const [groups, setGroups] = useState<Group[]>(() =>
    storage.get("groups", DEMO.groups)
  );
  const [availability, setAvailability] = useState<Availability[]>(() =>
    storage.get("availability", DEMO.availability)
  );
  const [linkStatus, setLinkStatus] = useState<boolean>(() =>
    storage.get("linkStatus", DEMO.linkStatus)
  );

  useEffect(() => {
    storage.set("users", users);
    storage.set("events", events);
    storage.set("groups", groups);
    storage.set("availability", availability);
    storage.set("linkStatus", linkStatus);
  }, [users, events, groups, availability, linkStatus]);

  const value = useMemo(
    () => ({ users, events, groups, availability, linkStatus, setEvents }),
    [users, events, groups, availability, linkStatus]
  );

  return <AppState.Provider value={value}>{children}</AppState.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppState);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
