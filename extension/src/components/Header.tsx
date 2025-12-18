import React from 'react';
import { Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-foreground" />
        <h1 className="text-xl font-bold tracking-tight text-foreground">Astra</h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs text-muted-foreground font-medium">Active</span>
      </div>
    </header>
  );
};
