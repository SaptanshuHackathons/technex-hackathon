import { create } from "zustand";
import { scrapeWebsite, getChatTree, queryRAG, TreeNode, listChats, Chat, getChatMessages, scrapeWebsiteWithProgress, ScrapeProgress, deleteChat } from "./api";

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
  sources?: Array<{
    url: string;
    title: string;
    score: number;
  }>;
};

type ScrapingStage = {
  stage: string;
  message: string;
  progress: number;
  completed: boolean;
};

type ChatStore = {
  // Session state
  chatId: string | null;
  crawlId: string | null;

  // Messages
  messages: Message[];
  isLoading: boolean;

  // Scraping state
  isScraping: boolean;
  scrapingStages: ScrapingStage[];

  // Sidebar tree
  pageTree: TreeNode[];
  isLoadingTree: boolean;

  // Previous chats
  previousChats: Chat[];
  isLoadingChats: boolean;

  // Actions
  startScrape: (url: string, maxDepth?: number) => Promise<void>;
  startScrapeWithProgress: (url: string, maxDepth?: number) => Promise<void>;
  loadTree: (chatId: string) => Promise<void>;
  loadPreviousChats: () => Promise<void>;
  loadMessages: (chatId: string) => Promise<void>;
  sendMessage: (query: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  setChatId: (chatId: string) => Promise<void>;
  reset: () => void;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  chatId: null,
  crawlId: null,
  messages: [],
  isLoading: false,
  isScraping: false,
  scrapingStages: [],
  pageTree: [],
  isLoadingTree: false,
  previousChats: [],
  isLoadingChats: false,

  // Start scraping with progress tracking
  startScrapeWithProgress: async (url: string, maxDepth: number = 1) => {
    set({ 
      isScraping: true, 
      messages: [],
      scrapingStages: []
    });
    
    try {
      const result = await scrapeWebsiteWithProgress(url, maxDepth, (progress: ScrapeProgress) => {
        const stageMap: Record<string, string> = {
          'initializing': 'Starting scrape process...',
          'cache_found': 'Found existing data for this URL',
          'chat_found': 'Using existing chat session',
          'chat_created': 'Chat session created',
          'loaded': 'Loading cached data...',
          'scraping': 'Scraping website pages...',
          'scraped': progress.message || 'Pages scraped successfully',
          'storing': 'Storing page data...',
          'stored': 'Pages stored successfully',
          'embedding': 'Generating embeddings...',
          'embedded': progress.message || 'Embeddings generated',
          'summarizing': 'Generating AI summary...',
          'complete': 'Scraping completed!',
        };

        const currentStages = get().scrapingStages;
        const stageName = progress.stage;
        const stageMessage = stageMap[stageName] || progress.message;

        // Check if stage already exists
        const existingIndex = currentStages.findIndex(s => s.stage === stageName);
        
        if (existingIndex >= 0) {
          // Update existing stage
          const updatedStages = [...currentStages];
          updatedStages[existingIndex] = {
            stage: stageName,
            message: stageMessage,
            progress: progress.progress || 0,
            completed: ['cache_found', 'chat_found', 'scraped', 'stored', 'embedded', 'complete', 'chat_created', 'loaded'].includes(stageName)
          };
          set({ scrapingStages: updatedStages });
        } else {
          // Add new stage
          set({ 
            scrapingStages: [...currentStages, {
              stage: stageName,
              message: stageMessage,
              progress: progress.progress || 0,
              completed: false
            }]
          });
        }

        // Update chat_id when received (especially important for cached chats)
        if (progress.chat_id) {
          set({ chatId: progress.chat_id });
        }
        if (progress.crawl_id) {
          set({ crawlId: progress.crawl_id });
        }
      });

      set({
        chatId: result.chat_id,
        crawlId: result.crawl_id,
        isScraping: false,
      });

      // Load the page tree, messages, and previous chats in parallel
      await Promise.all([
        get().loadTree(result.chat_id),
        get().loadMessages(result.chat_id),
        get().loadPreviousChats(),
      ]);

    } catch (error) {
      set({ isScraping: false });
      throw error;
    }
  },

  // Start scraping and create chat session (legacy)
  startScrape: async (url: string, maxDepth: number = 1) => {
    set({ isLoading: true, messages: [] }); // Clear previous messages
    try {
      const response = await scrapeWebsite(url, maxDepth);
      set({
        chatId: response.chat_id,
        crawlId: response.crawl_id,
        isLoading: false,
      });

      // Load tree, messages, and previous chats in parallel
      await Promise.all([
        get().loadTree(response.chat_id),
        get().loadMessages(response.chat_id),
        get().loadPreviousChats(),
      ]);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Load page tree for sidebar
  loadTree: async (chatId: string) => {
    set({ isLoadingTree: true });
    try {
      const treeData = await getChatTree(chatId);
      set({
        pageTree: treeData || [],
        isLoadingTree: false,
      });
    } catch (error) {
      set({ pageTree: [], isLoadingTree: false });
      throw error; // Re-throw so setChatId can catch it
    }
  },

  // Load previous chats
  loadPreviousChats: async () => {
    set({ isLoadingChats: true });
    try {
      const chats = await listChats();
      set({
        previousChats: chats,
        isLoadingChats: false,
      });
    } catch (error) {
      console.error("Failed to load previous chats:", error);
      set({ isLoadingChats: false });
    }
  },

  // Load messages from database
  loadMessages: async (chatId: string) => {
    set({ isLoading: true });
    try {
      const dbMessages = await getChatMessages(chatId);
      const formattedMessages = dbMessages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        sources: msg.sources || [],
      }));
      set({
        messages: formattedMessages,
        isLoading: false,
      });
    } catch (error) {
      set({ messages: [], isLoading: false });
      throw error; // Re-throw so setChatId can catch it
    }
  },

  // Send a message and get RAG response
  sendMessage: async (query: string) => {
    const { chatId, messages } = get();
    if (!chatId) {
      throw new Error("No active chat session");
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
    };
    set({ messages: [...messages, userMessage], isLoading: true });

    try {
      const response = await queryRAG(chatId, query);

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: response.answer,
        sources: response.sources,
      };
      set((state) => ({
        messages: [...state.messages, aiMessage],
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false });
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: `Error: ${
          error instanceof Error ? error.message : "Failed to get response"
        }`,
      };
      set((state) => ({
        messages: [...state.messages, errorMessage],
      }));
    }
  },

  // Set chat ID (e.g., when loading from URL)
  setChatId: async (chatId: string) => {
    const currentChatId = get().chatId;
    if (currentChatId !== chatId) {
      set({ chatId, isLoadingTree: true, isLoading: true });
      try {
        const results = await Promise.allSettled([
          get().loadTree(chatId),
          get().loadMessages(chatId),
        ]);
        
        // Check if any promise was rejected (chat not found)
        const rejected = results.find(r => r.status === 'rejected');
        if (rejected && rejected.status === 'rejected') {
          // Chat doesn't exist - reset state and throw
          get().reset();
          throw rejected.reason;
        }
      } catch (error) {
        // Chat doesn't exist - reset state
        get().reset();
        throw error;
      }
    }
  },

  // Delete a chat
  deleteChat: async (chatId: string) => {
    try {
      await deleteChat(chatId);
      
      // Remove from previousChats list
      const currentChats = get().previousChats;
      set({ previousChats: currentChats.filter(chat => chat.id !== chatId) });
      
      // If the deleted chat was active, reset
      if (get().chatId === chatId) {
        get().reset();
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
      throw error;
    }
  },

  // Reset store
  reset: () => {
    set({
      chatId: null,
      crawlId: null,
      messages: [],
      isLoading: false,
      pageTree: [],
      isLoadingTree: false,
    });
  },
}));
