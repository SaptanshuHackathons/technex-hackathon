"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const plans = [
    {
        name: "Basic plan",
        description: "Our most popular plan.",
        monthlyPrice: 10,
        annualPrice: 8,
        features: [
            "Access to all basic features",
            "Basic reporting and analytics",
            "Up to 10 individual users",
            "20 GB individual data",
            "Basic chat and email support",
        ],
        popular: false,
    },
    {
        name: "Business plan",
        description: "Growing teams up to 20 users.",
        monthlyPrice: 20,
        annualPrice: 16,
        features: [
            "200+ integrations",
            "Advanced reporting and analytics",
            "Up to 20 individual users",
            "40 GB individual data",
            "Priority chat and email support",
        ],
        popular: true,
    },
    {
        name: "Enterprise plan",
        description: "Advanced features + unlimited users.",
        monthlyPrice: 40,
        annualPrice: 32,
        features: [
            "Advanced custom fields",
            "Audit log and data history",
            "Unlimited individual users",
            "Unlimited individual data",
            "Personalized + priority service",
        ],
        popular: false,
    },
];

export function Pricing() {
    const [isAnnual, setIsAnnual] = useState(false);

    return (
        <section className="w-full py-24 px-4">
            <div className="mx-auto max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-12 text-center"
                >
                    <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
                        Pricing plans
                    </h2>
                    <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
                        Simple, transparent pricing that grows with you. Try any plan free for 30 days.
                    </p>

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center rounded-lg border border-black/10 bg-gray-50 p-1 dark:border-white/10 dark:bg-zinc-900">
                        <button
                            onClick={() => setIsAnnual(false)}
                            className={`rounded-md px-6 py-2 text-sm font-medium transition-all ${!isAnnual
                                    ? "bg-white text-black shadow-sm dark:bg-zinc-800 dark:text-white"
                                    : "text-gray-600 dark:text-gray-400"
                                }`}
                        >
                            Monthly billing
                        </button>
                        <button
                            onClick={() => setIsAnnual(true)}
                            className={`rounded-md px-6 py-2 text-sm font-medium transition-all ${isAnnual
                                    ? "bg-white text-black shadow-sm dark:bg-zinc-800 dark:text-white"
                                    : "text-gray-600 dark:text-gray-400"
                                }`}
                        >
                            Annual billing
                        </button>
                    </div>
                </motion.div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="relative"
                        >
                            {/* Popular Badge */}
                            {plan.popular && (
                                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                                    <div className="rounded-full bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-1 text-xs font-semibold text-white shadow-lg">
                                        Most popular plan
                                    </div>
                                </div>
                            )}

                            <div
                                className={`group relative overflow-hidden rounded-3xl border bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-2xl dark:bg-zinc-900 ${plan.popular
                                        ? "border-purple-500/50 dark:border-purple-500/50"
                                        : "border-black/5 dark:border-white/10"
                                    }`}
                            >
                                {/* Background Gradient */}
                                {plan.popular && (
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent" />
                                )}

                                <div className="relative z-10">
                                    {/* Price */}
                                    <div className="mb-6">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-5xl font-bold">
                                                ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                                            </span>
                                            <span className="text-gray-500 dark:text-gray-400">/mth</span>
                                        </div>
                                        {isAnnual && (
                                            <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                                                Save ${(plan.monthlyPrice - plan.annualPrice) * 12}/year
                                            </p>
                                        )}
                                    </div>

                                    {/* Plan Name & Description */}
                                    <div className="mb-6">
                                        <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {plan.description}
                                        </p>
                                    </div>

                                    {/* Features */}
                                    <ul className="mb-8 space-y-3">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-3">
                                                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                                    <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                                                </div>
                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA Buttons */}
                                    <div className="space-y-3">
                                        <Button
                                            className={`w-full rounded-xl py-6 font-semibold transition-all ${plan.popular
                                                    ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-700 hover:to-purple-600 shadow-lg shadow-purple-500/25"
                                                    : "bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90"
                                                }`}
                                        >
                                            Get started
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full rounded-xl py-6 font-medium border-black/10 dark:border-white/10"
                                        >
                                            Chat to sales
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
