"use client";

import { useUserStore } from "@/lib/user-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Key, Activity, Database, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockPreviousChats } from "@/lib/mock-data";

export function ProfileHeader() {
    const { user } = useUserStore();

    if (!user) return null;

    return (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
                <p className="text-muted-foreground">{user.email}</p>
            </div>
            <Badge variant={user.tier === "Pro" ? "default" : "secondary"} className="text-sm px-3 py-1">
                {user.tier} Plan
            </Badge>
        </div>
    );
}

export function SubscriptionCard() {
    const { user } = useUserStore();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" /> Subscription Usage
                </CardTitle>
                <CardDescription>Your current billing cycle usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Pages Crawled</span>
                        <span className="font-medium">1,240 / 5,000</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[25%]" />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>API Calls</span>
                        <span className="font-medium">8,430 / 10,000</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 w-[84%]" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function ChatHistoryList() {
    const handleExport = (id: string) => {
        console.log(`Exporting chat ${id}`);
        // Mock export functionality
        alert(`Chat ${id} exported successfully!`);
    };

    return (
        <Card className="col-span-1 md:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" /> Recent Chats
                </CardTitle>
                <CardDescription>View and manage your previous observations</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px] w-full pr-4">
                    <div className="flex flex-col gap-2">
                        {mockPreviousChats.map((chat) => (
                            <div key={chat.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                <div className="flex flex-col gap-1 overflow-hidden">
                                    <span className="font-medium truncate">{chat.title}</span>
                                    <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleExport(chat.id)} title="Export Chat">
                                    <Download className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

export function DeveloperSection() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" /> Developer Access
                </CardTitle>
                <CardDescription>Manage your API keys </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-secondary/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-secondary">
                            <Key className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">Production Key</span>
                            <span className="text-xs text-muted-foreground">pk_live_...93j2</span>
                        </div>
                    </div>
                    <Button variant="outline" size="sm">Roll Key</Button>
                </div>

                {/* <div className="flex items-center justify-between p-3 rounded-lg border bg-secondary/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-secondary">
                            <Database className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">Webhook URL</span>
                            <span className="text-xs text-muted-foreground">Not configured</span>
                        </div>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                </div> */}
            </CardContent>
        </Card>
    );
}
