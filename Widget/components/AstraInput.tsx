'use client';

import React, { useState } from 'react';
import { useAstra } from '../context/AstraContext';
import { useChat } from '../hooks/useChat';

export function AstraInput() {
    const { config } = useAstra();
    const { sendMessage, isLoading } = useChat();
    const [input, setInput] = useState('');

    const customClass = config.appearance?.elements?.input || '';

    const handleSend = () => {
        if (input.trim()) {
            sendMessage(input);
            setInput('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={`astra-input-container ${customClass}`}>
            <div className="astra-input-wrapper">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="astra-input"
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="astra-send-button"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
