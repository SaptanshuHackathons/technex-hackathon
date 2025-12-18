import { URLInput } from "@/components/url-input";
import { ArrowRight, History } from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { BentoGrid } from "@/components/landing/bento-grid";
import { Pipeline } from "@/components/landing/pipeline";
import { Stats } from "@/components/landing/stats";
import { Pricing } from "@/components/landing/pricing";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Page() {
    return (
        <div className="flex min-h-screen flex-col bg-white text-black dark:bg-black dark:text-white transition-colors duration-300">
            {/* Navbar */}
            <Navbar />

            {/* Hero Section */}
            <main className="flex flex-1 flex-col items-center justify-center px-4 pt-20 text-center min-h-screen">
                <div className="animate-in fade-in zoom-in duration-700 slide-in-from-bottom-4">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/5 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-600 dark:border-white/10 dark:bg-zinc-900 dark:text-gray-300">
                        <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                        2 Months Free — Annually
                        <ArrowRight className="ml-1 h-3 w-3" />
                    </div>

                    <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl">
                        Turn websites into <br />
                        <span className="bg-linear-to-r from-[#ff4500] to-[#ff8c00] bg-clip-text text-transparent">
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

                    <div className="mt-6 flex justify-center gap-4">
                        <Link href="/profile">
                            <Button variant="outline" className="gap-2">
                                <History className="h-4 w-4" />
                                View Previous Chats
                            </Button>
                        </Link>
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