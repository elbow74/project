"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Collapsible from "@/components/groups/collapse-box";
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
        const data = await res.json();
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

    // Optional: Add confirmation dialog
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
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            Create Group
          </Button>
        </div>
      </div>

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
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="font-medium text-white">Join Code:</span>{" "}
                  <span className="font-mono text-gray-300">{group.code}</span>
                </div>

                <div className="text-sm">
                  <div className="font-medium text-white mb-2">Members:</div>
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
                  <div className="text-xs text-blue-400">You are the owner</div>
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
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}
