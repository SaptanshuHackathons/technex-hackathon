
import { ChatArea } from "@/components/chat/chat-area";
import { ChatSidebar } from "@/components/chat/sidebar";

export default function ChatPage() {
    return (
        <div className="flex h-screen w-full bg-linear-to-br from-emerald-50 via-white to-emerald-50/30 dark:from-emerald-950/20 dark:via-black dark:to-emerald-950/10">
            <ChatSidebar />
            <main className="flex-1 min-w-0">
                <ChatArea />
            </main>
        </div>
    );
}
