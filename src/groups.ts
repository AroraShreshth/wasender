/*
 * Wasender TypeScript SDK - Group Management Types
 * Defines structures for group information, participants, API responses related to groups.
 */

import { RateLimitInfo, WasenderSuccessResponse } from "./messages";

// ---------- Group Data Structures ----------

export interface GroupParticipant {
  /** The id (Jabber ID) of the participant. */
  id: string;
  /** Indicates if the participant is an admin in the group. */
  admin: string;
}

export interface BasicGroupInfo {
  /** The id (Jabber ID) of the group (e.g., '123456789-987654321@g.us'). */
  id: string;
  /** The name or subject of the group. */
  name: string | null; // Name can sometimes be null or empty
  /** URL of the group's profile picture, if available. */
  imgUrl: string | null;
}

export interface GroupMetadata extends BasicGroupInfo {
  /** Timestamp of when the group was created. */
  creation: number;
  /** The JID of the group owner/creator. */
  owner: string | undefined;
  /** The description of the group. */
  desc?: string | null;
  /** The owner of the group description. */
  descOwner?: string | null;
  /** The ID of the group description. */
  descId?: string | null;
  /** Whether the group is restricted to admin-only messages. */
  restrict?: boolean;
  /** Whether announcements are enabled for the group. */
  announce?: boolean;
  /** Size of the group. */
  size?: number;
  /** Owner of the group subject. */
  subjectOwner?: string;
  /** Timestamp when subject was last changed. */
  subjectTime?: number;
  /** Array of participants in the group. */
  participants: GroupParticipant[];
  /** The subject of the group. */
  subject: string;
}

// ---------- API Request Payloads ----------

export interface ModifyGroupParticipantsPayload {
  /** Array of participant JIDs (E.164 format phone numbers) to add or remove. */
  participants: string[];
}

export interface UpdateGroupSettingsPayload {
  /** New group subject. */
  subject?: string;
  /** New group description. */
  description?: string;
  /** Set to true for admin-only messages, false otherwise. */
  announce?: boolean;
  /** Set to true to restrict editing group info to admins, false otherwise. */
  restrict?: boolean;
}

// ---------- API Response Data Structures ----------

/** Status of an action (add/remove) for a single participant. */
export interface ParticipantActionStatus {
  /** HTTP-like status code for the operation on this participant. */
  status: number;
  /** JID of the participant. */
  jid: string;
  /** Message describing the result (e.g., 'added', 'removed', 'not-authorized'). */
  message: string;
}

export interface UpdateGroupSettingsResponseData {
    /** The updated subject of the group. */
    subject?: string;
    /** The updated description of the group. */
    description?: string;
    // The API response might return more fields, this is based on the example.
}

// ---------- API Success Response Types for Groups ----------

/** Response for retrieving a list of all groups. */
export interface GetAllGroupsResponse extends WasenderSuccessResponse {
  data: BasicGroupInfo[];
}

/** Response for retrieving metadata of a single group. */
export interface GetGroupMetadataResponse extends WasenderSuccessResponse {
  data: GroupMetadata;
}

/** Response for retrieving participants of a single group. */
export interface GetGroupParticipantsResponse extends WasenderSuccessResponse {
  data: GroupParticipant[];
}

/** Response for adding or removing group participants. */
export interface ModifyGroupParticipantsResponse extends WasenderSuccessResponse {
  data: ParticipantActionStatus[];
}

/** Response for updating group settings. */
export interface UpdateGroupSettingsResponse extends WasenderSuccessResponse {
  data: UpdateGroupSettingsResponseData;
}

// ---------- Result Types Including Rate Limiting for Groups ----------

export interface GetAllGroupsResult {
  response: GetAllGroupsResponse;
  rateLimit: RateLimitInfo;
}

export interface GetGroupMetadataResult {
  response: GetGroupMetadataResponse;
  rateLimit: RateLimitInfo;
}

export interface GetGroupParticipantsResult {
  response: GetGroupParticipantsResponse;
  rateLimit: RateLimitInfo;
}

export interface ModifyGroupParticipantsResult {
  response: ModifyGroupParticipantsResponse;
  rateLimit: RateLimitInfo;
}

export interface UpdateGroupSettingsResult {
  response: UpdateGroupSettingsResponse;
  rateLimit: RateLimitInfo;
}
