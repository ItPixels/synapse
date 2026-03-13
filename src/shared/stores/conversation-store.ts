import { create } from "zustand";
import type { ConversationRecord } from "@/shared/db/dexie-schema";
import { db } from "@/shared/db/dexie-schema";
import { deleteConversation, getAllConversations } from "@/shared/db/operations";
import type { ContextCard } from "@/shared/types";

interface ConversationState {
  conversations: ConversationRecord[];
  selectedId: string | null;
  searchQuery: string;
  isLoading: boolean;

  load: () => Promise<void>;
  select: (id: string | null) => void;
  setSearch: (query: string) => void;
  remove: (id: string) => Promise<void>;
  getContextCard: (conversationId: string) => Promise<ContextCard | undefined>;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  selectedId: null,
  searchQuery: "",
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    const conversations = await getAllConversations();
    set({ conversations, isLoading: false });
  },

  select: (id) => set({ selectedId: id }),

  setSearch: (query) => set({ searchQuery: query }),

  remove: async (id) => {
    await deleteConversation(id);
    const { conversations, selectedId } = get();
    set({
      conversations: conversations.filter((c) => c.id !== id),
      selectedId: selectedId === id ? null : selectedId,
    });
  },

  getContextCard: async (conversationId) => {
    return db.contextCards.where("conversationId").equals(conversationId).first();
  },
}));
