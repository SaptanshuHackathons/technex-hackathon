"use client";

import { motion } from "framer-motion";
import {
    Code2,
    CalendarClock,
    Download,
    Webhook,
    CheckCircle2,
    Terminal,
    ArrowRight,
    FileJson,
    FileSpreadsheet,
    Database
} from "lucide-react";

export function BentoGrid() {
    return (
        <section className="w-full py-24 px-4 bg-white dark:bg-black transition-colors duration-300">
            <div className="mx-auto max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-16 text-center"
                >
                    <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
                        Everything you need to{" "}
                        <span className="bg-linear-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                            scrape smarter
                        </span>
                    </h2>
                    <p className="max-w-2xl mx-auto text-lg text-gray-500 dark:text-gray-400">
                        Powerful features designed to help you extract, transform, and deliver web data at scale without the headache.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[minmax(180px,auto)]">
                    {/* API Integration Card - Large Vertical */}
                    <div className="md:col-span-2 md:row-span-2 group relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl transition-all duration-300">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-linear-to-br from-emerald-500/20 to-teal-500/20 blur-3xl rounded-full" />

                        <div className="p-8 flex flex-col h-full relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <Code2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">API Integration</h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
                                Embed scraping directly into your product. Our REST API is designed for developer happiness with predictable inputs and typed responses.
                            </p>

                            {/* Improved Mock Terminal */}
                            <div className="flex-1 mt-auto overflow-hidden rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl">
                                <div className="flex items-center px-4 py-3 bg-zinc-900 border-b border-zinc-800 gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                    </div>
                                    <span className="ml-2 text-xs text-zinc-500 font-mono">api-example.js</span>
                                </div>
                                <div className="p-4 font-mono text-sm leading-relaxed text-zinc-300">
                                    <div className="flex">
                                        <span className="text-zinc-600 w-6 select-none">1</span>
                                        <span><span className="text-purple-400">const</span> response <span className="text-purple-400">=</span> <span className="text-purple-400">await</span> fetch<span className="text-zinc-500">(</span></span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-zinc-600 w-6 select-none">2</span>
                                        <span className="pl-4"><span className="text-green-400">'https://api.astra.ai/scrape'</span>,</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-zinc-600 w-6 select-none">3</span>
                                        <span className="pl-4"><span className="text-yellow-400">&#123;</span></span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-zinc-600 w-6 select-none">4</span>
                                        <span className="pl-8"><span className="text-blue-400">method</span>: <span className="text-green-400">'POST'</span>,</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-zinc-600 w-6 select-none">5</span>
                                        <span className="pl-8"><span className="text-blue-400">body</span>: JSON.<span className="text-blue-300">stringify</span><span className="text-purple-400">(</span><span className="text-yellow-400">&#123;</span></span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-zinc-600 w-6 select-none">6</span>
                                        <span className="pl-12"><span className="text-blue-400">url</span>: <span className="text-green-400">'https://example.com'</span></span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-zinc-600 w-6 select-none">7</span>
                                        <span className="pl-8"><span className="text-yellow-400">&#125;</span><span className="text-purple-400">)</span></span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-zinc-600 w-6 select-none">8</span>
                                        <span className="pl-4"><span className="text-yellow-400">&#125;</span></span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-zinc-600 w-6 select-none">9</span>
                                        <span><span className="text-zinc-500">)</span>;</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scheduled Scraping - Wide Top Right */}
                    <div className="md:col-span-2 group relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl transition-all duration-300">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-500/10 to-teal-500/10 blur-3xl rounded-full" />

                        <div className="p-8 relative z-10">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                            <CalendarClock className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Scheduled Jobs</h3>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
                                        Automate your data collection. Set up recurring scraping jobs that run hourly, daily, or weekly.
                                    </p>
                                </div>
                            </div>

                            {/* Mock Schedule UI */}
                            <div className="space-y-3">
                                {[
                                    { name: "Daily Product Sync", time: "Every day at 09:00 AM", status: "Active", color: "green" },
                                    { name: "Competitor Price Check", time: "Every 4 hours", status: "Running", color: "blue" },
                                ].map((job, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${job.color === 'green' ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`} />
                                            <div>
                                                <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">{job.name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{job.time}</div>
                                            </div>
                                        </div>
                                        <div className={`text-xs font-medium px-2 py-1 rounded-md ${job.status === "Active"
                                            ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                                            : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                                            }`}>
                                            {job.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Data Export - Small Bottom Right 1 */}
                    <div className="md:col-span-1 group relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl transition-all duration-300">
                        <div className="p-6 relative z-10 flex flex-col h-full">
                            <div className="mb-4 p-2.5 w-fit rounded-xl bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                <Download className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Export Anywhere</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                Download your data in any format you need instantly.
                            </p>

                            <div className="mt-auto grid grid-cols-2 gap-2">
                                <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-transparent group-hover:border-purple-200 dark:group-hover:border-purple-800 transition-colors">
                                    <FileJson className="w-6 h-6 text-gray-400 group-hover:text-purple-500 mb-1 transition-colors" />
                                    <span className="text-xs font-medium text-gray-500">JSON</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-transparent group-hover:border-green-200 dark:group-hover:border-green-800 transition-colors">
                                    <FileSpreadsheet className="w-6 h-6 text-gray-400 group-hover:text-green-500 mb-1 transition-colors" />
                                    <span className="text-xs font-medium text-gray-500">CSV</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Webhook Delivery - Small Bottom Right 2 */}
                    {/* <div className="md:col-span-1 group relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl transition-all duration-300">
                        <div className="p-6 relative z-10 flex flex-col h-full">
                            <div className="mb-4 p-2.5 w-fit rounded-xl bg-pink-100 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400">
                                <Webhook className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Webhooks</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                Real-time events sent to your secure endpoints.
                            </p>

                            <div className="mt-auto relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-zinc-900/50 z-10 w-full h-full" />
                                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 dark:bg-zinc-950 text-white text-xs font-mono">
                                    <span className="text-pink-400">POST</span>
                                    <span className="text-gray-400">/webhook...</span>
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div> */}

                </div>
            </div>
        </section>
    );
}
