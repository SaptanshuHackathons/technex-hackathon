"use client";

import * as React from "react";
import { ArrowRight, Globe, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function URLInput({ className }: { className?: string }) {
    const [url, setUrl] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setIsLoading(true);
        // Simulate scraping delay
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsLoading(false);
        router.push("/chat");
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={cn(
                "relative flex w-full max-w-2xl items-center gap-2 rounded-2xl border border-black/5 bg-white p-2 shadow-xl transition-all hover:shadow-2xl focus-within:ring-4 focus-within:ring-black/5 dark:border-white/10 dark:bg-black dark:focus-within:ring-white/10",
                className
            )}
        >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-500 dark:bg-zinc-900 dark:text-zinc-400">
                <Globe className="h-5 w-5" />
            </div>

            <input
                type="url"
                placeholder="https://example.com"
                className="flex-1 bg-transparent px-2 text-lg font-medium outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-zinc-600"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
            />

            <div className="flex items-center gap-2">
                {/* Options (Mock) */}
                <div className="hidden sm:flex items-center gap-1 rounded-lg border border-black/5 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-500 dark:border-white/5 dark:bg-zinc-900 dark:text-zinc-400">
                    <Search className="h-3 w-3" />
                    <span>Search</span>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className={cn(
                        "flex h-10 items-center gap-2 rounded-xl bg-[#ff4500] px-4 text-sm font-semibold text-white transition-all hover:bg-[#ff4500]/90 disabled:opacity-50",
                        isLoading && "cursor-not-allowed opacity-70"
                    )}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Scraping...</span>
                        </>
                    ) : (
                        <>
                            <span>Scrape</span>
                            <ArrowRight className="h-4 w-4" />
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
