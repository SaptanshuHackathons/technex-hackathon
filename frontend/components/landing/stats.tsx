"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface StatItemProps {
    value: string;
    label: string;
    delay: number;
}

function StatItem({ value, label, delay }: StatItemProps) {
    const [count, setCount] = useState(0);
    const numericValue = parseInt(value.replace(/\D/g, ""));
    const suffix = value.replace(/[\d.]/g, "");

    useEffect(() => {
        const duration = 2000; // 2 seconds
        const steps = 60;
        const increment = numericValue / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= numericValue) {
                setCount(numericValue);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [numericValue]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay }}
            className="text-center"
        >
            <div className="mb-2 text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                {count.toLocaleString()}{suffix}
            </div>
            <div className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                {label}
            </div>
        </motion.div>
    );
}

export function Stats() {
    return (
        <section className="w-full py-24 px-4 relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent dark:via-emerald-500/10" />

            <div className="mx-auto max-w-7xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-16 text-center"
                >
                    <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                        Trusted by{" "}
                        <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                            developers
                        </span>{" "}
                        worldwide
                    </h2>
                    <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
                        Join thousands of teams building the future of AI
                    </p>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
                    <StatItem value="1M+" label="Pages Processed" delay={0.2} />
                    <StatItem value="99.9%" label="Uptime" delay={0.4} />
                    <StatItem value="50+" label="Enterprise Partners" delay={0.6} />
                </div>

                {/* Trust Badges */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="mt-20 flex flex-wrap items-center justify-center gap-8"
                >
                    <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-sm font-medium">SOC 2 Compliant</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="text-sm font-medium">GDPR Ready</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                        <div className="h-2 w-2 rounded-full bg-purple-500" />
                        <span className="text-sm font-medium">Enterprise SLA</span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
