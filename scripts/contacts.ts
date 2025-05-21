import 'dotenv/config'; // Load .env file
import * as fs from 'node:fs/promises'; // For file system operations
import * as path from 'node:path'; // For path manipulation
import {
  createWasender,
  Wasender,
  // RetryConfig, // May not be needed as much for contact mgmt, but can add if desired
} from "../src/main.ts";
import { WasenderAPIError } from "../src/errors.ts";
// Import contact-specific result types if you need to strongly type the results
// For this script, we will infer or use them directly in function returns.
// import {
//   GetAllContactsResult,
//   GetContactInfoResult,
//   GetContactProfilePictureResult,
//   ContactActionResult,
// } from "../src/contacts.ts";

const OPERATION_DELAY = 2000; // 2 seconds delay between operations (can be adjusted)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runAllContactExamples() {
  const apiKey = process.env.WASENDER_API_KEY;
  const testContactId = process.env.WASENDER_TEST_CONTACT_ID; // e.g., 12345678901 (without + or @c.us for path params)

  if (!apiKey) {
    console.error("Error: WASENDER_API_KEY environment variable is not set.");
    process.exit(1);
  }

  if (!testContactId) {
    console.error("Error: WASENDER_TEST_CONTACT_ID environment variable is not set (e.g., 12345678901).");
    process.exit(1);
  }

  // For contact operations, personalAccessToken is not typically needed, so pass undefined.
  // apiKey (session-specific) is required for contact operations.
  const wasender = createWasender(apiKey, undefined);
  console.log("Wasender SDK Initialized for Contact Management examples.");

  // Generic error handler for examples
  function handleContactApiError(error: unknown, operation: string) {
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

  // --- Contact Operation Examples Start ---
  async function fetchAllContacts() {
    console.log("\n--- Fetching All Contacts ---");
    try {
      const result = await wasender.getContacts();
      const contacts = result.response.data;
      console.log(
        "Contacts retrieved successfully:",
        contacts.length,
        "contacts found."
      );

      if (contacts.length > 0) {
        console.log(
          "First contact (example):",
          JSON.stringify(contacts[0], null, 2)
        );

        // Save contacts to a file
        const dataDir = path.join(process.cwd(), 'data'); // data directory in project root
        const filePath = path.join(dataDir, 'all_contacts.json');

        try {
          await fs.mkdir(dataDir, { recursive: true }); // Ensure directory exists
          await fs.writeFile(filePath, JSON.stringify(contacts, null, 2), 'utf8');
          console.log(`\nSuccessfully saved ${contacts.length} contacts to ${filePath}`);
        } catch (writeError) {
          console.error(`\nError saving contacts to file ${filePath}:`, writeError);
        }
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
      handleContactApiError(error, "fetching all contacts");
    }
  }

  async function fetchContactInfo(contactId: string) {
    console.log(`\n--- Fetching Info for Contact: ${contactId} ---`);
    if (!contactId) {
      console.error("Error: No target contact ID provided for fetching info.");
      return;
    }
    try {
      const result = await wasender.getContactInfo(contactId);
      console.log(
        "Contact info retrieved:",
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
      handleContactApiError(error, `fetching info for contact ${contactId}`);
    }
  }

  async function fetchContactProfilePicture(contactId: string) {
    console.log(
      `\n--- Fetching Profile Picture URL for Contact: ${contactId} ---`
    );
    if (!contactId) {
      console.error(
        "Error: No target contact ID provided for fetching profile picture."
      );
      return;
    }
    try {
      const result = await wasender.getContactProfilePicture(contactId);
      if (result.response.data.imgUrl) {
        console.log("Profile picture URL:", result.response.data.imgUrl);
      } else {
        console.log(
          "Contact does not have a profile picture or it is not accessible."
        );
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
      handleContactApiError(error, `fetching profile picture for contact ${contactId}`);
    }
  }

  async function blockSpecificContact(contactId: string) {
    console.log(`\n--- Blocking Contact: ${contactId} ---`);
    console.warn("CAUTION: This is a contact modifying operation.");
    if (!contactId) {
      console.error("Error: No target contact ID provided for blocking.");
      return;
    }
    try {
      const result = await wasender.blockContact(contactId);
      console.log("Block operation successful:", result.response.data.message);
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
      handleContactApiError(error, `blocking contact ${contactId}`);
    }
  }

  async function unblockSpecificContact(contactId: string) {
    console.log(`\n--- Unblocking Contact: ${contactId} ---`);
    console.warn("CAUTION: This is a contact modifying operation.");
    if (!contactId) {
      console.error("Error: No target contact ID provided for unblocking.");
      return;
    }
    try {
      const result = await wasender.unblockContact(contactId);
      console.log("Unblock operation successful:", result.response.data.message);
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
      handleContactApiError(error, `unblocking contact ${contactId}`);
    }
  }
  // --- Contact Operation Examples End ---

  console.log("\nStarting contact operation examples...");

  await fetchAllContacts();
  await delay(OPERATION_DELAY);

  await fetchContactInfo(testContactId);
  await delay(OPERATION_DELAY);

  await fetchContactProfilePicture(testContactId);
  await delay(OPERATION_DELAY);

  // CAUTION: Modifying operations. Uncomment to test. Ensure ID is correct.
  console.log("\nSKIPPING modifying contact operations (block/unblock) by default. Uncomment in script to run.");
  // await blockSpecificContact(testContactId);
  // await delay(OPERATION_DELAY);
  // await unblockSpecificContact(testContactId); // Make sure to unblock if you block for testing
  // await delay(OPERATION_DELAY);

  console.log("\nAll contact examples processed.");
}

runAllContactExamples(); // Call the main function to execute examples

// Exporting for potential future use if needed
// export { runAllContactExamples };
