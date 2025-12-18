"use client";

import { motion } from "framer-motion";
import { Code2, Cpu, FileJson } from "lucide-react";

export function Pipeline() {
    return (
        <section className="w-full py-24 px-4 bg-gradient-to-b from-transparent via-gray-50/50 to-transparent dark:via-zinc-900/50">
            <div className="mx-auto max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-16 text-center"
                >
                    <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                        How it{" "}
                        <span className="bg-gradient-to-r from-[#ff4500] to-[#ff8c00] bg-clip-text text-transparent">
                            works
                        </span>
                    </h2>
                    <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
                        From messy HTML to clean, structured data in milliseconds
                    </p>
                </motion.div>

                {/* Pipeline Flow */}
                <div className="relative">
                    {/* Connection Lines */}
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-700 hidden lg:block" />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-4 relative">
                        {/* Step 1: Input */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="group relative overflow-hidden rounded-3xl border border-black/5 bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-300 dark:border-white/10 dark:bg-zinc-900">
                                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-gradient-to-br from-red-500/10 to-orange-300/10 blur-3xl group-hover:scale-150 transition-transform duration-500" />

                                <div className="relative z-10">
                                    <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg">
                                        <Code2 className="h-8 w-8 text-white" />
                                    </div>

                                    <div className="mb-2 inline-block rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400">
                                        STEP 1
                                    </div>

                                    <h3 className="mb-3 text-2xl font-bold">Raw Input</h3>
                                    <p className="mb-4 text-gray-600 dark:text-gray-400">
                                        Paste any URL or messy HTML. We handle JavaScript-heavy sites, dynamic content, and complex structures.
                                    </p>

                                    {/* Code Preview */}
                                    <div className="rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 p-4 font-mono text-xs dark:from-zinc-800 dark:to-zinc-900 overflow-hidden">
                                        <div className="text-gray-400 dark:text-gray-500">
                                            <span className="text-purple-600 dark:text-purple-400">&lt;div</span>
                                            <span className="text-blue-600 dark:text-blue-400"> class=</span>
                                            <span className="text-green-600 dark:text-green-400">&quot;messy&quot;</span>
                                            <span className="text-purple-600 dark:text-purple-400">&gt;</span>
                                        </div>
                                        <div className="ml-4 text-gray-400 dark:text-gray-500">
                                            <span className="text-purple-600 dark:text-purple-400">&lt;script&gt;</span>
                                            <span>...</span>
                                        </div>
                                        <div className="ml-4 text-gray-400 dark:text-gray-500">
                                            <span className="text-purple-600 dark:text-purple-400">&lt;style&gt;</span>
                                            <span>...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Step 2: Process */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="relative"
                        >
                            <div className="group relative overflow-hidden rounded-3xl border border-black/5 bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-300 dark:border-white/10 dark:bg-zinc-900">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-amber-500/5 to-yellow-500/5" />

                                <div className="relative z-10">
                                    <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg">
                                        <Cpu className="h-8 w-8 text-white animate-pulse" />
                                    </div>

                                    <div className="mb-2 inline-block rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400">
                                        STEP 2
                                    </div>

                                    <h3 className="mb-3 text-2xl font-bold">AI Processing</h3>
                                    <p className="mb-4 text-gray-600 dark:text-gray-400">
                                        Our intelligent engine extracts, cleans, and structures the data. Removes noise, preserves context.
                                    </p>

                                    {/* Processing Animation */}
                                    <div className="space-y-2">
                                        {[60, 85, 100].map((width, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${width}%` }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 1, delay: 0.6 + i * 0.2 }}
                                                className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Step 3: Output */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                            className="relative"
                        >
                            <div className="group relative overflow-hidden rounded-3xl border border-black/5 bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-300 dark:border-white/10 dark:bg-zinc-900">
                                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-32 w-32 rounded-full bg-gradient-to-tr from-green-500/10 to-emerald-300/10 blur-3xl group-hover:scale-150 transition-transform duration-500" />

                                <div className="relative z-10">
                                    <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
                                        <FileJson className="h-8 w-8 text-white" />
                                    </div>

                                    <div className="mb-2 inline-block rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-600 dark:text-green-400">
                                        STEP 3
                                    </div>

                                    <h3 className="mb-3 text-2xl font-bold">Clean Output</h3>
                                    <p className="mb-4 text-gray-600 dark:text-gray-400">
                                        Receive structured JSON or Markdown, ready for your LLM, RAG system, or database.
                                    </p>

                                    {/* JSON Preview */}
                                    <div className="rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 p-4 font-mono text-xs dark:from-zinc-800 dark:to-zinc-900">
                                        <div className="text-gray-700 dark:text-gray-300">
                                            <span className="text-purple-600 dark:text-purple-400">&#123;</span>
                                        </div>
                                        <div className="ml-4 text-gray-700 dark:text-gray-300">
                                            <span className="text-blue-600 dark:text-blue-400">&quot;title&quot;</span>
                                            <span>: </span>
                                            <span className="text-green-600 dark:text-green-400">&quot;...&quot;</span>
                                            <span>,</span>
                                        </div>
                                        <div className="ml-4 text-gray-700 dark:text-gray-300">
                                            <span className="text-blue-600 dark:text-blue-400">&quot;content&quot;</span>
                                            <span>: </span>
                                            <span className="text-green-600 dark:text-green-400">&quot;...&quot;</span>
                                        </div>
                                        <div className="text-gray-700 dark:text-gray-300">
                                            <span className="text-purple-600 dark:text-purple-400">&#125;</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
