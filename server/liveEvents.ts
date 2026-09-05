import { EventEmitter } from 'events';

export type LiveEventStatus = 'active' | 'passed' | 'blocked' | 'complete';

export interface LivePaymentEvent {
  id: string;
  timestamp: string;
  orderId: string;
  stage: string;
  title: string;
  detail: string;
  status: LiveEventStatus;
  metadata?: Record<string, unknown>;
}

const emitter = new EventEmitter();
const recentEvents: LivePaymentEvent[] = [];
let activeSubscribers = 0;

export function publishLiveEvent(event: Omit<LivePaymentEvent, 'id' | 'timestamp'>): LivePaymentEvent {
  const completeEvent = {
    ...event,
    id: `live_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    timestamp: new Date().toISOString()
  };
  recentEvents.unshift(completeEvent);
  if (recentEvents.length > 100) recentEvents.pop();
  emitter.emit('payment', completeEvent);
  return completeEvent;
}

export function getRecentLiveEvents(): LivePaymentEvent[] {
  return [...recentEvents];
}

export function subscribeToLiveEvents(listener: (event: LivePaymentEvent) => void): () => void {
  activeSubscribers += 1;
  emitter.on('payment', listener);
  return () => {
    activeSubscribers = Math.max(0, activeSubscribers - 1);
    emitter.off('payment', listener);
  };
}

export function getLiveConnectionState(): { activeSubscribers: number; recentEventCount: number } {
  return { activeSubscribers, recentEventCount: recentEvents.length };
}
