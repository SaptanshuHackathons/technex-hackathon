"use client";

import { cn } from "@/lib/utils";
import {
    BookOpen,
    ChevronDown,
    Clock,
    ExternalLink,
    FileText,
    Link2,
    MessageSquare,
    Plus,
    Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockCitations, mockIndexedPages, mockPreviousChats } from "@/lib/mock-data";
import * as React from "react";

interface SidebarProps {
    className?: string;
}

export function ChatSidebar({ className }: SidebarProps) {
    const [expandedSections, setExpandedSections] = React.useState({
        citations: true,
        indexed: true,
        chats: true,
    });

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
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
                <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 space-y-6 overflow-y-auto px-2">
                {/* Citations Section */}
                <div>
                    <button
                        onClick={() => toggleSection("citations")}
                        className="mb-3 flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <div className="flex items-center gap-2">
                            <Link2 className="h-3.5 w-3.5" />
                            <span>Citations</span>
                        </div>
                        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !expandedSections.citations && "-rotate-90")} />
                    </button>
                    {expandedSections.citations && (
                        <div className="space-y-2">
                            {mockCitations.map((citation) => (
                                <a
                                    key={citation.id}
                                    href={citation.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-start gap-2 rounded-lg p-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-900"
                                >
                                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                                    <span className="flex-1 truncate text-gray-700 group-hover:text-black dark:text-gray-300 dark:group-hover:text-white">
                                        {citation.title}
                                    </span>
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                {/* Indexed Pages Section */}
                <div>
                    <button
                        onClick={() => toggleSection("indexed")}
                        className="mb-3 flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <div className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5" />
                            <span>Indexed Pages</span>
                        </div>
                        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !expandedSections.indexed && "-rotate-90")} />
                    </button>
                    {expandedSections.indexed && (
                        <div className="space-y-1">
                            {mockIndexedPages.map((page) => (
                                <a
                                    key={page.id}
                                    href={page.url}
                                    className="block truncate rounded-lg px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-black dark:text-gray-400 dark:hover:bg-zinc-900 dark:hover:text-white"
                                >
                                    {page.title}
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                {/* Previous Chats Section */}
                <div>
                    <button
                        onClick={() => toggleSection("chats")}
                        className="mb-3 flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>Previous Chats</span>
                        </div>
                        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !expandedSections.chats && "-rotate-90")} />
                    </button>
                    {expandedSections.chats && (
                        <div className="space-y-2">
                            {mockPreviousChats.map((chat) => (
                                <a
                                    key={chat.id}
                                    href="#"
                                    className="block rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-zinc-900"
                                >
                                    <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {chat.title}
                                    </p>
                                    <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                                        <Clock className="h-3 w-3" />
                                        <span>{chat.timestamp}</span>
                                    </div>
                                </a>
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
                        <span className="text-sm font-medium">User Name</span>
                        <span className="text-xs text-gray-500">Free Plan</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
