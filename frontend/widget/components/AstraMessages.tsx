'use client';

import React, { useEffect, useRef } from 'react';
import { useAstra } from '../context/AstraContext';
import { useChat } from '../hooks/useChat';

export function AstraMessages() {
    const { config } = useAstra();
    const { messages, isLoading } = useChat();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const customClass = config.appearance?.elements?.messages || '';
    const bubbleClass = config.appearance?.elements?.messageBubble || '';

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className={`astra-messages ${customClass}`}>
            {messages.map((message) => (
                <div
                    key={message.id}
                    className={`astra-message ${message.role}`}
                >
                    <div className={`astra-message-bubble ${bubbleClass}`}>
                        <p className="astra-message-content">{message.content}</p>
                        <span className="astra-message-timestamp">
                            {message.timestamp.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </span>
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="astra-loading">
                    <div className="astra-loading-bubble">
                        <div className="astra-loading-dot" />
                        <div className="astra-loading-dot" />
                        <div className="astra-loading-dot" />
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
    );
}
