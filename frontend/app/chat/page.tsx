
import { ChatArea } from "@/components/chat/chat-area";
import { ChatSidebar } from "@/components/chat/sidebar";

export default function ChatPage() {
    return (
        <div className="flex h-screen w-full bg-white dark:bg-black">
            <ChatSidebar />
            <main className="flex-1 min-w-0">
                <ChatArea />
            </main>
        </div>
    );
}
