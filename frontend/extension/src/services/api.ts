export const API_BASE_URL = 'http://localhost:8000/api';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface ScrapeResponse {
    success: boolean;
    crawl_id: string;
    message: string;
}

export interface CreateChatResponse {
    chat_id: string;
    crawl_id: string;
    message: string;
}

export interface QueryResponse {
    answer: string;
    sources: Array<{
        url: string;
        title: string;
        score: number;
    }>;
    chat_id: string;
    crawl_id: string;
}

export const api = {
    scrape: async (url: string): Promise<ScrapeResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/scrape`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, max_depth: 1 }), // Default to depth 1 for speed
            });

            if (!response.ok) {
                throw new Error(`Scrape failed: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API Scrape Error:', error);
            throw error;
        }
    },

    createChat: async (crawlId: string): Promise<CreateChatResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/chats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ crawl_id: crawlId }),
            });

            if (!response.ok) {
                throw new Error(`Create Chat failed: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API CreateChat Error:', error);
            throw error;
        }
    },

    query: async (query: string, chatId: string): Promise<QueryResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    chat_id: chatId,
                    limit: 5
                }),
            });

            if (!response.ok) {
                throw new Error(`Query failed: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API Query Error:', error);
            throw error;
        }
    }
};
