"use client";

import * as React from "react";
import { useChatStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ArrowUp, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSearchParams, useRouter } from "next/navigation";

export function ChatArea() {
    const { messages, isLoading, sendMessage, chatId, setChatId, isScraping, scrapingStages, startScrapeWithProgress } = useChatStore();
    const [input, setInput] = React.useState("");
    const searchParams = useSearchParams();
    const router = useRouter();
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages change
    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, scrapingStages]);

    // Handle scraping from URL parameters
    React.useEffect(() => {
        const scrapingParam = searchParams.get("scraping");
        const urlParam = searchParams.get("url");
        
        if (scrapingParam === "true" && urlParam && !isScraping && !chatId) {
            // Start scraping
            startScrapeWithProgress(decodeURIComponent(urlParam), 1).catch((error) => {
                console.error("Scraping failed:", error);
                alert(error instanceof Error ? error.message : "Failed to scrape website");
                router.push("/");
            });
        }
    }, [searchParams, isScraping, chatId, startScrapeWithProgress, router]);

    // Load chat from URL parameter
    React.useEffect(() => {
        const urlChatId = searchParams.get("id");
        if (urlChatId && urlChatId !== chatId && !isScraping) {
            setChatId(urlChatId);
        }
    }, [searchParams, chatId, setChatId, isScraping]);

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
        <div className="flex h-screen flex-1 flex-col bg-white dark:bg-[#0a0a0a]">
            {/* Top Bar / Header */}
            <div className="flex items-center justify-between border-b px-6 py-4 dark:border-white/5">
                <h2 className="text-lg font-semibold">Chat</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="mx-auto max-w-3xl space-y-8">
                    {/* Scraping Progress */}
                    {isScraping && (
                        <div className="space-y-6 pb-24">
                            <div className="bg-white border dark:bg-zinc-900 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff4500]/10">
                                        <Loader2 className="h-5 w-5 text-[#ff4500] animate-spin" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">Scraping Website</h3>
                                        <p className="text-sm text-gray-500">Please wait while we process your website...</p>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
                                    <div 
                                        className="h-full bg-[#ff4500] transition-all duration-500 ease-out"
                                        style={{ 
                                            width: `${scrapingStages.length > 0 ? scrapingStages[scrapingStages.length - 1].progress : 0}%` 
                                        }}
                                    />
                                </div>

                                {/* Stages List */}
                                <div className="space-y-3">
                                    {scrapingStages.map((stage, idx) => (
                                        <div 
                                            key={idx}
                                            className={cn(
                                                "flex items-center gap-3 transition-all duration-300",
                                                stage.completed ? "opacity-60" : "opacity-100"
                                            )}
                                        >
                                            {stage.completed ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                            ) : (
                                                <Loader2 className="h-5 w-5 text-[#ff4500] animate-spin flex-shrink-0" />
                                            )}
                                            <div className="flex-1">
                                                <p className={cn(
                                                    "text-sm font-medium",
                                                    stage.completed ? "text-gray-500 dark:text-gray-500" : "text-gray-900 dark:text-gray-100"
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
                                            ? "bg-black text-white dark:bg-white dark:text-black"
                                            : "bg-white border text-gray-800 dark:bg-zinc-900 dark:border-white/5 dark:text-gray-200"
                                    )}
                                >
                                    {msg.role === "ai" ? (
                                        <>
                                            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-strong:font-bold prose-strong:text-gray-900 dark:prose-strong:text-gray-100">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                            {msg.sources && msg.sources.length > 0 && (
                                                <div className="mt-3 pt-3 border-t dark:border-white/10">
                                                    <p className="text-xs font-semibold text-gray-500 mb-2">Sources:</p>
                                                    <div className="space-y-1">
                                                        {msg.sources.map((source, idx) => (
                                                            <a
                                                                key={idx}
                                                                href={source.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="block text-xs text-blue-600 hover:underline dark:text-blue-400"
                                                            >
                                                                {source.title || source.url}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border dark:bg-zinc-900 dark:border-white/5 rounded-2xl px-5 py-3">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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
            <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pb-6 pt-10 dark:from-[#0a0a0a] dark:via-[#0a0a0a]">
                <div className="mx-auto max-w-3xl px-4">
                    <form onSubmit={handleSend} className="relative flex items-end gap-2 rounded-2xl border bg-white p-2 shadow-lg dark:border-white/10 dark:bg-zinc-900">
                        <input
                            className="flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-gray-400 dark:text-white"
                            placeholder={isScraping ? "Scraping in progress..." : chatId ? "Ask anything..." : "No active chat session"}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading || !chatId || isScraping}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="rounded-xl bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black"
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
