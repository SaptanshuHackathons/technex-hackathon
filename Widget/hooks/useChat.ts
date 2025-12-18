'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatContextValue {
    messages: Message[];
    isLoading: boolean;
    sendMessage: (content: string) => Promise<void>;
    downloadChat: () => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export interface ChatProviderProps {
    children: ReactNode;
    apiKey: string;
    apiEndpoint?: string;
    initialMessage?: string;
}

export function ChatProvider({ children, apiKey, apiEndpoint, initialMessage }: ChatProviderProps) {
    const defaultMessage = initialMessage || 'Hello! I\'m Astra, your context-aware assistant. How can I help you today?';

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '0',
            role: 'assistant',
            content: defaultMessage,
            timestamp: new Date(),
        },
    ]);
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = async (content: string) => {
        if (!content.trim()) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        // TODO: Replace with actual API call using apiKey and apiEndpoint
        // For now, using mock responses
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 500));

        // Mock response logic
        let botResponse = 'I understand your question. Let me help you with that.';

        const lowerContent = content.toLowerCase();
        if (lowerContent.includes('hello') || lowerContent.includes('hi')) {
            botResponse = 'Hello! I can help you navigate this site and answer questions about our services.';
        } else if (lowerContent.includes('pricing') || lowerContent.includes('price') || lowerContent.includes('cost')) {
            botResponse = 'Our pricing starts at $99/month for the basic plan. Would you like to know more about our features?';
        } else if (lowerContent.includes('feature') || lowerContent.includes('what can you do')) {
            botResponse = 'I can help you with website navigation, answer questions about products, provide support, and much more. What would you like to know?';
        } else if (lowerContent.includes('contact') || lowerContent.includes('support')) {
            botResponse = 'You can reach our support team at support@astra.ai or through the contact form on our website.';
        }

        const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: botResponse,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
    };

    const downloadChat = () => {
        const chatText = messages
            .map((msg) => {
                const time = msg.timestamp.toLocaleTimeString();
                const sender = msg.role === 'user' ? 'You' : 'Astra';
                return `[${time}] ${sender}: ${msg.content}`;
            })
            .join('\n\n');

        const url = 'data:text/plain;charset=utf-8,' + encodeURIComponent(chatText);

        const a = document.createElement('a');
        a.href = url;
        a.download = `astra-chat-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();

        // Delay removal to ensure browser registers the download attribute
        setTimeout(() => {
            document.body.removeChild(a);
        }, 100);
    };

    const value: ChatContextValue = {
        messages,
        isLoading,
        sendMessage,
        downloadChat,
    };

    return <ChatContext.Provider value={ value }> { children } </ChatContext.Provider>;
}

export function useChat() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within ChatProvider');
    }
    return context;
}
