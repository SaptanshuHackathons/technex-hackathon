'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    metadata?: any;
}

interface ChatContextValue {
    messages: Message[];
    isLoading: boolean;
    chatId: string | null;
    crawlId: string | null;
    sendMessage: (content: string) => Promise<void>;
    downloadChat: () => void;
    initializeChat: (crawlId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export interface ChatProviderProps {
    children: ReactNode;
    apiEndpoint?: string;
    initialMessage?: string;
    chatId?: string; // Optional: Resume existing chat
    crawlId?: string; // Optional: Initialize with crawl ID
}

export function ChatProvider({
    children,
    apiEndpoint = 'http://localhost:8000',
    initialMessage,
    chatId: initialChatId,
    crawlId: initialCrawlId
}: ChatProviderProps) {
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
    const [chatId, setChatId] = useState<string | null>(initialChatId || null);
    const [crawlId, setCrawlId] = useState<string | null>(initialCrawlId || null);

    // Load chat history if chatId exists
    useEffect(() => {
        if (chatId) {
            loadChatHistory();
        }
    }, [chatId]);

    // Initialize chat if crawlId exists but chatId doesn't
    useEffect(() => {
        if (crawlId && !chatId) {
            initializeChat(crawlId);
        }
    }, [crawlId]);

    const loadChatHistory = async () => {
        if (!chatId) return;

        try {
            const response = await fetch(`${apiEndpoint}/api/chats/${chatId}/history`);
            if (response.ok) {
                const data = await response.json();
                const historyMessages: Message[] = data.messages.map((msg: any) => ({
                    id: msg.message_id,
                    role: msg.role,
                    content: msg.content,
                    timestamp: new Date(msg.created_at),
                    metadata: msg.metadata
                }));

                if (historyMessages.length > 0) {
                    setMessages(historyMessages);
                }
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
    };

    const initializeChat = async (newCrawlId: string) => {
        try {
            const response = await fetch(`${apiEndpoint}/api/chats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ crawl_id: newCrawlId })
            });

            if (response.ok) {
                const data = await response.json();
                setChatId(data.chat_id);
                setCrawlId(newCrawlId);
                console.log('Chat initialized:', data.chat_id);
            }
        } catch (error) {
            console.error('Failed to initialize chat:', error);
        }
    };

    const sendMessage = async (content: string) => {
        if (!content.trim()) return;

        if (!chatId) {
            console.error('Chat not initialized. Please provide a crawlId or chatId.');
            return;
        }

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
            const response = await fetch(`${apiEndpoint}/api/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: content,
                    chat_id: chatId,
                    limit: 5
                })
            });

            if (response.ok) {
                const data = await response.json();

                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.answer,
                    timestamp: new Date(),
                    metadata: {
                        sources: data.sources,
                        ...data.metadata
                    }
                };

                setMessages((prev) => [...prev, assistantMessage]);
            } else {
                const errorData = await response.json();
                const errorMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: `Error: ${errorData.detail || 'Failed to get response'}`,
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, errorMessage]);
            }
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
            console.error('Error sending message:', error);
        } finally {
            setIsLoading(false);
        }
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
        chatId,
        crawlId,
        sendMessage,
        downloadChat,
        initializeChat,
    };

    return <ChatContext.Provider value={value}> {children} </ChatContext.Provider>;
}

export function useChat() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within ChatProvider');
    }
    return context;
}
