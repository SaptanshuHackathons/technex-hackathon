'use client';

import React from 'react';
import { AstraRoot } from './AstraRoot';
import { AstraToggle } from './AstraToggle';
import { AstraWindow } from './AstraWindow';
import { AstraHeader } from './AstraHeader';
import { AstraMessages } from './AstraMessages';
import { AstraInput } from './AstraInput';
import { AstraFooter } from './AstraFooter';
import { AstraConfig } from '../context/AstraContext';

// Default pre-composed component
export default function AstraWidget(config: AstraConfig) {
    return (
        <AstraRoot {...config}>
            <AstraToggle />
            <AstraWindow>
                <AstraHeader />
                <AstraMessages />
                <AstraInput />
                <AstraFooter />
            </AstraWindow>
        </AstraRoot>
    );
}

// Export compound components for custom layouts
AstraWidget.Root = AstraRoot;
AstraWidget.Toggle = AstraToggle;
AstraWidget.Window = AstraWindow;
AstraWidget.Header = AstraHeader;
AstraWidget.Messages = AstraMessages;
AstraWidget.Input = AstraInput;
AstraWidget.Footer = AstraFooter;

// Export types
export type { AstraConfig, AstraAppearance } from '../context/AstraContext';
export type { Message } from '../hooks/useChat';
