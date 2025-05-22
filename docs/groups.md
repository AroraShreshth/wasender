# Wasender SDK: Group Management Examples

This document provides examples for managing WhatsApp groups using the Wasender TypeScript SDK. It covers retrieving group lists, fetching metadata and participant details, modifying participants, updating group settings, and sending messages to groups.

## SDK Version: 0.1.5

## Prerequisites

1.  **Install Node.js and npm/yarn.**
2.  **Obtain a Wasender API Key:** From [https://www.wasenderapi.com](https://www.wasenderapi.com).
3.  **SDK Installation:** Ensure the Wasender SDK is correctly installed in your project.

## Initializing the SDK

All examples assume SDK initialization as shown below. Adjust paths to your SDK files.

```typescript
// group-examples-setup.ts
import {
  createWasender,
  Wasender,
  WasenderMessagePayload, // For sending messages
} from "path-to-your-sdk/main";
import { WasenderAPIError } from "path-to-your-sdk/errors";
import {
  TextOnlyMessage, // Example message type
} from "path-to-your-sdk/messages";
import {
  GetAllGroupsResult,
  GetGroupMetadataResult,
  GetGroupParticipantsResult,
  ModifyGroupParticipantsResult,
  UpdateGroupSettingsResult,
  UpdateGroupSettingsPayload,
} from "path-to-your-sdk/groups";

const apiKey = process.env.WASENDER_API_KEY;

if (!apiKey) {
  console.error("Error: WASENDER_API_KEY environment variable is not set.");
  process.exit(1);
}

const wasender = createWasender(apiKey);
console.log("Wasender SDK Initialized for Group Management examples.");

// Placeholders - replace with actual IDs for testing
const exampleGroupId = "1234567890-1234567890@g.us"; // Replace with a valid group ID
const participantIdsToAdd = ["19876543210", "19876543211"]; // E.164 format numbers
const participantIdsToRemove = ["19876543210"];

// Generic error handler
function handleGroupApiError(error: unknown, operation: string) {
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

**Note:** Replace path placeholders with the actual paths to your SDK files. Set the `WASENDER_API_KEY` environment variable.

## Group Management Operations

### 1. Get All Groups

Retrieves a list of all WhatsApp groups the connected account is part of.

```typescript
// examples/get-all-groups.ts
async function fetchAllGroups() {
  console.log("\n--- Fetching All Groups ---");
  try {
    const result: GetAllGroupsResult = await wasender.getGroups();
    console.log(
      "Groups retrieved:",
      result.response.data.length,
      "groups found."
    );
    if (result.response.data.length > 0) {
      console.log(
        "First group (example):",
        JSON.stringify(result.response.data[0], null, 2)
      );
    }
    // Log rate limit info as needed
  } catch (error) {
    handleGroupApiError(error, "fetching all groups");
  }
}
fetchAllGroups();
```

### 2. Send Message to a Group

Use the standard `wasender.send()` method. The `to` field in the message payload should be the Group ID.

```typescript
// examples/send-group-message.ts
async function sendSampleGroupMessage(groupId: string) {
  console.log(`\n--- Sending Message to Group: ${groupId} ---`);
  if (!groupId) return console.error("Group ID is required.");

  const textPayload: TextOnlyMessage = {
    to: groupId,
    messageType: "text",
    text: "Hello everyone in this group from the Wasender SDK!",
  };

  try {
    const result = await wasender.send(textPayload);
    console.log("Group message sent successfully:", result.response.message);
    // Log rate limit info
  } catch (error) {
    handleGroupApiError(error, `sending message to group ${groupId}`);
  }
}
sendSampleGroupMessage(exampleGroupId);
```

### 3. Get Group Metadata

Retrieves detailed metadata for a specific group.

```typescript
// examples/get-group-metadata.ts
async function fetchGroupMetadata(groupId: string) {
  console.log(`\n--- Fetching Metadata for Group: ${groupId} ---`);
  if (!groupId) return console.error("Group ID is required.");

  try {
    const result: GetGroupMetadataResult = await wasender.getGroupMetadata(
      groupId
    );
    console.log(
      "Group metadata:",
      JSON.stringify(result.response.data, null, 2)
    );
    // Log rate limit info
  } catch (error) {
    handleGroupApiError(error, `fetching metadata for group ${groupId}`);
  }
}
fetchGroupMetadata(exampleGroupId);
```

### 4. Get Group Participants

Retrieves a list of participants for a specific group.

```typescript
// examples/get-group-participants.ts
async function fetchGroupParticipants(groupId: string) {
  console.log(`\n--- Fetching Participants for Group: ${groupId} ---`);
  if (!groupId) return console.error("Group ID is required.");

  try {
    const result: GetGroupParticipantsResult =
      await wasender.getGroupParticipants(groupId);
    console.log(
      "Group participants retrieved:",
      result.response.data.length,
      "participants."
    );
    if (result.response.data.length > 0) {
      console.log(
        "First participant (example):",
        JSON.stringify(result.response.data[0], null, 2)
      );
    }
    // Log rate limit info
  } catch (error) {
    handleGroupApiError(error, `fetching participants for group ${groupId}`);
  }
}
fetchGroupParticipants(exampleGroupId);
```

### 5. Add Group Participants

Adds participants to a group. Requires admin privileges.

```typescript
// examples/add-group-participants.ts
async function addParticipantsToGroup(
  groupId: string,
  participantsToAdd: string[]
) {
  console.log(`\n--- Adding Participants to Group: ${groupId} ---`);
  if (!groupId || !participantsToAdd || participantsToAdd.length === 0) {
    return console.error("Group ID and participants list are required.");
  }
  try {
    const result: ModifyGroupParticipantsResult =
      await wasender.addGroupParticipants(groupId, participantsToAdd);
    console.log(
      "Add participants result:",
      JSON.stringify(result.response.data, null, 2)
    );
    // Log rate limit info
  } catch (error) {
    handleGroupApiError(error, `adding participants to group ${groupId}`);
  }
}
// addParticipantsToGroup(exampleGroupId, participantIdsToAdd); // Uncomment to test - CAUTION: Modifies group
```

### 6. Remove Group Participants

Removes participants from a group. Requires admin privileges.

```typescript
// examples/remove-group-participants.ts
async function removeParticipantsFromGroup(
  groupId: string,
  participantsToRemove: string[]
) {
  console.log(`\n--- Removing Participants from Group: ${groupId} ---`);
  if (!groupId || !participantsToRemove || participantsToRemove.length === 0) {
    return console.error("Group ID and participants list are required.");
  }
  try {
    const result: ModifyGroupParticipantsResult =
      await wasender.removeGroupParticipants(groupId, participantsToRemove);
    console.log(
      "Remove participants result:",
      JSON.stringify(result.response.data, null, 2)
    );
    // Log rate limit info
  } catch (error) {
    handleGroupApiError(error, `removing participants from group ${groupId}`);
  }
}
// removeParticipantsFromGroup(exampleGroupId, participantIdsToRemove); // Uncomment to test - CAUTION: Modifies group
```

### 7. Update Group Settings

Updates group settings like subject, description, announce mode, etc. Requires admin privileges.

```typescript
// examples/update-group-settings.ts
async function updateSampleGroupSettings(groupId: string) {
  console.log(`\n--- Updating Settings for Group: ${groupId} ---`);
  if (!groupId) return console.error("Group ID is required.");

  const settingsToUpdate: UpdateGroupSettingsPayload = {
    subject: "New Awesome Group Name via SDK",
    description: "This group is now managed by the Wasender SDK!",
    announce: false, // Allow all participants to send messages
    restrict: false, // Allow all participants to edit group info
  };

  try {
    const result: UpdateGroupSettingsResult =
      await wasender.updateGroupSettings(groupId, settingsToUpdate);
    console.log(
      "Update group settings result:",
      JSON.stringify(result.response.data, null, 2)
    );
    // Log rate limit info
  } catch (error) {
    handleGroupApiError(error, `updating settings for group ${groupId}`);
  }
}
// updateSampleGroupSettings(exampleGroupId); // Uncomment to test - CAUTION: Modifies group settings
```

## Important Notes

- **Group IDs:** Ensure you use the correct Group ID format (e.g., `1234567890-1234567890@g.us`).
- **Admin Privileges:** Operations like adding/removing participants or updating settings require the connected WhatsApp account to have admin privileges in the target group.
- **Participant IDs:** When adding or removing participants, provide their IDs in E.164 phone number format (e.g., `12345678901`).

This guide covers the group management functionalities of the Wasender SDK. Always test modifying operations carefully.
