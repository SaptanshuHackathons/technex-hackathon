import { URLInput } from "@/components/url-input";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BentoGrid } from "@/components/landing/bento-grid";
import { Pipeline } from "@/components/landing/pipeline";
import { Stats } from "@/components/landing/stats";
import { Pricing } from "@/components/landing/pricing";

export default function Page() {
    return (
        <div className="flex min-h-screen flex-col bg-white text-black dark:bg-black dark:text-white transition-colors duration-300">
            {/* Navbar */}
            <header className="absolute top-0 z-50 w-full">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black">
                            <Sparkles className="h-4 w-4 fill-current" />
                        </div>
                        <span>BeeBot.ai</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="#"
                            className="text-sm font-medium text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white"
                        >
                            Documentation
                        </Link>
                        <Button size="sm" variant="outline" className="rounded-full">
                            Log in
                        </Button>
                        <Button size="sm" className="rounded-full bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90">
                            Start Free
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex flex-1 flex-col items-center justify-center px-4 pt-20 text-center">
                <div className="animate-in fade-in zoom-in duration-700 slide-in-from-bottom-4">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/5 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-600 dark:border-white/10 dark:bg-zinc-900 dark:text-gray-300">
                        <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                        2 Months Free — Annually
                        <ArrowRight className="ml-1 h-3 w-3" />
                    </div>

                    <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl">
                        Turn websites into <br />
                        <span className="bg-gradient-to-r from-[#ff4500] to-[#ff8c00] bg-clip-text text-transparent">
                            LLM-ready
                        </span>{" "}
                        data
                    </h1>

                    <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500 dark:text-gray-400">
                        Power your AI apps with clean web data from any website. <br className="hidden sm:inline" />
                        It&apos;s also open source.
                    </p>

                    <div className="mt-10 flex w-full justify-center">
                        <URLInput className="w-full" />
                    </div>

                    <div className="mt-12 flex items-center justify-center gap-8 opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0">
                        {/* Mock Logos */}
                        <span className="text-xl font-bold text-gray-400">Google</span>
                        <span className="text-xl font-bold text-gray-400">Microsoft</span>
                        <span className="text-xl font-bold text-gray-400">OpenAI</span>
                        <span className="text-xl font-bold text-gray-400">Anthropic</span>
                    </div>
                </div>
            </main>

            {/* Feature Sections */}
            <BentoGrid />
            <Pipeline />
            <Stats />
            <Pricing />

            {/* Background Decor */}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 blur-3xl opacity-20">
                    <div className="aspect-square w-[600px] rounded-full bg-gradient-to-bl from-orange-500 to-amber-300" />
                </div>
                <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 blur-3xl opacity-20">
                    <div className="aspect-square w-[600px] rounded-full bg-gradient-to-tr from-blue-500 to-cyan-300" />
                </div>
            </div>
        </div>
    );
}