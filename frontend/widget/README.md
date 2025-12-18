# Astra Widget - Reusable React Component

A beautiful, customizable chatbot widget for React applications. Built with the compound component pattern for maximum flexibility.

## Features

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

### Simple Usage (Default Layout)

```tsx
import AstraWidget from './Widget';

function App() {
  return (
    <div>
      <AstraWidget apiKey="your-api-key" />
    </div>
  );
}
```

### With Customization

```tsx
import AstraWidget from './Widget';

function App() {
  return (
    <AstraWidget
      apiKey="your-api-key"
      title="Support Chat"
      position="bottom-left"
      appearance={{
        variables: {
          primaryColor: '#6366f1',
          borderRadius: '0.5rem',
        },
      }}
    />
  );
}
```

### Custom Layout (Compound Components)

```tsx
import AstraWidget from './Widget';

function App() {
  return (
    <AstraWidget.Root apiKey="your-api-key">
      <AstraWidget.Toggle />
      <AstraWidget.Window>
        <AstraWidget.Header />
        {/* Add your custom component here */}
        <AstraWidget.Messages />
        <AstraWidget.Input />
        <AstraWidget.Footer />
      </AstraWidget.Window>
    </AstraWidget.Root>
  );
}
```

## API Reference

### AstraWidget (Default Export)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiKey` | `string` | **required** | Your API key |
| `title` | `string` | `"Astra Assistant"` | Chat window title |
| `position` | `'bottom-right' \| 'bottom-left'` | `'bottom-right'` | Widget position |
| `appearance` | `AstraAppearance` | `undefined` | Theming configuration |
| `apiEndpoint` | `string` | `undefined` | Custom API endpoint |
| `initialMessage` | `string` | Default greeting | Initial bot message |

### Appearance API

```tsx
interface AstraAppearance {
  variables?: {
    primaryColor?: string;      // Main theme color
    primaryHover?: string;       // Hover state color
    fontFamily?: string;         // Custom font
    borderRadius?: string;       // Border radius
    accentColor?: string;        // Accent color (status indicator)
  };
  elements?: {
    container?: string;          // Additional classes for container
    toggle?: string;             // Additional classes for toggle button
    window?: string;             // Additional classes for chat window
    header?: string;             // Additional classes for header
    messages?: string;           // Additional classes for messages area
    messageBubble?: string;      // Additional classes for message bubbles
    input?: string;              // Additional classes for input area
    footer?: string;             // Additional classes for footer
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
  apiKey="your-api-key"
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
  apiKey="your-api-key"
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
