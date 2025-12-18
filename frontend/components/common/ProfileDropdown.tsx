"use client";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AiOutlineDown } from "react-icons/ai";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CiLogout } from "react-icons/ci";
import { Settings } from "lucide-react";
import { CgProfile } from "react-icons/cg";
import { useUserStore } from "@/lib/user-store";

const ProfileDropdown = () => {
    const { user, logout } = useUserStore();

    if (!user) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild className="cursor-pointer">
                <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-3 py-2 hover:bg-transparent"
                >
                    <Avatar className="h-8 w-8">
                        {user.image ? (
                            <AvatarImage src={user.image} />
                        ) : (
                            <AvatarFallback>
                                {user.email?.charAt(0).toUpperCase() || "A"}
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start text-left">
                        <span className="text-sm font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.tier} Plan</span>
                    </div>
                    <AiOutlineDown  />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                    <p className="font-normal">Signed in as</p>
                    <p className="font-medium truncate">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/profile" className="flex items-center w-full">
                        <CgProfile />
                        Profile
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/settings" className="flex items-center w-full">
                        <Settings />
                        Settings
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={logout}
                >
                    <CiLogout />
                    Logout
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default ProfileDropdown;
