# Handling Wasender Webhooks

This document explains how to receive and process webhook events from Wasender using the Wasender TypeScript SDK. Webhooks allow your application to be notified in real-time about events such as incoming messages, message status updates, session status changes, and more.

## Prerequisites

1.  **Webhook Endpoint:** A publicly accessible HTTPS URL on your server where Wasender can send POST requests.
2.  **Webhook Secret:** A secret string obtained from your Wasender dashboard. This is crucial for verifying the authenticity of incoming webhooks.

## SDK Setup for Webhooks

To handle webhooks, you must provide your `webhookSecret` when initializing the Wasender SDK client.

```typescript
import { createWasender } from "wasender"; // Adjust path if necessary

const apiKey = process.env.WASENDER_API_KEY!;
const webhookSecret = process.env.WASENDER_WEBHOOK_SECRET!;

if (!webhookSecret) {
  throw new Error("WASENDER_WEBHOOK_SECRET is essential for webhook handling.");
}

const wasender = createWasender(
  apiKey,
  undefined, // Optional: baseUrl
  undefined, // Optional: customFetch
  undefined, // Optional: retryConfig
  webhookSecret // Crucial: Your webhook secret
);

// Now the \'wasender\' instance is ready to handle webhook events.
```

## Processing Incoming Webhooks

The SDK provides a `handleWebhookEvent` method on the `Wasender` instance to simplify webhook processing. This method performs two key actions:

1.  **Signature Verification:** It verifies the incoming request using the `webhookSecret` you provided during initialization and the signature sent in the `x-webhook-signature` header.
2.  **Event Parsing:** If the signature is valid, it parses the request body into a typed `WasenderWebhookEvent` object.

### `WebhookRequestAdapter`

To use `handleWebhookEvent`, you need to provide an adapter that allows the SDK to interact with your specific HTTP server framework (e.g., Express.js, Cloudflare Workers, Next.js API routes). This adapter must implement the `WebhookRequestAdapter` interface:

```typescript
export interface WebhookRequestAdapter {
  /**
   * Function to get a header value by its name (case-insensitive).
   * Should return the value of the specified header, or undefined/null if not found.
   */
  getHeader: (name: string) => string | undefined | null;

  /**
   * Function that returns the raw request body as a string.
   * This can be a direct string or a Promise that resolves to a string.
   * It is important to provide the *raw* body for accurate signature verification,
   * before any JSON parsing by your framework\'s middlewares.
   */
  getRawBody: () => Promise<string> | string;
}
```

### Using `handleWebhookEvent`

Here\'s a conceptual example of how to use it within a request handler:

```typescript
// Conceptual example - adapt to your framework
async function handleIncomingWebhook(
  request: YourFrameworkRequest,
  response: YourFrameworkResponse
) {
  const adapter: WebhookRequestAdapter = {
    // Example for Express.js: req.header(name)
    getHeader: (name: string) => request.headers[name.toLowerCase()], // Adapt to your framework
    // Example for Express.js with express.raw() middleware: req.body.toString()
    // Example for Cloudflare Workers: await request.text()
    getRawBody: () => getRawRequestBody(request), // Implement this based on your framework
  };

  try {
    const webhookEvent: WasenderWebhookEvent =
      await wasender.handleWebhookEvent(adapter);

    console.log("Received verified webhook event type:", webhookEvent.type);

    // Process the event based on its type
    switch (webhookEvent.type) {
      case WasenderWebhookEventType.MessagesUpsert:
        // Handle new incoming message
        const newMessageData = webhookEvent.data;
        console.log("New message from:", newMessageData.key.remoteJid);
        if (newMessageData.message?.conversation) {
          console.log("Text:", newMessageData.message.conversation);
        }
        break;
      case WasenderWebhookEventType.SessionStatus:
        // Handle session status change
        const sessionStatusData = webhookEvent.data;
        console.log("Session status changed:", sessionStatusData.status);
        break;
      // ... add cases for other event types you want to handle
      default:
        // Optional: Log unhandled event types
        // const unhandledEvent: never = webhookEvent; // Ensures all types are covered if using strict TypeScript
        console.warn(
          "Received an unhandled webhook event type:",
          (webhookEvent as any).type
        );
    }

    // Send a success response to Wasender
    // response.status(200).json({ received: true }); // Adapt to your framework
  } catch (error) {
    if (error instanceof WasenderAPIError) {
      console.error(
        "Webhook Error:",
        error.apiMessage,
        "Status:",
        error.statusCode
      );
      // Respond with an appropriate error status (e.g., 400 for bad request, 401 for signature mismatch)
      // response.status(error.statusCode || 400).json({ error: error.apiMessage }); // Adapt
    } else {
      console.error("Generic Webhook Processing Error:", error);
      // response.status(500).json({ error: "Internal server error" }); // Adapt
    }
  }
}
```

**Important Notes:**

- The `x-webhook-signature` header is used for signature verification.
- `handleWebhookEvent` will throw a `WasenderAPIError` if:
  - The SDK was not initialized with a `webhookSecret`.
  - The signature is missing or invalid (status code 401).
  - The request body cannot be read or parsed.
- Always respond to webhook requests promptly (e.g., with a 2xx status code) to acknowledge receipt. Process lengthy tasks asynchronously to avoid timeouts.

## Webhook Event Structure

All webhook events follow a base structure defined by `BaseWebhookEvent` and are part of the `WasenderWebhookEvent` discriminated union, typed by the `type` property.

```typescript
export interface BaseWebhookEvent<T extends WasenderWebhookEventType, D = any> {
  type: T;
  timestamp?: number; // Unix timestamp
  data: D;
  sessionId?: string;
}

export type WasenderWebhookEvent =
  | ChatsUpsertEvent
  | ChatsUpdateEvent
  | ChatsDeleteEvent;
// ... and all other event types defined in \'src/wasender/webhook.ts\'
```

### Event Types (`WasenderWebhookEventType`)

The `type` property is an enum `WasenderWebhookEventType` that indicates the kind of event. Key event types include:

- **Chat Events:** `ChatsUpsert`, `ChatsUpdate`, `ChatsDelete`
- **Group Events:** `GroupsUpsert`, `GroupsUpdate`, `GroupParticipantsUpdate`
- **Contact Events:** `ContactsUpsert`, `ContactsUpdate`
- **Message Events:**
  - `MessagesUpsert`: New incoming message.
  - `MessagesUpdate`: Message status update (e.g., delivered, read).
  - `MessagesDelete`: A message was deleted.
  - `MessagesReaction`: A reaction was added/removed from a message.
- **Message Receipt Events:** `MessageReceiptUpdate`
- **Session Events:**
  - `MessageSent`: Confirmation of a message successfully sent _from your session_.
  - `SessionStatus`: Changes in your session status (e.g., connected, disconnected, QR code needed).
  - `QrCodeUpdated`: A new QR code is available for scanning.

Each event type has a corresponding `data` payload with a specific structure. Refer to the type definitions in `src/wasender/webhook.ts` for details on each payload.

## Detailed Examples

This section provides complete, runnable examples of handling webhooks with popular frameworks.

### 1. Express.js Webhook Example

Make sure to use a middleware that provides the raw body (e.g., `express.raw({ type: 'application/json' })`) **before** Express's default JSON parser if you want to use `req.body` directly as the raw string. Alternatively, re-stringify `req.body` if it's already parsed, though this is less ideal for signature verification if the body was altered.

```typescript
// examples/webhook-express.ts
import express from "express";
// Assuming Wasender SDK (createWasender, WebhookRequestAdapter, WasenderWebhookEvent, WasenderWebhookEventType) is available
// import { createWasender, WebhookRequestAdapter, WasenderWebhookEvent, WasenderWebhookEventType, WasenderAPIError } from "../src/wasender/main";
// For this example, let's mock them if not running full SDK context
const {
  createWasender,
  WebhookRequestAdapter,
  WasenderWebhookEvent,
  WasenderWebhookEventType,
  WasenderAPIError,
} = require("../lib/main"); //path to compiled sdk

const app = express();
const PORT = process.env.PORT || 3000;

const apiKey = process.env.WASENDER_API_KEY!;
const webhookSecret = process.env.WASENDER_WEBHOOK_SECRET!;

if (!webhookSecret) {
  console.error(
    "WASENDER_WEBHOOK_SECRET is not set. Webhook handler will not work."
  );
  // Potentially exit or disable webhook route
}

const wasender = createWasender(
  apiKey,
  undefined,
  undefined,
  undefined,
  webhookSecret
);

// Middleware to get raw body - place this BEFORE express.json() for this route if needed for verification on raw body by some libraries
// For this SDK's current string-based signature, express.json() is fine as we re-stringify if needed, but raw is safer.
// Or, use a specific raw body middleware:
app.use("/webhook-wasender", express.raw({ type: "application/json" }));

app.post("/webhook-wasender", async (req, res) => {
  if (!webhookSecret) {
    return res
      .status(500)
      .json({ error: "Webhook secret not configured on server." });
  }

  const adapter: typeof WebhookRequestAdapter = {
    getHeader: (name: string) => req.header(name),
    // If using express.raw(), req.body is a Buffer. Convert to string.
    // If express.json() ran first, req.body is parsed JSON; we'd need to re-stringify for some verification methods,
    // but this SDK currently takes the string. Be cautious about mutations by middlewares.
    getRawBody: () =>
      req.body instanceof Buffer
        ? req.body.toString()
        : JSON.stringify(req.body),
  };

  try {
    const webhookEvent: typeof WasenderWebhookEvent =
      await wasender.handleWebhookEvent(adapter);
    console.log("Received verified webhook event:", webhookEvent.type);

    // Process the event (example)
    switch (webhookEvent.type) {
      case WasenderWebhookEventType.MessagesUpsert:
        console.log(
          "New message content:",
          webhookEvent.data.message?.conversation
        );
        break;
      case WasenderWebhookEventType.SessionStatus:
        console.log("Session status:", webhookEvent.data.status);
        break;
      default:
        console.log("Unhandled event type:", (webhookEvent as any).type);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    if (error instanceof WasenderAPIError) {
      console.error("Webhook Error:", error.apiMessage, error.statusCode);
      res
        .status(error.statusCode === 401 ? 401 : 400)
        .json({ error: error.apiMessage });
    } else if (error instanceof Error) {
      console.error("Generic Webhook Error:", error.message);
      res.status(500).json({ error: error.message });
    } else {
      console.error("Unknown Webhook Error:", error);
      res.status(500).json({ error: "Unknown error processing webhook" });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Express webhook server listening on port ${PORT}`);
});
```

### 2. Cloudflare Worker Webhook Example

```typescript
// Example: src/worker.ts (Cloudflare Worker)

import {
  createWasender,
  WebhookRequestAdapter,
  WasenderWebhookEvent,
  WasenderWebhookEventType,
  WasenderAPIError,
} from "./wasender/main"; // Adjust path to your SDK files

export interface Env {
  WASENDER_API_KEY: string;
  WASENDER_WEBHOOK_SECRET: string;
  // ... other bindings
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Expected POST", { status: 405 });
    }

    if (!env.WASENDER_WEBHOOK_SECRET) {
      console.error("Webhook secret not configured in Worker environment.");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const wasender = createWasender(
      env.WASENDER_API_KEY,
      undefined, // Default baseUrl
      undefined, // Default fetch (already global in workers)
      undefined, // Default retry config
      env.WASENDER_WEBHOOK_SECRET
    );

    const adapter: WebhookRequestAdapter = {
      getHeader: (name: string) => request.headers.get(name),
      getRawBody: () => request.text(), // Returns a promise with the raw body string
    };

    try {
      const webhookEvent: WasenderWebhookEvent =
        await wasender.handleWebhookEvent(adapter);
      console.log(
        "CF Worker: Received verified webhook event:",
        webhookEvent.type
      );

      // Process the event (example using a switch, could be a separate function)
      switch (webhookEvent.type) {
        case WasenderWebhookEventType.MessagesUpsert:
          console.log(
            "CF Worker: New message content:",
            webhookEvent.data.message?.conversation
          );
          // Add to a queue, call another service, etc.
          // ctx.waitUntil(someAsyncProcessing(webhookEvent.data));
          break;
        case WasenderWebhookEventType.SessionStatus:
          console.log("CF Worker: Session status:", webhookEvent.data.status);
          break;
        default:
          console.log(
            "CF Worker: Unhandled event type:",
            (webhookEvent as any).type
          );
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      let status = 500;
      let message = "Error processing webhook";

      if (error instanceof WasenderAPIError) {
        message = error.apiMessage;
        status = error.statusCode === 401 ? 401 : 400; // Use 401 for bad signature
        console.error(`CF Worker: Webhook Error (${status}): ${message}`);
      } else if (error instanceof Error) {
        message = error.message;
        console.error(`CF Worker: Generic Webhook Error: ${message}`);
      } else {
        console.error("CF Worker: Unknown Webhook Error:", error);
      }
      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
```

By following this guide and referring to the detailed examples, you can effectively integrate Wasender webhooks into your application.
