import React, { useState, useRef, useEffect } from 'react';
import { Send, Download, Database, FileText, Loader2, ExternalLink } from 'lucide-react';
import type { Message } from '../services/api';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (msg: string) => void;
  isTyping: boolean;
  hasContext: boolean;
  onScrape: () => void;
  isScraping: boolean;
  onDownload: () => void;
  onSummarize: () => void;
  isSummarizing: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isTyping,
  hasContext,
  onScrape,
  isScraping,
  onDownload,
  onSummarize,
  isSummarizing
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[450px] bg-background">
      {/* Action Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30 gap-2">
        {/* Left: Main Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onScrape}
            disabled={isScraping || hasContext}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all
              ${hasContext 
                ? 'bg-green-500/10 text-green-500 cursor-default' 
                : 'bg-primary text-primary-foreground hover:bg-primary/90'}
            `}
          >
            {isScraping ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : hasContext ? (
              <Database className="w-3 h-3" />
            ) : (
              <Database className="w-3 h-3" />
            )}
            {isScraping ? 'Analyzing...' : hasContext ? 'Active' : 'Analyze'}
          </button>

          <button
            onClick={onSummarize}
            disabled={!hasContext || isSummarizing}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all
              ${!hasContext || isSummarizing
                ? 'bg-secondary/50 text-muted-foreground cursor-not-allowed' 
                : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'}
            `}
            title="Generate page summary"
          >
            {isSummarizing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <FileText className="w-3 h-3" />
            )}
            {isSummarizing ? 'Summarizing...' : 'Summarize'}
          </button>
        </div>

        {/* Right: Secondary Actions */}
        <div className="flex items-center gap-2">
          <a
            href="https://astra-web.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            title="Visit Website"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onDownload}
            disabled={messages.length === 0}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            title="Download Chat"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground opacity-50 space-y-2">
            <FileText className="w-8 h-8" />
            <p className="text-sm">No messages yet. Start chatting!</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                ${msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-br-none' 
                  : 'bg-secondary text-secondary-foreground rounded-bl-none'}
              `}
            >
              <div className="whitespace-pre-wrap break-words">
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-secondary text-secondary-foreground rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 pt-2">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this page..."
            className="w-full bg-secondary text-foreground placeholder-muted-foreground text-sm rounded-full pl-4 pr-12 py-3 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all border border-transparent hover:border-border"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-primary-foreground rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
