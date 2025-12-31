"use client";

import * as React from "react";
import { useChatStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ArrowUp, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSearchParams, useRouter } from "next/navigation";

export function ChatArea() {
    const { messages, isLoading, sendMessage, chatId, setChatId, isScraping, scrapingStages, startScrapeWithProgress } = useChatStore();
    const [input, setInput] = React.useState("");
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const scrapeInitiatedRef = React.useRef(false);

    // Scroll to bottom when messages change
    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, scrapingStages]);

    // Handle scraping from URL parameters
    React.useEffect(() => {
        const scrapingParam = searchParams.get("scraping");
        const urlParam = searchParams.get("url");

        if (scrapingParam === "true" && urlParam && !isScraping && !chatId && !scrapeInitiatedRef.current) {
            // Mark as initiated to prevent duplicate scraping
            scrapeInitiatedRef.current = true;

            // Start scraping
            startScrapeWithProgress(decodeURIComponent(urlParam), 1).catch((error) => {
                console.error("Scraping failed:", error);
                alert(error instanceof Error ? error.message : "Failed to scrape website");
                scrapeInitiatedRef.current = false;
                router.push("/");
            });
        }
    }, [searchParams, isScraping, chatId]);

    // Load chat from URL parameter
    React.useEffect(() => {
        const urlChatId = searchParams.get("id");
        if (urlChatId && urlChatId !== chatId && !isScraping) {
            setChatId(urlChatId).catch((error) => {
                console.error("Chat not found:", error);
                // Redirect to home if chat doesn't exist
                router.push("/");
            });
        }
    }, [searchParams, chatId, setChatId, isScraping, router]);

    // Update URL when chatId is received (especially from cache)
    React.useEffect(() => {
        const scrapingParam = searchParams.get("scraping");
        if (chatId && scrapingParam === "true") {
            // Replace URL to show chat ID instead of scraping params
            router.replace(`/chat?id=${chatId}`);
        }
    }, [chatId, searchParams, router]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Simulate loading for 1.5 seconds
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsRefreshing(false);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chatId) return;

        const query = input;
        setInput("");

        try {
            await sendMessage(query);
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    return (
        <div className="flex h-screen flex-1 flex-col bg-gradient-to-b from-emerald-50/30 to-white dark:from-emerald-950/20 dark:to-[#0a0a0a]">
            {/* Top Bar / Header */}
            <div className="flex items-center justify-between border-b border-emerald-200/50 px-6 py-4 dark:border-emerald-900/30">
                <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">Chat</h2>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="h-8 w-8 p-0"
                    title="Refresh chats"
                >
                    <RefreshCw className={cn(
                        "h-4 w-4 text-emerald-600 dark:text-emerald-400",
                        isRefreshing && "animate-spin"
                    )} />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="mx-auto max-w-3xl space-y-8">
                    {/* Scraping Progress */}
                    {isScraping && (
                        <div className="space-y-6 pb-24">
                            <div className="bg-white border border-emerald-200 dark:bg-zinc-900 dark:border-emerald-900/50 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                                        <Loader2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 animate-spin" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">Scraping Website</h3>
                                        <p className="text-sm text-gray-500">Please wait while we process your website...</p>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-950/50">
                                    <div
                                        className="h-full bg-linear-to-r from-emerald-500 to-emerald-600 transition-all duration-500 ease-out"
                                        style={{
                                            width: `${scrapingStages.length > 0 ? scrapingStages[scrapingStages.length - 1].progress : 0}%`
                                        }}
                                    />
                                </div>

                                {/* Stages List */}
                                <div className="space-y-3">
                                    {scrapingStages.map((stage, idx) => (
                                        <div
                                            key={`${stage.stage}-${idx}`}
                                            className={cn(
                                                "flex items-center gap-3 transition-all duration-300",
                                                stage.completed ? "opacity-100" : "opacity-100"
                                            )}
                                        >
                                            {stage.completed ? (
                                                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                            ) : (
                                                <Loader2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 animate-spin shrink-0" />
                                            )}
                                            <div className="flex-1">
                                                <p className={cn(
                                                    "text-sm font-medium transition-colors duration-200",
                                                    stage.completed ? "text-gray-600 dark:text-gray-400" : "text-gray-900 dark:text-gray-100"
                                                )}>
                                                    {stage.message}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    {!isScraping && (
                        <div className="space-y-6 pb-24">
                            {isLoading && messages.length === 0 ? (
                                <div className="text-center text-gray-500 py-12">
                                    <div className="flex justify-center mb-4">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                    <p className="text-sm">Loading chat history...</p>
                                </div>
                            ) : messages.length === 0 && !isLoading ? (
                                <div className="text-center text-gray-500 py-12">
                                    {chatId ? (
                                        <>
                                            <p className="text-lg font-medium">Chat session ready!</p>
                                            <p className="text-sm mt-2">Ask questions about the indexed pages</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-lg font-medium">No active chat</p>
                                            <p className="text-sm mt-2">Start by scraping a website from the home page</p>
                                        </>
                                    )}
                                </div>
                            ) : null}

                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex gap-4",
                                        msg.role === "user" ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "relative max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm",
                                            msg.role === "user"
                                                ? "bg-linear-to-br from-emerald-600 to-emerald-700 text-white dark:from-emerald-500 dark:to-emerald-600"
                                                : "bg-white border border-emerald-200/50 text-gray-800 dark:bg-zinc-900 dark:border-emerald-900/30 dark:text-gray-200"
                                        )}
                                    >
                                        {msg.role === "ai" ? (
                                            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-strong:font-bold prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:font-medium hover:prose-a:underline">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-emerald-200/50 dark:bg-zinc-900 dark:border-emerald-900/30 rounded-2xl px-5 py-3">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Invisible element to scroll to */}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="sticky bottom-0 bg-linear-to-t from-emerald-50/30 via-emerald-50/20 to-transparent pb-6 pt-10 dark:from-emerald-950/20 dark:via-emerald-950/10">
                <div className="mx-auto max-w-3xl px-4">
                    <form onSubmit={handleSend} className="relative flex items-end gap-2 rounded-2xl border border-emerald-300 bg-white p-2 shadow-lg dark:border-emerald-900/50 dark:bg-zinc-900">
                        <input
                            className="flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-emerald-400 dark:text-white dark:placeholder:text-emerald-600"
                            placeholder={isScraping ? "Scraping in progress..." : chatId ? "Ask anything..." : "No active chat session"}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading || !chatId || isScraping}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="rounded-xl bg-linear-to-br from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 dark:from-emerald-500 dark:to-emerald-600"
                            disabled={!input.trim() || isLoading || !chatId || isScraping}
                        >
                            <ArrowUp className="h-4 w-4" />
                        </Button>
                    </form>
                    <p className="mt-2 text-center text-xs text-gray-400">
                        AI can make mistakes. Check important info.
                    </p>
                </div>
            </div>
        </div>
    );
}
