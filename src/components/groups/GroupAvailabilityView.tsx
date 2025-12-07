"use client";
import { useEffect, useState, useRef } from "react";

interface GroupAvailabilityViewProps {
  groupId: string;
  memberIds: string[];
  memberInfo: Record<string, { name: string; email: string }>;
  currentUser: any;
}

interface TimeSlot {
  start: Date;
  end: Date;
  availableCount: number; // Number of members available
  unavailableCount: number; // Number of members unavailable
  totalMembers: number;
}

export function GroupAvailabilityView({
  groupId,
  memberIds,
  memberInfo,
  currentUser,
}: GroupAvailabilityViewProps) {
  // Initialize to null on both server and initial client render to keep markup stable.
  // Populate the real date on the client in useEffect to avoid hydration mismatches.
  const [currentWeek, setCurrentWeek] = useState<Date | null>(null);
  const [memberEvents, setMemberEvents] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get start and end of week
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.getFullYear(), d.getMonth(), diff);
  };

  const getEndOfWeek = (date: Date) => {
    const start = getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  };

  // Fetch events for the current week
  useEffect(() => {
  // Do not attempt to fetch until we have a concrete currentWeek on the client
  if (currentWeek === null) return;
    (async () => {
      if (!currentUser || memberIds.length === 0) return;

      setLoading(true);
      try {
        const idToken = await currentUser.getIdToken();
  const weekStart = getStartOfWeek(currentWeek!);
  const weekEnd = getEndOfWeek(currentWeek!);

        const timeMin = weekStart.toISOString();
        const timeMax = weekEnd.toISOString();

        const res = await fetch(
          `/api/groups/${groupId}/availability?timeMin=${timeMin}&timeMax=${timeMax}`,
          {
            headers: { Authorization: `Bearer ${idToken}` },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setMemberEvents(data.events || {});
        }
      } catch (error) {
        console.error("Failed to fetch availability:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId, currentWeek, memberIds, currentUser]);

  // Set currentWeek on the client only
  useEffect(() => {
    setCurrentWeek(new Date());
  }, []);

  // Calculate available time slots with heat map data
  useEffect(() => {
  if (currentWeek === null) return;

  const weekStart = getStartOfWeek(currentWeek!);
    const slots: TimeSlot[] = [];
    const totalMembers = memberIds.length;

    if (totalMembers === 0) {
      setAvailableSlots([]);
      return;
    }

    // Check each hour for the entire day (12 AM to 11 PM)
    for (let day = 0; day < 7; day++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + day);

      for (let hour = 0; hour < 24; hour++) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(date);
        slotEnd.setHours(hour + 1, 0, 0, 0);

        // Count how many members are available and unavailable during this slot
        let availableCount = 0;
        let unavailableCount = 0;
        for (const memberId of memberIds) {
          const events = memberEvents[memberId] || [];
          const hasConflict = events.some((event: any) => {
            const eventStart = new Date(
              event.start?.dateTime || event.start?.date || 0
            );
            const eventEnd = new Date(
              event.end?.dateTime || event.end?.date || 0
            );

            // Check if event overlaps with slot
            return eventStart < slotEnd && eventEnd > slotStart;
          });

          if (hasConflict) {
            unavailableCount++;
          } else {
            availableCount++;
          }
        }

        slots.push({
          start: slotStart,
          end: slotEnd,
          availableCount,
          unavailableCount,
          totalMembers,
        });
      }
    }

    setAvailableSlots(slots);
  }, [memberEvents, memberIds, currentWeek]);

  // Scroll to 8 AM when component loads or week changes
  useEffect(() => {
    if (scrollContainerRef.current && !loading) {
      // 8 AM is hour 8, each hour is 60px tall
      // Scroll to position: 8 hours * 60px = 480px
      // Subtract a bit to show some context above
      const scrollPosition = 8 * 60 - 120; // 8 AM minus 2 hours of context
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, [loading, currentWeek]);

  const goToPreviousWeek = () => {
  const newDate = new Date(currentWeek!);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeek(newDate);
  };

  const goToNextWeek = () => {
  const newDate = new Date(currentWeek!);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeek(newDate);
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  if (currentWeek === null) {
    return (
      <div className="text-center py-8">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-blue-400"></div>
        <p className="mt-2 text-sm text-gray-400">Loading availability...</p>
      </div>
    );
  }

  const weekStart = getStartOfWeek(currentWeek);
  const weekEnd = getEndOfWeek(currentWeek);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const timeSlots = Array.from({ length: 24 }, (_, i) => i); // 12 AM (0) to 11 PM (23) - full 24 hours

  const getSlotAvailability = (date: Date, hour: number) => {
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(date);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    const slot = availableSlots.find(
      (s) =>
        s.start.getTime() === slotStart.getTime() &&
        s.end.getTime() === slotEnd.getTime()
    );

    return slot || null;
  };

  const getHeatMapColor = (availableCount: number, totalMembers: number) => {
    if (totalMembers === 0) return "bg-gray-800";

    const percentage = availableCount / totalMembers;

    // Heat map: darker green = more available, red = less available
    if (percentage === 1) {
      return "bg-green-700"; // All available - darkest green
    } else if (percentage >= 0.75) {
      return "bg-green-800/70"; // Most available
    } else if (percentage >= 0.5) {
      return "bg-green-900/50"; // Half available
    } else if (percentage >= 0.25) {
      return "bg-yellow-900/40"; // Some available
    } else if (percentage > 0) {
      return "bg-orange-900/30"; // Few available
    } else {
      return "bg-red-900/20"; // None available
    }
  };

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={goToPreviousWeek}
            className="rounded-lg px-3 py-1.5 text-white hover:bg-gray-700 transition-colors"
          >
            ←
          </button>
          <button
            onClick={goToToday}
            className="rounded-lg px-3 py-1.5 text-sm text-white hover:bg-gray-700 transition-colors"
          >
            Today
          </button>
          <button
            onClick={goToNextWeek}
            className="rounded-lg px-3 py-1.5 text-white hover:bg-gray-700 transition-colors"
          >
            →
          </button>
          <div className="text-sm font-semibold text-white">
            {weekStart.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })} {" "}
            - {" "}
            {weekEnd.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-blue-400"></div>
          <p className="mt-2 text-sm text-gray-400">Loading availability...</p>
        </div>
      ) : (
        <div className="rounded-lg border-2 border-gray-700 bg-gray-800 overflow-hidden">
          <div
            ref={scrollContainerRef}
            className="max-h-[600px] overflow-y-auto"
          >
            <div className="grid grid-cols-8 border-b-2 border-gray-700 sticky top-0 bg-gray-800 z-10">
              <div className="p-2 text-xs font-semibold text-gray-400 border-r border-gray-700">
                Time
              </div>
              {weekDays.map((date) => {
                const isToday =
                  date.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={date.toISOString()}
                    className={`p-2 text-center border-r border-gray-700 last:border-r-0 ${
                      isToday ? "bg-blue-900/30" : ""
                    }`}
                  >
                    <div className="text-xs font-semibold text-gray-400">
                      {dayNames[date.getDay()]}
                    </div>
                    <div
                      className={`text-sm font-bold ${
                        isToday ? "text-blue-400" : "text-white"
                      }`}
                    >
                      {date.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-8">
              {/* Time Column */}
              <div className="border-r border-gray-700 sticky left-0 bg-gray-800 z-10">
                {timeSlots.map((hour) => (
                  <div
                    key={hour}
                    className="border-b border-gray-700 p-2 text-xs text-gray-400"
                    style={{ height: "60px" }}
                  >
                    {hour === 12
                      ? "12 PM"
                      : hour > 12
                      ? `${hour - 12} PM`
                      : `${hour} AM`}
                  </div>
                ))}
              </div>

              {/* Day Columns - Heat Map */}
              {weekDays.map((date) => {
                const isToday =
                  date.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={date.toISOString()}
                    className={`border-r border-gray-700 last:border-r-0 ${
                      isToday ? "bg-blue-900/10" : ""
                    }`}
                  >
                    {timeSlots.map((hour) => {
                      const slot = getSlotAvailability(date, hour);
                      const heatColor = slot
                        ? getHeatMapColor(
                            slot.availableCount,
                            slot.totalMembers
                          )
                        : "bg-gray-800";

                      return (
                        <div
                          key={hour}
                          className={`border-b border-gray-700 p-1 ${heatColor} transition-colors hover:opacity-80`}
                          style={{ height: "60px" }}
                          title={
                            slot
                              ? `${slot.availableCount}/${slot.totalMembers} available`
                              : "No data"
                          }
                        >
                          {slot && slot.availableCount > 0 && (
                            <div className="text-[10px] font-semibold text-white">
                              {slot.availableCount}/{slot.totalMembers}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
