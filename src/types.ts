export type TimeISO = string;

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  isAuthenticated: boolean;
}

export interface Group {
  id: string;
  name: string;
  members: string[];
}

export interface Event {
  id: string;
  title: string;
  start: TimeISO;
  end: TimeISO;
  attendees: string[];
}

export interface TimeSlot {
  start: TimeISO;
  end: TimeISO;
}

export interface Availability {
  userId: string;
  slots: TimeSlot[];
}
