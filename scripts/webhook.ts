import express, { Request, Response } from 'express';
import { WasenderWebhookEvent, WasenderWebhookEventType, WEBHOOK_SIGNATURE_HEADER } from '../src/webhook.js';
import 'dotenv/config'; // Imports and executes dotenv.config()
import * as fs from 'node:fs';
import * as path from 'node:path';

const app = express();
const PORT = process.env.PORT || 3000;

// Use the environment variable for the webhook secret
const WASENDER_WEBHOOK_SECRET_KEY_FROM_ENV = process.env.WASENDER_WEBHOOK_SECRET_KEY;

if (!WASENDER_WEBHOOK_SECRET_KEY_FROM_ENV) {
  console.error('CRITICAL ERROR: WASENDER_WEBHOOK_SECRET_KEY is not set in the environment variables.');
  console.error('Please create a .env file with WASENDER_WEBHOOK_SECRET_KEY=your_secret or set it in your environment.');
  process.exit(1); // Exit if the secret is not set
}

// Middleware to parse JSON bodies
app.use(express.json());

const DATA_DIR = path.join(process.cwd(), 'data', 'webhook_events');

// Ensure data directory exists when the script starts
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`Created data directory at: ${DATA_DIR}`);
  } catch (error) {
    console.error(`Error creating data directory ${DATA_DIR}:`, error);
  }
}

// Helper function to ensure data is always an array
function toArray<T>(x: T | T[] | undefined): T[] {
  if (x === undefined || x === null) { // Handle undefined or null explicitly
    return [];
  }
  return Array.isArray(x) ? x : [x];
}

// Helper function to describe message content
function describeContent(content: any): string {
  if (!content) return 'empty message content';
  if (content.conversation) return `text: "${content.conversation}"`;
  if (content.imageMessage) return `image ${content.imageMessage.mimetype || ''} ${content.imageMessage.fileLength || '?'} bytes`;
  if (content.videoMessage) return `video ${content.videoMessage.mimetype || ''} ${content.videoMessage.fileLength || '?'} bytes`;
  if (content.documentMessage) return `document "${content.documentMessage.fileName || 'unknown file'}"`;
  if (content.audioMessage) return `audio (${content.audioMessage.mimetype || ''}), duration: ${content.audioMessage.duration ?? '?'}s`;
  if (content.stickerMessage) return `sticker (${content.stickerMessage.mimetype || ''})`;
  if (content.reactionMessage) return `reaction: "${content.reactionMessage.text}" to msg ID ${content.reactionMessage.key?.id}`;


  // General fallback for other types not explicitly listed above but might be present
  const knownKeys = ['extendedTextMessage', 'buttonsMessage', 'templateMessage', 'contactMessage', 'locationMessage'];
  for (const key of knownKeys) {
    if (content[key]) {
      return `${key.replace('Message', '')} message`;
    }
  }
  
  return 'unsupported/unknown message kind';
}

/**
 * Verifies the webhook signature from Wasender.
 * This is a direct implementation for the test server.
 * Logging within this function is minimized as requested.
 */
function verifySignature(req: Request): boolean {
  const signature = req.headers[WEBHOOK_SIGNATURE_HEADER.toLowerCase()] as string | undefined;
  if (!signature || !WASENDER_WEBHOOK_SECRET_KEY_FROM_ENV) {
    return false;
  }
  return signature === WASENDER_WEBHOOK_SECRET_KEY_FROM_ENV;
}

function normalisePayload(raw: any): { type: WasenderWebhookEventType | string; data: any[], sessionId?: string, timestamp?: number } {
  const eventType = raw?.event as WasenderWebhookEventType | string | undefined;
  const rawEventSpecificData = raw?.data; // This is the content of the 'data' key from the webhook
  const sessionId = raw?.sessionId;
  const eventTimestamp = raw?.timestamp;

  if (eventType && typeof rawEventSpecificData === 'object' && rawEventSpecificData !== null) {
    console.log(`[normalisePayload] Standard structure detected. Event: ${eventType}, Inner Data Object (rawEventSpecificData):`, JSON.stringify(rawEventSpecificData, null, 2));
    let dataToProcess: any = rawEventSpecificData; // Default: assume rawEventSpecificData is the direct payload (e.g. SessionStatus, QrCodeUpdated)

    // Extract the true event-specific data from its typical nesting key (e.g., data.messages, data.chats)
    switch (eventType) {
      case WasenderWebhookEventType.MessagesUpsert:
      case WasenderWebhookEventType.MessagesUpdate:
      case WasenderWebhookEventType.MessagesDelete:
        dataToProcess = rawEventSpecificData.messages;
        break;
      case WasenderWebhookEventType.MessagesReaction:
        dataToProcess = rawEventSpecificData.message; // { key: ..., reaction: ... }
        break;
      case WasenderWebhookEventType.ChatsUpsert:
      case WasenderWebhookEventType.ChatsUpdate:
        // .chats is often an array, .chat a single object. Prioritize .chats if present.
        dataToProcess = rawEventSpecificData.chats || rawEventSpecificData.chat;
        break;
      case WasenderWebhookEventType.ContactsUpsert:
      case WasenderWebhookEventType.ContactsUpdate:
        dataToProcess = rawEventSpecificData.contacts;
        break;
      // For types like SessionStatus, QrCodeUpdated, GroupParticipantsUpdate, MessageSent, MessageReceiptUpdate,
      // GroupsUpdate, GroupsUpsert, ChatsDelete: rawEventSpecificData is assumed to be the correct payload.
      // So, dataToProcess remains rawEventSpecificData by default.
      default:
        // Define a list of event types where rawEventSpecificData is the direct payload
        const directPayloadEventTypes: Array<WasenderWebhookEventType | string> = [
            WasenderWebhookEventType.SessionStatus, WasenderWebhookEventType.QrCodeUpdated,
            WasenderWebhookEventType.GroupParticipantsUpdate, WasenderWebhookEventType.MessageSent,
            WasenderWebhookEventType.MessageReceiptUpdate, WasenderWebhookEventType.GroupsUpdate,
            WasenderWebhookEventType.GroupsUpsert, WasenderWebhookEventType.ChatsDelete
        ];
        // Define a list of event types that have specific extraction rules above this default case
        const specificExtractionEventTypes: Array<WasenderWebhookEventType | string> = [
            WasenderWebhookEventType.MessagesUpsert, WasenderWebhookEventType.MessagesUpdate,
            WasenderWebhookEventType.MessagesDelete, WasenderWebhookEventType.MessagesReaction,
            WasenderWebhookEventType.ChatsUpsert, WasenderWebhookEventType.ChatsUpdate,
            WasenderWebhookEventType.ContactsUpsert, WasenderWebhookEventType.ContactsUpdate
        ];

        if (!directPayloadEventTypes.includes(eventType as string) && 
            !specificExtractionEventTypes.includes(eventType as string)) {
            // This warning is for event types that are not explicitly handled for inner data extraction
            // AND are not known to have their payload directly in rawEventSpecificData.
            console.warn(`[normalisePayload] Event type "${eventType}" has no specific inner data extraction rule and is not a known direct payload type. Using rawEventSpecificData directly for dataToProcess.`);
        }
        break;
    }
    
    const finalDataArray = toArray(dataToProcess); // Ensure the result is always an array
    console.log(`[normalisePayload] Extracted and array-normalized data for ${eventType}:`, JSON.stringify(finalDataArray, null, 2));
    return { type: eventType, data: finalDataArray, sessionId, timestamp: eventTimestamp };
  }

  // Fallback for older/different structures (if raw.event and raw.data not present)
  console.warn("[normalisePayload] Payload does not match standard {event, data} structure. Attempting legacy fallback inference.");
  const keys = Object.keys(raw);
  if (keys.length === 0) return { type: 'unknown:empty', data: [], sessionId, timestamp: eventTimestamp };

  const rootKey = keys[0];
  let inferredTypeFromFallback: WasenderWebhookEventType | string = `unknown:${rootKey}`;
  let dataFromFallback: any = raw[rootKey];

  // Specific inferences based on observed payload structures from legacy logs
  if (rootKey === 'messages') {
    if (raw.messages?.message?.reactionMessage) {
        inferredTypeFromFallback = WasenderWebhookEventType.MessagesUpsert; // Treat reaction as a type of message upsert
        dataFromFallback = raw.messages; 
    } else if (Array.isArray(raw.messages)){
        inferredTypeFromFallback = WasenderWebhookEventType.MessagesUpdate;
        dataFromFallback = raw.messages;
    } else if (raw.messages?.keys && Array.isArray(raw.messages.keys)) {
        inferredTypeFromFallback = WasenderWebhookEventType.MessagesDelete;
        dataFromFallback = raw.messages; 
    } else if (raw.messages) { // Single message object for upsert
        inferredTypeFromFallback = WasenderWebhookEventType.MessagesUpsert;
        dataFromFallback = raw.messages;
    }
  } else if (rootKey === 'message' && raw.message?.reaction) {
    inferredTypeFromFallback = WasenderWebhookEventType.MessagesReaction;
    dataFromFallback = raw.message; // This is {key, reaction}
  } else if (rootKey === 'contacts') {
    inferredTypeFromFallback = Array.isArray(raw.contacts) ? WasenderWebhookEventType.ContactsUpsert : WasenderWebhookEventType.ContactsUpdate;
    dataFromFallback = raw.contacts;
  } else if (rootKey === 'chats') {
    inferredTypeFromFallback = WasenderWebhookEventType.ChatsUpsert;
    dataFromFallback = raw.chats;
  } else if (rootKey === 'chat') { 
    inferredTypeFromFallback = WasenderWebhookEventType.ChatsUpdate;
    dataFromFallback = raw.chat;
  } else if (rootKey === 'qr' && typeof raw.qr === 'string') {
    inferredTypeFromFallback = WasenderWebhookEventType.QrCodeUpdated;
    dataFromFallback = raw; // The whole object {qr: "...", session_id: "..."}
  } else if (rootKey === 'status' && typeof raw.status === 'string') {
    inferredTypeFromFallback = WasenderWebhookEventType.SessionStatus;
    dataFromFallback = raw; // The whole object {status: "...", reason: "..."}
  }
  
  const finalFallbackDataArray = toArray(dataFromFallback); // Ensure fallback data is also an array
  console.log(`[normalisePayload] Fallback inference. Type: ${inferredTypeFromFallback}, Data (array-normalized):`, JSON.stringify(finalFallbackDataArray, null, 2));
  return { type: inferredTypeFromFallback, data: finalFallbackDataArray, sessionId, timestamp: eventTimestamp };
}

app.post('/webhook', (req: Request, res: Response) => {
  console.log(`\nReceived POST request on /webhook at ${new Date().toISOString()}`);
  // console.log('Incoming Request Headers:', JSON.stringify(req.headers, null, 2)); // Optional: for verbose header logging

  const requestBody = req.body;

  // Log the raw request body to a file (happens before signature check to capture all attempts)
  try {
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, ''); // Clean timestamp for filename
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const logFileName = path.join(DATA_DIR, `event-${timestamp}-${randomSuffix}.json`);
    fs.writeFileSync(logFileName, JSON.stringify(requestBody, null, 2));
    console.log(`Webhook payload logged to ${logFileName}`);
  } catch (error) {
    console.error('Failed to log webhook payload:', error);
  }

  if (!verifySignature(req)) {
    console.log('Invalid signature detected.');
    return res.status(401).json({ error: 'Invalid signature' });
  }
  console.log('Signature verified successfully.');

  // Call normalisePayload to get the event type and actual data
  const { type: inferredEventType, data: actualEventData, sessionId, timestamp: eventTimestamp } = normalisePayload(requestBody);

  // Log what normalisePayload returned for clarity
  console.log(`[Handler] Normalised Event Type: ${inferredEventType}, Session ID: ${sessionId || 'N/A'}, Event Timestamp: ${eventTimestamp || 'N/A'}`);
  // console.log('[Handler] Normalised Event Data:', JSON.stringify(actualEventData, null, 2)); // actualEventData is now always an array

  // Guard against undefined type. actualEventData is now guaranteed to be an array (possibly empty by toArray).
  if (!inferredEventType) {
    console.warn('[Handler] Could not reliably determine event type from normalisePayload (type was undefined/empty).');
    console.log('[Handler] Raw payload for undetermined event type:', JSON.stringify(requestBody, null, 2));
    return res.status(200).json({ received: true, message: "Payload received, but event type undetermined after normalization." });
  }
  
  // actualEventData is now guaranteed to be an array by normalisePayload.
  const entries = actualEventData; 

  console.log('[Handler] Processing Event Type:', inferredEventType); 

  switch (inferredEventType) {
    case WasenderWebhookEventType.MessagesUpsert:
      console.log('Event: MessagesUpsert');
      entries.forEach((entry: any) => { // entry is MessagesUpsertData
        const key = entry.key;
        console.log(`  MsgID: ${key?.id} from ${key?.remoteJid}`);
        if (entry.message) {
          console.log(`  → ${describeContent(entry.message)}`);
        } else {
          console.log('  → No message content field found in this entry.');
        }
      });
      break;
    case WasenderWebhookEventType.MessagesUpdate:
      console.log('Event: MessagesUpdate');
      entries.forEach((updateEntry: any) => {
        console.log(
          `  Msg ID: ${updateEntry.key?.id}, Status: ${updateEntry.update?.status}, To/From: ${updateEntry.key?.remoteJid}`
        );
      });
      break;
    case WasenderWebhookEventType.SessionStatus:
      console.log('Event: SessionStatus');
      if (entries.length > 0) {
        const sessionStatusData: any = entries[0];
        console.log('  Session status changed:', sessionStatusData.status);
        if (sessionStatusData.reason) {
          console.log('  Reason:', sessionStatusData.reason);
        }
      } else {
        console.warn('  SessionStatus data missing or not a single entry as expected.');
        console.log('  Actual original event data for SessionStatus:', JSON.stringify(actualEventData, null, 2));
      }
      break;
    case WasenderWebhookEventType.QrCodeUpdated:
      console.log('Event: QrCodeUpdated');
      if (entries.length > 0) {
        const qrData: any = entries[0];
        console.log('  QR code updated. Session ID (if available):', qrData.session_id);
        if (qrData.qr) {
          console.log('  QR Data (first 50 chars):', String(qrData.qr).substring(0, 50) + '...');
        }
      } else {
        console.warn('  QrCodeUpdated data missing or not a single entry as expected.');
        console.log('  Actual original event data for QrCodeUpdated:', JSON.stringify(actualEventData, null, 2));
      }
      break;
    case WasenderWebhookEventType.MessageSent:
      console.log('Event: MessageSent');
      // MessageSentData is a single object, entries will be [MessageSentData]
      if (entries.length > 0) {
        const entry = entries[0]; // entry is MessageSentData
        const key = entry.key;
        console.log(`  MsgID: ${key?.id} to ${key?.remoteJid} (fromMe: ${key?.fromMe})`);
        if (entry.message) {
            console.log(`  → ${describeContent(entry.message)}`);
        } else {
            console.log('  → No message content field found in this entry.');
        }
      } else {
        console.warn('  MessageSent data missing or not a single entry as expected after normalization.');
        console.log('  Actual original event data for MessageSent (before normalization was toArray):', JSON.stringify(requestBody?.data, null, 2));
      }
      break;
    case WasenderWebhookEventType.MessageReceiptUpdate:
      console.log('Event: MessageReceiptUpdate');
      entries.forEach((entry: any) => console.log('  MessageReceiptUpdate data:', JSON.stringify(entry, null, 2)));
      break;
    case WasenderWebhookEventType.ChatsUpsert:
      console.log('Event: ChatsUpsert');
      entries.forEach((chat: any) => {
        console.log(`  Chat ID: ${chat.id}, Unread: ${chat.unreadCount}, Timestamp: ${chat.conversationTimestamp}`);
      });
      break;
    case WasenderWebhookEventType.ChatsDelete:
      console.log('Event: ChatsDelete');
      entries.forEach((chatId: string) => console.log('  Deleted Chat ID:', chatId));
      break;
    case WasenderWebhookEventType.ChatsUpdate:
      console.log('Event: ChatsUpdate');
      entries.forEach((chat: any) => {
        console.log(`  Chat ID: ${chat.id}, Unread: ${chat.unreadCount}, Timestamp: ${chat.conversationTimestamp}`);
      });
      break;
    case WasenderWebhookEventType.GroupsUpdate:
      console.log('Event: GroupsUpdate');
      entries.forEach((group: any) => console.log('  GroupsUpdate data:', JSON.stringify(group, null, 2)));
      break;
    case WasenderWebhookEventType.GroupsUpsert:
      console.log('Event: GroupsUpsert');
      entries.forEach((group: any) => console.log('  GroupsUpsert data:', JSON.stringify(group, null, 2)));
      break;
    case WasenderWebhookEventType.GroupParticipantsUpdate:
      console.log('Event: GroupParticipantsUpdate');
      if (entries.length > 0) {
        const groupParticipantsData: any = entries[0];
        console.log('  Group JID:', groupParticipantsData.jid);
        console.log('  Action:', groupParticipantsData.action);
        console.log('  Participants:', JSON.stringify(groupParticipantsData.participants, null, 2));
      } else {
        console.warn('  GroupParticipantsUpdate data missing or not a single entry as expected.');
        console.log('  Actual original event data for GroupParticipantsUpdate:', JSON.stringify(actualEventData, null, 2));
      }
      break;
    case WasenderWebhookEventType.ContactsUpsert:
      console.log('Event: ContactsUpsert');
      entries.forEach((contact: any) => {
        console.log(`  Contact JID: ${contact.id || contact.jid}, Name: ${contact.name || contact.notify}`);
      });
      break;
    case WasenderWebhookEventType.ContactsUpdate:
      console.log('Event: ContactsUpdate');
      entries.forEach((contact: any) => {
        console.log(`  Contact JID: ${contact.id || contact.jid}, Updated Name: ${contact.name || contact.notify}`);
      });
      break;
    case WasenderWebhookEventType.MessagesDelete:
      console.log('Event: MessagesDelete');
      if (entries.length > 0) {
        const messagesDeleteData: any = entries[0];
        if (messagesDeleteData && Array.isArray(messagesDeleteData.keys)) {
          messagesDeleteData.keys.forEach((key: any) => {
            console.log(`  Deleted Msg ID: ${key.id}, RemoteJid: ${key.remoteJid}, FromMe: ${key.fromMe}`);
          });
        } else {
          console.warn('  MessagesDelete data structure unexpected (expected .keys array inside the single entry):', JSON.stringify(messagesDeleteData, null, 2));
        }
      } else {
        console.warn('  MessagesDelete data missing or not a single entry as expected.');
        console.log('  Actual original event data for MessagesDelete:', JSON.stringify(actualEventData, null, 2));
      }
      break;
    case WasenderWebhookEventType.MessagesReaction:
      console.log('Event: MessagesReaction');
      entries.forEach((reactionEntry: any) => {
        console.log(`  Reaction to Msg ID: ${reactionEntry.key?.id} (from ${reactionEntry.key?.remoteJid})`);
        if (reactionEntry.reaction) {
            console.log(`  Reaction Text: ${reactionEntry.reaction.text}`);
            console.log(`  Reaction by: ${reactionEntry.reaction.key?.participant || reactionEntry.reaction.key?.remoteJid || 'N/A'}`);
        }
      });
      break;
    default:
      console.log(`Received unhandled or unexpected event type/category: '${inferredEventType}'`);
      // entries provides a consistent view of the data payload
      if (entries.length === 1 && entries[0] === actualEventData && !Array.isArray(actualEventData)) {
        // If actualEventData was a single non-array object, entries = [actualEventData]
        console.log('  Data payload (single entry from original object):', JSON.stringify(entries[0], null, 2));
      } else {
        // If actualEventData was an array, or if it was empty/undefined and entries is [],
        // or if it was a single object but we want to show it as an array of one.
        console.log('  Data payload (entries array):', JSON.stringify(entries, null, 2));
      }
      // console.log('  Original actualEventData for unhandled type:', JSON.stringify(actualEventData, null, 2)); // Optional
      break;
  }

  res.status(200).json({ received: true, processedEventType: inferredEventType });
});

app.get('/', (req: Request, res: Response) => {
  res.status(200).send('Wasender Webhook Test Server is running. Send POST requests to /webhook.');
});

app.listen(PORT, () => {
  console.log(`Webhook test server listening on http://localhost:${PORT}/webhook`);
  console.log('Webhook secret is being read from the WASENDER_WEBHOOK_SECRET_KEY environment variable.');
  console.log('Make sure your Wasender dashboard webhook URL points to your public ngrok/server URL + /webhook');
});

/**
 * To run this server:
 * 1. Make sure you have Node.js and npm/yarn installed.
 * 2. Install dependencies:
 *    npm install express @types/express ts-node typescript --save-dev
 *    or
 *    yarn add express @types/express ts-node typescript --dev
 * 3. Replace 'YOUR_VERY_SECRET_KEY_HERE' with your actual Webhook Secret from Wasender.
 * 4. You might need a tsconfig.json file if you don't have one. A simple one:
 *    {
 *      "compilerOptions": {
 *        "module": "commonjs",
 *        "target": "es6",
 *        "esModuleInterop": true,
 *        "strict": true,
 *        "skipLibCheck": true,
 *        "resolveJsonModule": true, // If you plan to import JSON files directly
 *        "outDir": "./dist", // Optional: if you want to compile
 *        "rootDir": "./"
 *      },
 *      "include": ["src/**\/*.ts", "scripts/**\/*.ts"],
 *      "exclude": ["node_modules"]
 *    }
 * 5. Run with ts-node:
 *    npx ts-node scripts/webhook.ts
 * 6. Or compile and run:
 *    npx tsc
 *    node dist/scripts/webhook.js
 *
 * For Wasender to reach this local server, you'll need to expose it to the internet
 * using a tool like ngrok:
 *   ./ngrok http 3000
 * Then use the HTTPS URL provided by ngrok (e.g., https://xxxx-xxxx.ngrok.io/webhook)
 * as your webhook URL in the Wasender dashboard.
 */
