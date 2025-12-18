# Astra Widget - Embeddable AI Chatbot for Documentation

A beautiful, customizable AI chatbot widget that developers can embed in their documentation sites. The widget scrapes your docs, generates embeddings once, and uses RAG to answer user questions.

## Features

- 🤖 **AI-Powered Q&A** - RAG-based responses from your documentation
- 📚 **One-Time Indexing** - Embeddings are generated once, reused for all chats
- 🎨 **Beautiful Default UI** - Polished, modern design out of the box
- 🔧 **Fully Customizable** - Clerk-like appearance API for theming
- 🧩 **Compound Components** - Rearrange layout or build custom UIs
- 🎯 **Framework Agnostic** - Works with Next.js, Vite, CRA, Remix, etc.
- 📦 **Zero Dependencies** - Uses vanilla CSS (no Tailwind required)
- 💪 **TypeScript Support** - Full type safety

## Installation

```bash
# Copy the Widget folder to your project
# Then import in your app
```

## Quick Start

### 1. Create your config file

Copy `astra.config.example.ts` to your project and configure:

```typescript
// astra.config.ts
import type { AstraConfig } from './Widget';

const config: AstraConfig = {
  siteId: 'my-docs',           // Unique identifier for your site
  apiKey: 'astra_your_key',    // Your Astra API key
  pages: [                      // Documentation pages to index
    { url: 'https://docs.example.com/', label: 'Home' },
    { url: 'https://docs.example.com/api', label: 'API Reference' },
  ],
  title: 'Docs Assistant',
  initialMessage: 'Hi! Ask me anything about our docs.',
};

export default config;
```

### 2. Add the widget

```tsx
import AstraWidget from './Widget';
import config from './astra.config';

function App() {
  return (
    <div>
      <AstraWidget {...config} />
    </div>
  );
}
```

### 3. Initialize embeddings (first time only)

The widget checks for existing embeddings on load. To create or refresh embeddings, use the `refreshEmbeddings()` function:

```tsx
import { useAstra } from './Widget';

function AdminPanel() {
  const { initStatus, refreshEmbeddings } = useAstra();
  
  return (
    <div>
      <p>Status: {initStatus.hasEmbeddings ? 'Ready' : 'Not indexed'}</p>
      <p>Pages indexed: {initStatus.indexedPageCount}</p>
      <button onClick={refreshEmbeddings} disabled={initStatus.isInitializing}>
        {initStatus.isInitializing ? 'Indexing...' : 'Refresh Embeddings'}
      </button>
    </div>
  );
}
```

## API Reference

### AstraWidget Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `siteId` | `string` | ✅ | Unique identifier for your site (namespaces embeddings) |
| `apiKey` | `string` | ✅ | Your Astra API key (prefix: `astra_`) |
| `pages` | `AstraPage[]` | ✅ | Pages to scrape and index |
| `title` | `string` | | Chat window title |
| `position` | `'bottom-right' \| 'bottom-left'` | | Widget position |
| `appearance` | `AstraAppearance` | | Theming configuration |
| `apiEndpoint` | `string` | | Custom API endpoint |
| `initialMessage` | `string` | | Initial bot greeting |
| `supabase` | `{ url, anonKey }` | | Custom Supabase for data isolation |

### Initialization Status

Access via `useAstra()` hook:

```typescript
interface AstraInitStatus {
  isReady: boolean;           // Widget ready to accept queries
  isInitializing: boolean;    // Init/refresh in progress
  error: string | null;       // Error message if failed
  hasEmbeddings: boolean;     // Whether embeddings exist
  indexedPageCount: number;   // Number of indexed chunks
}
```

### Backend Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/widget/init` | POST | Check if embeddings exist for siteId |
| `/api/widget/query` | POST | Query indexed content |
| `/api/widget/refresh` | POST | Scrape pages and regenerate embeddings |

### Appearance API

```tsx
interface AstraAppearance {
  variables?: {
    primaryColor?: string;
    primaryHover?: string;
    fontFamily?: string;
    borderRadius?: string;
    accentColor?: string;
  };
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
```

### Compound Components

- `AstraWidget.Root` - Provider component (required)
- `AstraWidget.Toggle` - Floating action button
- `AstraWidget.Window` - Chat window container
- `AstraWidget.Header` - Header with title and actions
- `AstraWidget.Messages` - Message list with auto-scroll
- `AstraWidget.Input` - Input field and send button
- `AstraWidget.Footer` - Footer with branding

## Examples

### Example 1: Custom Theme

```tsx
<AstraWidget
  siteId="my-project"
  apiKey="astra_xxx"
  pages={[{ url: 'https://docs.example.com' }]}
  appearance={{
    variables: {
      primaryColor: '#10b981',
      fontFamily: 'Inter, sans-serif',
      borderRadius: '1rem',
    },
  }}
/>
```

### Example 2: Custom Position

```tsx
<AstraWidget
  siteId="my-project"
  apiKey="astra_xxx"
  pages={[{ url: 'https://docs.example.com' }]}
  position="bottom-left"
  title="Help Center"
/>
```

### Example 3: Rearranged Layout

```tsx
<AstraWidget.Root apiKey="your-api-key">
  <AstraWidget.Toggle />
  <AstraWidget.Window>
    <AstraWidget.Messages />  {/* Messages first */}
    <AstraWidget.Header />    {/* Header in middle */}
    <AstraWidget.Input />
    <AstraWidget.Footer />
  </AstraWidget.Window>
</AstraWidget.Root>
```

### Example 4: Custom CSS Classes

```tsx
<AstraWidget
  apiKey="your-api-key"
  appearance={{
    elements: {
      window: 'my-custom-window-class',
      messageBubble: 'my-custom-bubble-class',
    },
  }}
/>
```

## Headless Usage

For complete control, use the hooks directly:

```tsx
import { ChatProvider, useChat } from './Widget';

function CustomChat() {
  const { messages, sendMessage, isLoading } = useChat();
  
  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      {/* Your custom UI */}
    </div>
  );
}

function App() {
  return (
    <ChatProvider apiKey="your-api-key">
      <CustomChat />
    </ChatProvider>
  );
}
```

## License

MIT
