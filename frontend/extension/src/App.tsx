import { useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ChatInterface } from './components/ChatInterface';
import { mockScrape, mockChat, type Message } from './services/mockBackend';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [hasContext, setHasContext] = useState(false);

  const handleScrape = async () => {
    setIsScraping(true);
    try {
      await mockScrape();
      setHasContext(true);
      // Optional: Add a system notification or just rely on the button state
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I've analyzed the page context. Ask me anything!",
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error("Scrape failed", error);
    } finally {
      setIsScraping(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    // Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // Get Bot Response
    try {
      const responseText = await mockChat(text, hasContext);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat failed", error);
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
         />
      </div>
      <Footer />
    </div>
  );
}

export default App;
