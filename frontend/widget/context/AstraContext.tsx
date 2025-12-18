'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface AstraAppearance {
  variables?: {
    primaryColor?: string;
    primaryHover?: string;
    fontFamily?: string;
    borderRadius?: string;
    accentColor?: string;
  };
  elements?: {
    container?: string;
    toggle?: string;
    window?: string;
    header?: string;
    messages?: string;
    messageBubble?: string;
    input?: string;
    footer?: string;
  };
}

export interface AstraConfig {
  chatId?: string; // Optional: Resume existing chat
  crawlId?: string; // Optional: Initialize with crawl ID
  title?: string;
  position?: 'bottom-right' | 'bottom-left';
  appearance?: AstraAppearance;
  apiEndpoint?: string;
  initialMessage?: string;
}

interface AstraContextValue {
  config: AstraConfig;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const AstraContext = createContext<AstraContextValue | undefined>(undefined);

export interface AstraProviderProps {
  config: AstraConfig;
  children: ReactNode;
}

export function AstraProvider({ config, children }: AstraProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const value: AstraContextValue = {
    config,
    isOpen,
    setIsOpen,
  };

  return <AstraContext.Provider value={value}>{children}</AstraContext.Provider>;
}

export function useAstra() {
  const context = useContext(AstraContext);
  if (!context) {
    throw new Error('useAstra must be used within AstraProvider');
  }
  return context;
}
