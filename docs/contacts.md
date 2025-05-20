# Wasender SDK: Contact Management Examples

This document provides examples for managing contacts using the Wasender TypeScript SDK, including retrieving contacts, getting specific contact details, fetching profile pictures, and blocking/unblocking contacts.

## SDK Version: 0.1.0

## Prerequisites

1.  **Install Node.js and npm/yarn.**
2.  **Obtain a Wasender API Key:** You'll need an API key from [https://www.wasenderapi.com](https://www.wasenderapi.com).
3.  **SDK Installation:** Ensure the Wasender SDK is correctly installed and accessible in your project.

## Initializing the SDK

All examples assume you have initialized the SDK as follows. You can place this in a central part of your application or at the beginning of your script.

```typescript
// contact-examples-setup.ts
import { createWasender, Wasender } from "wasenderapi";
import { WasenderAPIError } from "wasenderapi/errors"; 
// Import contact-specific result types if you need to strongly type the results
import {
  GetAllContactsResult,
  GetContactInfoResult,
  GetContactProfilePictureResult,
  ContactActionResult,
} from "wasenderapi/contacts"; // Adjust path

const apiKey = process.env.WASENDER_API_KEY;

if (!apiKey) {
  console.error("Error: WASENDER_API_KEY environment variable is not set.");
  process.exit(1);
}

const wasenderapi = createWasender(apiKey);
console.log("Wasender SDK Initialized for Contact Management examples.");

// Placeholder for a contact\'s phone number - replace with a valid E.164 number
const targetContactJid = "12345678901"; // Example: international format without '+'

// Generic error handler for examples
function handleApiError(error: unknown, operation: string) {
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
```

**Note:** Replace `"wasenderapi"`, `"wasenderapi/errors"`, and `"wasenderapi/contacts"` with the actual paths to your SDK files. Ensure the `WASENDER_API_KEY` environment variable is set.

## Contact Management Operations

### 1. Get All Contacts

Retrieves a list of all contacts synced with the WhatsApp session.

```typescript
// examples/get-all-contacts.ts
// (Assume contact-examples-setup.ts is imported or its content is available)

async function fetchAllContacts() {
  console.log("\n--- Fetching All Contacts ---");
  try {
    const result: GetAllContactsResult = await wasenderapi.getContacts();
    console.log(
      "Contacts retrieved successfully:",
      result.response.data.length,
      "contacts found."
    );
    if (result.response.data.length > 0) {
      console.log(
        "First contact (example):",
        JSON.stringify(result.response.data[0], null, 2)
      );
    }
    console.log(
      "Rate Limit Info: Remaining =",
      result.rateLimit.remaining,
      "| Resets at =",
      result.rateLimit.getResetTimestampAsDate()?.toLocaleTimeString() || "N/A"
    );
  } catch (error) {
    handleApiError(error, "fetching all contacts");
  }
}

fetchAllContacts();
```

### 2. Get Specific Contact Information

Retrieves detailed information for a specific contact using their JID (Phone Number).

```typescript
// examples/get-contact-info.ts
// (Assume contact-examples-setup.ts is imported or its content is available)

async function fetchContactInfo(contactJid: string) {
  console.log(`\n--- Fetching Info for Contact: ${contactJid} ---`);
  if (!contactJid) {
    console.error("Error: No target contact JID provided for fetching info.");
    return;
  }
  try {
    const result: GetContactInfoResult = await wasenderapi.getContactInfo(
      contactJid
    );
    console.log(
      "Contact info retrieved:",
      JSON.stringify(result.response.data, null, 2)
    );
    console.log(
      "Rate Limit Info: Remaining =",
      result.rateLimit.remaining,
      "| Resets at =",
      result.rateLimit.getResetTimestampAsDate()?.toLocaleTimeString() || "N/A"
    );
  } catch (error) {
    handleApiError(error, `fetching info for contact ${contactJid}`);
  }
}

fetchContactInfo(targetContactJid);
// fetchContactInfo("another_number_jid"); // Example for another contact
```

### 3. Get Contact Profile Picture URL

Retrieves the URL of the profile picture for a specific contact.

```typescript
// examples/get-contact-picture.ts
// (Assume contact-examples-setup.ts is imported or its content is available)

async function fetchContactProfilePicture(contactJid: string) {
  console.log(
    `\n--- Fetching Profile Picture URL for Contact: ${contactJid} ---`
  );
  if (!contactJid) {
    console.error(
      "Error: No target contact JID provided for fetching profile picture."
    );
    return;
  }
  try {
    const result: GetContactProfilePictureResult =
      await wasenderapi.getContactProfilePicture(contactJid);
    if (result.response.data.imgUrl) {
      console.log("Profile picture URL:", result.response.data.imgUrl);
    } else {
      console.log(
        "Contact does not have a profile picture or it is not accessible."
      );
    }
    console.log(
      "Rate Limit Info: Remaining =",
      result.rateLimit.remaining,
      "| Resets at =",
      result.rateLimit.getResetTimestampAsDate()?.toLocaleTimeString() || "N/A"
    );
  } catch (error) {
    handleApiError(error, `fetching profile picture for contact ${contactJid}`);
  }
}

fetchContactProfilePicture(targetContactJid);
```

### 4. Block a Contact

Blocks a specific contact.

```typescript
// examples/block-contact.ts
// (Assume contact-examples-setup.ts is imported or its content is available)

async function blockSpecificContact(contactJid: string) {
  console.log(`\n--- Blocking Contact: ${contactJid} ---`);
  if (!contactJid) {
    console.error("Error: No target contact JID provided for blocking.");
    return;
  }
  try {
    const result: ContactActionResult = await wasenderapi.blockContact(contactJid);
    console.log("Block operation successful:", result.response.data.message);
    console.log(
      "Rate Limit Info: Remaining =",
      result.rateLimit.remaining,
      "| Resets at =",
      result.rateLimit.getResetTimestampAsDate()?.toLocaleTimeString() || "N/A"
    );
  } catch (error) {
    handleApiError(error, `blocking contact ${contactJid}`);
  }
}

// blockSpecificContact(targetContactJid); // Uncomment to run - CAUTION: This will block the contact.
```

### 5. Unblock a Contact

Unblocks a specific contact.

```typescript
// examples/unblock-contact.ts
// (Assume contact-examples-setup.ts is imported or its content is available)

async function unblockSpecificContact(contactJid: string) {
  console.log(`\n--- Unblocking Contact: ${contactJid} ---`);
  if (!contactJid) {
    console.error("Error: No target contact JID provided for unblocking.");
    return;
  }
  try {
    const result: ContactActionResult = await wasenderapi.unblockContact(
      contactJid
    );
    console.log("Unblock operation successful:", result.response.data.message);
    console.log(
      "Rate Limit Info: Remaining =",
      result.rateLimit.remaining,
      "| Resets at =",
      result.rateLimit.getResetTimestampAsDate()?.toLocaleTimeString() || "N/A"
    );
  } catch (error) {
    handleApiError(error, `unblocking contact ${contactJid}`);
  }
}

// unblockSpecificContact(targetContactJid); // Uncomment to run
```

## Important Notes on Contact JIDs

- The API documentation often refers to `contactPhoneNumber` as the JID (Jabber ID) in E.164 format. However, for some WhatsApp internal JIDs (like groups or channels), the format might differ (e.g., `number@g.us` or `number@newsletter`).
- For individual contacts, ensure you are using the phone number part of their JID, typically without the `+` sign or `@s.whatsapp.net` suffix, as per the API\'s expectation for `contactPhoneNumber` path parameters (e.g., `12345678901`). Always refer to the specific API documentation for the exact format required by each endpoint if issues arise.

This guide provides a solid foundation for using the contact management features of the Wasender SDK. Remember to replace placeholder JIDs and handle API keys securely.
