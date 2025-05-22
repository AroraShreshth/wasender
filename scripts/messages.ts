import 'dotenv/config'; // Load .env file
import { createWasender, Wasender, RetryConfig } from "../src/main.ts";
import {
  TextOnlyMessage,
  ImageUrlMessage,
  VideoUrlMessage,
  DocumentUrlMessage,
  AudioUrlMessage,
  StickerUrlMessage,
  ContactCardMessage,
  LocationPinMessage,
  WasenderMessagePayload, // Added for sendMessageExample payload type
} from "../src/messages.ts";
import { WasenderAPIError } from "../src/errors.ts";

async function runAllMessageExamples() {
  const apiKey = process.env.WASENDER_API_KEY;
  const testPhoneNumber = process.env.WASENDER_TEST_PHONE_NO;
  const testGroupJid = process.env.WASENDER_TEST_GROUP_JID;
  const testChannelJid = process.env.WASENDER_TEST_CHANNEL_JID;

  if (!apiKey) {
    console.error("Error: WASENDER_API_KEY environment variable is not set.");
    process.exit(1);
  }

  if (!testPhoneNumber) {
    console.error(
      "Error: WASENDER_TEST_PHONE_NO environment variable is not set."
    );
    process.exit(1);
  }

  // Initialize SDK instances
  const wasender = createWasender(apiKey, undefined);

  const retryOptions: RetryConfig = {
    enabled: true,
    maxRetries: 2,
  };
  const wasenderWithRetries = createWasender(
    apiKey,
    undefined,
    undefined,
    undefined,
    retryOptions
  );

  console.log("Wasender SDK Initialized for examples.");

  const recipientPhoneNumber = testPhoneNumber;
  const recipientGroupJid = testGroupJid
  const recipientChannelJid = testChannelJid;

  async function sendMessageExample(
    description: string,
    wasenderInstance: Wasender,
    payload: WasenderMessagePayload
  ) {
    console.log(`\n--- ${description} ---`);
    try {
      const result = await wasenderInstance.send(payload);
      console.log("Message Sent Successfully:", result.response.message);
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
      if (error instanceof WasenderAPIError) {
        console.error("API Error Details:");
        console.error(`  Message: ${error.message}`);
        console.error(`  Status Code: ${error.statusCode || "N/A"}`);
        if (error.apiMessage)
          console.error(`  API Message: ${error.apiMessage}`);
        if (error.errorDetails)
          console.error(
            "  Error Details:",
            JSON.stringify(error.errorDetails, null, 2)
          );
        if (error.retryAfter)
          console.error(`  Retry After: ${error.retryAfter} seconds`);
        
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
        console.error("An unexpected error occurred:", error);
      }
    }
  }

  // --- Individual Message Type Examples Start ---
  async function sendTextMessage() {
    const textPayload: TextOnlyMessage = {
      to: recipientPhoneNumber,
      messageType: "text",
      text: "Hello from the Wasender SDK! This is a plain text message.",
    };
    await sendMessageExample("Sending Text Message", wasender, textPayload);
  }

  async function sendImageMessageWithRetry() {
    const imagePayload: ImageUrlMessage = {
      to: recipientPhoneNumber,
      messageType: "image",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/%D0%92%D0%B5%D0%B4%D0%BC%D1%96%D0%B4%D1%8C_%D1%83_%D0%BB%D1%96%D1%81%D1%96.jpg/1599px-%D0%92%D0%B5%D0%B4%D0%BC%D1%96%D0%B4%D1%8C_%D1%83_%D0%BB%D1%96%D1%81%D1%96.jpg?20190515112011", // Placeholder, replace with valid public image URL
      text: "Check out this cool image! (Sent with retry logic)",
    };
    await sendMessageExample(
      "Sending Image Message (with Retries)",
      wasenderWithRetries,
      imagePayload
    );
  }

  async function sendVideoMessage() {
    const videoPayload: VideoUrlMessage = {
      to: recipientPhoneNumber,
      messageType: "video",
      videoUrl: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4", // Placeholder, replace with valid public video URL
      text: "Watch this exciting video!",
    };
    await sendMessageExample("Sending Video Message", wasender, videoPayload);
  }

  async function sendDocumentMessage() {
    const documentPayload: DocumentUrlMessage = {
      to: recipientPhoneNumber,
      messageType: "document",
      documentUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", // Placeholder, replace with valid public document URL
      text: "Here is the document you requested.",
    };
    await sendMessageExample("Sending Document Message", wasender, documentPayload);
  }

  async function sendAudioMessage() {
    const audioPayload: AudioUrlMessage = {
      to: recipientPhoneNumber,
      messageType: "audio",
      audioUrl: "https://file-examples.com/storage/fe4a1fdc54682dc65a37ab9/2017/11/file_example_MP3_700KB.mp3", // Placeholder, replace with valid public audio URL
      // text: "Listen to this audio." // Optional
    };
    await sendMessageExample("Sending Audio Message (Voice Note)", wasender, audioPayload);
  }

  async function sendStickerMessage() {
    const stickerPayload: StickerUrlMessage = {
      to: recipientPhoneNumber,
      messageType: "sticker",
      stickerUrl: "https://www.gstatic.com/webp/gallery/1.sm.webp", // Placeholder, replace with valid public .webp sticker URL
    };
    await sendMessageExample("Sending Sticker Message", wasender, stickerPayload);
  }

  async function sendContactCardMessageWithRetry() {
    const contactPayload: ContactCardMessage = {
      to: recipientPhoneNumber,
      messageType: "contact",
      contact: {
        name: "John Doe",
        phone: "+19876543210",
      },
      text: "Here is John Doe's contact information. (Sent with retry logic)",
    };
    await sendMessageExample(
      "Sending Contact Card Message (with Retries)",
      wasenderWithRetries,
      contactPayload
    );
  }

  async function sendLocationPinMessage() {
    const locationPayload: LocationPinMessage = {
      to: recipientPhoneNumber,
      messageType: "location",
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        name: "OpenAI HQ",
        address: "Pioneer Building, San Francisco, CA",
      },
      text: "Meet me at this location!",
    };
    await sendMessageExample("Sending Location Pin Message", wasender, locationPayload);
  }
  // --- Individual Message Type Examples End ---

  // --- Helper Method Example Start ---
  async function sendTextViaHelper() {
    console.log("\n--- Sending Text Message via sendText() Helper ---");
    try {
      const result = await wasender.sendText({
        to: recipientPhoneNumber,
        text: "Hello from the sendText() helper method!",
      });
      console.log("Text Sent via Helper:", result.response.message);
      let rateLimitResetTime = "N/A";
      if (result.rateLimit && result.rateLimit.getResetTimestampAsDate) {
        rateLimitResetTime = result.rateLimit.getResetTimestampAsDate()?.toLocaleTimeString() || "N/A";
      }
      console.log(
        "Rate Limit:",
        result.rateLimit?.remaining,
        "rem, resets",
        rateLimitResetTime
      );
    } catch (error) {
      if (error instanceof WasenderAPIError) {
        console.error("\n--- API Error During Send (Helper) ---");
        console.error(
          `Msg: ${error.apiMessage || error.message}, Status: ${error.statusCode}`
        );
        if (error.errorDetails) console.error("Details:", error.errorDetails);
        
        let errorRateLimitResetTime = "N/A";
        if (error.rateLimit && error.rateLimit.getResetTimestampAsDate) {
            errorRateLimitResetTime = error.rateLimit.getResetTimestampAsDate()?.toLocaleTimeString() || "N/A";
        }
        if (error.rateLimit) console.error("Rate Limit at error:", error.rateLimit.remaining, "resets", errorRateLimitResetTime);

      } else {
        console.error("\n--- Generic Error During Send (Helper) ---", error);
      }
    }
  }
  // --- Helper Method Example End ---

  console.log("\nStarting message sending examples...");

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const MESSAGE_SEND_DELAY = 5000; // 5 seconds

  // Call all example functions with delays
  await sendTextMessage();
  await delay(MESSAGE_SEND_DELAY);

  await sendImageMessageWithRetry();
  await delay(MESSAGE_SEND_DELAY);

  await sendVideoMessage();
  await delay(MESSAGE_SEND_DELAY);

  await sendDocumentMessage();
  await delay(MESSAGE_SEND_DELAY);

  await sendAudioMessage();
  await delay(MESSAGE_SEND_DELAY);

  await sendStickerMessage();
  await delay(MESSAGE_SEND_DELAY);

  await sendContactCardMessageWithRetry();
  await delay(MESSAGE_SEND_DELAY);

  await sendLocationPinMessage();
  await delay(MESSAGE_SEND_DELAY);
  
  await sendTextViaHelper();

  console.log("\nAll message examples processed.");
}

runAllMessageExamples(); // Call the main function to execute examples

// Exporting for potential future use if needed, or can be removed if script is self-contained runner
// export { runAllMessageExamples };
