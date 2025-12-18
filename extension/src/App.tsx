import { useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ChatInterface } from './components/ChatInterface';
import { api, type Message } from './services/api';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [hasContext, setHasContext] = useState(false);
  
  // Backend State
  const [chatId, setChatId] = useState<string | null>(null);

  // Helper to get current tab URL
  const getCurrentUrl = async (): Promise<string> => {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
          resolve(tabs[0]?.url || 'https://example.com');
        });
      } else {
        // Fallback for local dev
        resolve('https://example.com');
      }
    });
  };

  const handleScrape = async () => {
    setIsScraping(true);
    try {
      const url = await getCurrentUrl();
      console.log('Analyzing URL:', url);
      
      // 1. Scrape
      const scrapeRes = await api.scrape(url);
      console.log('Scraped, crawl_id:', scrapeRes.crawl_id);

      // 2. Create Chat Session
      const chatRes = await api.createChat(scrapeRes.crawl_id);
      setChatId(chatRes.chat_id);
      console.log('Chat Session Created:', chatRes.chat_id);

      setHasContext(true);
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I've analyzed ${url}. Accessing ${scrapeRes.message}. Ask me anything!`,
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error("Analysis failed", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Error analyzing page: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsScraping(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      if (!chatId) {
        throw new Error("No active chat session. Please analyze the page first.");
      }

      // Get Bot Response
      const response = await api.query(text, chatId);
      
      const botMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.answer,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat failed", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleDownload = () => {
    const text = messages.map(m => 
      `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.role.toUpperCase()}: ${m.content}`
    ).join('\n\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `astra-chat-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      if (!chatId) {
        throw new Error("No active chat session. Please analyze the page first.");
      }

      const response = await api.summarize(chatId);
      
      // Display summary as assistant message with special formatting
      const summaryMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `📄 **Page Summary:**\n\n${response.summary}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, summaryMsg]);
    } catch (error) {
      console.error("Summarize failed", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Error generating summary: ${error instanceof Error ? error.message : 'Failed to summarize'}`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="w-[400px] h-[600px] bg-background text-foreground flex flex-col font-sans border border-border shadow-2xl relative">
      <Header />
      <div className="flex-1 flex flex-col min-h-0 bg-background">
         <ChatInterface 
           messages={messages}
           onSendMessage={handleSendMessage}
           isTyping={isTyping}
           hasContext={hasContext}
           onScrape={handleScrape}
           isScraping={isScraping}
           onDownload={handleDownload}
           onSummarize={handleSummarize}
           isSummarizing={isSummarizing}
         />
      </div>
      <Footer />
    </div>
  );
}

export default App;
