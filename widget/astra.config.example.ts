import type { AstraConfig } from './types/config';

/**
 * Example Astra Widget Configuration
 * 
 * Copy this file to your project and rename to `astra.config.ts`.
 * Update the values below with your own configuration.
 * 
 * IMPORTANT: 
 * - Store your apiKey in environment variables, not in source code
 * - Embeddings are generated once when you first initialize the widget
 * - To refresh embeddings (e.g., after doc updates), call the refresh endpoint
 */
const astraConfig: AstraConfig = {
  // === Required Configuration ===
  
  /**
   * Unique identifier for your documentation site.
   * This namespaces your embeddings so they don't conflict with other sites.
   * Use a URL-safe string like 'my-project-docs' or 'acme-api'
   */
  siteId: 'your-site-id',

  /**
   * Your Astra API key (get from dashboard.astra.ai)
   * ⚠️ In production, use environment variables:
   * apiKey: process.env.NEXT_PUBLIC_ASTRA_API_KEY!
   */
  apiKey: 'your-api-key',

  /**
   * Pages to scrape and index for the AI chatbot.
   * Add all documentation pages you want the AI to know about.
   */
  pages: [
    { url: 'https://docs.example.com/', label: 'Home' },
    { url: 'https://docs.example.com/getting-started', label: 'Getting Started' },
    { url: 'https://docs.example.com/api-reference', label: 'API Reference' },
    { url: 'https://docs.example.com/guides/authentication', label: 'Auth Guide' },
    // Add more pages as needed...
  ],

  // === Optional: Custom Supabase (for data isolation) ===
  // If not provided, uses Astra's shared infrastructure
  supabase: {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-supabase-anon-key',
  },

  // === Optional: Custom API Endpoint ===
  // apiEndpoint: 'https://api.astra.ai', // defaults to production

  // === UI Configuration ===
  
  /** Title shown in the chat window header */
  title: 'Documentation Assistant',

  /** Widget position on screen */
  position: 'bottom-right',

  /** Initial greeting message */
  initialMessage: "Hi! I'm here to help you with our documentation. What would you like to know?",

  /** Theme customization */
  appearance: {
    variables: {
      primaryColor: '#6366f1',    // Indigo
      primaryHover: '#4f46e5',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: '12px',
      accentColor: '#8b5cf6',     // Purple accent
    },
    // Optional: custom class names for styling
    elements: {
      // container: 'my-custom-container',
      // toggle: 'my-custom-toggle',
    },
  },
};

export default astraConfig;
