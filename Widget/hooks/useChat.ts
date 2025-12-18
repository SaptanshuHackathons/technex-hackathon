'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    sources?: Array<{ url: string; title: string; score: number }>;
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
    siteId: string;
    apiEndpoint?: string;
    initialMessage?: string;
}

const DEFAULT_API_ENDPOINT = 'http://localhost:8000/api';

export function ChatProvider({ children, apiKey, siteId, apiEndpoint, initialMessage }: ChatProviderProps) {
    const defaultMessage = initialMessage || 'Hello! I\'m here to help you with your questions. What would you like to know?';
    const endpoint = apiEndpoint || DEFAULT_API_ENDPOINT;

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

        try {
            const response = await fetch(`${endpoint}/widget/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    site_id: siteId,
                    api_key: apiKey,
                    query: content,
                    limit: 5,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Query failed');
            }

            const data = await response.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.answer,
                timestamp: new Date(),
                sources: data.sources,
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadChat = () => {
        const chatText = messages
            .map((msg) => {
                const time = msg.timestamp.toLocaleTimeString();
                const sender = msg.role === 'user' ? 'You' : 'Assistant';
                return `[${time}] ${sender}: ${msg.content}`;
            })
            .join('\n\n');

        const url = 'data:text/plain;charset=utf-8,' + encodeURIComponent(chatText);

        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();

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

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within ChatProvider');
    }
    return context;
}
