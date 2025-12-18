'use client';

import React, { ReactNode, CSSProperties } from 'react';
import { AstraProvider, AstraConfig } from '../context/AstraContext';
import { ChatProvider } from '../hooks/useChat';
import './AstraWidget.css';

export interface AstraRootProps extends AstraConfig {
    children: ReactNode;
}

export function AstraRoot({ children, ...config }: AstraRootProps) {
    const position = config.position || 'bottom-right';
    const customClass = config.appearance?.elements?.container || '';

    // Apply CSS variables from appearance config
    const style: CSSProperties = {};
    if (config.appearance?.variables) {
        const vars = config.appearance.variables;
        if (vars.primaryColor) style['--astra-primary' as any] = vars.primaryColor;
        if (vars.primaryHover) style['--astra-primary-hover' as any] = vars.primaryHover;
        if (vars.fontFamily) style['--astra-font-family' as any] = vars.fontFamily;
        if (vars.borderRadius) style['--astra-radius' as any] = vars.borderRadius;
        if (vars.accentColor) style['--astra-accent' as any] = vars.accentColor;
    }

    return (
        <AstraProvider config={config}>
            <ChatProvider
                apiEndpoint={config.apiEndpoint}
                initialMessage={config.initialMessage}
                chatId={config.chatId}
                crawlId={config.crawlId}
            >
                <div
                    className={`astra-widget-container position-${position} ${customClass}`}
                    style={style}
                >
                    {children}
                </div>
            </ChatProvider>
        </AstraProvider>
    );
}
