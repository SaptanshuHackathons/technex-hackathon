'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AstraConfig, AstraInitStatus } from '../types/config';


export type { AstraAppearance, AstraConfig } from '../types/config';


interface AstraContextValue {
  config: AstraConfig;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  initStatus: AstraInitStatus;
  refreshEmbeddings: () => Promise<void>;
}

const AstraContext = createContext<AstraContextValue | undefined>(undefined);

export interface AstraProviderProps {
  config: AstraConfig;
  children: ReactNode;
}

const DEFAULT_API_ENDPOINT = 'http://localhost:8000/api';

export function AstraProvider({ config, children }: AstraProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [initStatus, setInitStatus] = useState<AstraInitStatus>({
    isReady: false,
    isInitializing: true,
    error: null,
    hasEmbeddings: false,
    indexedPageCount: 0,
  });

  const apiEndpoint = config.apiEndpoint || DEFAULT_API_ENDPOINT;

  // Initialize on mount - check if embeddings exist
  useEffect(() => {
    const initWidget = async () => {
      try {
        setInitStatus(prev => ({ ...prev, isInitializing: true, error: null }));

        const response = await fetch(`${apiEndpoint}/widget/init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            site_id: config.siteId,
            api_key: config.apiKey,
            pages: config.pages || [],
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Failed to initialize widget');
        }

        const data = await response.json();

        setInitStatus({
          isReady: data.has_embeddings,
          isInitializing: false,
          error: data.has_embeddings ? null : 'No embeddings found. Call refreshEmbeddings() to create them.',
          hasEmbeddings: data.has_embeddings,
          indexedPageCount: data.indexed_page_count,
        });
      } catch (error) {
        setInitStatus({
          isReady: false,
          isInitializing: false,
          error: error instanceof Error ? error.message : 'Initialization failed',
          hasEmbeddings: false,
          indexedPageCount: 0,
        });
      }
    };

    if (config.siteId && config.apiKey) {
      initWidget();
    }
  }, [config.siteId, config.apiKey, apiEndpoint]);

  // Manual refresh function for developers
  const refreshEmbeddings = async () => {
    try {
      setInitStatus(prev => ({ ...prev, isInitializing: true, error: null }));

      const response = await fetch(`${apiEndpoint}/widget/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: config.siteId,
          api_key: config.apiKey,
          pages: config.pages || [],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to refresh embeddings');
      }

      const data = await response.json();

      setInitStatus({
        isReady: true,
        isInitializing: false,
        error: null,
        hasEmbeddings: true,
        indexedPageCount: data.indexed_page_count,
      });
    } catch (error) {
      setInitStatus(prev => ({
        ...prev,
        isInitializing: false,
        error: error instanceof Error ? error.message : 'Refresh failed',
      }));
    }
  };

  const value: AstraContextValue = {
    config,
    isOpen,
    setIsOpen,
    initStatus,
    refreshEmbeddings,
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
