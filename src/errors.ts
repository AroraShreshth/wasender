/*
 * Wasender TypeScript SDK - Error Types
 * Defines custom error classes and structures for API error responses.
 */

import type { RateLimitInfo } from "./messages"; // Import as type for RateLimitInfo

// Structure for detailed field-specific errors (e.g., validation errors)
export interface WasenderErrorDetail {
  [key: string]: string[]; // e.g., "to": ["The to field is required."]
}

// Standard API error response structure from the server
export interface WasenderErrorResponse {
  success: false;
  message: string; // Error description
  errors?: WasenderErrorDetail; // Optional: More specific field errors
  retry_after?: number; // Optional: Seconds to wait before retrying (for rate limits)
}

// Forward declaration for WasenderSuccessResponse to resolve circular dependency for WasenderAPIRawResponse
// The actual WasenderSuccessResponse is in messages.ts
interface WasenderSuccessResponse {
    success: true;
    message: string;
}

// Union type for any API response body (used internally before error throwing or success processing)
export type WasenderAPIRawResponse = WasenderSuccessResponse | WasenderErrorResponse;


// ---------- Custom Error Class ----------
/**
 * Custom error class for errors originating from the Wasender API or the SDK itself (e.g., network issues).
 */
export class WasenderAPIError extends Error {
  /** HTTP status code from the API response, if available. Undefined for network errors or other non-HTTP issues. */
  public readonly statusCode?: number;
  /** Detailed field-specific errors from the API response, if provided (e.g., validation errors). */
  public readonly errorDetails?: WasenderErrorDetail;
  /** Suggested number of seconds to wait before retrying, from API response body (e.g., for rate limiting). */
  public readonly retryAfter?: number;
  public readonly success: false = false; // To align with API error response structure
  /** The 'message' field from the API error response body, or a descriptive message for SDK-originated errors. */
  public readonly apiMessage: string;
  /** Rate limit information parsed from response headers, if available at the time of error. */
  public readonly rateLimit?: RateLimitInfo;

  constructor(
    apiMessage: string, 
    statusCode?: number,
    errorDetails?: WasenderErrorDetail,
    retryAfter?: number, 
    rateLimit?: RateLimitInfo
  ) {
    super(`Wasender API Error (Status ${statusCode || 'N/A'}): ${apiMessage}`);
    this.name = "WasenderAPIError";
    this.apiMessage = apiMessage;
    this.statusCode = statusCode;
    this.errorDetails = errorDetails;
    this.retryAfter = retryAfter;
    this.rateLimit = rateLimit;
    Object.setPrototypeOf(this, WasenderAPIError.prototype);
  }
}
