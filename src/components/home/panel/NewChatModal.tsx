import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Search,
  Users,
  Check,
  Loader2,
  UserPlus,
  ShieldAlert,
} from "lucide-react";
import { fetchConnections, createChat } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import { avatarOnError, formatHandle } from "../../../constants";
import { useNavigate } from "react-router-dom";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated?: (chat: any) => void;
}

export default function NewChatModal({
  isOpen,
  onClose,
  onChatCreated,
}: NewChatModalProps) {
  const [mode, setMode] = useState<"direct" | "group">("direct");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && user?.uid) {
      setIsLoading(true);
      fetchConnections(user.uid)
        .then((data: any[]) => {
          const connectedUsers = data
            .filter((c: any) => c.status === "accepted")
            .map((c: any) =>
              c.requesterId === user.uid ? c.recipient : c.requester,
            )
            .filter(
              (u: any) => u && u.id !== user.uid && u.id !== "ai-vet-bot-id",
            );
          setUsers(connectedUsers);
        })
        .catch((err) => {
          console.error("Failed to fetch connections for chat", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, user?.uid]);

  if (!isOpen) return null;

  const filteredUsers = users.filter(
    (u) =>
      (u.displayName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.handle || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleUser = async (id: string) => {
    if (mode === "direct") {
      try {
        if (!user) return;
        setIsStartingChat(id);
        const newConv = await createChat(id);

        // Find the user we just started a chat with
        const targetUser = users.find((u) => u.id === id);

        if (onChatCreated) {
          onChatCreated({
            id: newConv.id,
            name: targetUser?.displayName || "Unknown",
            avatar: targetUser?.photoUrl,
            message: "",
            time: "",
            unread: 0,
            isGroup: false,
            otherUserId: targetUser?.id,
          });
        } else {
          onClose();
        }
      } catch (err: any) {
        console.error("Failed to create chat:", err);
        alert(
          err?.message || "Chats are only available between connected users.",
        );
      } finally {
        setIsStartingChat(null);
      }
    } else {
      setSelectedUsers((prev) =>
        prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id],
      );
    }
  };

  const handleCreateGroup = () => {
    if (groupName && selectedUsers.length > 0) {
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal / Bottom Sheet */}
      <div className="relative bg-[var(--sc-card-bg,white)] rounded-t-[28px] sm:rounded-3xl w-full max-w-md max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col border border-[var(--sc-border)] shadow-2xl z-10 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Top Grab Bar for Mobile */}
        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 sticky-glass shrink-0">
          <div>
            <h2 className="text-lg font-extrabold text-[var(--sc-text-primary)] leading-tight">
              New Message
            </h2>
            <p className="text-[11px] text-[var(--sc-text-secondary)] font-medium">
              Direct chats are available with your connections
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Mode Toggle & Search */}
          <div className="p-4 border-b border-[var(--sc-border)] shrink-0 bg-gray-50/50 dark:bg-white/[0.02]">
            <div className="flex bg-gray-200/70 dark:bg-gray-800 rounded-xl p-1 mb-3.5">
              <button
                onClick={() => {
                  setMode("direct");
                  setSelectedUsers([]);
                  setGroupName("");
                }}
                className={`flex-1 py-1.5 text-[13px] font-extrabold rounded-lg transition-all ${
                  mode === "direct"
                    ? "bg-white dark:bg-gray-900 shadow-2xs text-[var(--sc-text-primary)]"
                    : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
                }`}
              >
                Direct (1:1)
              </button>
              <button
                onClick={() => setMode("group")}
                className={`flex-1 py-1.5 text-[13px] font-extrabold rounded-lg transition-all ${
                  mode === "group"
                    ? "bg-white dark:bg-gray-900 shadow-2xs text-[var(--sc-text-primary)]"
                    : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
                }`}
              >
                Group
              </button>
            </div>

            {mode === "group" && (
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Group Name (e.g. Stray Rescue Volunteers)"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-[var(--sc-border)] px-3.5 py-2.5 rounded-xl text-[14px] text-[var(--sc-text-primary)] focus:outline-none focus:border-[var(--sc-brand-500)] transition-colors"
                />
              </div>
            )}

            <div className="relative group">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--sc-brand-500)] transition-colors"
                size={17}
              />
              <input
                type="text"
                placeholder="Search connected friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 border border-[var(--sc-border)] pl-10 pr-4 py-2 rounded-xl text-[13px] sm:text-[14px] text-[var(--sc-text-primary)] placeholder:text-gray-400 focus:outline-none focus:border-[var(--sc-brand-500)] transition-colors"
              />
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto p-2.5">
            {mode === "group" && selectedUsers.length > 0 && (
              <div className="px-2 py-1.5 flex flex-wrap gap-1.5 mb-2 border-b border-[var(--sc-border)] pb-2.5">
                {selectedUsers.map((id) => {
                  const u = users.find((u) => u.id === id);
                  return u ? (
                    <div
                      key={id}
                      className="flex items-center gap-1.5 bg-[var(--sc-brand-50)] dark:bg-purple-950/40 border border-[var(--sc-brand-200)] dark:border-purple-800 rounded-full pl-1 pr-2 py-0.5"
                    >
                      <img
                        src={u.photoUrl}
                        alt={u.displayName}
                        onError={avatarOnError}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span
                        className="text-[11px] font-bold text-[var(--sc-brand-700)] dark:text-purple-300 notranslate"
                        translate="no"
                      >
                        {u.displayName.split(" ")[0]}
                      </span>
                      <button
                        onClick={() => toggleUser(id)}
                        className="text-[var(--sc-brand-400)] hover:text-[var(--sc-brand-600)] ml-0.5"
                      >
                        <X size={11} strokeWidth={3} />
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                <Loader2
                  size={24}
                  className="animate-spin text-[var(--sc-brand-500)]"
                />
                <span className="text-xs font-medium">
                  Loading connections...
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {filteredUsers.map((u) => {
                  const isSelected = selectedUsers.includes(u.id);
                  const isStarting = isStartingChat === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => !isStarting && toggleUser(u.id)}
                      disabled={isStarting}
                      className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all w-full text-left active:scale-[0.99]"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={u.photoUrl}
                          alt={u.displayName}
                          onError={avatarOnError}
                          className="w-10 h-10 rounded-full object-cover border border-[var(--sc-border)]"
                        />
                        {mode === "group" && (
                          <div
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border border-white transition-colors ${
                              isSelected
                                ? "bg-[var(--sc-brand-600)] text-white"
                                : "bg-gray-200"
                            }`}
                          >
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="font-bold text-[14px] text-[var(--sc-text-primary)] truncate notranslate"
                            translate="no"
                          >
                            {u.displayName}
                          </span>
                          <span className="px-1.5 py-0.2 bg-purple-50 text-[var(--sc-brand-700)] border border-[var(--sc-brand-200)] text-[9px] font-bold rounded-md shrink-0">
                            1st
                          </span>
                        </div>
                        <span
                          className="text-[12px] text-gray-400 truncate notranslate"
                          translate="no"
                        >
                          {formatHandle(u.handle)}
                        </span>
                      </div>
                      {isStarting && (
                        <Loader2
                          size={16}
                          className="animate-spin text-[var(--sc-brand-600)] shrink-0 ml-2"
                        />
                      )}
                    </button>
                  );
                })}

                {/* Empty State: User has 0 connections */}
                {!isLoading && users.length === 0 && (
                  <div className="p-6 text-center flex flex-col items-center justify-center my-4">
                    <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-[var(--sc-brand-600)] flex items-center justify-center mb-3 border border-purple-100 dark:border-purple-900/50">
                      <Users size={26} />
                    </div>
                    <h3 className="font-bold text-[15px] text-[var(--sc-text-primary)]">
                      No Connections Yet
                    </h3>
                    <p className="text-xs text-[var(--sc-text-secondary)] mt-1.5 leading-relaxed max-w-[260px] mx-auto">
                      Direct messaging is exclusively available between
                      connected users. Send connection requests to pet lovers or
                      doctors to chat!
                    </p>
                    <button
                      onClick={() => {
                        onClose();
                        navigate("/profile?tab=connections");
                      }}
                      className="mt-4 px-4 py-2 bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <UserPlus size={14} />
                      <span>Find & Connect People</span>
                    </button>
                  </div>
                )}

                {/* Empty State: Search filter yielded 0 */}
                {!isLoading &&
                  users.length > 0 &&
                  filteredUsers.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-xs sm:text-sm">
                      No connected friends matched &quot;{searchQuery}&quot;.
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>

        {/* Footer for Group Mode */}
        {mode === "group" && (
          <div className="p-4 border-t border-[var(--sc-border)] shrink-0 bg-gray-50/50 dark:bg-white/[0.02]">
            <button
              disabled={selectedUsers.length === 0 || !groupName.trim()}
              onClick={handleCreateGroup}
              className={`w-full py-3 text-[14px] font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                selectedUsers.length > 0 && groupName.trim()
                  ? "bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] text-white shadow-md shadow-[var(--sc-brand-600)]/20"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Users size={17} />
              <span>Create Group ({selectedUsers.length})</span>
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
