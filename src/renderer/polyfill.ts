// EventEmitter polyfill for browser environment
import { EventEmitter } from 'events';

declare global {
  interface Window {
    EventEmitter: typeof EventEmitter;
  }

  // Make EventEmitter available in global module scope
  const EventEmitter: typeof import('events').EventEmitter;
}

// Ensure EventEmitter is available globally
if (typeof window !== 'undefined') {
  window.EventEmitter = EventEmitter;
}

// Make EventEmitter available as a global constructor
if (typeof global !== 'undefined') {
  (global as any).EventEmitter = EventEmitter;
}

// Also make it available as a module export for webpack
if (typeof globalThis !== 'undefined') {
  (globalThis as any).EventEmitter = EventEmitter;
}

export default EventEmitter;