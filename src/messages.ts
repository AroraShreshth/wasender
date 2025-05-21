/*
 * Wasender TypeScript SDK - Message & Response Types
 * Defines the structure for various message payloads, API success responses, and rate limit info.
 */

// Common base interface for all message types - used internally for structure
export interface BaseMessage {
  /** Recipient phone number in E.164 format, Group JID, or Community Channel JID. */
  to: string;
  /** Optional caption or message text. Rules vary by message type. */
  text?: string;
}

// ---------- Discriminated Union for Message Payloads ----------

export interface TextOnlyMessage extends BaseMessage {
  messageType: 'text';
  /** The text content of the message. Mandatory for plain text messages. */
  text: string;
}

export interface ImageUrlMessage extends BaseMessage {
  messageType: 'image';
  /** URL of the image to send. Supported: JPEG, PNG. Max size: 5MB. */
  imageUrl: string;
  // `text` (caption) is optional for image messages
}

export interface VideoUrlMessage extends BaseMessage {
  messageType: 'video';
  /** URL of the video to send. Supported: MP4, 3GPP. Max size: 16MB. */
  videoUrl: string;
  // `text` (caption) is optional for video messages
}

export interface DocumentUrlMessage extends BaseMessage {
  messageType: 'document';
  /** URL of the document to send. Supports PDF, DOCX, XLSX, etc. Max size: 100MB. */
  documentUrl: string;
  // `text` (caption) is optional for document messages
}

export interface AudioUrlMessage extends BaseMessage {
  messageType: 'audio';
  /** URL of the audio file to send (sent as voice note). Supported: AAC, MP3, OGG, AMR. Max size: 16MB. */
  audioUrl: string;
  // `text` is typically not used with audioUrl (voice notes) but allowed by API
}

export interface StickerUrlMessage extends BaseMessage {
  messageType: 'sticker';
  /** URL of the sticker (.webp) to send. Max size: 100KB. */
  stickerUrl: string;
  // `text` is not applicable to sticker messages
  text?: never; // Explicitly forbid text for stickers
}

export interface ContactCardPayload {
  /** Name of the contact. */
  name: string;
  /** Phone number for the contact. */
  phone: string;
}

export interface ContactCardMessage extends BaseMessage {
  messageType: 'contact';
  /** Contact card object. */
  contact: ContactCardPayload;
  // `text` (caption) is optional
}

export interface LocationPinPayload {
  /** Latitude of the location. */
  latitude: number | string;
  /** Longitude of the location. */
  longitude: number | string;
  /** Optional name for the location. */
  name?: string;
  /** Optional address for the location. */
  address?: string;
}

export interface LocationPinMessage extends BaseMessage {
  messageType: 'location';
  /** Location object. */
  location: LocationPinPayload;
  // `text` (caption) is optional
}

/** Union of all specific message payload types. Use this for the generic `send` method. */
export type WasenderMessagePayload =
  | TextOnlyMessage
  | ImageUrlMessage
  | VideoUrlMessage
  | DocumentUrlMessage
  | AudioUrlMessage
  | StickerUrlMessage
  | ContactCardMessage
  | LocationPinMessage;

// Re-exporting old types for a brief transition or if specific send methods are kept with old signatures (less ideal)
// It's better to update send methods to use the new discriminated union types directly.
export type TextMessage = TextOnlyMessage;
export type ImageMessage = ImageUrlMessage;
export type VideoMessage = VideoUrlMessage;
export type DocumentMessage = DocumentUrlMessage;
export type AudioMessage = AudioUrlMessage;
export type StickerMessage = StickerUrlMessage;
export type ContactMessage = ContactCardMessage;
export type LocationMessage = LocationPinMessage;
export type ContactCard = ContactCardPayload;
export type LocationPin = LocationPinPayload;


// ---------- API Success Response & Rate Limit Types ----------

/** Standard API success response structure. */
export interface WasenderSuccessResponse {
  success: true;
  message: string;
}

/** Rate Limit Information extracted from response headers. */
export interface RateLimitInfo {
  /** Max requests per window (X-RateLimit-Limit). */
  limit: number | null;
  /** Remaining requests in the current window (X-RateLimit-Remaining). */
  remaining: number | null;
  /** Unix timestamp (in seconds) when the window resets (from X-RateLimit-Reset). */
  resetTimestamp: number | null;
  /** 
   * Optional helper to get the reset timestamp as a Date object.
   * @returns A Date object if resetTimestamp is available, otherwise null.
   */
  getResetTimestampAsDate?: () => Date | null;
}

/** Combined result for a successful API call, including the response body and rate limit info. */
export interface WasenderSendResult {
  response: WasenderSuccessResponse;
  /** Optional. Rate limit information from the API response. May be undefined if not applicable or not provided by the server. */
  rateLimit?: RateLimitInfo;
}
