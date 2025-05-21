import 'dotenv/config'; // Load .env file
import {
  createWasender,
  Wasender,
  // WasenderMessagePayload, // Moved to messages.ts import
  RetryConfig, // Added for consistency if we need a retry instance
} from "../src/main.ts";
import { WasenderAPIError } from "../src/errors.ts";
import {
  TextOnlyMessage,
  ImageUrlMessage,
  VideoUrlMessage,
  DocumentUrlMessage,
  AudioUrlMessage,
  StickerUrlMessage,
  ContactCardMessage,
  LocationPinMessage,
  WasenderMessagePayload, // Correctly imported from messages.ts
} from "../src/messages.ts";
import {
  // GetAllGroupsResult, // Will be used directly in function returns
  // GetGroupMetadataResult,
  // GetGroupParticipantsResult,
  // ModifyGroupParticipantsResult,
  // UpdateGroupSettingsResult,
  UpdateGroupSettingsPayload, // Specific payload type
} from "../src/groups.ts";

const MESSAGE_SEND_DELAY = 5000; // 5 seconds delay between operations
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runAllGroupExamples() {
  const apiKey = process.env.WASENDER_API_KEY;
  const testGroupId = process.env.WASENDER_TEST_GROUP_ID;

  if (!apiKey) {
    console.error("Error: WASENDER_API_KEY environment variable is not set.");
    process.exit(1);
  }

  if (!testGroupId) {
    console.error("Error: WASENDER_TEST_GROUP_ID environment variable is not set.");
    process.exit(1);
  }

  // For group operations, personalAccessToken is not typically needed, so pass undefined.
  // apiKey (session-specific) is required for group operations.
  const wasender = createWasender(apiKey, undefined);
  
  // For operations that might benefit from retries (like sending messages to groups)
  const retryOptions: RetryConfig = { enabled: true, maxRetries: 2 };
  const wasenderWithRetries = createWasender(
    apiKey, 
    undefined, // personalAccessToken
    undefined, // baseUrl
    undefined, // fetchImplementation
    retryOptions // retryOptions
  );

  console.log("Wasender SDK Initialized for Group Management examples.");

  // Placeholders for participant modification examples - replace if needed or use env vars
  const participantJidsToAdd = [process.env.WASENDER_TEST_ADD_PHONE_NO_1 || "19876543210@c.us", process.env.WASENDER_TEST_ADD_PHONE_NO_2 || "19876543211@c.us"]; // E.164 format numbers typically suffixed with @c.us for user JIDs
  const participantJidsToRemove = [process.env.WASENDER_TEST_REMOVE_PHONE_NO || "19876543210@c.us"];

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

  // --- Group Operation Examples Start ---

  async function fetchAllGroups() {
    console.log("\n--- Fetching All Groups ---");
    try {
      const result = await wasender.getGroups();
      const groups = result.response.data;
      console.log(
        "Groups retrieved:",
        groups.length,
        "groups found."
      );

      if (groups.length > 0) {
        console.log("\n--- All Group Data ---");
        groups.forEach((group, index) => {
          console.log(`\nGroup ${index + 1}:`);
          console.log(JSON.stringify(group, null, 2));
        });
        console.log("\n--- End of All Group Data ---");

        // You might want to find your specific testGroupId here to verify it exists
        const testGroupExists = groups.some(group => group.id === testGroupId);
        console.log(`\nTest group ${testGroupId} found in list: ${testGroupExists}`);
      }

      let rateLimitResetTime = "N/A";
      if (result.rateLimit && result.rateLimit.getResetTimestampAsDate) {
        rateLimitResetTime = result.rateLimit.getResetTimestampAsDate()?.toLocaleTimeString() || "N/A";
      }
      console.log(
        "\nRate Limit Info: Remaining =",
        result.rateLimit?.remaining,
        "| Resets at =",
        rateLimitResetTime
      );
    } catch (error) {
      handleGroupApiError(error, "fetching all groups");
    }
  }

  // Generic message sender to group
  async function sendMessageToGroup(
    description: string,
    groupId: string,
    payload: WasenderMessagePayload,
    instance?: Wasender // Optional instance, defaults to wasenderWithRetries for messages
  ) {
    console.log(`\n--- ${description} to Group: ${groupId} ---`);
    if (!groupId) return console.error("Group ID is required for sending messages.");
    
    const senderInstance = instance || wasenderWithRetries;
    try {
      // Ensure the payload's 'to' field is set to the groupId
      const messagePayload = { ...payload, to: groupId };
      const result = await senderInstance.send(messagePayload);
      console.log("Message Sent Successfully to group:", result.response.message);
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
      handleGroupApiError(error, `${description} to group ${groupId}`);
    }
  }

  // Functions to send specific message types to the group
  async function sendTextToGroup(groupId: string) {
    const textPayload: Omit<TextOnlyMessage, 'to'> = { // 'to' will be set by sendMessageToGroup
      messageType: "text",
      text: "Hello group from Wasender SDK (groups.ts script)!",
    };
    await sendMessageToGroup("Sending Text Message", groupId, textPayload as WasenderMessagePayload);
  }

  async function sendImageToGroup(groupId: string) {
    const imagePayload: Omit<ImageUrlMessage, 'to'> = {
      messageType: "image",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/%D0%92%D0%B5%D0%B4%D0%BC%D1%96%D0%B4%D1%8C_%D1%83_%D0%BB%D1%96%D1%81%D1%96.jpg/1599px-%D0%92%D0%B5%D0%B4%D0%BC%D1%96%D0%B4%D1%8C_%D1%83_%D0%BB%D1%96%D1%81%D1%96.jpg?20190515112011",
      text: "Cool image for the group!",
    };
    await sendMessageToGroup("Sending Image Message", groupId, imagePayload as WasenderMessagePayload);
  }
  
  async function sendVideoToGroup(groupId: string) {
    const videoPayload: Omit<VideoUrlMessage, 'to'> = {
        messageType: "video",
        videoUrl: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
        text: "Group video!",
    };
    await sendMessageToGroup("Sending Video Message", groupId, videoPayload as WasenderMessagePayload);
  }

  async function sendDocumentToGroup(groupId: string) {
    const documentPayload: Omit<DocumentUrlMessage, 'to'> = {
        messageType: "document",
        documentUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        text: "Important group document.",
    };
    await sendMessageToGroup("Sending Document Message", groupId, documentPayload as WasenderMessagePayload);
  }

  async function sendAudioToGroup(groupId: string) {
    const audioPayload: Omit<AudioUrlMessage, 'to'> = {
        messageType: "audio",
        audioUrl: "https://file-examples.com/storage/fe15fd9e66682b77ba42822/2017/11/file_example_MP3_700KB.mp3",
    };
    await sendMessageToGroup("Sending Audio Message", groupId, audioPayload as WasenderMessagePayload);
  }

  async function sendStickerToGroup(groupId: string) {
    const stickerPayload: Omit<StickerUrlMessage, 'to'> = {
        messageType: "sticker",
        stickerUrl: "https://www.gstatic.com/webp/gallery/1.sm.webp",
    };
    await sendMessageToGroup("Sending Sticker Message", groupId, stickerPayload as WasenderMessagePayload);
  }

  async function sendContactToGroup(groupId: string) {
    const contactPayload: Omit<ContactCardMessage, 'to'> = {
        messageType: "contact",
        contact: { name: "Shared Contact", phone: "+12345098765" },
        text: "Group contact share.",
    };
    await sendMessageToGroup("Sending Contact Message", groupId, contactPayload as WasenderMessagePayload);
  }

  async function sendLocationToGroup(groupId: string) {
    const locationPayload: Omit<LocationPinMessage, 'to'> = {
        messageType: "location",
        location: { latitude: 40.7128, longitude: -74.0060, name: "NYC for Group" }, // New York City
        text: "Group meetup location!",
    };
    await sendMessageToGroup("Sending Location Message", groupId, locationPayload as WasenderMessagePayload);
  }


  async function fetchGroupMetadata(groupId: string) {
    console.log(`\n--- Fetching Metadata for Group: ${groupId} ---`);
    if (!groupId) return console.error("Group ID is required.");

    try {
      const result = await wasender.getGroupMetadata(groupId);
      console.log(
        "Group metadata:",
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
      handleGroupApiError(error, `fetching metadata for group ${groupId}`);
    }
  }

  async function fetchGroupParticipants(groupId: string) {
    console.log(`\n--- Fetching Participants for Group: ${groupId} ---`);
    if (!groupId) return console.error("Group ID is required.");

    try {
      const result = await wasender.getGroupParticipants(groupId);
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
      handleGroupApiError(error, `fetching participants for group ${groupId}`);
    }
  }

  async function addParticipantsToGroup(
    groupId: string,
    participantsToAdd: string[]
  ) {
    console.log(`\n--- Adding Participants to Group: ${groupId} ---`);
    console.warn("CAUTION: This is a group modifying operation.");
    if (!groupId || !participantsToAdd || participantsToAdd.length === 0) {
      return console.error("Group ID and participants list are required.");
    }
    try {
      const result = await wasender.addGroupParticipants(groupId, participantsToAdd);
      console.log(
        "Add participants result:",
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
      handleGroupApiError(error, `adding participants to group ${groupId}`);
    }
  }

  async function removeParticipantsFromGroup(
    groupId: string,
    participantsToRemove: string[]
  ) {
    console.log(`\n--- Removing Participants from Group: ${groupId} ---`);
    console.warn("CAUTION: This is a group modifying operation.");
    if (!groupId || !participantsToRemove || participantsToRemove.length === 0) {
      return console.error("Group ID and participants list are required.");
    }
    try {
      const result = await wasender.removeGroupParticipants(groupId, participantsToRemove);
      console.log(
        "Remove participants result:",
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
      handleGroupApiError(error, `removing participants from group ${groupId}`);
    }
  }

  async function updateSampleGroupSettings(groupId: string) {
    console.log(`\n--- Updating Settings for Group: ${groupId} ---`);
    console.warn("CAUTION: This is a group modifying operation.");
    if (!groupId) return console.error("Group ID is required.");

    const settingsToUpdate: UpdateGroupSettingsPayload = {
      subject: "Awesome Group Name via SDK Test",
      description: `Updated by Wasender SDK (groups.ts) at ${new Date().toLocaleTimeString()}`,
      // announce: false, // Example: Allow all participants to send messages
      // restrict: false, // Example: Allow all participants to edit group info
    };

    try {
      const result = await wasender.updateGroupSettings(groupId, settingsToUpdate);
      console.log(
        "Update group settings result:",
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
      handleGroupApiError(error, `updating settings for group ${groupId}`);
    }
  }

  // --- Group Operation Examples End ---

  console.log("\nStarting group operation examples...");

  await fetchAllGroups();
  await delay(MESSAGE_SEND_DELAY);

  await sendTextToGroup(testGroupId);
  await delay(MESSAGE_SEND_DELAY);

  await sendImageToGroup(testGroupId);
  await delay(MESSAGE_SEND_DELAY);

  await sendVideoToGroup(testGroupId);
  await delay(MESSAGE_SEND_DELAY);

  await sendDocumentToGroup(testGroupId);
  await delay(MESSAGE_SEND_DELAY);

  await sendAudioToGroup(testGroupId);
  await delay(MESSAGE_SEND_DELAY);

  await sendStickerToGroup(testGroupId);
  await delay(MESSAGE_SEND_DELAY);
  
  await sendContactToGroup(testGroupId);
  await delay(MESSAGE_SEND_DELAY);

  await sendLocationToGroup(testGroupId);
  await delay(MESSAGE_SEND_DELAY);

  await fetchGroupMetadata(testGroupId);
  await delay(MESSAGE_SEND_DELAY);

  await fetchGroupParticipants(testGroupId);
  await delay(MESSAGE_SEND_DELAY);

//   CAUTION: Modifying operations. Uncomment to test. Ensure IDs are correct.
//   console.log("\nSKIPPING modifying operations by default. Uncomment in script to run.");
//   await addParticipantsToGroup(testGroupId, participantJidsToAdd);
//   await delay(MESSAGE_SEND_DELAY);
//   await removeParticipantsFromGroup(testGroupId, participantJidsToRemove);
//   await delay(MESSAGE_SEND_DELAY);
//   await updateSampleGroupSettings(testGroupId);
//   await delay(MESSAGE_SEND_DELAY);

  console.log("\nAll group examples processed.");
}

runAllGroupExamples(); // Call the main function to execute examples

// Exporting for potential future use if needed, or can be removed if script is self-contained runner
// export { runAllGroupExamples };
