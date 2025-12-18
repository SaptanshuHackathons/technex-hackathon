"use client";

import { Navbar } from "@/components/landing/navbar";
import { ProfileHeader, SubscriptionCard, ChatHistoryList, DeveloperSection } from "@/components/profile/profile-components";

export default function ProfilePage() {
    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Navbar />

            <main className="container mx-auto px-4 pt-24 pb-12">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Header Section */}
                    <ProfileHeader />

                    {/* Dashboard Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Subscription Card - Full width on mobile, half on desktop */}
                        <SubscriptionCard />

                        {/* Developer Section - Full width on mobile, half on desktop */}
                        <DeveloperSection />

                        {/* Chat History - Full width on both */}
                        <div className="lg:col-span-2">
                            <ChatHistoryList />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
