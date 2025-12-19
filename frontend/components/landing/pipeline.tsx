"use client";

import { Code2, Cpu, FileJson } from "lucide-react";

export function Pipeline() {
    return (
        <section className="w-full py-24 px-4 bg-linear-to-b from-transparent via-emerald-50/50 to-transparent dark:via-emerald-950/20">
            <div className="mx-auto max-w-7xl">
                <div className="mb-16 text-center">
                    <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                        How it{" "}
                        <span className="bg-linear-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                            works
                        </span>
                    </h2>
                    <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
                        From messy HTML to clean, structured data in milliseconds
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Step 1 */}
                    <div className="rounded-3xl border border-emerald-200/60 bg-white p-8 shadow-lg dark:border-emerald-900/30 dark:bg-zinc-900">
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            STEP 1
                        </div>
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-600 to-emerald-700 text-white">
                                <Code2 className="h-6 w-6" />
                            </div>
                            <h3 className="text-2xl font-bold">Raw Input</h3>
                        </div>
                        <p className="mb-6 text-gray-600 dark:text-gray-400">
                            Paste a URL or HTML. We handle JavaScript-heavy sites and complex layouts.
                        </p>
                        <div className="rounded-2xl bg-zinc-950 p-4 font-mono text-xs text-zinc-300">
                            <div className="text-zinc-500">&lt;div class=&quot;page&quot;&gt; ... &lt;/div&gt;</div>
                            <div className="text-zinc-500">&lt;script&gt; ... &lt;/script&gt;</div>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="rounded-3xl border border-emerald-200/60 bg-white p-8 shadow-lg dark:border-emerald-900/30 dark:bg-zinc-900">
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            STEP 2
                        </div>
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-600 to-teal-500 text-white">
                                <Cpu className="h-6 w-6" />
                            </div>
                            <h3 className="text-2xl font-bold">AI Processing</h3>
                        </div>
                        <p className="mb-6 text-gray-600 dark:text-gray-400">
                            We extract the useful text, remove noise, and keep the structure.
                        </p>
                        <div className="space-y-3">
                            <div>
                                <div className="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <span>Extract</span>
                                    <span className="font-medium text-gray-700 dark:text-gray-200">100%</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-emerald-100 dark:bg-emerald-950/50">
                                    <div className="h-full w-full rounded-full bg-linear-to-r from-emerald-500 to-emerald-600" />
                                </div>
                            </div>
                            <div>
                                <div className="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <span>Clean</span>
                                    <span className="font-medium text-gray-700 dark:text-gray-200">85%</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-emerald-100 dark:bg-emerald-950/50">
                                    <div className="h-full w-[85%] rounded-full bg-linear-to-r from-emerald-500 to-teal-500" />
                                </div>
                            </div>
                            <div>
                                <div className="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <span>Structure</span>
                                    <span className="font-medium text-gray-700 dark:text-gray-200">95%</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-emerald-100 dark:bg-emerald-950/50">
                                    <div className="h-full w-[95%] rounded-full bg-linear-to-r from-teal-500 to-emerald-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="rounded-3xl border border-emerald-200/60 bg-white p-8 shadow-lg dark:border-emerald-900/30 dark:bg-zinc-900">
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            STEP 3
                        </div>
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-600 to-green-500 text-white">
                                <FileJson className="h-6 w-6" />
                            </div>
                            <h3 className="text-2xl font-bold">Clean Output</h3>
                        </div>
                        <p className="mb-6 text-gray-600 dark:text-gray-400">
                            Get JSON/Markdown ready for your LLM, RAG pipeline, or database.
                        </p>
                        <div className="rounded-2xl bg-zinc-950 p-4 font-mono text-xs text-zinc-300">
                            <div>{"{"}</div>
                            <div className="ml-4">"title": "...",</div>
                            <div className="ml-4">"content": "..."</div>
                            <div>{"}"}</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
