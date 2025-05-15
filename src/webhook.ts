/*
 * Wasender TypeScript SDK - Webhook Utilities
 * Provides helpers for verifying and typing incoming webhook events from Wasender.
 * Version: 0.3.2
 */

/**
 * The HTTP header name used by Wasender to send the webhook signature.
 */
export const WEBHOOK_SIGNATURE_HEADER = 'x-webhook-signature';

/**
 * Verifies the webhook signature from Wasender.
 *
 * @remarks
 * IMPORTANT: The current Wasender documentation example shows a direct string comparison
 * for the signature and secret (`signature === webhookSecret`). This is a very simple
 * verification method. Most webhook systems use HMAC-SHA256 or similar cryptographic hashes
 * for security. 
 * 
 * **Please VERIFY with Wasender's official documentation or support if this simple string
 * comparison is indeed the correct and only method for signature verification.**
 * If they use HMAC, this function will need to be updated to use Node.js `crypto` module
 * or a similar library (like Web Crypto API for browser/worker environments) to compute
 * and compare HMAC hashes. This function currently implements the simple check as per
 * the provided example.
 *
 * @param requestSignature - The signature string from the `X-Webhook-Signature` header of the incoming request.
 * @param configuredSecret - Your webhook secret configured in the Wasender dashboard.
 * @returns `true` if the signature is valid according to the simple check, `false` otherwise.
 */
export function verifyWasenderWebhookSignature(
  requestSignature: string | undefined | null,
  configuredSecret: string
): boolean {
  if (!requestSignature || !configuredSecret) {
    return false;
  }
  // IMPORTANT: This is a simple check based on initial documentation.
  // Verify with Wasender if HMAC-SHA256 or similar should be used for robust security.
  return requestSignature === configuredSecret;
}

/**
 * Known webhook event types from Wasender.
 */
export enum WasenderWebhookEventType {
  // Chat Events
  ChatsUpsert = 'chats.upsert',
  ChatsUpdate = 'chats.update',
  ChatsDelete = 'chats.delete',
  // Group Events
  GroupsUpsert = 'groups.upsert',
  GroupsUpdate = 'groups.update',
  GroupParticipantsUpdate = 'group-participants.update',
  // Contact Events
  ContactsUpsert = 'contacts.upsert',
  ContactsUpdate = 'contacts.update',
  // Message Events
  MessagesUpsert = 'messages.upsert',      // New incoming message
  MessagesUpdate = 'messages.update',      // Message status update (e.g., delivered, read by recipient)
  MessagesDelete = 'messages.delete',
  MessagesReaction = 'messages.reaction',
  // Message Receipt (specific to a user in a group or a direct chat)
  MessageReceiptUpdate = 'message-receipt.update',
  // Session Events
  MessageSent = 'message.sent',          // Message successfully sent *from your session*
  SessionStatus = 'session.status',
  QrCodeUpdated = 'qrcode.updated',
}

/**
 * Base interface for all Wasender webhook events.
 */
export interface BaseWebhookEvent<T extends WasenderWebhookEventType, D = any> {
  /** The type of the event. */
  type: T;
  /** Timestamp of the event generation (example, confirm actual structure). */
  timestamp?: number; // Unix timestamp
  /** The actual data payload for the event. */
  data: D;
  /** Session ID or identifier associated with the event (example). */
  sessionId?: string;
}

// ---------- Message Key (Commonly used) ----------
export interface MessageKey {
  id: string;
  fromMe: boolean;
  remoteJid: string; // Recipient JID for outgoing, Sender JID for incoming
  participant?: string; // For group messages, the JID of the actual sender
}

// ---------- Chat Event Payloads ----------
export interface ChatEntry {
  id: string; // Typically the JID of the chat participant or group
  name?: string; // Contact name or group subject
  conversationTimestamp?: number; // Unix timestamp of the last message
  unreadCount?: number;
  muteEndTime?: number;
  isSpam?: boolean;
  // ... other chat properties
}

export type ChatsUpsertEvent = BaseWebhookEvent<WasenderWebhookEventType.ChatsUpsert, ChatEntry[]>;
export type ChatsUpdateEvent = BaseWebhookEvent<WasenderWebhookEventType.ChatsUpdate, Partial<ChatEntry>[]>; // Updates are often partial
export type ChatsDeleteEvent = BaseWebhookEvent<WasenderWebhookEventType.ChatsDelete, string[]>; // Array of chat IDs (JIDs)

// ---------- Group Event Payloads ----------
export interface GroupMetadata {
  jid: string;
  subject: string;
  creation?: number; // Unix timestamp
  owner?: string; // JID of the group owner
  desc?: string; // Group description
  participants?: GroupParticipantObject[]; // Ensuring this uses GroupParticipantObject
  announce?: boolean; // If true, only admins can send messages
  restrict?: boolean; // If true, only admins can modify group info
  // ... other group properties
}

export type GroupsUpsertEvent = BaseWebhookEvent<WasenderWebhookEventType.GroupsUpsert, GroupMetadata[]>;
export type GroupsUpdateEvent = BaseWebhookEvent<WasenderWebhookEventType.GroupsUpdate, Partial<GroupMetadata>[]>; // Updates might be partial

import { GroupParticipant as GroupParticipantObject } from './groups'; // This import is used by GroupMetadata now

export interface GroupParticipantsUpdateData {
  jid: string; // Group JID
  participants: Array<string | GroupParticipant>; // Array of participant JIDs affected or participant objects
  action: 'add' | 'remove' | 'promote' | 'demote';
}
export type GroupParticipantsUpdateEvent = BaseWebhookEvent<WasenderWebhookEventType.GroupParticipantsUpdate, GroupParticipantsUpdateData>;

// ---------- Contact Event Payloads ----------
export interface ContactEntry {
  jid: string;
  name?: string; // User's saved name for the contact
  notify?: string; // Display name (often same as name or phone number)
  verifiedName?: string; // Official business name if verified
  status?: string; // Contact's WhatsApp status/about text
  imgUrl?: string; // URL to profile picture (may be temporary)
  // ... other contact properties
}
export type ContactsUpsertEvent = BaseWebhookEvent<WasenderWebhookEventType.ContactsUpsert, ContactEntry[]>;
export type ContactsUpdateEvent = BaseWebhookEvent<WasenderWebhookEventType.ContactsUpdate, Partial<ContactEntry>[]>;

// ---------- Message Event Payloads ----------
export interface MessageContent {
  conversation?: string; // For text messages
  // Placeholders for other message types; expand based on actual API structure
  imageMessage?: { url?: string; caption?: string; mimetype?: string; /* ... */ };
  videoMessage?: { url?: string; caption?: string; mimetype?: string; /* ... */ };
  documentMessage?: { url?: string; title?: string; mimetype?: string; fileName?: string; /* ... */ };
  audioMessage?: { url?: string; mimetype?: string; duration?: number; /* ... */ };
  stickerMessage?: { url?: string; mimetype?: string; /* ... */ };
  contactMessage?: { displayName?: string; vcard?: string; /* ... */ };
  locationMessage?: { degreesLatitude?: number; degreesLongitude?: number; name?: string; address?: string; /* ... */ };
  // ... add other message types like extendedTextMessage, buttonsMessage, templateMessage, etc.
}

export interface MessagesUpsertData {
  key: MessageKey;
  message?: MessageContent;
  pushName?: string; // Name of the user as set in their WhatsApp profile
  messageTimestamp?: number; // Unix timestamp of the message
  // ... other properties related to a new message
}
export type MessagesUpsertEvent = BaseWebhookEvent<WasenderWebhookEventType.MessagesUpsert, MessagesUpsertData>; // Typically one message per event, but API might send an array.
                                                                                                              // The example showed a single object for `data`.

export interface MessageUpdate {
  status: 'delivered' | 'read' | 'played' | 'error' | 'pending'; // 'played' for audio/video, confirm others
  // ... other potential update fields
}
export interface MessagesUpdateDataEntry {
    key: MessageKey;
    update: MessageUpdate;
}
export type MessagesUpdateEvent = BaseWebhookEvent<WasenderWebhookEventType.MessagesUpdate, MessagesUpdateDataEntry[]>;

export interface MessagesDeleteData {
    keys: MessageKey[];
}
export type MessagesDeleteEvent = BaseWebhookEvent<WasenderWebhookEventType.MessagesDelete, MessagesDeleteData>;

export interface Reaction {
    text: string; // The emoji reaction
    key: MessageKey; // Key of the message being reacted to
    senderTimestampMs?: string; // Timestamp of when the reaction was sent
    read?: boolean;
}
export interface MessagesReactionDataEntry {
    key: MessageKey; // Key of the message that received the reaction
    reaction: Reaction; 
}
export type MessagesReactionEvent = BaseWebhookEvent<WasenderWebhookEventType.MessagesReaction, MessagesReactionDataEntry[]>;

// ---------- Message Receipt Update Event Payloads ----------
export interface Receipt {
    userJid: string; // JID of the user whose receipt status changed
    status: 'sent' | 'delivered' | 'read' | 'played';
    t?: number; // Timestamp of the status change
}
export interface MessageReceiptUpdateDataEntry {
    key: MessageKey; // Key of the message this receipt pertains to
    receipt: Receipt;
}
export type MessageReceiptUpdateEvent = BaseWebhookEvent<WasenderWebhookEventType.MessageReceiptUpdate, MessageReceiptUpdateDataEntry[]>;

// ---------- Session Event Payloads ----------
export interface MessageSentData {
  key: MessageKey;
  message?: MessageContent;
  status?: string; // e.g., "sent", "pending"
}
export type MessageSentEvent = BaseWebhookEvent<WasenderWebhookEventType.MessageSent, MessageSentData>;

export interface SessionStatusData {
  status: 'connected' | 'disconnected' | 'connecting' | 'error' | 'logged_out' | 'need_scan';
  session_id?: string;
  reason?: string;
}
export type SessionStatusEvent = BaseWebhookEvent<WasenderWebhookEventType.SessionStatus, SessionStatusData>;

export interface QrCodeUpdatedData {
  qr: string; // Base64 encoded QR code image data URI
  session_id?: string;
}
export type QrCodeUpdatedEvent = BaseWebhookEvent<WasenderWebhookEventType.QrCodeUpdated, QrCodeUpdatedData>;

// ---------- Discriminated Union of All Webhook Events ----------
export type WasenderWebhookEvent =
  | ChatsUpsertEvent
  | ChatsUpdateEvent
  | ChatsDeleteEvent
  | GroupsUpsertEvent
  | GroupsUpdateEvent
  | GroupParticipantsUpdateEvent
  | ContactsUpsertEvent
  | ContactsUpdateEvent
  | MessagesUpsertEvent
  | MessagesUpdateEvent
  | MessagesDeleteEvent
  | MessagesReactionEvent
  | MessageReceiptUpdateEvent
  | MessageSentEvent
  | SessionStatusEvent
  | QrCodeUpdatedEvent;

/*
// Example of how to process different event types after parsing:
function processParsedWebhookEvent(event: WasenderWebhookEvent) {
  console.log('Processing event type:', event.type);
  switch (event.type) {
    case WasenderWebhookEventType.MessagesUpsert:
      console.log('New message from:', event.data.key.remoteJid, 'ID:', event.data.key.id);
      if (event.data.message?.conversation) {
        console.log('Text:', event.data.message.conversation);
      }
      break;
    case WasenderWebhookEventType.SessionStatus:
      console.log('Session status changed:', event.data.status);
      break;
    // ... Add cases for all other event types defined in the union
    default:
      const unhandledEvent: never = event; 
      console.warn('Received an unhandled webhook event type:', unhandledEvent);
      break;
  }
}
*/
