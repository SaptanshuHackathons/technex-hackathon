'use client';

import { useState, useEffect } from 'react';

interface AutoCrawlWidgetProps {
    url?: string;
    maxDepth?: number;
    apiEndpoint?: string;
    children: (crawlId: string | null, isLoading: boolean, error: string | null) => React.ReactNode;
}

/**
 * Component that automatically crawls a website and provides the crawl ID to its children.
 * This eliminates the need to manually manage crawl IDs for testing.
 */
export function AutoCrawlWidget({
    url = 'https://example.com',
    maxDepth = 1,
    apiEndpoint = 'http://localhost:8000',
    children
}: AutoCrawlWidgetProps) {
    const [crawlId, setCrawlId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const startCrawl = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // First, check if there's already a recent crawl for this URL
                const crawlsResponse = await fetch(`${apiEndpoint}/api/crawls`);
                if (crawlsResponse.ok) {
                    const crawls = await crawlsResponse.json();

                    // Find a recent crawl for the same URL (within last hour)
                    const oneHourAgo = Date.now() - 60 * 60 * 1000;
                    const existingCrawl = crawls.find((crawl: any) => {
                        const crawlTime = new Date(crawl.created_at).getTime();
                        return crawl.url === url && crawlTime > oneHourAgo;
                    });

                    if (existingCrawl) {
                        console.log('Using existing crawl:', existingCrawl.crawl_id);
                        setCrawlId(existingCrawl.crawl_id);
                        setIsLoading(false);
                        return;
                    }
                }

                // No existing crawl found, create a new one
                console.log('Starting new crawl for:', url);
                const scrapeResponse = await fetch(`${apiEndpoint}/api/scrape`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url: url,
                        max_depth: maxDepth
                    })
                });

                if (!scrapeResponse.ok) {
                    const errorData = await scrapeResponse.json();
                    throw new Error(errorData.detail || 'Failed to crawl website');
                }

                const data = await scrapeResponse.json();
                console.log('Crawl completed:', data.crawl_id);
                setCrawlId(data.crawl_id);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
                console.error('Crawl error:', errorMessage);
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        startCrawl();
    }, [url, maxDepth, apiEndpoint]);

    return <>{children(crawlId, isLoading, error)}</>;
}
