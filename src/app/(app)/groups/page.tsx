"use client";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import Collapsible from "@/components/groups/collapse-box";
import { GroupAvailabilityView } from "@/components/groups/GroupAvailabilityView";
import { GroupChatBox } from "@/components/groups/GroupChatBox";
import { AllGroupsChatBox } from "@/components/groups/AllGroupsChatBox";
import { useAuth } from "@/context/authContext";
import { Group } from "@/types";

export default function GroupsPage() {
  const auth = useAuth() as { currentUser: any } | null;
  const currentUser = auth?.currentUser;
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [memberInfo, setMemberInfo] = useState<
    Record<string, { name: string; email: string }>
  >({});
  const [showAllGroupsChat, setShowAllGroupsChat] = useState(false);
  
  // Draggable button state
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef({ isDragging: false, dragStart: { x: 0, y: 0 }, hasMoved: false, startPosition: { x: 0, y: 0 } });

  // Load button position from localStorage on mount
  useEffect(() => {
    const savedPosition = localStorage.getItem("allGroupsChatButtonPosition");
    if (savedPosition) {
      try {
        const { x, y } = JSON.parse(savedPosition);
        // Validate position is within bounds
        const buttonSize = 56;
        const validX = Math.max(0, Math.min(x, window.innerWidth - buttonSize));
        const validY = Math.max(0, Math.min(y, window.innerHeight - buttonSize));
        setButtonPosition({ x: validX, y: validY });
      } catch (e) {
        // Use default position if parsing fails
        const buttonSize = 56;
        setButtonPosition({ x: window.innerWidth - buttonSize - 24, y: 24 });
      }
    } else {
      // Default position: top right
      const buttonSize = 56;
      setButtonPosition({ x: window.innerWidth - buttonSize - 24, y: 24 });
    }
  }, []);

  // Save button position to localStorage when it changes
  useEffect(() => {
    if (buttonPosition.x !== 0 || buttonPosition.y !== 0) {
      localStorage.setItem(
        "allGroupsChatButtonPosition",
        JSON.stringify(buttonPosition)
      );
    }
  }, [buttonPosition]);

  // Handle window resize to keep button in bounds
  useEffect(() => {
    const handleResize = () => {
      setButtonPosition((prev) => ({
        x: Math.min(prev.x, window.innerWidth - 56),
        y: Math.min(prev.y, window.innerHeight - 56),
      }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch user's groups
  useEffect(() => {
    (async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const idToken = await currentUser.getIdToken();
        const res = await fetch("/api/groups", {
          headers: { Authorization: `Bearer ${idToken}` },
        });

          if (res.ok) {
            const data = await res.json();
            setGroups(data.groups || []);
          }
      } catch (error) {
        console.error("Failed to fetch groups:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser]);

  // Fetch member info when groups change
  useEffect(() => {
    (async () => {
      if (!currentUser || groups.length === 0) return;

      try {
        const idToken = await currentUser.getIdToken();

        // Get all unique member IDs from all groups
        const allMemberIds = Array.from(
          new Set(groups.flatMap((g) => g.memberIds || []))
        );

        if (allMemberIds.length === 0) return;

        const res = await fetch("/api/users/batch", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userIds: allMemberIds }),
        });

        if (res.ok) {
          const data = await res.json();
          const infoMap: Record<string, { name: string; email: string }> = {};
          data.users.forEach((user: any) => {
            infoMap[user.id] = { name: user.name, email: user.email };
          });
          setMemberInfo(infoMap);
        }
      } catch (error) {
        console.error("Failed to fetch member info:", error);
      }
    })();
  }, [currentUser, groups]);

  const handleCreateGroup = async () => {
    if (!currentUser || !groupName.trim()) return;

    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: groupName.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setGroups((prev) => [...prev, data.group]);
        setGroupName("");
        setShowCreateModal(false);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to create group");
      }
    } catch (error) {
      console.error("Failed to create group:", error);
      alert("Failed to create group");
    }
  };

  const handleJoinGroup = async () => {
    if (!currentUser || !joinCode.trim()) return;

    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: joinCode.trim().toUpperCase() }),
      });

      if (res.ok) {
        const data = await res.json();
        setGroups((prev) => [...prev, data.group]);
        setJoinCode("");
        setShowJoinModal(false);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to join group");
      }
    } catch (error) {
      console.error("Failed to join group:", error);
      alert("Failed to join group");
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!currentUser) return;

    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch(`/api/groups/leave/${groupId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        setGroups((prev) => prev.filter((g) => g.id !== groupId));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to leave group");
      }
    } catch (error) {
      console.error("Failed to leave group:", error);
      alert("Failed to leave group");
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!currentUser) return;

    if (
      !confirm(
        "Are you sure you want to delete this group? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch(`/api/groups/delete/${groupId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (res.ok) {
        setGroups((prev) => prev.filter((g) => g.id !== groupId));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to delete group");
      }
    } catch (error) {
      console.error("Failed to delete group:", error);
      alert("Failed to delete group");
    }
  };

  // Drag handlers for the floating button
  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    dragStateRef.current = {
      isDragging: true,
      dragStart: {
        x: e.clientX - buttonPosition.x,
        y: e.clientY - buttonPosition.y,
      },
      hasMoved: false,
      startPosition: { ...buttonPosition },
    };
    setIsDragging(true);
  };

  // Add global mouse event listeners for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStateRef.current.isDragging) return;

      const newX = e.clientX - dragStateRef.current.dragStart.x;
      const newY = e.clientY - dragStateRef.current.dragStart.y;

      // Check if user has actually moved the mouse (more than 5px)
      const moved =
        Math.abs(newX - dragStateRef.current.startPosition.x) > 5 ||
        Math.abs(newY - dragStateRef.current.startPosition.y) > 5;
      if (moved) {
        dragStateRef.current.hasMoved = true;
      }

      // Constrain to viewport bounds
      const buttonSize = 56; // h-14 = 56px
      const constrainedX = Math.max(
        0,
        Math.min(newX, window.innerWidth - buttonSize)
      );
      const constrainedY = Math.max(
        0,
        Math.min(newY, window.innerHeight - buttonSize)
      );

      setButtonPosition({ x: constrainedX, y: constrainedY });
    };

    const handleMouseUp = () => {
      if (dragStateRef.current.isDragging) {
        const wasJustClick = !dragStateRef.current.hasMoved;
        dragStateRef.current.isDragging = false;
        setIsDragging(false);
        
        // Only open modal if user didn't drag (just clicked)
        if (wasJustClick) {
          setShowAllGroupsChat(true);
        }
        
        dragStateRef.current.hasMoved = false;
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, buttonPosition]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Groups</h1>
          <p className="mt-1 text-sm text-gray-400">Manage your groups</p>
        </div>
        <div className="rounded-2xl bg-gray-800 p-12 text-center shadow-lg border border-gray-700">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-blue-400"></div>
          <p className="mt-4 text-gray-300">Loading groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Groups</h1>
          <p className="mt-1 text-sm text-gray-400">
            Create and manage your groups
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowJoinModal(true)}
            className="border-2 border-gray-600 hover:bg-gray-700 text-gray-200 font-semibold"
          >
            Join Group
          </Button>

          {/* 🔵 Plain button so styling can't be overridden */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm"
          >
            Create Group
          </button>
        </div>
      </div>

      {/* Floating AI Chat Button */}
      <button
        onMouseDown={handleMouseDown}
        style={{
          position: "fixed",
          left: `${buttonPosition.x}px`,
          top: `${buttonPosition.y}px`,
          cursor: isDragging ? "grabbing" : "grab",
        }}
        className={`h-14 w-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl flex items-center justify-center z-40 group select-none ${
          isDragging ? "scale-105" : "transition-all duration-200"
        }`}
        title="AI Assistant - Find common times across all groups (Drag to move)"
      >
        <svg
          className="h-6 w-6 group-hover:scale-110 transition-transform"
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
      </button>

      {/* All Groups Chat Modal */}
      {showAllGroupsChat && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-gray-700">
            <AllGroupsChatBox onClose={() => setShowAllGroupsChat(false)} />
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-bold mb-2 text-white">
              Create New Group
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Give your group a name to get started
            </p>
            <input
              type="text"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full border-2 border-gray-600 bg-gray-700 rounded-lg px-4 py-3 mb-6 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateGroup();
              }}
            />
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setGroupName("");
                }}
                className="border-2 border-gray-600 hover:bg-gray-700 text-gray-200 font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateGroup}
                disabled={!groupName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-bold mb-2 text-white">Join Group</h2>
            <p className="text-sm text-gray-400 mb-6">
              Enter the group code to join
            </p>
            <input
              type="text"
              placeholder="Enter join code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full border-2 border-gray-600 bg-gray-700 rounded-lg px-4 py-3 mb-6 uppercase text-white font-mono text-center text-lg tracking-widest placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleJoinGroup();
              }}
            />
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinCode("");
                }}
                className="border-2 border-gray-600 hover:bg-gray-700 text-gray-200 font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleJoinGroup}
                disabled={!joinCode.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
              >
                Join
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Groups List */}
      {groups.length === 0 ? (
        <div className="rounded-2xl bg-gray-800 p-12 text-center shadow-lg border-2 border-gray-700">
          <svg
            className="mx-auto h-16 w-16 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="mt-4 text-white font-semibold">
            You're not in any groups yet
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Create or join a group to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Collapsible key={group.id} title={group.name}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="font-medium text-white">Join Code:</span>{" "}
                      <span className="font-mono text-gray-300">
                        {group.code}
                      </span>
                    </div>

                    <div className="text-sm">
                      <div className="font-medium text-white mb-2">
                        Members:
                      </div>
                      <ul className="space-y-1.5">
                        {group.memberIds?.map((memberId) => {
                          const member = memberInfo[memberId];
                          const isOwner = memberId === group.ownerId;
                          const isCurrentUser = memberId === currentUser?.uid;
                          return (
                            <li
                              key={memberId}
                              className="flex items-center gap-2 text-sm text-gray-300"
                            >
                              <svg
                                className="h-4 w-4 text-gray-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              <span>
                                {member
                                  ? isCurrentUser
                                    ? "You"
                                    : member.name
                                  : "Loading..."}
                              </span>
                              {isOwner && (
                                <span className="text-xs text-blue-400">
                                  (Owner)
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {group.ownerId === currentUser?.uid && (
                      <div className="text-xs text-blue-400">
                        You are the owner
                      </div>
                    )}

                    {group.ownerId === currentUser?.uid ? (
                      <Button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                      >
                        Delete Group
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleLeaveGroup(group.id)}
                        className="border-2 border-gray-600 hover:bg-gray-700 text-gray-200 font-semibold bg-gray-800"
                      >
                        Leave Group
                      </Button>
                    )}
                  </div>

                  <div>
                    <GroupChatBox groupId={group.id} groupName={group.name} />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <h3 className="text-sm font-semibold text-white mb-3">
                    Group Availability
                  </h3>
                  <GroupAvailabilityView
                    groupId={group.id}
                    memberIds={group.memberIds || []}
                    memberInfo={memberInfo}
                    currentUser={currentUser}
                  />
                </div>
              </div>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}
