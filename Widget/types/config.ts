/**
 * Astra Widget Configuration Types
 * 
 * These types define the configuration options for developers
 * embedding the Astra AI chatbot into their documentation sites.
 */

export interface AstraPage {
  /** URL of the page to scrape and index */
  url: string;
  /** Optional label for the page (used in UI) */
  label?: string;
  /** Optional metadata to attach to this page's embeddings */
  metadata?: Record<string, string>;
}

export interface AstraWidgetConfig {
  /** 
   * Unique identifier for your site/project. 
   * Used to namespace embeddings and isolate your data.
   * Should be a URL-safe string (e.g., 'my-docs', 'acme-api-docs')
   */
  siteId: string;

  /** 
   * Your Astra API key for authentication.
   * Get this from your Astra dashboard.
   */
  apiKey: string;

  /**
   * List of pages/URLs to scrape and generate embeddings for.
   * These embeddings are created once and reused for all chats.
   * To refresh embeddings, call the refresh API endpoint.
   */
  pages: AstraPage[];

  /**
   * Supabase configuration for the widget.
   * This should be separate from your main application's Supabase.
   */
  supabase?: {
    url: string;
    anonKey: string;
  };

  /**
   * Custom API endpoint for the Astra backend.
   * Defaults to the production Astra API.
   */
  apiEndpoint?: string;
}

export interface AstraUIConfig {
  /** Title displayed in the chat window header */
  title?: string;

  /** Position of the widget toggle button */
  position?: 'bottom-right' | 'bottom-left';

  /** Initial greeting message from the assistant */
  initialMessage?: string;

  /** Theme customization */
  appearance?: AstraAppearance;
}

export interface AstraAppearance {
  /** CSS variable overrides */
  variables?: {
    primaryColor?: string;
    primaryHover?: string;
    fontFamily?: string;
    borderRadius?: string;
    accentColor?: string;
  };
  /** Custom class names for elements */
  elements?: {
    container?: string;
    toggle?: string;
    window?: string;
    header?: string;
    messages?: string;
    messageBubble?: string;
    input?: string;
    footer?: string;
  };
}

/** Combined config passed to AstraRoot */
export type AstraConfig = AstraWidgetConfig & AstraUIConfig;

/** Initialization status for the widget */
export interface AstraInitStatus {
  /** Whether the widget is ready to accept queries */
  isReady: boolean;
  /** Whether initialization is in progress */
  isInitializing: boolean;
  /** Error message if initialization failed */
  error: string | null;
  /** Whether embeddings exist for this siteId */
  hasEmbeddings: boolean;
  /** Number of pages indexed */
  indexedPageCount: number;
}
