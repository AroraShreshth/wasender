# Wasender SDK: Sending Messages to WhatsApp Channels

This document explains how to send messages to WhatsApp Channels (within Communities) using the Wasender TypeScript SDK.

## SDK Version: 0.1.0

## Overview

Sending a message to a WhatsApp Channel utilizes the existing generic `wasender.send()` method. The key differences compared to sending a message to a regular user or group are:

1.  **Recipient (`to` field):** The `to` field in the message payload must be the unique **Channel ID** (also known as Channel JID). This typically looks like `12345678901234567890@newsletter`.
2.  **Message Type Restriction:** Currently, the Wasender API **only supports sending text messages** to channels. Other message types (images, videos, documents, etc.) are not supported for channels at this time via this method.

## Prerequisites

1.  **Obtain a Channel ID:** You need the specific ID of the channel you want to send a message to. The API documentation suggests that one way to obtain a Channel ID is by listening for the `message.upsert` webhook event, as this event data for messages originating from a channel will include the channel's JID.
2.  **SDK Initialization:** Ensure the Wasender SDK is correctly initialized in your project as shown in other documentation examples (e.g., `messages.md` or `contacts.md`).

## How to Send a Message to a Channel

You will use the `wasender.send()` method with a `TextOnlyMessage` payload (or the more specific `ChannelTextMessage` type alias from `src/wasender/channel.ts`).

### Type Definition for Channel Messages

For clarity, the SDK provides a type alias in `src/wasender/channel.ts`:

```typescript
// src/wasender/channel.ts
import { TextOnlyMessage } from "./messages";

export type ChannelTextMessage = TextOnlyMessage;
```

This emphasizes that the payload should conform to `TextOnlyMessage` and the `to` field should be the Channel JID.

### Code Example

Here's how you can send a text message to a WhatsApp Channel:

```typescript
// examples/send-channel-message.ts
import { createWasender, Wasender } from "path-to-your-sdk/main"; // Adjust path
import { WasenderAPIError } from "path-to-your-sdk/errors"; // Adjust path
import { ChannelTextMessage } from "path-to-your-sdk/channel"; // Adjust path
import { WasenderSendResult } from "path-to-your-sdk/messages"; // Adjust path

const apiKey = process.env.WASENDER_API_KEY;

if (!apiKey) {
  console.error("Error: WASENDER_API_KEY environment variable is not set.");
  process.exit(1);
}

const wasender = createWasender(apiKey);

// Replace with the actual Channel ID you want to send a message to
const targetChannelJid = "12345678901234567890@newsletter";

async function sendMesageToChannel(channelJid: string, messageText: string) {
  console.log(`\n--- Attempting to Send Message to Channel: ${channelJid} ---`);
  if (!channelJid) {
    console.error("Channel JID is required.");
    return;
  }
  if (!messageText) {
    console.error("Message text is required.");
    return;
  }

  const channelMessagePayload: ChannelTextMessage = {
    to: channelJid,
    messageType: "text", // Must be 'text' for channels
    text: messageText,
  };

  try {
    const result: WasenderSendResult = await wasender.send(
      channelMessagePayload
    );
    console.log(
      "Message sent to channel successfully:",
      result.response.message
    );
    console.log(
      "Rate Limit Info: Remaining =",
      result.rateLimit.remaining,
      "| Resets at =",
      result.rateLimit.getResetTimestampAsDate()?.toLocaleTimeString() || "N/A"
    );
  } catch (error) {
    if (error instanceof WasenderAPIError) {
      console.error(`API Error sending to channel ${channelJid}:`);
      console.error(`  Message: ${error.message}`);
      console.error(`  Status Code: ${error.statusCode || "N/A"}`);
      if (error.apiMessage) console.error(`  API Message: ${error.apiMessage}`);
      if (error.errorDetails)
        console.error(
          "  Error Details:",
          JSON.stringify(error.errorDetails, null, 2)
        );
      if (error.rateLimit) {
        console.error(
          `  Rate Limit at Error: Remaining = ${
            error.rateLimit.remaining
          }, Resets at = ${
            error.rateLimit.getResetTimestampAsDate()?.toLocaleTimeString() ||
            "N/A"
          }`
        );
      }
    } else {
      console.error(
        `An unexpected error occurred sending to channel ${channelJid}:`,
        error
      );
    }
  }
}

// Example usage:
sendMesageToChannel(
  targetChannelJid,
  "Hello Channel! This is a test message from the SDK."
);

// Example for another channel or message:
// const anotherChannelJid = "09876543210987654321@newsletter";
// sendMesageToChannel(anotherChannelJid, "Another important update for our subscribers!");
```

### Key Points from the Example:

- **`to`**: Set to the `targetChannelJid`.
- **`messageType`**: Explicitly set to `"text"`.
- **`text`**: Contains the content of your message.
- The `ChannelTextMessage` type is used for the payload for better type safety and clarity.

## Important Considerations

- **Channel ID Accuracy:** Ensure the Channel ID is correct. Sending to an incorrect ID will fail.
- **Message Content:** Only text messages are supported. Sending other types will likely result in an API error.
- **API Limitations:** The ability to send messages to channels and any restrictions (like message types) are determined by the Wasender API. Refer to the official Wasender API documentation for the most up-to-date information.
- **Webhook for Channel IDs:** As mentioned, using webhooks to listen for `message.upsert` events is a practical way to discover Channel IDs your connected number interacts with or is part of.

This guide should provide you with the necessary information to send text messages to WhatsApp Channels using the Wasender SDK.
