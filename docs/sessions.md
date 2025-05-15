# Wasender SDK: Session Management Examples

This document provides comprehensive examples for managing WhatsApp sessions using the Wasender TypeScript SDK. It covers creating, retrieving, updating, deleting sessions, handling connections (QR codes), and checking session status.

## SDK Version: 0.3.2

## Prerequisites

1.  **Install Node.js and npm/yarn.**
2.  **Obtain a Wasender API Key:** From [https://www.wasenderapi.com](https://www.wasenderapi.com). This API key is used to authorize your SDK calls.
3.  **SDK Installation:** Ensure the Wasender SDK is correctly installed in your project.

## Initializing the SDK

All examples assume SDK initialization as shown below. Adjust paths to your SDK files accordingly.

```typescript
// session-examples-setup.ts
import { createWasender, Wasender } from "path-to-your-sdk/main"; // Adjust path
import { WasenderAPIError } from "path-to-your-sdk/errors"; // Adjust path
import {
  // WhatsAppSession, // Individual session type, if needed directly
  CreateWhatsAppSessionPayload,
  UpdateWhatsAppSessionPayload,
  GetAllWhatsAppSessionsResult,
  GetWhatsAppSessionDetailsResult,
  CreateWhatsAppSessionResult,
  UpdateWhatsAppSessionResult,
  DeleteWhatsAppSessionResult,
  ConnectSessionResult,
  GetQRCodeResult,
  DisconnectSessionResult,
  RegenerateApiKeyResult,
  GetSessionStatusResult,
  // WhatsAppSessionStatus // Type for status strings
} from "path-to-your-sdk/sessions"; // Adjust path

const apiKey = process.env.WASENDER_API_KEY;

if (!apiKey) {
  console.error("Error: WASENDER_API_KEY environment variable is not set.");
  process.exit(1);
}

const wasender = createWasender(apiKey);
console.log("Wasender SDK Initialized for Session Management examples.");

// Placeholder for a session ID - replace with an actual ID from your tests
let activeTestSessionId: number | null = null;

// Generic error handler for session examples
function handleSessionApiError(error: unknown, operation: string) {
  if (error instanceof WasenderAPIError) {
    console.error(`API Error during ${operation}:`);
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
    console.error(`An unexpected error occurred during ${operation}:`, error);
  }
}

// --- Example Execution Orchestrator ---
async function runAllSessionExamples() {
  await fetchAllSessions();
  await createNewSession();
  if (activeTestSessionId) {
    await fetchSessionDetails(activeTestSessionId);
    await updateExistingSession(activeTestSessionId);
    await connectSession(activeTestSessionId);
    // Pause here in a real test to scan QR if needed
    await fetchSessionQrCode(activeTestSessionId); // Might be useful if NEED_SCAN persists
    await checkSessionStatus(); // General status for the API key
    await disconnectSpecificSession(activeTestSessionId);
    // await regenerateKeyForSession(activeTestSessionId); // Highly destructive - use with extreme caution
    // await deleteSpecificSession(activeTestSessionId); // Destructive - use with caution
  }
  console.log("\n--- All Session Examples (selected) Completed ---");
}

// runAllSessionExamples(); // Uncomment to run the orchestrated examples
```

**Note:** Replace path placeholders. Ensure `WASENDER_API_KEY` is set. The `runAllSessionExamples` function provides a way to test operations in sequence; uncomment and modify it for your testing.

## Session Management Operations

### 1. Get All WhatsApp Sessions

Retrieves a list of all WhatsApp sessions linked to your API key.

```typescript
async function fetchAllSessions() {
  console.log("\n--- Fetching All WhatsApp Sessions ---");
  try {
    const result: GetAllWhatsAppSessionsResult =
      await wasender.getAllWhatsAppSessions();
    console.log(
      "Sessions retrieved:",
      result.response.data.length,
      "sessions found."
    );
    if (result.response.data.length > 0) {
      console.log(
        "First session (example):",
        JSON.stringify(result.response.data[0], null, 2)
      );
      if (!activeTestSessionId)
        activeTestSessionId = result.response.data[0].id; // Use first existing for some tests if none created
    }
  } catch (error) {
    handleSessionApiError(error, "fetching all sessions");
  }
}
// To run standalone: fetchAllSessions();
```

### 2. Create WhatsApp Session

Creates a new WhatsApp session.

```typescript
async function createNewSession() {
  console.log("\n--- Creating New WhatsApp Session ---");
  const uniqueName = `SDK Test Session ${Date.now()}`;
  const payload: CreateWhatsAppSessionPayload = {
    name: uniqueName,
    phone_number: "+12345000001", // IMPORTANT: Use a REAL, UNIQUE, and UNUSED number for testing session creation
    account_protection: true,
    log_messages: true,
    // webhook_url: "https://my.service.com/webhook", // Optional
    // webhook_enabled: true, // Optional
    // webhook_events: ["message", "status_update"], // Optional
  };
  try {
    const result: CreateWhatsAppSessionResult =
      await wasender.createWhatsAppSession(payload);
    console.log(
      "Session created successfully:",
      JSON.stringify(result.response.data, null, 2)
    );
    activeTestSessionId = result.response.data.id; // Store for subsequent examples
    console.log(`Stored new session ID for tests: ${activeTestSessionId}`);
  } catch (error) {
    handleSessionApiError(error, `creating new session (${uniqueName})`);
  }
}
// To run standalone: createNewSession();
```

### 3. Get WhatsApp Session Details

Retrieves details for a specific session by its ID.

```typescript
async function fetchSessionDetails(sessionId: number) {
  console.log(`\n--- Fetching Details for Session ID: ${sessionId} ---`);
  try {
    const result: GetWhatsAppSessionDetailsResult =
      await wasender.getWhatsAppSessionDetails(sessionId);
    console.log(
      "Session details:",
      JSON.stringify(result.response.data, null, 2)
    );
  } catch (error) {
    handleSessionApiError(error, `fetching details for session ${sessionId}`);
  }
}
// To run standalone (ensure activeTestSessionId is set):
// if (activeTestSessionId) fetchSessionDetails(activeTestSessionId);
```

### 4. Update WhatsApp Session

Updates details for an existing session.

```typescript
async function updateExistingSession(sessionId: number) {
  console.log(`\n--- Updating Session ID: ${sessionId} ---`);
  const payload: UpdateWhatsAppSessionPayload = {
    name: `SDK Updated Name ${Date.now()}`,
    webhook_enabled: false,
    log_messages: true,
  };
  try {
    const result: UpdateWhatsAppSessionResult =
      await wasender.updateWhatsAppSession(sessionId, payload);
    console.log(
      "Session updated successfully:",
      JSON.stringify(result.response.data, null, 2)
    );
  } catch (error) {
    handleSessionApiError(error, `updating session ${sessionId}`);
  }
}
// To run standalone:
// if (activeTestSessionId) updateExistingSession(activeTestSessionId);
```

### 5. Connect WhatsApp Session (Get QR Code)

Initiates the connection process. If a QR code is needed for scanning, it will be returned.

```typescript
async function connectSession(sessionId: number) {
  console.log(`\n--- Connecting Session ID: ${sessionId} ---`);
  try {
    // Setting qr_as_image to true is often useful
    const result: ConnectSessionResult = await wasender.connectWhatsAppSession(
      sessionId,
      true
    );
    console.log(
      "Connect session response:",
      JSON.stringify(result.response.data, null, 2)
    );
    if (result.response.data.qrCode) {
      console.log(
        "QR Code received (first 50 chars):",
        result.response.data.qrCode.substring(0, 50) + "..."
      );
      console.log(
        "ACTION REQUIRED: Scan this QR code with your WhatsApp mobile app linked to the session's phone number."
      );
    } else if (result.response.data.status === "CONNECTED") {
      console.log(
        "Session is already connected or connection initiated without needing QR."
      );
    } else {
      console.log("Session connection status:", result.response.data.status);
    }
  } catch (error) {
    handleSessionApiError(error, `connecting session ${sessionId}`);
  }
}
// To run standalone:
// if (activeTestSessionId) connectSession(activeTestSessionId);
```

### 6. Get WhatsApp Session QR Code (Alternative)

Explicitly retrieves the QR code if the session is in a state requiring one (e.g., `NEED_SCAN`).

```typescript
async function fetchSessionQrCode(sessionId: number) {
  console.log(`\n--- Fetching QR Code for Session ID: ${sessionId} ---`);
  try {
    const result: GetQRCodeResult = await wasender.getWhatsAppSessionQRCode(
      sessionId
    );
    console.log("QR code data:", JSON.stringify(result.response.data, null, 2));
    console.log(
      "QR Code (first 50 chars):",
      result.response.data.qrCode.substring(0, 50) + "..."
    );
    console.log("ACTION REQUIRED: Scan if session status is NEED_SCAN.");
  } catch (error) {
    // This might fail if the session is not in a state that has a QR code (e.g., already connected)
    handleSessionApiError(error, `fetching QR code for session ${sessionId}`);
  }
}
// To run standalone:
// if (activeTestSessionId) fetchSessionQrCode(activeTestSessionId);
```

### 7. Get WhatsApp Session Status (General)

Retrieves the current status of the session linked to the API key used for SDK initialization (not for a specific session ID by parameter).

```typescript
async function checkSessionStatus() {
  console.log("\n--- Checking Current Session Status (for API Key) ---");
  try {
    const result: GetSessionStatusResult = await wasender.getSessionStatus();
    console.log("Current session status:", result.response.status);
    // Further explanation of statuses below.
  } catch (error) {
    handleSessionApiError(error, "checking general session status");
  }
}
// To run standalone: checkSessionStatus();
```

**Session Statuses Explained:**

- `CONNECTING`: The session is attempting to establish a connection with WhatsApp servers.
- `CONNECTED`: The session is successfully authenticated and actively connected to WhatsApp.
- `DISCONNECTED`: This is the first status before any connection attempt or after a deliberate disconnect.
- `NEED_SCAN`: The session needs to be scanned with a QR code.
- `LOGGED_OUT`: The user has logged out of the WhatsApp session (e.g., from another device).
- `EXPIRED`: The session is no longer valid, often due to extended inactivity.

### 8. Disconnect WhatsApp Session

Disconnects an active session by its ID.

```typescript
async function disconnectSpecificSession(sessionId: number) {
  console.log(`\n--- Disconnecting Session ID: ${sessionId} ---`);
  try {
    const result: DisconnectSessionResult =
      await wasender.disconnectWhatsAppSession(sessionId);
    console.log(
      "Disconnect session response:",
      JSON.stringify(result.response.data, null, 2)
    );
  } catch (error) {
    handleSessionApiError(error, `disconnecting session ${sessionId}`);
  }
}
// To run standalone (CAUTION: Disconnects the session):
// if (activeTestSessionId) disconnectSpecificSession(activeTestSessionId);
```

### 9. Regenerate API Key

Regenerates the API key for a specific session. **Use with extreme caution as this invalidates the previous API key for that session.**

```typescript
async function regenerateKeyForSession(sessionId: number) {
  console.log(`\n--- Regenerating API Key for Session ID: ${sessionId} ---`);
  console.warn(
    "CAUTION: Regenerating the API key will invalidate the current key for THIS SESSION if it's the one tied to your WASENDER_API_KEY env var for this script run!"
  );
  try {
    const result: RegenerateApiKeyResult = await wasender.regenerateApiKey(
      sessionId
    );
    console.log(
      "API Key regenerated successfully. New API Key for session ${sessionId}:",
      result.response.api_key
    );
    console.log(
      "IMPORTANT: If this session's API key was the one used to initialize the SDK, you would need to re-initialize with the new key for subsequent operations on THIS session through the SDK."
    );
  } catch (error) {
    handleSessionApiError(
      error,
      `regenerating API key for session ${sessionId}`
    );
  }
}
// To run standalone (EXTREME CAUTION):
// if (activeTestSessionId) regenerateKeyForSession(activeTestSessionId);
```

### 10. Delete WhatsApp Session

Deletes a specific session by its ID. **This action is irreversible.**

```typescript
async function deleteSpecificSession(sessionId: number) {
  console.log(`\n--- Deleting Session ID: ${sessionId} ---`);
  console.warn("CAUTION: Deleting a session is irreversible!");
  try {
    const result: DeleteWhatsAppSessionResult =
      await wasender.deleteWhatsAppSession(sessionId);
    console.log(
      "Session deleted successfully. Response data (should be null):",
      result.response.data
    );
    if (sessionId === activeTestSessionId) activeTestSessionId = null; // Clear if it was the one we created/used
  } catch (error) {
    handleSessionApiError(error, `deleting session ${sessionId}`);
  }
}
// To run standalone (EXTREME CAUTION):
// if (activeTestSessionId) deleteSpecificSession(activeTestSessionId);
```

## Running the Examples

1.  Ensure the setup code (like `session-examples-setup.ts` content) is at the top of your test file or imported.
2.  Correctly set the `WASENDER_API_KEY` environment variable.
3.  Replace placeholder values like phone numbers for session creation with actual, unique test data.
4.  You can call functions individually (e.g., `fetchAllSessions().then(() => createNewSession());`) or use/modify the `runAllSessionExamples()` orchestrator.
5.  Execute your TypeScript file (e.g., using `ts-node your-session-test-file.ts`).

Start with read-only operations like `fetchAllSessions` and `checkSessionStatus` before attempting creation, connection, and especially destructive operations like `regenerateApiKey` or `deleteSpecificSession`.
