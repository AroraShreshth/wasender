import {
  verifyWasenderWebhookSignature,
  WasenderWebhookEvent,
  WEBHOOK_SIGNATURE_HEADER,
  WasenderWebhookEventType,
  ChatsUpsertEvent,
  ChatEntry,
  GroupsUpsertEvent,
  GroupMetadata,
  GroupParticipantsUpdateEvent,
  GroupParticipantsUpdateData,
  ContactsUpsertEvent,
  ContactEntry,
  MessagesUpsertEvent,
  MessagesUpsertData,
  MessageContent,
  MessageKey,
  MessagesUpdateEvent,
  MessagesUpdateDataEntry,
  MessageUpdate,
  MessageSentEvent,
  MessageSentData,
  SessionStatusEvent,
  SessionStatusData,
  QrCodeUpdatedEvent,
  QrCodeUpdatedData,
  MessagesReactionEvent,
  MessagesReactionDataEntry,
  Reaction,
  ChatsUpdateEvent,
  ChatsDeleteEvent,
  GroupsUpdateEvent,
  ContactsUpdateEvent,
  MessagesDeleteEvent,
  MessageReceiptUpdateEvent,
  MessageReceiptUpdateDataEntry,
  Receipt,
} from '../src/webhook';
import { GroupParticipant } from '../src/groups';
import { IncomingHttpHeaders } from 'http';

const SECRET = 'shh!';

interface MockRequest {
  headers: IncomingHttpHeaders;
  json: () => Promise<any>;
}

function makeReq(body: any, signature?: string): MockRequest {
  const headers: IncomingHttpHeaders = {};
  if (signature) {
    headers[WEBHOOK_SIGNATURE_HEADER] = signature;
  }
  return {
    headers,
    json: async () => body,
  } as MockRequest;
}

describe('Webhook handler', () => {
  // Recreate the handler logic for testing purposes
  const handleWebhook = async (req: MockRequest): Promise<WasenderWebhookEvent> => {
    const signature = req.headers[WEBHOOK_SIGNATURE_HEADER] as string | undefined;
    if (!verifyWasenderWebhookSignature(signature, SECRET)) {
      throw new Error('Invalid signature');
    }
    return (await req.json()) as WasenderWebhookEvent;
  };

  it('rejects missing signature', async () => {
    await expect(handleWebhook(makeReq({ event: 'something' }))).rejects.toThrow('Invalid signature');
  });

  it('rejects incorrect signature', async () => {
    await expect(handleWebhook(makeReq({ event: 'something' }, 'wrongsecret'))).rejects.toThrow('Invalid signature');
  });

  describe('Event Type Parsing', () => {
    it('parses ChatsUpsertEvent correctly', async () => {
      const chatEntry: ChatEntry = {
        id: '1234567890',
        name: 'Contact Name',
        conversationTimestamp: 1633456789,
        unreadCount: 2,
      };
      const payload: ChatsUpsertEvent = {
        event: WasenderWebhookEventType.ChatsUpsert,
        timestamp: 1633456789,
        data: [chatEntry],
        sessionId: 'session-id-123',
      };
    const req = makeReq(payload, SECRET);
    const evt = await handleWebhook(req);
      expect(evt.event).toBe(WasenderWebhookEventType.ChatsUpsert);
      expect(evt.data).toEqual([chatEntry]);
      expect(evt.timestamp).toBe(1633456789);
      expect(evt.sessionId).toBe('session-id-123');
    });

    it('parses ChatsUpdateEvent correctly', async () => {
        const chatUpdateData: Partial<ChatEntry> = {
            id: "1234567890",
            unreadCount: 0,
            conversationTimestamp: 1633456789
        };
        const payload: ChatsUpdateEvent = {
            event: WasenderWebhookEventType.ChatsUpdate,
            timestamp: 1633456789,
            data: [chatUpdateData]
        };
        const evt = await handleWebhook(makeReq(payload, SECRET)) as ChatsUpdateEvent;
        expect(evt.event).toBe(WasenderWebhookEventType.ChatsUpdate);
        expect(evt.data).toEqual([chatUpdateData]);
    });

    it('parses ChatsDeleteEvent correctly', async () => {
        const payload: ChatsDeleteEvent = {
            event: WasenderWebhookEventType.ChatsDelete,
            timestamp: 1633456789,
            data: ["1234567890"]
        };
        const evt = await handleWebhook(makeReq(payload, SECRET)) as ChatsDeleteEvent;
        expect(evt.event).toBe(WasenderWebhookEventType.ChatsDelete);
        expect(evt.data).toEqual(["1234567890"]);
    });

    it('parses GroupsUpsertEvent correctly', async () => {
      const participant1: GroupParticipant = { id: '1234567890', admin: "superadmin" };
      const participant2: GroupParticipant = { id: '0987654321' }; // Regular participant, admin is undefined
      const groupData: GroupMetadata = {
        id: '123456789-987654321@g.us',
        subject: 'Group Name',
        creation: 1633456700,
        owner: '1234567890',
        desc: 'Group description',
        participants: [participant1, participant2],
      };
      const payload: GroupsUpsertEvent = {
        event: WasenderWebhookEventType.GroupsUpsert,
        timestamp: 1633456789,
        data: [groupData],
      };
      const evt = await handleWebhook(makeReq(payload, SECRET));
      expect(evt.event).toBe(WasenderWebhookEventType.GroupsUpsert);
      expect(evt.data).toEqual([groupData]);
    });
    
    it('parses GroupsUpdateEvent correctly', async () => {
        const groupUpdateData: Partial<GroupMetadata> = {
            id: "123456789-987654321@g.us",
            announce: true,
            restrict: false
        };
        const payload: GroupsUpdateEvent = {
            event: WasenderWebhookEventType.GroupsUpdate,
            timestamp: 1633456789,
            data: [groupUpdateData]
        };
        const evt = await handleWebhook(makeReq(payload, SECRET)) as GroupsUpdateEvent;
        expect(evt.event).toBe(WasenderWebhookEventType.GroupsUpdate);
        expect(evt.data).toEqual([groupUpdateData]);
    });

    it('parses GroupParticipantsUpdateEvent correctly', async () => {
      const participantsUpdateData: GroupParticipantsUpdateData = {
        id: '123456789-987654321@g.us',
        participants: ['1234567890'],
        action: 'add',
      };
      const payload: GroupParticipantsUpdateEvent = {
        event: WasenderWebhookEventType.GroupParticipantsUpdate,
        timestamp: 1633456789,
        data: participantsUpdateData,
      };
      const evt = await handleWebhook(makeReq(payload, SECRET));
      expect(evt.event).toBe(WasenderWebhookEventType.GroupParticipantsUpdate);
      expect(evt.data).toEqual(participantsUpdateData);
    });

    it('parses ContactsUpsertEvent correctly', async () => {
      const contactData: ContactEntry = {
        id: '1234567890',
        name: 'Contact Name',
        notify: 'Contact Display Name',
        verifiedName: 'Verified Business Name',
        status: 'Hey there! I am using WhatsApp.',
      };
      const payload: ContactsUpsertEvent = {
        event: WasenderWebhookEventType.ContactsUpsert,
        timestamp: 1633456789,
        data: [contactData],
      };
      const evt = await handleWebhook(makeReq(payload, SECRET));
      expect(evt.event).toBe(WasenderWebhookEventType.ContactsUpsert);
      expect(evt.data).toEqual([contactData]);
    });

    it('parses ContactsUpdateEvent correctly', async () => {
        const contactUpdateData: Partial<ContactEntry> = {
            id: "1234567890",
            imgUrl: "https://pps.whatsapp.net/v/t61.24694-24/123456789_123456789_123456789_123456789_123456789.jpg"
        };
        const payload: ContactsUpdateEvent = {
            event: WasenderWebhookEventType.ContactsUpdate,
            timestamp: 1633456789,
            data: [contactUpdateData]
        };
        const evt = await handleWebhook(makeReq(payload, SECRET)) as ContactsUpdateEvent;
        expect(evt.event).toBe(WasenderWebhookEventType.ContactsUpdate);
        expect(evt.data).toEqual([contactUpdateData]);
    });

    it('parses MessagesUpsertEvent (new message) correctly', async () => {
      const messageKey: MessageKey = { id: 'message-id-123', fromMe: false, remoteId: '+1234567890' };
      const messageContent: MessageContent = { conversation: 'Hello, I have a question' };
      const messageData: MessagesUpsertData = { key: messageKey, message: messageContent };
      const payload: MessagesUpsertEvent = {
        event: WasenderWebhookEventType.MessagesUpsert,
        timestamp: 1633456789,
        data: messageData,
      };
      const evt = await handleWebhook(makeReq(payload, SECRET));
      expect(evt.event).toBe(WasenderWebhookEventType.MessagesUpsert);
      expect(evt.data).toEqual(messageData);
    });

    it('parses MessagesUpdateEvent (status update) correctly', async () => {
      const messageKey: MessageKey = { id: 'message-id-456', fromMe: true, remoteId: '+1987654321' };
      const messageUpdate: MessageUpdate = { status: 'delivered' };
      const updateEntry: MessagesUpdateDataEntry = { key: messageKey, update: messageUpdate };
      const payload: MessagesUpdateEvent = {
        event: WasenderWebhookEventType.MessagesUpdate,
        timestamp: 1633456795,
        data: [updateEntry],
      };
      const evt = await handleWebhook(makeReq(payload, SECRET));
      expect(evt.event).toBe(WasenderWebhookEventType.MessagesUpdate);
      expect(evt.data).toEqual([updateEntry]);
    });
    
    it('parses MessagesDeleteEvent correctly', async () => {
        const messageKey: MessageKey = {
            id: "message-id-789",
            fromMe: false,
            remoteId: "+1234567890"
        };
        const payload: MessagesDeleteEvent = {
            event: WasenderWebhookEventType.MessagesDelete,
            timestamp: 1633456800,
            data: {
                keys: [messageKey]
            }
        };
        const evt = await handleWebhook(makeReq(payload, SECRET)) as MessagesDeleteEvent;
        expect(evt.event).toBe(WasenderWebhookEventType.MessagesDelete);
        expect(evt.data).toEqual({ keys: [messageKey] });
    });

    it('parses MessageSentEvent correctly', async () => {
      const messageKey: MessageKey = { id: 'message-id-456', fromMe: true, remoteId: '+1987654321' };
      const messageContent: MessageContent = { conversation: 'This is my reply.' };
      const sentData: MessageSentData = { key: messageKey, message: messageContent, status: 'sent' };
      const payload: MessageSentEvent = {
        event: WasenderWebhookEventType.MessageSent,
        timestamp: 1633456790,
        data: sentData,
      };
      const evt = await handleWebhook(makeReq(payload, SECRET));
      expect(evt.event).toBe(WasenderWebhookEventType.MessageSent);
      expect(evt.data).toEqual(sentData);
    });

    it('parses SessionStatusEvent correctly', async () => {
      const statusData: SessionStatusData = { status: 'connected', session_id: 'session-id-123' };
      const payload: SessionStatusEvent = {
        event: WasenderWebhookEventType.SessionStatus,
        timestamp: 1633456789,
        data: statusData,
      };
      const evt = await handleWebhook(makeReq(payload, SECRET));
      expect(evt.event).toBe(WasenderWebhookEventType.SessionStatus);
      expect(evt.data).toEqual(statusData);
    });

    it('parses QrCodeUpdatedEvent correctly', async () => {
      const qrData: QrCodeUpdatedData = { qr: 'data:image/png;base64,...', session_id: 'session-id-123' };
      const payload: QrCodeUpdatedEvent = {
        event: WasenderWebhookEventType.QrCodeUpdated,
        timestamp: 1633456780,
        data: qrData,
      };
      const evt = await handleWebhook(makeReq(payload, SECRET));
      expect(evt.event).toBe(WasenderWebhookEventType.QrCodeUpdated);
      expect(evt.data).toEqual(qrData);
    });

    it('parses MessagesReactionEvent correctly', async () => {
      const reactionKey: MessageKey = { id: 'message-id-123', fromMe: false, remoteId: '+1234567890' };
      const reaction: Reaction = { text: '👍', key: reactionKey };
      const reactionEntry: MessagesReactionDataEntry = { key: reactionKey, reaction: reaction };
      const payload: MessagesReactionEvent = {
        event: WasenderWebhookEventType.MessagesReaction,
        timestamp: 1633456810,
        data: [reactionEntry],
      };
      const evt = await handleWebhook(makeReq(payload, SECRET));
      expect(evt.event).toBe(WasenderWebhookEventType.MessagesReaction);
      expect(evt.data).toEqual([reactionEntry]);
    });

    it('parses MessageReceiptUpdateEvent correctly', async () => {
        const messageKey: MessageKey = { id: 'message-id-xyz', fromMe: true, remoteId: 'recipient@s.whatsapp.net' };
        const receipt: Receipt = { userJid: 'recipient@s.whatsapp.net', status: 'read', t: 1633456815 };
        const receiptEntry: MessageReceiptUpdateDataEntry = { key: messageKey, receipt: receipt };
        const payload: MessageReceiptUpdateEvent = {
            event: WasenderWebhookEventType.MessageReceiptUpdate,
            timestamp: 1633456815,
            data: [receiptEntry],
            sessionId: 'session-1'
        };
        const evt = await handleWebhook(makeReq(payload, SECRET)) as MessageReceiptUpdateEvent;
        expect(evt.event).toBe(WasenderWebhookEventType.MessageReceiptUpdate);
        expect(evt.data).toEqual([receiptEntry]);
        expect(evt.sessionId).toBe('session-1');
    });
  });
});