import Dexie, { type EntityTable } from "dexie";
import type { ContextCard, Conversation } from "@/shared/types";

export interface ConversationRecord extends Omit<Conversation, "contextCard"> {
  contextCardId: string | null;
}

export class SynapseDB extends Dexie {
  conversations!: EntityTable<ConversationRecord, "id">;
  contextCards!: EntityTable<ContextCard, "id">;

  constructor() {
    super("synapse");
    this.version(1).stores({
      conversations:
        "id, platform, platformConversationId, updatedAt, syncStatus, *autoTags, *tags",
      contextCards: "id, conversationId, *topics, *entities, createdAt",
    });
  }
}

export const db = new SynapseDB();
