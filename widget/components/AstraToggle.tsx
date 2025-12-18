'use client';

import React from 'react';
import { useAstra } from '../context/AstraContext';

export function AstraToggle() {
    const { isOpen, setIsOpen, config } = useAstra();

    if (isOpen) return null;

    const customClass = config.appearance?.elements?.toggle || '';

    return (
        <button
            onClick={() => setIsOpen(true)}
            className={`astra-toggle ${customClass}`}
            aria-label="Open Astra Chat"
        >
            <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
            </svg>
            <div className="astra-toggle-indicator" />
        </button>
    );
}
