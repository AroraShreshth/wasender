# Wasender SDK: Message Sending Examples

This document provides detailed examples for sending various types of messages using the Wasender TypeScript SDK.

## SDK Version: 0.1.0

## Prerequisites

1.  **Install Node.js and npm/yarn.**
2.  **Obtain a Wasender API Key:** You'll need an API key from [https://www.wasenderapi.com](https://www.wasenderapi.com).
3.  **SDK Installation:** Ensure the Wasender SDK is correctly installed and accessible in your project.

## Initializing the SDK

All examples assume you have initialized the SDK as follows. You can place this in a central part of your application or at the beginning of your script.

```typescript
// main-setup.ts
import { createWasender, Wasender, RetryConfig } from "path-to-your-sdk/main"; // Adjust path to your SDK files
import {
  TextOnlyMessage,
  ImageUrlMessage,
  VideoUrlMessage,
  DocumentUrlMessage,
  AudioUrlMessage,
  StickerUrlMessage,
  ContactCardMessage,
  LocationPinMessage,
  WasenderAPIError,
} from "path-to-your-sdk/messages"; // Adjust path to your SDK files

const apiKey = process.env.WASENDER_API_KEY;

if (!apiKey) {
  console.error("Error: WASENDER_API_KEY environment variable is not set.");
  process.exit(1);
}

// For most examples, we initialize without special retry config
const wasender = createWasender(apiKey);

// For examples specifically showing retry logic:
const retryOptions: RetryConfig = {
  enabled: true,
  maxRetries: 2, // Attempt up to 2 retries on HTTP 429 errors
};
const wasenderWithRetries = createWasender(
  apiKey,
  undefined,
  undefined,
  retryOptions
);

console.log("Wasender SDK Initialized for examples.");

// Placeholder for recipient number - replace with a valid E.164 number or JID
const recipientPhoneNumber = "+12345678900"; // Example: international format
const recipientGroupJid = "1234567890-1234567890@g.us"; // Example Group JID
const recipientChannelJid = "12345678901234567890@newsletter"; // Example Channel JID

async function sendMessageExample(
  description: string,
  wasenderInstance: Wasender,
  payload: any
) {
  console.log(`\n--- ${description} ---`);
  try {
    const result = await wasenderInstance.send(payload);
    console.log("Message Sent Successfully:", result.response.message);
    console.log(
      "Rate Limit Info: Remaining =",
      result.rateLimit.remaining,
      "| Resets at =",
      result.rateLimit.getResetTimestampAsDate()?.toLocaleTimeString() || "N/A"
    );
  } catch (error) {
    if (error instanceof WasenderAPIError) {
      console.error("API Error Details:");
      console.error(`  Message: ${error.message}`);
      console.error(`  Status Code: ${error.statusCode || "N/A"}`);
      if (error.apiMessage) console.error(`  API Message: ${error.apiMessage}`);
      if (error.errorDetails)
        console.error(
          "  Error Details:",
          JSON.stringify(error.errorDetails, null, 2)
        );
      if (error.retryAfter)
        console.error(`  Retry After: ${error.retryAfter} seconds`);
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
      console.error("An unexpected error occurred:", error);
    }
  }
}

// --- Individual Message Type Examples Follow ---
```

**Note:** Replace `"path-to-your-sdk/main"` and `"path-to-your-sdk/messages"` with the actual paths to your SDK files. Also, set the `WASENDER_API_KEY` environment variable.

## Sending Different Message Types

The SDK uses a generic `wasender.send()` method that accepts a discriminated union `WasenderMessagePayload`. You define the `messageType` and provide the corresponding properties.

### 1. Text Message

Sends a simple plain text message.

```typescript
// examples/send-text.ts
// (Assume main-setup.ts is imported or its content is available)

async function sendTextMessage() {
  const textPayload: TextOnlyMessage = {
    to: recipientPhoneNumber,
    messageType: "text",
    text: "Hello from the Wasender SDK! This is a plain text message.",
  };
  await sendMessageExample("Sending Text Message", wasender, textPayload);
}

sendTextMessage();
```

### 2. Image Message (with Retry Logic Example)

Sends an image from a URL. This example also demonstrates enabling retry logic for the Wasender client.

```typescript
// examples/send-image-with-retry.ts
// (Assume main-setup.ts is imported or its content is available)

async function sendImageMessageWithRetry() {
  const imagePayload: ImageUrlMessage = {
    to: recipientPhoneNumber,
    messageType: "image",
    imageUrl: "https://www.example.com/image.jpg", // Replace with a valid public image URL (JPEG, PNG, max 5MB)
    text: "Check out this cool image! (Sent with retry logic)", // Optional caption
  };
  // Using the wasenderWithRetries instance for this example
  await sendMessageExample(
    "Sending Image Message (with Retries)",
    wasenderWithRetries,
    imagePayload
  );
}

sendImageMessageWithRetry();
```

### 3. Video Message

Sends a video from a URL.

```typescript
// examples/send-video.ts
// (Assume main-setup.ts is imported or its content is available)

async function sendVideoMessage() {
  const videoPayload: VideoUrlMessage = {
    to: recipientPhoneNumber,
    messageType: "video",
    videoUrl: "https://www.example.com/video.mp4", // Replace with a valid public video URL (MP4, 3GPP, max 16MB)
    text: "Watch this exciting video!", // Optional caption
  };
  await sendMessageExample("Sending Video Message", wasender, videoPayload);
}

sendVideoMessage();
```

### 4. Document Message

Sends a document from a URL.

```typescript
// examples/send-document.ts
// (Assume main-setup.ts is imported or its content is available)

async function sendDocumentMessage() {
  const documentPayload: DocumentUrlMessage = {
    to: recipientPhoneNumber,
    messageType: "document",
    documentUrl: "https://www.example.com/document.pdf", // Replace with a valid public document URL (PDF, DOCX, etc., max 100MB)
    text: "Here is the document you requested.", // Optional caption
  };
  await sendMessageExample(
    "Sending Document Message",
    wasender,
    documentPayload
  );
}

sendDocumentMessage();
```

### 5. Audio Message (as Voice Note)

Sends an audio file from a URL, typically rendered as a voice note.

```typescript
// examples/send-audio.ts
// (Assume main-setup.ts is imported or its content is available)

async function sendAudioMessage() {
  const audioPayload: AudioUrlMessage = {
    to: recipientPhoneNumber,
    messageType: "audio",
    audioUrl: "https://www.example.com/audio.mp3", // Replace with a valid public audio URL (AAC, MP3, OGG, AMR, max 16MB)
    // text: "Listen to this audio." // Optional, but typically not used for voice notes
  };
  await sendMessageExample(
    "Sending Audio Message (Voice Note)",
    wasender,
    audioPayload
  );
}

sendAudioMessage();
```

### 6. Sticker Message

Sends a sticker from a URL. Stickers must be in `.webp` format.

```typescript
// examples/send-sticker.ts
// (Assume main-setup.ts is imported or its content is available)

async function sendStickerMessage() {
  const stickerPayload: StickerUrlMessage = {
    to: recipientPhoneNumber,
    messageType: "sticker",
    stickerUrl: "https://www.example.com/sticker.webp", // Replace with a valid public sticker URL (.webp, max 100KB)
    // `text` is not applicable for stickers
  };
  await sendMessageExample("Sending Sticker Message", wasender, stickerPayload);
}

sendStickerMessage();
```

### 7. Contact Card Message (with Retry Logic Example for Variety)

Sends a contact card. This example also demonstrates enabling retry logic for the Wasender client, showing it can be applied to any message type.

```typescript
// examples/send-contact-with-retry.ts
// (Assume main-setup.ts is imported or its content is available)

async function sendContactCardMessageWithRetry() {
  const contactPayload: ContactCardMessage = {
    to: recipientPhoneNumber,
    messageType: "contact",
    contact: {
      name: "John Doe",
      phone: "+19876543210", // The contact's phone number
    },
    text: "Here is John Doe's contact information. (Sent with retry logic)", // Optional caption
  };
  // Using the wasenderWithRetries instance for this example
  await sendMessageExample(
    "Sending Contact Card Message (with Retries)",
    wasenderWithRetries,
    contactPayload
  );
}

sendContactCardMessageWithRetry();
```

### 8. Location Pin Message

Sends a location pin with latitude and longitude.

```typescript
// examples/send-location.ts
// (Assume main-setup.ts is imported or its content is available)

async function sendLocationPinMessage() {
  const locationPayload: LocationPinMessage = {
    to: recipientPhoneNumber,
    messageType: "location",
    location: {
      latitude: 37.7749, // Example: San Francisco
      longitude: -122.4194, // Example: San Francisco
      name: "OpenAI HQ", // Optional name for the location
      address: "Pioneer Building, San Francisco, CA", // Optional address
    },
    text: "Meet me at this location!", // Optional caption
  };
  await sendMessageExample(
    "Sending Location Pin Message",
    wasender,
    locationPayload
  );
}

sendLocationPinMessage();
```

## Using Specific Helper Methods

The SDK also provides specific helper methods for each message type (e.g., `wasender.sendText()`, `wasender.sendImage()`). These are wrappers around the generic `send()` method and automatically set the `messageType`. When using these helpers, you omit `messageType` from the payload.

### Example: Sending Text using `sendText()`

```typescript
// examples/send-text-helper.ts
// (Assume main-setup.ts is imported or its content is available, specifically `wasender` instance)
// Note: For specific helpers, payload types are Omit<MessageType, 'messageType'>

async function sendTextViaHelper() {
  console.log("\n--- Sending Text Message via sendText() Helper ---");
  try {
    // Notice `messageType` is not needed in the payload for helper methods
    const result = await wasender.sendText({
      to: recipientPhoneNumber,
      text: "Hello from the sendText() helper method!",
    });
    console.log("Text Sent via Helper:", result.response.message);
    console.log(
      "Rate Limit:",
      result.rateLimit.remaining,
      "rem, resets",
      result.rateLimit.getResetTimestampAsDate()?.toLocaleTimeString()
    );
  } catch (error) {
    if (error instanceof WasenderAPIError) {
      console.error("\n--- API Error During Send (Helper) ---");
      console.error(
        `Msg: ${error.apiMessage || error.message}, Status: ${error.statusCode}`
      );
      if (error.errorDetails) console.error("Details:", error.errorDetails);
      if (error.rateLimit)
        console.error("Rate Limit at error:", error.rateLimit.remaining);
    } else {
      console.error("\n--- Generic Error During Send (Helper) ---", error);
    }
  }
}

sendTextViaHelper();
```

You can use similar helper methods for all other message types:

- `wasender.sendImage(payload: Omit<ImageUrlMessage, 'messageType'>)`
- `wasender.sendVideo(payload: Omit<VideoUrlMessage, 'messageType'>)`
- `wasender.sendDocument(payload: Omit<DocumentUrlMessage, 'messageType'>)`
- `wasender.sendAudio(payload: Omit<AudioUrlMessage, 'messageType'>)`
- `wasender.sendSticker(payload: Omit<StickerUrlMessage, 'messageType'>)`
- `wasender.sendContact(payload: Omit<ContactCardMessage, 'messageType'>)`
- `wasender.sendLocation(payload: Omit<LocationPinMessage, 'messageType'>)`

## Error Handling and Rate Limiting

All send operations can throw a `WasenderAPIError`. This error object contains detailed information about the failure, including:

- `message`: A user-friendly error message.
- `statusCode`: The HTTP status code of the response.
- `apiMessage`: The specific error message from the Wasender API.
- `errorDetails`: Any additional structured error details from the API.
- `rateLimit`: `RateLimitInfo` object reflecting the state at the time of the error.
- `retryAfter`: If it was a 429 error, this might contain the suggested seconds to wait before retrying.

The `RateLimitInfo` object is available on both successful results (`result.rateLimit`) and on `WasenderAPIError` instances (`error.rateLimit`). It provides:

- `limit`: Max requests per window.
- `remaining`: Requests remaining in the current window.
- `resetTimestamp`: Unix timestamp (seconds) when the window resets.
- `getResetTimestampAsDate()`: Helper to get `resetTimestamp` as a `Date` object.

Refer to the `sendMessageExample` function in the "Initializing the SDK" section and the specific error handling in the `sendTextViaHelper` example for how to catch and inspect these errors.

This comprehensive set of examples should help you effectively use the Wasender SDK to send various message types and manage API interactions.
