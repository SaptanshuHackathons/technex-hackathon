const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Default timeout for API requests (30 seconds)
const DEFAULT_TIMEOUT = 30000;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second

export interface TreeNode {
  id?: string;
  url: string;
  title: string;
  children: TreeNode[];
}

export interface Source {
  url: string;
  title: string;
  score: number;
}

export interface ScrapeResponse {
  success: boolean;
  pages: Array<{
    page_id: string;
    url: string;
    title?: string;
  }>;
  crawl_id: string;
  chat_id: string;
  message: string;
}

export interface QueryResponse {
  answer: string;
  sources: Source[];
  chat_id: string;
  crawl_id: string;
  metadata?: Record<string, any>;
}

export interface ChatTreeResponse {
  chat_id: string;
  crawl_id: string;
  tree: TreeNode[];
}

export interface Chat {
  id: string;
  crawl_id: string;
  url: string | null;
  title: string | null;
  page_count: number;
  created_at: string;
  updated_at?: string;
}

/**
 * Fetch with timeout and retry support.
 * Automatically retries on network errors with exponential backoff.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries: number = MAX_RETRIES,
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  const fetchOptions: RequestInit = {
    ...options,
    signal: controller.signal,
  };

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error as Error;
      clearTimeout(timeoutId);
      
      // Don't retry on abort (user cancelled or timeout)
      if ((error as Error).name === 'AbortError') {
        throw new Error('Request timed out');
      }
      
      // Don't retry on last attempt
      if (attempt < retries - 1) {
        // Exponential backoff with jitter
        const delay = RETRY_DELAY_BASE * Math.pow(2, attempt) + Math.random() * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Request failed after retries');
}

export async function scrapeWebsite(url: string, maxDepth: number = 1): Promise<ScrapeResponse> {
  const response = await fetchWithRetry(`${API_BASE_URL}/scrape`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      max_depth: maxDepth,
    }),
  }, MAX_RETRIES, 120000); // 2 minute timeout for scraping

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to scrape website');
  }

  return response.json();
}

export async function getChatTree(chatId: string): Promise<TreeNode[]> {
  const response = await fetchWithRetry(`${API_BASE_URL}/chats/${chatId}/tree`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get chat tree');
  }

  const data: ChatTreeResponse = await response.json();
  return data.tree;
}

export async function queryRAG(chatId: string, query: string, limit: number = 5): Promise<QueryResponse> {
  const response = await fetchWithRetry(`${API_BASE_URL}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      query,
      limit,
    }),
  }, MAX_RETRIES, 60000); // 1 minute timeout for queries

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to query RAG');
  }

  return response.json();
}

export async function listChats(): Promise<Chat[]> {
  const response = await fetchWithRetry(`${API_BASE_URL}/chats`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to list chats');
  }

  return response.json();
}

export interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'ai';
  content: string;
  sources: Source[];
  created_at: string;
}

export async function getChatMessages(chatId: string): Promise<Message[]> {
  const response = await fetchWithRetry(`${API_BASE_URL}/chats/${chatId}/messages`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get chat messages');
  }

  const data = await response.json();
  return data.messages;
}

export interface ScrapeProgress {
  stage: string;
  message: string;
  progress?: number;
  chat_id?: string;
  crawl_id?: string;
  page_count?: number;
}

export async function scrapeWebsiteWithProgress(
  url: string,
  maxDepth: number = 1,
  onProgress: (progress: ScrapeProgress) => void
): Promise<{ chat_id: string; crawl_id: string }> {
  // Use AbortController for cleanup on component unmount
  const controller = new AbortController();
  
  const response = await fetch(`${API_BASE_URL}/scrape/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      max_depth: maxDepth,
    }),
    signal: controller.signal,
  });

  if (!response.ok) {
    throw new Error('Failed to start scraping');
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('Response body is null');
  }

  let chatId = '';
  let crawlId = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            onProgress(data);

            if (data.chat_id) chatId = data.chat_id;
            if (data.crawl_id) crawlId = data.crawl_id;

            if (data.stage === 'error') {
              throw new Error(data.message);
            }
          } catch (parseError) {
            // Ignore parse errors for incomplete chunks
            console.warn('Failed to parse SSE chunk:', line);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return { chat_id: chatId, crawl_id: crawlId };
}

export async function deleteChat(chatId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete chat');
  }
}
