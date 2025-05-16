/*
 * Wasender TypeScript SDK - Channel Message Types
 * Defines structures and type aliases for messages sent to WhatsApp Channels.
 */

import { TextOnlyMessage, WasenderSendResult } from "./messages";

/**
 * Represents a text message specifically for sending to a WhatsApp Channel.
 * Currently, only text messages are supported for channels.
 * The `to` field must be a valid Channel JID (e.g., '1234567890@newsletter').
 */
export type ChannelTextMessage = TextOnlyMessage;

/**
 * The result of sending a message to a channel is the same as a standard send operation.
 */
export type SendChannelMessageResult = WasenderSendResult;

// No new API interaction logic is defined here as sending to channels
// uses the existing /api/send-message endpoint, which is handled by wasenderapi.send() in main.ts.
// This file primarily provides type clarity for channel-specific messaging.
