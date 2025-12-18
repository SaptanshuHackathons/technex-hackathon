'use client';

import React from 'react';
import { useAstra } from '../context/AstraContext';
import { useChat } from '../hooks/useChat';

export function AstraHeader() {
    const { config, setIsOpen } = useAstra();
    const { downloadChat } = useChat();

    const title = config.title || 'Astra Assistant';
    const customClass = config.appearance?.elements?.header || '';

    return (
        <div className={`astra-header ${customClass}`}>
            <div className="astra-header-info">
                <div className="astra-header-status" />
                <h2 className="astra-header-title">{title}</h2>
            </div>
            <div className="astra-header-actions">
                <button
                    onClick={downloadChat}
                    className="astra-header-button"
                    title="Download chat"
                >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                    </svg>
                </button>
                <button
                    onClick={() => setIsOpen(false)}
                    className="astra-header-button"
                    title="Close"
                >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
}
