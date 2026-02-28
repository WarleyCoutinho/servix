type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();

export const supportEvents = {
  subscribe(ticketId: string, callback: Listener): () => void {
    if (!listeners.has(ticketId)) {
      listeners.set(ticketId, new Set());
    }
    listeners.get(ticketId)!.add(callback);

    return () => {
      const set = listeners.get(ticketId);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          listeners.delete(ticketId);
        }
      }
    };
  },

  notify(ticketId: string) {
    const set = listeners.get(ticketId);
    if (set) {
      for (const callback of set) {
        try {
          callback();
        } catch {}
      }
    }
  },
};
