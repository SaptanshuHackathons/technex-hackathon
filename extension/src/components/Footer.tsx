import React from 'react';
import { ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="px-6 py-3 border-t border-border bg-background">
      <a 
        href="https://astra-web.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group"
      >
        <span>For in-depth analysis: Visit our website</span>
        <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </a>
    </footer>
  );
};
