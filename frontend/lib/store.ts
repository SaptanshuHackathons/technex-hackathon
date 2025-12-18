import { create } from "zustand";
import { mockChatHistory, mockScrapedContent } from "./mock-data";

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
};

type Citation = {
  title: string;
  url: string;
};

type ChatStore = {
  messages: Message[];
  isLoading: boolean;
  citations: Citation[];
  scrapedData: typeof mockScrapedContent | null;
  addMessage: (message: Message) => void;
  setIsLoading: (loading: boolean) => void;
  // Initialize with mock data for demo
  init: () => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isLoading: false,
  citations: [],
  scrapedData: null,
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setIsLoading: (loading) => set({ isLoading: loading }),
  init: () =>
    set({
      messages: mockChatHistory as Message[], // Cast for demo
      scrapedData: mockScrapedContent,
    }),
}));
