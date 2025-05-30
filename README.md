# Wasender API TypeScript SDK

**Author:** Shreshth Arora

[![NPM Version](https://img.shields.io/npm/v/wasenderapi?style=flat)](https://www.npmjs.com/package/wasenderapi)
[![NPM Downloads](https://img.shields.io/npm/dm/wasenderapi?style=flat)](https://www.npmjs.com/package/wasenderapi)
[![License](https://img.shields.io/npm/l/wasenderapi?style=flat)](https://github.com/AroraShreshth/wasender/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/written%20in-TypeScript-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![CI](https://github.com/AroraShreshth/wasender/actions/workflows/ci.yml/badge.svg)](https://github.com/AroraShreshth/wasender/actions/workflows/ci.yml)

A lightweight and robust TypeScript SDK for interacting with the Wasender API ([https://www.wasenderapi.com](https://www.wasenderapi.com)). This SDK simplifies sending various types of WhatsApp messages, managing contacts and groups, handling session statuses, and processing incoming webhooks.

## Features

- **Typed Interfaces:** Full TypeScript support for all API requests and responses.
- **Message Sending:**
  - Generic `send()` method for all supported message types.
  - Specific helper methods (e.g., `sendText()`, `sendImage()`) for convenience.
  - Support for text, image, video, document, audio, sticker, contact card, and location messages.
- **Contact Management:** List, retrieve details, get profile pictures, block, and unblock contacts.
- **Group Management:** List groups, fetch metadata, manage participants (add/remove), and update group settings.
- **Channel Messaging:** Send text messages to WhatsApp Channels.
- **Session Management:** Create, list, update, delete sessions, connect/disconnect, get QR codes, and check session status.
- **Webhook Handling:** Securely verify and parse incoming webhook events from Wasender.
- **Error Handling:** Comprehensive `WasenderAPIError` class with detailed error information.
- **Rate Limiting:** Access to rate limit information on API responses.
- **Retry Mechanism:** Optional automatic retries for rate-limited requests (HTTP 429).
- **Injectable Fetch:** Allows providing a custom `fetch` implementation (e.g., for Node.js environments or testing).

## Prerequisites

- Node.js (version compatible with `fetch` API, or use a polyfill like `cross-fetch`)
- **Personal Access Token (PAT):** For account-level operations like session management (creating, listing sessions). Obtain this from your Wasender Dashboard (Settings > Personal Access Token).
- **Session-Specific API Key:** For operations _within_ an active session (sending messages, managing contacts/groups). This key is generated when a WhatsApp session is connected via Wasender.
- If using webhooks:
  - A publicly accessible HTTPS URL for your webhook endpoint.
  - A Webhook Secret generated from the Wasender dashboard.

## Installation

```bash
npm install wasenderapi
# or
yarn add wasenderapi
```

## SDK Initialization

```typescript
import { createWasender, RetryConfig, FetchImplementation } from "wasenderapi";
// For Node.js < 18 or environments without global fetch, you might need a polyfill
// import fetch from 'cross-fetch';
// const customFetch: FetchImplementation = fetch as FetchImplementation;

const apiKey = process.env.WASENDER_API_KEY; // Session-specific API key
const personalAccessToken = process.env.WASENDER_PERSONAL_ACCESS_TOKEN; // Account-level PAT
const webhookSecret = process.env.WASENDER_WEBHOOK_SECRET; // Required for wasender.handleWebhookEvent()

// Optional: Configure retry behavior for rate limit errors
const retryOptions: RetryConfig = {
  enabled: true,
  maxRetries: 3, // Attempt up to 3 retries on HTTP 429 errors
};

// Initialize with the appropriate token(s) for your needs:
// - Use 'personalAccessToken' for managing sessions (create, list, delete, connect, status).
// - Use 'apiKey' for operations tied to an active session (send messages, manage contacts/groups).
// Both can be provided if your application performs both types of operations.
const wasender = createWasender(
  apiKey, // Can be undefined if only using PAT
  personalAccessToken, // Can be undefined if only using session-specific apiKey
  undefined, // Optional: baseUrl, defaults to "https://www.wasenderapi.com/api"
  undefined, // Optional: customFetch implementation (e.g., for Node.js < 18)
  retryOptions,
  webhookSecret // Provide if you plan to use wasender.handleWebhookEvent()
);

console.log("Wasender SDK Initialized.");
```

**Important:**

- Always store your `WASENDER_API_KEY` (session-specific), `WASENDER_PERSONAL_ACCESS_TOKEN`, and `WASENDER_WEBHOOK_SECRET` securely (e.g., as environment variables).
- The SDK requires at least one token (`apiKey` or `personalAccessToken`) to be provided during initialization. The specific token used for an API call depends on the nature of the operation (session management vs. in-session actions).

## Core Concepts

### Message Payloads

The SDK uses discriminated unions (`WasenderMessagePayload`) for message sending. Each message type has a specific interface, and you must provide the `messageType` discriminant along with the corresponding fields.

### Generic `send()` vs. Specific Helpers

- **`wasender.send(payload)`:** A versatile method that accepts any valid `WasenderMessagePayload`.
- **`wasender.sendText(payload)`**, **`wasender.sendImage(payload)`**, etc.: Convenience wrappers that pre-fill the `messageType` for you.

### Error Handling

API errors are thrown as instances of `WasenderAPIError`. This object includes properties like `statusCode`, `apiMessage` (from Wasender), `errorDetails`, and `rateLimit` information at the time of error.

### Rate Limiting

Successful responses and `WasenderAPIError` objects include a `rateLimit` property (`RateLimitInfo`) which provides details about your current API usage limits (`limit`, `remaining`, `resetTimestamp`).

### Webhooks

The `wasender.handleWebhookEvent(requestAdapter)` method verifies the signature of incoming webhook requests (using the `webhookSecret` you provide at initialization) and parses the event payload into a typed `WasenderWebhookEvent` object. You'll need to implement a `WebhookRequestAdapter` based on your HTTP server framework.

## Usage Examples

This SDK provides a comprehensive suite of functionalities. Below is an overview with links to detailed documentation for each module. For more comprehensive information on all features, please refer to the files in the [`docs`](./docs/) directory.

### 1. Sending Messages

Send various types of messages including text, media (images, videos, documents, audio, stickers), contact cards, and location pins.

- **Detailed Documentation & Examples:** [`docs/messages.md`](./docs/messages.md)

```typescript
import { TextOnlyMessage } from "wasenderapi";

async function sendSimpleText() {
  try {
    const textPayload: TextOnlyMessage = {
      messageType: "text",
      to: "+1234567890", // Recipient's JID
      text: "Hello from the Wasender SDK!",
    };
    const result = await wasender.send(textPayload);
    console.log("Message sent:", result.response.message);
    console.log("Rate limit remaining:", result.rateLimit.remaining);
  } catch (error) {
    console.error("Error sending message:", error);
  }
}
sendSimpleText();
```

### 2. Managing Contacts

Retrieve your contact list, fetch information about specific contacts, get their profile pictures, and block or unblock contacts.

- **Detailed Documentation & Examples:** [`docs/contacts.md`](./docs/contacts.md)

```typescript
async function getMyContacts() {
  try {
    const result = await wasender.getContacts();
    console.log(`Found ${result.response.data.length} contacts.`);
    if (result.response.data.length > 0) {
      console.log("First contact:", result.response.data[0]);
    }
  } catch (error) {
    console.error("Error fetching contacts:", error);
  }
}
getMyContacts();
```

### 3. Managing Groups

List groups your account is part of, get group metadata (like subject and participants), add or remove participants, and update group settings (subject, description, announce/restrict modes).

- **Detailed Documentation & Examples:** [`docs/groups.md`](./docs/groups.md)

```typescript
async function getMyGroups() {
  try {
    const result = await wasender.getGroups();
    console.log(`Found ${result.response.data.length} groups.`);
    if (result.response.data.length > 0) {
      const firstGroup = result.response.data[0];
      console.log(
        "First group ID:",
        firstGroup.id,
        "Subject:",
        firstGroup.subject
      );

      // Example: Get metadata for the first group
      const metadata = await wasender.getGroupMetadata(firstGroup.id);
      console.log(
        "First group participants count:",
        metadata.response.data.participants?.length
      );
    }
  } catch (error) {
    console.error("Error fetching groups:", error);
  }
}
getMyGroups();
```

### 4. Sending Messages to WhatsApp Channels

Send text messages to WhatsApp Channels (within Communities).

- **Detailed Documentation & Examples:** [`docs/channel.md`](./docs/channel.md)

```typescript
import { ChannelTextMessage } from "wasenderapi";

async function sendToChannel(channelJid: string, text: string) {
  try {
    const payload: ChannelTextMessage = {
      to: channelJid, // e.g., "12345678901234567890@newsletter"
      messageType: "text",
      text: text,
    };
    const result = await wasender.send(payload);
    console.log("Message sent to channel:", result.response.message);
  } catch (error) {
    console.error("Error sending to channel:", error);
  }
}
// sendToChannel("YOUR_CHANNEL_JID@newsletter", "Hello Channel Subscribers!");
```

### 5. Handling Incoming Webhooks

Process real-time events from Wasender such as new messages, message status updates, and session status changes.

- **Detailed Documentation & Examples:** [`docs/webhook.md`](./docs/webhook.md)

```typescript
// Conceptual example (adapt to your server framework like Express.js or Cloudflare Workers)
import {
  WebhookRequestAdapter,
  WasenderWebhookEvent,
  WasenderWebhookEventType,
  WasenderAPIError,
} from "wasenderapi";

async function handleIncomingWebhook(request: YourFrameworkRequest) {
  // Replace YourFrameworkRequest
  if (!webhookSecret) {
    // Ensure wasender instance was initialized with webhookSecret
    console.error("Webhook secret not configured in SDK.");
    return; // Or send appropriate error response
  }

  const adapter: WebhookRequestAdapter = {
    getHeader: (name: string) => {
      /* ... get header from request ... */ return "";
    },
    getRawBody: () => {
      /* ... get raw body from request ... */ return "";
    },
  };

  try {
    const webhookEvent: WasenderWebhookEvent =
      await wasender.handleWebhookEvent(adapter);

    console.log("Received verified webhook event:", webhookEvent.type);

    switch (webhookEvent.type) {
      case WasenderWebhookEventType.MessagesUpsert:
        console.log("New message from:", webhookEvent.data.key.remoteJid);
        if (webhookEvent.data.message?.conversation) {
          console.log("Text:", webhookEvent.data.message.conversation);
        }
        break;
      case WasenderWebhookEventType.SessionStatus:
        console.log("Session status update:", webhookEvent.data.status);
        break;
      // ... handle other event types
      default:
        console.warn("Unhandled event type:", (webhookEvent as any).type);
    }
    // Respond with 200 OK to Wasender
  } catch (error) {
    if (error instanceof WasenderAPIError) {
      console.error(
        "Webhook error:",
        error.apiMessage,
        "Status:",
        error.statusCode
      );
      // Respond with appropriate error status (e.g., 400 or 401)
    } else {
      console.error("Generic webhook processing error:", error);
      // Respond with 500
    }
  }
}
```

### 6. Managing Sessions

Create, list, update, delete sessions, connect/disconnect, get QR codes, and check session status. These operations typically require a **Personal Access Token** for authentication.

- **Detailed Documentation & Examples:** [`docs/sessions.md`](./docs/sessions.md)

```typescript
async function listMySessions() {
  try {
    // This operation uses the Personal Access Token provided during SDK initialization.
    const result = await wasender.getAllWhatsAppSessions();
    console.log(`Found ${result.response.data.length} sessions.`);
    if (result.response.data.length > 0) {
      console.log("First session ID:", result.response.data[0].id); // Corrected to .id
    }
  } catch (error) {
    console.error("Error fetching sessions:", error);
  }
}
// listMySessions();
```

## Advanced Topics

### Custom Fetch Implementation

If you are in an environment where `globalThis.fetch` is not available (e.g., older Node.js versions) or if you want to use a custom fetch implementation (e.g., for advanced logging, mocking, or specific proxy configurations), you can pass it during SDK initialization:

```typescript
import fetch, { RequestInfo, RequestInit, Response } from "cross-fetch"; // Example using cross-fetch

const customFetchImplementation = async (
  url: RequestInfo,
  options?: RequestInit
): Promise<Response> => {
  console.log(`Making request to: ${url}`);
  return fetch(url, options);
};

const wasender = createWasender(apiKey, undefined, customFetchImplementation);
```

### Retry Configuration

The SDK can automatically retry requests that fail due to rate limiting (HTTP 429). This is configurable during initialization:

```typescript
const retryConfig: RetryConfig = {
  enabled: true, // Default: false
  maxRetries: 2, // Default: 0 (no retries if enabled is true but maxRetries is 0)
};

const wasenderWithRetries = createWasender(
  apiKey,
  undefined,
  undefined,
  retryConfig
);
```

The SDK will respect the `retry_after` header from the API if available, or use an exponential backoff strategy.

## Contributing

Contributions are welcome! Please feel free to submit issues, fork the repository, and create pull requests.

## License

This SDK is released under the [MIT License](./LICENSE).
