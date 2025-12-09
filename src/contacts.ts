/*
 * Wasender TypeScript SDK - Contact Management Types
 * Defines structures for contact information, API responses related to contacts.
 */

import { RateLimitInfo } from "./messages"; // Assuming RateLimitInfo is in messages.ts
import { WasenderSuccessResponse } from "./messages"; // Reusing generic success response

// ---------- Contact Data Structures ----------

export interface Contact {
  /** ID either in lid or jid format (preferred) **/
  id: string
  /** ID in LID format (@lid) **/
  lid?: string
  /** ID in PN format (@s.whatsapp.net)  **/
  phoneNumber?: string
  /** name of the contact, you have saved on your WA */
  name?: string
  /** name of the contact, the contact has set on their own on WA */
  notify?: string
  /** I have no idea */
  verifiedName?: string
  // Baileys Added
  /**
   * Url of the profile picture of the contact
   *
   * 'changed' => if the profile picture has changed
   * null => if the profile picture has not been set (default profile picture)
   * any other string => url of the profile picture
   */
  imgUrl?: string | null
  status?: string
}

// ---------- API Response Types for Contacts ----------

/** Response for retrieving a list of all contacts. */
export interface GetAllContactsResponse extends WasenderSuccessResponse {
  data: Contact[];
}

/** Response for retrieving information about a single contact. */
export interface GetContactInfoResponse extends WasenderSuccessResponse {
  data: Contact; // `exists` field is particularly relevant here
}

/** Response for retrieving a contact\'s profile picture URL. */
export interface GetContactProfilePictureResponse extends WasenderSuccessResponse {
  data: {
    imgUrl: string | null; // imgUrl can be null if no picture
  };
}

/** Response for blocking or unblocking a contact. */
export interface ContactActionResponse extends WasenderSuccessResponse {
  data: {
    message: string;
  };
}

// ---------- Result Types Including Rate Limiting ----------

/** Combined result for a successful "get all contacts" API call. */
export interface GetAllContactsResult {
  response: GetAllContactsResponse;
  rateLimit?: RateLimitInfo;
}

/** Combined result for a successful "get contact info" API call. */
export interface GetContactInfoResult {
  response: GetContactInfoResponse;
  rateLimit?: RateLimitInfo;
}

/** Combined result for a successful "get contact profile picture" API call. */
export interface GetContactProfilePictureResult {
  response: GetContactProfilePictureResponse;
  rateLimit?: RateLimitInfo;
}

/** Combined result for a successful contact action (block/unblock) API call. */
export interface ContactActionResult {
  response: ContactActionResponse;
  rateLimit?: RateLimitInfo;
}
