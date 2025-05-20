import 'dotenv/config'; // Load .env file
import * as fs from 'node:fs/promises'; // For file system operations (e.g., saving QR code)
import * as path from 'node:path';   // For path manipulation

import {
  createWasender,
  Wasender,
  // RetryConfig, // Session management typically doesn't involve retries in the same way as messages
} from "../src/main.ts";
import { WasenderAPIError } from "../src/errors.ts";
import {
  CreateWhatsAppSessionPayload,
  UpdateWhatsAppSessionPayload,
  // Result types will be inferred or used directly in function returns
} from "../src/sessions.ts";

const OPERATION_DELAY = 2000; // 2 seconds delay between non-interactive operations
const QR_SCAN_PAUSE_DELAY = 15000; // 15 seconds to allow for QR scanning in a manual test
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// To store the ID of the session created during the test run
let activeTestSessionId: number | null = null;

async function runAllSessionExamplesOrchestrator() {
  const apiKey = process.env.WASENDER_API_KEY; // Session-specific key, might be undefined
  const personalAccessToken = process.env.WASENDER_PERSONAL_ACCESS_TOKEN; // Account-level PAT
  const testSessionPhoneNumber = process.env.WASENDER_TEST_SESSION_PHONE_NO; // e.g., +12345000001

  if (!personalAccessToken) {
    console.error("Error: WASENDER_PERSONAL_ACCESS_TOKEN environment variable is not set. This is required for session management.");
    process.exit(1);
  }
  // apiKey is not strictly required to run session management examples if only PAT is used.
  // However, if other operations were mixed in, it might be.
  // The SDK constructor now handles if apiKey is null/undefined when PAT is present.

  if (!testSessionPhoneNumber) {
    console.error("Error: WASENDER_TEST_SESSION_PHONE_NO environment variable is not set for creating a test session.");
    process.exit(1);
  }

  const wasender = createWasender(apiKey, personalAccessToken); // Pass apiKey (can be undefined) and PAT
  // console.log(`DEBUG: API Key loaded in sessions.ts: ${apiKey ? apiKey.substring(0, 5) + "..." : "NOT LOADED"}`); // Removed old debug log
  console.log("Wasender SDK Initialized for Session Management examples with Personal Access Token.");

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
      let errorRateLimitResetTime = "N/A";
      if (error.rateLimit && error.rateLimit.getResetTimestampAsDate) {
          errorRateLimitResetTime = error.rateLimit.getResetTimestampAsDate()?.toLocaleTimeString() || "N/A";
      }
      if (error.rateLimit) {
        console.error(
          `  Rate Limit at Error: Remaining = ${
            error.rateLimit.remaining
          }, Resets at = ${
            errorRateLimitResetTime
          }`
        );
      }
    } else {
      console.error(`An unexpected error occurred during ${operation}:`, error);
    }
  }

  // --- Session Operation Functions Start ---
  async function fetchAllSessions() {
    console.log("\n--- Fetching All WhatsApp Sessions ---");
    try {
      const result = await wasender.getAllWhatsAppSessions();
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
        // Optionally, use an existing session ID if no new one is created by subsequent tests
        // if (!activeTestSessionId) activeTestSessionId = result.response.data[0].id;
      }
      let rateLimitResetTime = "N/A";
      if (result.rateLimit && result.rateLimit.getResetTimestampAsDate) {
        rateLimitResetTime = result.rateLimit.getResetTimestampAsDate()?.toLocaleTimeString() || "N/A";
      }
      console.log(
        "Rate Limit Info: Remaining =",
        result.rateLimit?.remaining,
        "| Resets at =",
        rateLimitResetTime
      );
    } catch (error) {
      handleSessionApiError(error, "fetching all sessions");
    }
  }

  async function createNewSession() {
    console.log("\n--- Creating New WhatsApp Session ---");
    const uniqueName = `SDK Test Session ${Date.now()}`;
    const payload: CreateWhatsAppSessionPayload = {
      name: uniqueName,
      phone_number: testSessionPhoneNumber!, // Asserting non-null due to check at start
      account_protection: true,
      log_messages: true,
      // webhook_url: "https://my.service.com/webhook", // Optional
      // webhook_enabled: true, // Optional
      // webhook_events: ["messages.upsert", "session.status"], // Example events
    };
    try {
      const result = await wasender.createWhatsAppSession(payload);
      console.log(
        "Session created successfully:",
        JSON.stringify(result.response.data, null, 2)
      );
      activeTestSessionId = result.response.data.id; // Store for subsequent examples
      console.log(`Stored new session ID for tests: ${activeTestSessionId}`);
      let rateLimitResetTime = "N/A";
      if (result.rateLimit && result.rateLimit.getResetTimestampAsDate) {
        rateLimitResetTime = result.rateLimit.getResetTimestampAsDate()?.toLocaleTimeString() || "N/A";
      }
      console.log(
        "Rate Limit Info: Remaining =",
        result.rateLimit?.remaining,
        "| Resets at =",
        rateLimitResetTime
      );
    } catch (error) {
      handleSessionApiError(error, `creating new session (${uniqueName})`);
    }
  }

  async function fetchSessionDetails(sessionId: number) {
    console.log(`\n--- Fetching Details for Session ID: ${sessionId} ---`);
    try {
      const result = await wasender.getWhatsAppSessionDetails(sessionId);
      console.log(
        "Session details:",
        JSON.stringify(result.response.data, null, 2)
      );
      let rateLimitResetTime = "N/A";
      if (result.rateLimit && result.rateLimit.getResetTimestampAsDate) {
        rateLimitResetTime = result.rateLimit.getResetTimestampAsDate()?.toLocaleTimeString() || "N/A";
      }
      console.log(
        "Rate Limit Info: Remaining =",
        result.rateLimit?.remaining,
        "| Resets at =",
        rateLimitResetTime
      );
    } catch (error) {
      handleSessionApiError(error, `fetching details for session ${sessionId}`);
    }
  }

  async function updateExistingSession(sessionId: number) {
    console.log(`\n--- Updating Session ID: ${sessionId} ---`);
    const payload: UpdateWhatsAppSessionPayload = {
      name: `SDK Updated Name ${Date.now()}`,
      webhook_enabled: false, // Example update
      log_messages: false,   // Example update
    };
    try {
      const result = await wasender.updateWhatsAppSession(sessionId, payload);
      console.log(
        "Session updated successfully:",
        JSON.stringify(result.response.data, null, 2)
      );
      let rateLimitResetTime = "N/A";
      if (result.rateLimit && result.rateLimit.getResetTimestampAsDate) {
        rateLimitResetTime = result.rateLimit.getResetTimestampAsDate()?.toLocaleTimeString() || "N/A";
      }
      console.log(
        "Rate Limit Info: Remaining =",
        result.rateLimit?.remaining,
        "| Resets at =",
        rateLimitResetTime
      );
    } catch (error) {
      handleSessionApiError(error, `updating session ${sessionId}`);
    }
  }

  async function connectSession(sessionId: number) {
    console.log(`\n--- Connecting Session ID: ${sessionId} ---`);
    try {
      const result = await wasender.connectWhatsAppSession(sessionId, true); // Request QR as image
      console.log(
        "Connect session response:",
        JSON.stringify(result.response.data, null, 2)
      );
      if (result.response.data.qrCode) {
        console.log(
          "QR Code received. Scan this QR code with your WhatsApp mobile app linked to the session's phone number."
        );
        // Optionally save QR to a file for easier viewing
        const dataDir = path.join(process.cwd(), 'data');
        const filePath = path.join(dataDir, `session_${sessionId}_qr.txt`);
        const imageFilePath = path.join(dataDir, `session_${sessionId}_qr.png`);
        try {
          await fs.mkdir(dataDir, { recursive: true });
          await fs.writeFile(filePath, result.response.data.qrCode, 'utf8');
          console.log(`QR code text saved to ${filePath}`);
          // If qrCode is a base64 image string (e.g., data:image/png;base64,...)
          if (result.response.data.qrCode.startsWith('data:image/png;base64,')) {
            const base64Data = result.response.data.qrCode.replace(/^data:image\/png;base64,/, "");
            await fs.writeFile(imageFilePath, base64Data, 'base64');
            console.log(`QR code image saved to ${imageFilePath}`);
          }
        } catch (writeError) {
          console.error(`Error saving QR code:`, writeError);
        }
        console.log(`Pausing for ${QR_SCAN_PAUSE_DELAY / 1000} seconds to allow QR scan...`);
        await delay(QR_SCAN_PAUSE_DELAY);
      } else if (result.response.data.status === "CONNECTED") {
        console.log("Session is already connected or connection initiated without needing QR.");
      } else {
        console.log("Session connection status:", result.response.data.status);
      }
      let rateLimitResetTime = "N/A";
      if (result.rateLimit && result.rateLimit.getResetTimestampAsDate) {
        rateLimitResetTime = result.rateLimit.getResetTimestampAsDate()?.toLocaleTimeString() || "N/A";
      }
      console.log(
        "Rate Limit Info: Remaining =",
        result.rateLimit?.remaining,
        "| Resets at =",
        rateLimitResetTime
      );
    } catch (error) {
      handleSessionApiError(error, `connecting session ${sessionId}`);
    }
  }

  async function fetchSessionQrCode(sessionId: number) {
    console.log(`\n--- Fetching QR Code for Session ID: ${sessionId} (Alternative) ---`);
    try {
      const result = await wasender.getWhatsAppSessionQRCode(sessionId);
      console.log("QR code data:", JSON.stringify(result.response.data, null, 2));
      console.log("ACTION REQUIRED: Scan if session status is NEED_SCAN.");
      // You could add saving logic here too if needed, similar to connectSession
      let rateLimitResetTime = "N/A";
      if (result.rateLimit && result.rateLimit.getResetTimestampAsDate) {
        rateLimitResetTime = result.rateLimit.getResetTimestampAsDate()?.toLocaleTimeString() || "N/A";
      }
      console.log(
        "Rate Limit Info: Remaining =",
        result.rateLimit?.remaining,
        "| Resets at =",
        rateLimitResetTime
      );
    } catch (error) {
      handleSessionApiError(error, `fetching QR code for session ${sessionId}`);
    }
  }

  async function checkSessionStatus() {
    console.log("\n--- Checking Current Session Status (for API Key) ---");
    try {
      const result = await wasender.getSessionStatus();
      console.log("Current session status for API Key:", result.response.status);
      let rateLimitResetTime = "N/A";
      if (result.rateLimit && result.rateLimit.getResetTimestampAsDate) {
        rateLimitResetTime = result.rateLimit.getResetTimestampAsDate()?.toLocaleTimeString() || "N/A";
      }
      console.log(
        "Rate Limit Info: Remaining =",
        result.rateLimit?.remaining,
        "| Resets at =",
        rateLimitResetTime
      );
    } catch (error) {
      handleSessionApiError(error, "checking general session status");
    }
  }

  async function disconnectSpecificSession(sessionId: number) {
    console.log(`\n--- Disconnecting Session ID: ${sessionId} ---`);
    try {
      const result = await wasender.disconnectWhatsAppSession(sessionId);
      console.log(
        "Disconnect session response:",
        JSON.stringify(result.response.data, null, 2)
      );
      let rateLimitResetTime = "N/A";
      if (result.rateLimit && result.rateLimit.getResetTimestampAsDate) {
        rateLimitResetTime = result.rateLimit.getResetTimestampAsDate()?.toLocaleTimeString() || "N/A";
      }
      console.log(
        "Rate Limit Info: Remaining =",
        result.rateLimit?.remaining,
        "| Resets at =",
        rateLimitResetTime
      );
    } catch (error) {
      handleSessionApiError(error, `disconnecting session ${sessionId}`);
    }
  }

  async function regenerateKeyForSession(sessionId: number) {
    console.log(`\n--- Regenerating API Key for Session ID: ${sessionId} ---`);
    console.warn(
      "CAUTION: This is a highly destructive operation! It will invalidate the API key for THIS SESSION."
    );
    try {
      const result = await wasender.regenerateApiKey(sessionId);
      console.log(
        `API Key regenerated successfully. New API Key for session ${sessionId}:`,
        result.response.api_key
      );
      console.log(
        "IMPORTANT: If this session's API key was the one used to initialize the SDK, you would need to re-initialize with the new key for subsequent operations on THIS session through the SDK."
      );
      let rateLimitResetTime = "N/A";
      if (result.rateLimit && result.rateLimit.getResetTimestampAsDate) {
        rateLimitResetTime = result.rateLimit.getResetTimestampAsDate()?.toLocaleTimeString() || "N/A";
      }
      console.log(
        "Rate Limit Info: Remaining =",
        result.rateLimit?.remaining,
        "| Resets at =",
        rateLimitResetTime
      );
    } catch (error) {
      handleSessionApiError(error, `regenerating API key for session ${sessionId}`);
    }
  }

  async function deleteSpecificSession(sessionId: number) {
    console.log(`\n--- Deleting Session ID: ${sessionId} ---`);
    console.warn("CAUTION: Deleting a session is irreversible!");
    try {
      const result = await wasender.deleteWhatsAppSession(sessionId);
      console.log(
        "Session deleted successfully. Response data (should be null):",
        result.response.data // data should be null on success
      );
      if (sessionId === activeTestSessionId) activeTestSessionId = null;
      let rateLimitResetTime = "N/A";
      if (result.rateLimit && result.rateLimit.getResetTimestampAsDate) {
        rateLimitResetTime = result.rateLimit.getResetTimestampAsDate()?.toLocaleTimeString() || "N/A";
      }
      console.log(
        "Rate Limit Info: Remaining =",
        result.rateLimit?.remaining,
        "| Resets at =",
        rateLimitResetTime
      );
    } catch (error) {
      handleSessionApiError(error, `deleting session ${sessionId}`);
    }
  }
  // --- Session Operation Functions End ---

  console.log("\nStarting session management examples...");

  // --- Orchestrated calls ---
  await fetchAllSessions();
  await delay(OPERATION_DELAY);

  // await createNewSession();
  // await delay(OPERATION_DELAY);

  if (activeTestSessionId) {
    await fetchSessionDetails(activeTestSessionId);
    await delay(OPERATION_DELAY);

    // await updateExistingSession(activeTestSessionId);
    // await delay(OPERATION_DELAY);

    // await connectSession(activeTestSessionId); // This function includes a pause for QR scan
    // No extra delay needed immediately after connectSession due to its internal pause

    // Check status after attempting connection and potential scan
    // await checkSessionStatus(); 
    // await delay(OPERATION_DELAY);

    // Fetch QR again - might be useful if NEED_SCAN persisted or for verification
    // await fetchSessionQrCode(activeTestSessionId); 
    // await delay(OPERATION_DELAY);

    // await disconnectSpecificSession(activeTestSessionId);
    // await delay(OPERATION_DELAY);

    // Destructive operations - uncomment with extreme caution
    // console.log("\nSKIPPING DESTRUCTIVE session operations by default. Uncomment in script to run.");
    // await regenerateKeyForSession(activeTestSessionId);
    // await delay(OPERATION_DELAY);
    
    // Ensure you want to delete the session created by this script run
    // await deleteSpecificSession(activeTestSessionId); 
    // await delay(OPERATION_DELAY);

  } else {
    console.log("\nSkipping some session examples as no activeTestSessionId was set (e.g., creation failed).");
  }

  console.log("\nAll session examples (selected) Completed.");
}

runAllSessionExamplesOrchestrator();

// Individual function exports can be added if needed for direct testing
// export { fetchAllSessions, createNewSession, ... };
