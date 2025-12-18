const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface TreeNode {
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

export async function scrapeWebsite(url: string, maxDepth: number = 1): Promise<ScrapeResponse> {
  const response = await fetch(`${API_BASE_URL}/scrape`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      max_depth: maxDepth,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to scrape website');
  }

  return response.json();
}

export async function getChatTree(chatId: string): Promise<TreeNode[]> {
  const response = await fetch(`${API_BASE_URL}/chats/${chatId}/tree`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get chat tree');
  }

  const data: ChatTreeResponse = await response.json();
  return data.tree;
}

export async function queryRAG(chatId: string, query: string, limit: number = 5): Promise<QueryResponse> {
  const response = await fetch(`${API_BASE_URL}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      query,
      limit,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to query RAG');
  }

  return response.json();
}

export async function listChats(): Promise<Chat[]> {
  const response = await fetch(`${API_BASE_URL}/chats`);

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
  const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`);

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
  const response = await fetch(`${API_BASE_URL}/scrape/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      max_depth: maxDepth,
    }),
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

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.substring(6));
        onProgress(data);

        if (data.chat_id) chatId = data.chat_id;
        if (data.crawl_id) crawlId = data.crawl_id;

        if (data.stage === 'error') {
          throw new Error(data.message);
        }
      }
    }
  }

  return { chat_id: chatId, crawl_id: crawlId };
}
