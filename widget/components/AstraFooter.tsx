'use client';

import React from 'react';
import { useAstra } from '../context/AstraContext';

export function AstraFooter() {
    const { config } = useAstra();
    const customClass = config.appearance?.elements?.footer || '';

    return (
        <div className={`astra-footer ${customClass}`}>
            <a
                href="https://astra.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="astra-footer-link"
            >
                <span>Powered by</span>
                <span className="astra-footer-brand">Astra</span>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                </svg>
            </a>
        </div>
    );
}
