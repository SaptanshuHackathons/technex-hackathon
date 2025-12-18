"use client";

import * as React from "react";
import { ArrowRight, Globe, Loader2, ChevronDown, Key, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/lib/store";

type Model = {
    id: string;
    name: string;
    tier: "free" | "pro" | "custom";
    credits: number;
};

const MODELS: Model[] = [
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", tier: "free", credits: 1 },
    { id: "claude-haiku", name: "Claude Haiku", tier: "free", credits: 1 },
    { id: "gpt-4", name: "GPT-4", tier: "pro", credits: 5 },
    { id: "claude-opus", name: "Claude Opus", tier: "pro", credits: 10 },
];

export function URLInput({ className }: { className?: string }) {
    const [url, setUrl] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const [selectedModel, setSelectedModel] = React.useState<Model>(MODELS[0]);
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
    const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = React.useState(false);
    const [apiKey, setApiKey] = React.useState("");
    const [customApiKey, setCustomApiKey] = React.useState("");
    const router = useRouter();
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setIsLoading(true);
        try {
            // Redirect to chat page immediately - the chat will handle the scraping
            const tempChatId = `scraping_${Date.now()}`;
            router.push(`/chat?scraping=true&url=${encodeURIComponent(url)}`);
        } catch (error) {
            console.error("Failed to initiate scrape:", error);
            alert(error instanceof Error ? error.message : "Failed to scrape website");
            setIsLoading(false);
        }
    };

    const handleModelSelect = (model: Model) => {
        setSelectedModel(model);
        setIsDropdownOpen(false);
    };

    const handleApiKeySubmit = () => {
        setCustomApiKey(apiKey);
        setIsApiKeyDialogOpen(false);
        setApiKey("");
    };

    const freeModels = MODELS.filter((m) => m.tier === "free");
    const proModels = MODELS.filter((m) => m.tier === "pro");

    return (
        <>
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
                    {/* Model Selector Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <span>{selectedModel.name}</span>
                            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isDropdownOpen && "rotate-180")} />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 bottom-12 z-50 w-52 rounded-lg border border-black/5 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-zinc-900">
                                {/* Free Tier Section */}
                                <div className="px-2 py-1">
                                    <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                        Free
                                    </div>
                                    {freeModels.map((model) => (
                                        <button
                                            key={model.id}
                                            type="button"
                                            onClick={() => handleModelSelect(model)}
                                            className="flex w-full items-center justify-between px-2 py-1.5 text-sm text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                                        >
                                            <span>{model.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400 dark:text-gray-500">{model.credits}c</span>
                                                {selectedModel.id === model.id && (
                                                    <div className="h-1 w-1 rounded-full bg-[#ff4500]" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Pro Tier Section */}
                                <div className="px-2 py-1">
                                    <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                        Pro
                                    </div>
                                    {proModels.map((model) => (
                                        <button
                                            key={model.id}
                                            type="button"
                                            onClick={() => handleModelSelect(model)}
                                            className="flex w-full items-center justify-between px-2 py-1.5 text-sm text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                                        >
                                            <span>{model.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400 dark:text-gray-500">{model.credits}c</span>
                                                {selectedModel.id === model.id && (
                                                    <div className="h-1 w-1 rounded-full bg-[#ff4500]" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Add API Key Option */}
                                <div className="border-t border-black/5 px-2 py-1 dark:border-white/5">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsApiKeyDialogOpen(true);
                                            setIsDropdownOpen(false);
                                        }}
                                        className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                    >
                                        <Key className="h-3.5 w-3.5" />
                                        <span>Custom API</span>
                                    </button>
                                </div>
                            </div>
                        )}
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

            {/* API Key Dialog */}
            {isApiKeyDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-zinc-900">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff4500]/10">
                                <Key className="h-5 w-5 text-[#ff4500]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Add API Key
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Enter your custom API key
                                </p>
                            </div>
                        </div>

                        <input
                            type="password"
                            placeholder="sk-..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full rounded-xl border border-black/5 bg-gray-50 px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#ff4500]/20 dark:border-white/10 dark:bg-zinc-800 dark:text-white"
                        />

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsApiKeyDialogOpen(false);
                                    setApiKey("");
                                }}
                                className="flex-1 rounded-xl border border-black/5 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-white/10 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleApiKeySubmit}
                                disabled={!apiKey}
                                className="flex-1 rounded-xl bg-[#ff4500] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#ff4500]/90 disabled:opacity-50"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
