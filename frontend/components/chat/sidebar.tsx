"use client";

import { cn } from "@/lib/utils";
import {
    ChevronDown,
    ChevronRight,
    ExternalLink,
    FileText,
    Plus,
    Sparkles,
    MessageSquare,
    Clock,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import * as React from "react";
import { useChatStore } from "@/lib/store";
import { TreeNode } from "@/lib/api";
import { useSearchParams, useRouter } from "next/navigation";

interface SidebarProps {
    className?: string;
}

// Recursive Tree Node Component
function TreeNodeComponent({ node, level = 0 }: { node: TreeNode; level?: number }) {
    const [isExpanded, setIsExpanded] = React.useState(level < 2); // Auto-expand first 2 levels

    const hasChildren = node.children && node.children.length > 0;

    return (
        <div>
            <div
                className={cn(
                    "group flex items-start gap-1 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer",
                    level > 0 && "ml-4"
                )}
                onClick={() => hasChildren && setIsExpanded(!isExpanded)}
            >
                {hasChildren ? (
                    isExpanded ? (
                        <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                    ) : (
                        <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                    )
                ) : (
                    <div className="w-3.5 shrink-0" />
                )}
                <a
                    href={node.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 truncate text-gray-700 group-hover:text-black dark:text-gray-300 dark:group-hover:text-white flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                >
                    <span className="truncate">{node.title}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
            </div>
            {hasChildren && isExpanded && (
                <div>
                    {node.children.map((child) => (
                        <TreeNodeComponent key={child.id} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

export function ChatSidebar({ className }: SidebarProps) {
    const { pageTree, isLoadingTree, chatId, setChatId, previousChats, loadPreviousChats, isLoadingChats, deleteChat } = useChatStore();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [deletingChatId, setDeletingChatId] = React.useState<string | null>(null);

    // Load chat ID from URL on mount
    React.useEffect(() => {
        const urlChatId = searchParams.get("id");
        if (urlChatId && urlChatId !== chatId) {
            setChatId(urlChatId);
        }
    }, [searchParams, chatId, setChatId]);

    // Load previous chats on mount
    React.useEffect(() => {
        loadPreviousChats();
    }, [loadPreviousChats]);

    const handleDeleteChat = async (chatIdToDelete: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent chat selection
        
        if (!confirm("Are you sure you want to delete this chat? This action cannot be undone.")) {
            return;
        }

        setDeletingChatId(chatIdToDelete);
        try {
            await deleteChat(chatIdToDelete);
            // If we deleted the current chat, redirect to home
            if (chatIdToDelete === chatId) {
                router.push("/");
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to delete chat");
        } finally {
            setDeletingChatId(null);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className={cn("hidden h-screen w-72 flex-col border-r bg-white p-4 dark:border-white/5 dark:bg-zinc-950 md:flex", className)}>
            {/* Logo Area */}
            <div className="mb-6 flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black">
                        <Sparkles className="h-4 w-4 fill-current" />
                    </div>
                    <span className="font-bold text-lg">BeeBot</span>
                </div>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => window.location.href = "/"}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 space-y-6 overflow-y-auto px-2">
                {/* Previous Chats Section */}
                <div>
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Previous Chats</span>
                    </div>

                    {isLoadingChats ? (
                        <div className="text-sm text-gray-500 px-2">Loading...</div>
                    ) : !previousChats || previousChats.length === 0 ? (
                        <div className="text-sm text-gray-500 px-2">No previous chats</div>
                    ) : (
                        <div className="space-y-1">
                            {previousChats.slice(0, 10).map((chat) => {
                                const displayName = chat.title || 
                                    (chat.url ? new URL(chat.url).hostname : "Unknown");
                                const truncatedName = displayName.length > 35 
                                    ? displayName.substring(0, 35) + "..." 
                                    : displayName;
                                
                                return (
                                <div
                                    key={chat.id}
                                    className={cn(
                                        "group flex items-start gap-2 rounded-lg px-2 py-2 text-sm cursor-pointer transition-colors",
                                        chat.id === chatId
                                            ? "bg-gray-100 dark:bg-zinc-800"
                                            : "hover:bg-gray-50 dark:hover:bg-zinc-900"
                                    )}
                                    onClick={() => router.push(`/chat?id=${chat.id}`)}
                                >
                                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                                    <div className="flex-1 min-w-0">
                                        <div className="truncate text-gray-700 dark:text-gray-300 font-medium" title={displayName}>
                                            {truncatedName}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-500">
                                            {formatTimeAgo(chat.created_at)} • {chat.page_count} page{chat.page_count !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteChat(chat.id, e)}
                                        disabled={deletingChatId === chat.id}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                        title="Delete chat"
                                    >
                                        {deletingChatId === chat.id ? (
                                            <div className="h-3.5 w-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400" />
                                        )}
                                    </button>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Indexed Pages Section */}
                <div>
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        <FileText className="h-3.5 w-3.5" />
                        <span>Indexed Pages</span>
                    </div>

                    {isLoadingTree ? (
                        <div className="text-sm text-gray-500 px-2">Loading...</div>
                    ) : !pageTree || pageTree.length === 0 ? (
                        <div className="text-sm text-gray-500 px-2">No pages indexed yet</div>
                    ) : (
                        <div className="space-y-1">
                            {pageTree.map((node) => (
                                <TreeNodeComponent key={node.url} node={node} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* User Profile Mock/Settings */}
            <div className="mt-auto border-t pt-4 dark:border-white/5">
                <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50 dark:hover:bg-zinc-900">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500" />
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">User</span>
                        <span className="text-xs text-gray-500">Free Plan</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
