## Wasender TypeScript SDK Usage Examples

This document provides examples of how to use the Wasender TypeScript SDK to send various types of messages, handle errors, inspect rate limiting information, configure custom fetch implementations, utilize optional retry mechanisms, and process incoming webhooks.

### SDK Version: 0.1.0

### Prerequisites

1.  **Install Node.js and npm/yarn.**
2.  **Obtain a Wasender API Key:** You'll need an API key from [https://www.wasenderapi.com](https://www.wasenderapi.com).
3.  **Webhook Setup (if using webhooks):**
    - A publicly accessible HTTPS URL for your webhook endpoint.
    - A Webhook Secret generated from the Wasender dashboard.

### Setup

Assuming your SDK files (`main.ts`, `messages.ts`, `errors.ts`, `webhook.ts`) are in a `src/wasender/` directory relative to your project root.

### Key Features & Concepts

- **Discriminated Message Payloads:** For sending messages (`WasenderMessagePayload`).
- **Generic `send` Method & Specific Helpers:** For sending messages.
- **Detailed Error Handling:** `WasenderAPIError` for API and SDK errors.
- **Rate Limit Information:** Accessible on success and error objects.
- **Injectable Fetch:** Provide your own `fetch` implementation.
- **Optional Retries:** Automatic retries on HTTP 429 errors.
- **Webhook Event Handling:** Integrated signature verification and event parsing via `wasender.handleWebhookEvent()`.

### Initializing the SDK

```typescript
// examples/initialize.ts
import {
  createWasender,
  FetchImplementation,
  RetryConfig,
} from "../src/wasender/main"; // Adjust path

// Optional: For Node.js < 18, you might need a fetch polyfill
// import fetch from 'cross-fetch';
// const customFetch: FetchImplementation = fetch as FetchImplementation;

const apiKey = process.env.WASENDER_API_KEY; // Session-specific API key, used for operations within a session
const personalAccessToken = process.env.WASENDER_PERSONAL_ACCESS_TOKEN; // Account-level token for session management
const webhookSecret = process.env.WASENDER_WEBHOOK_SECRET; // Optional, for handling webhooks

// At least one of apiKey or personalAccessToken must be provided.
// - personalAccessToken is required for account-level session management (create, list, delete sessions).
// - apiKey is required for operations on an already connected session (send messages, manage contacts/groups via that session).

const retryOptions: RetryConfig = {
  enabled: true,
  maxRetries: 2,
};

const wasender = createWasender(
  apiKey, // Can be undefined if only doing session management with PAT
  personalAccessToken, // Can be undefined if only using a session-specific apiKey
  undefined, // Default baseUrl "https://www.wasenderapi.com/api"
  undefined, // Default globalThis.fetch (or provide `customFetch`)
  retryOptions,
  webhookSecret // Provide if you plan to use wasender.handleWebhookEvent()
);

console.log("Wasender SDK Initialized.");
// Now you can use `wasender.send(...)` (if apiKey is set), `wasender.getAllWhatsAppSessions()` (if personalAccessToken is set), etc.
```

### Sending Messages (Basic Usage)

(Example from previous documentation, focuses on `send` and error handling for sending messages - remains largely the same but ensure `wasender` instance is initialized as above)

```typescript
// examples/send-messages.ts
// ... (imports for createWasender, errors, message types) ...
// ... (apiKey and wasender instance initialization, potentially without webhookSecret if only sending) ...

import {
  createWasender,
  WasenderAPIError,
  RetryConfig,
} from "../src/wasender/main"; // Adjust path
import {
  TextOnlyMessage,
  ImageUrlMessage,
  DocumentUrlMessage,
} from "../src/wasender/messages"; // Adjust path

async function sendDemoMessages() {
  const apiKey = process.env.WASENDER_API_KEY!; // Requires a session-specific API key
  // For sending messages, personalAccessToken is not typically used directly by send().
  const wasender = createWasender(apiKey, undefined, undefined, undefined, {
    enabled: true,
    maxRetries: 1,
  });

  try {
    console.log("\n--- Sending Text Message ---");
    const textPayload: TextOnlyMessage = {
      messageType: "text",
      to: "+1234567890",
      text: "Hello from SDK v0.1.0!",
    };
    let result = await wasender.send(textPayload);
    console.log("Text Sent:", result.response.message);
    console.log(
      "Rate Limit:",
      result.rateLimit.remaining,
      "rem, resets",
      result.rateLimit.getResetTimestampAsDate()?.toLocaleTimeString()
    );

    // ... (other send examples like image, document can follow) ...
  } catch (error) {
    if (error instanceof WasenderAPIError) {
      console.error("\n--- API Error During Send ---");
      console.error(`Msg: ${error.apiMessage}, Status: ${error.statusCode}`);
      if (error.errorDetails) console.error("Details:", error.errorDetails);
      if (error.retryAfter) console.error("Retry After:", error.retryAfter);
      if (error.rateLimit)
        console.error("Rate Limit at error:", error.rateLimit.remaining);
    } else {
      console.error("\n--- Generic Error During Send ---", error);
    }
  }
}
sendDemoMessages();
```

### Handling Incoming Webhooks

To process webhooks, initialize the `Wasender` SDK with your `webhookSecret`. Then, use the `wasender.handleWebhookEvent(requestAdapter)` method. You'll need to create a `WebhookRequestAdapter` based on your server framework.

**`WebhookRequestAdapter` Interface:**

```typescript
export interface WebhookRequestAdapter {
  getHeader: (name: string) => string | undefined | null;
  getRawBody: () => Promise<string> | string;
}
```

Detailed examples for Express.js and Cloudflare Workers have been moved to the [Webhook Documentation](./docs/webhook.md#detailed-examples).

This SDK version (0.1.0) provides integrated support for sending messages and handling incoming webhooks.
