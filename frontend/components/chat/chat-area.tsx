"use client";

import * as React from "react";
import { useChatStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ArrowUp, Copy, Save, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ChatArea() {
    const { messages, scrapedData, addMessage, init } = useChatStore();
    const [input, setInput] = React.useState("");

    React.useEffect(() => {
        init();
    }, [init]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        addMessage({ id: Date.now().toString(), role: "user", content: input });
        setInput("");

        // Simulate AI response
        setTimeout(() => {
            addMessage({
                id: (Date.now() + 1).toString(),
                role: "ai",
                content: "This is a simulated response based on the scraped context."
            });
        }, 1000);
    };

    return (
        <div className="flex h-screen flex-1 flex-col bg-white dark:bg-[#0a0a0a]">
            {/* Top Bar / Header */}
            <div className="flex items-center justify-between border-b px-6 py-4 dark:border-white/5">
                <h2 className="text-lg font-semibold">Chat</h2>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon"><Save className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><Copy className="h-4 w-4" /></Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="mx-auto max-w-3xl space-y-8">
                    {/* Summary Card (Only shows if data exists) */}
                    {scrapedData && (
                        <div className="rounded-xl border bg-gray-50/50 p-6 dark:border-white/5 dark:bg-zinc-900/50">
                            <div className="mb-4 flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-2xl">
                                    💾
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold tracking-tight">{scrapedData.title}</h1>
                                    <span className="text-sm text-gray-500">{scrapedData.sources} sources</span>
                                </div>
                            </div>
                            <p className="text-gray-600 leading-relaxed dark:text-gray-300">
                                {scrapedData.summary}
                            </p>

                            <div className="mt-4 flex gap-2">
                                <Button variant="outline" size="sm" className="rounded-full">Save to note</Button>
                                <Button variant="ghost" size="sm"><Copy className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="sm"><ThumbsUp className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="sm"><ThumbsDown className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    <div className="space-y-6 pb-24">
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
                                        <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-strong:font-bold prose-strong:text-gray-900 dark:prose-strong:text-gray-100">
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
                    </div>
                </div>
            </div>

            {/* Input Area */}
            <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pb-6 pt-10 dark:from-[#0a0a0a] dark:via-[#0a0a0a]">
                <div className="mx-auto max-w-3xl px-4">
                    {/* Suggested Questions (Chips) */}
                    <div className="mb-4 flex flex-wrap gap-2">
                        {["What are the ACID properties?", "Explain 3rd Normal Form"].map((q) => (
                            <button key={q} onClick={() => setInput(q)} className="rounded-full border bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:bg-zinc-900 dark:text-gray-400 dark:hover:bg-zinc-800 transition-colors">
                                {q}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSend} className="relative flex items-end gap-2 rounded-2xl border bg-white p-2 shadow-lg dark:border-white/10 dark:bg-zinc-900">
                        <input
                            className="flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-gray-400 dark:text-white"
                            placeholder="Ask anything..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="rounded-xl bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black"
                            disabled={!input.trim()}
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
