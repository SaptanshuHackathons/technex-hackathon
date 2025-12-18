// Main export file for Astra Widget
export { default as AstraWidget } from './components/AstraWidget';

// Export compound components individually for tree-shaking
export { AstraRoot } from './components/AstraRoot';
export { AstraToggle } from './components/AstraToggle';
export { AstraWindow } from './components/AstraWindow';
export { AstraHeader } from './components/AstraHeader';
export { AstraMessages } from './components/AstraMessages';
export { AstraInput } from './components/AstraInput';
export { AstraFooter } from './components/AstraFooter';

// Export hooks for headless usage
export { useChat, ChatProvider } from './hooks/useChat';
export { useAstra, AstraProvider } from './context/AstraContext';

// Export types
export type {
  AstraConfig,
  AstraWidgetConfig,
  AstraUIConfig,
  AstraAppearance,
  AstraPage,
  AstraInitStatus,
} from './types/config';
export type { Message } from './hooks/useChat';
