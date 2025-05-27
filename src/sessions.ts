/*
 * Wasender TypeScript SDK - Session Management Types
 * Defines structures for WhatsApp session information, API requests/responses related to sessions.
 */

import { RateLimitInfo, WasenderSuccessResponse } from "./messages.ts";

// ---------- Session Data Structures ----------

export type WhatsAppSessionStatus = 
  | "connected"
  | "disconnected"
  | "need_scan"
  | "connecting" 
  | "logged_out"
  | "expired";

export interface WhatsAppSession {
  id: number;
  name: string;
  phone_number: string;
  status: WhatsAppSessionStatus;
  account_protection: boolean;
  log_messages: boolean;
  webhook_url: string | null;
  webhook_enabled: boolean;
  webhook_events: string[] | null;
  created_at: string; // ISO 8601 date string
  updated_at: string; // ISO 8601 date string
}

// ---------- API Request Payloads ----------

export interface CreateWhatsAppSessionPayload {
  name: string;
  phone_number: string;
  account_protection: boolean;
  log_messages: boolean;
  webhook_url?: string | null;
  webhook_enabled?: boolean;
  webhook_events?: string[] | null;
}

export interface UpdateWhatsAppSessionPayload {
  name?: string;
  phone_number?: string;
  account_protection?: boolean;
  log_messages?: boolean;
  webhook_url?: string | null;
  webhook_enabled?: boolean;
  webhook_events?: string[] | null;
}

export interface ConnectSessionPayload {
    qr_as_image?: boolean;
}

// ---------- API Response Data Structures ----------

export interface ConnectSessionResponseData {
  status: WhatsAppSessionStatus; // e.g., "NEED_SCAN"
  qrCode?: string; // Base64 encoded QR code image string if status is NEED_SCAN
  message?: string; // e.g., for "Already Initialized"
}

export interface QRCodeResponseData {
  qrCode: string; // Base64 encoded QR code image string
}

export interface DisconnectSessionResponseData {
  status: WhatsAppSessionStatus; // Should be "DISCONNECTED"
  message: string;
}

// Special response for regenerate API key
export interface RegenerateApiKeyResponse extends Omit<WasenderSuccessResponse, 'message'| 'data'> {
    success: true;
    api_key: string;
    // This endpoint doesn't return a standard `data` object or `message` string directly under `data`.
}

export interface SessionStatusData {
    status: WhatsAppSessionStatus;
}

// ---------- API Success Response Types for Sessions ----------

export interface GetAllWhatsAppSessionsResponse extends WasenderSuccessResponse {
  data: WhatsAppSession[];
}

export interface GetWhatsAppSessionDetailsResponse extends WasenderSuccessResponse {
  data: WhatsAppSession;
}

export interface CreateWhatsAppSessionResponse extends WasenderSuccessResponse {
  data: WhatsAppSession;
}

export interface UpdateWhatsAppSessionResponse extends WasenderSuccessResponse {
  data: WhatsAppSession;
}

export interface DeleteWhatsAppSessionResponse extends WasenderSuccessResponse {
  data: null; // As per API docs, data is null on successful deletion
}

export interface ConnectSessionResponse extends WasenderSuccessResponse {
  data: ConnectSessionResponseData;
}

export interface GetQRCodeResponse extends WasenderSuccessResponse {
  data: QRCodeResponseData;
}

export interface DisconnectSessionResponse extends WasenderSuccessResponse {
  data: DisconnectSessionResponseData;
}

// The /api/status endpoint has a very different structure, not fitting WasenderSuccessResponse directly
export interface GetSessionStatusResponse {
    status: WhatsAppSessionStatus;
    // This endpoint does not have a `success` field or `data` wrapper in the example provided.
    // It also does not seem to return rate limit headers in the example.
    // If it DOES return rate limit headers, this should be paired with RateLimitInfo.
}


// ---------- Result Types Including Rate Limiting (where applicable) ----------

export interface GetAllWhatsAppSessionsResult {
  response: GetAllWhatsAppSessionsResponse;
  /** Optional. Rate limit information from the API response. May be undefined if not applicable or not provided by the server. */
  rateLimit?: RateLimitInfo;
}

export interface GetWhatsAppSessionDetailsResult {
  response: GetWhatsAppSessionDetailsResponse;
  /** Optional. Rate limit information from the API response. May be undefined if not applicable or not provided by the server. */
  rateLimit?: RateLimitInfo;
}

export interface CreateWhatsAppSessionResult {
  response: CreateWhatsAppSessionResponse;
  /** Optional. Rate limit information from the API response. May be undefined if not applicable or not provided by the server. */
  rateLimit?: RateLimitInfo;
}

export interface UpdateWhatsAppSessionResult {
  response: UpdateWhatsAppSessionResponse;
  /** Optional. Rate limit information from the API response. May be undefined if not applicable or not provided by the server. */
  rateLimit?: RateLimitInfo;
}

export interface DeleteWhatsAppSessionResult {
  response: DeleteWhatsAppSessionResponse;
  /** Optional. Rate limit information from the API response. May be undefined if not applicable or not provided by the server. */
  rateLimit?: RateLimitInfo;
}

export interface ConnectSessionResult {
  response: ConnectSessionResponse;
  /** Optional. Rate limit information from the API response. May be undefined if not applicable or not provided by the server. */
  rateLimit?: RateLimitInfo;
}

export interface GetQRCodeResult {
  response: GetQRCodeResponse;
  /** Optional. Rate limit information from the API response. May be undefined if not applicable or not provided by the server. */
  rateLimit?: RateLimitInfo;
}

export interface DisconnectSessionResult {
  response: DisconnectSessionResponse;
  /** Optional. Rate limit information from the API response. May be undefined if not applicable or not provided by the server. */
  rateLimit?: RateLimitInfo;
}

export interface RegenerateApiKeyResult {
    response: RegenerateApiKeyResponse; 
    /** Optional. Rate limit information from the API response. May be undefined if not applicable or not provided by the server. */
    rateLimit?: RateLimitInfo;
}

// For GetSessionStatus, if it returns rate limits, it would be:
export interface GetSessionStatusResult {
    response: GetSessionStatusResponse; 
    /** Optional. Rate limit information from the API response. May be undefined if not applicable or not provided by the server. */
    rateLimit?: RateLimitInfo; 
}
// If not, GetSessionStatusResponse is used directly.
