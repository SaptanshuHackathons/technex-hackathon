"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import ProfileDropdown from "@/components/common/ProfileDropdown";
import { useUserStore } from "@/lib/user-store";

export function Navbar() {
    const { user } = useUserStore();

    return (
        <header className="absolute top-0 z-50 w-full">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 text-white dark:from-emerald-500 dark:to-emerald-600">
                        <Sparkles className="h-4 w-4 fill-current" />
                    </div>
                    <span>Astra</span>
                </div>

                <div className="flex items-center gap-4">
                    <Link
                        href="#"
                        className="text-sm font-medium text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white"
                    >
                        Documentation
                    </Link>

                    {user ? (
                        <ProfileDropdown />
                    ) : (
                        <>
                            <Button size="sm" variant="outline" className="rounded-full">
                                Log in
                            </Button>
                            <Button size="sm" className="rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800">
                                Start Free
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
