import { verifyWasenderWebhookSignature, WasenderWebhookEvent, WEBHOOK_SIGNATURE_HEADER } from '../src/webhook';
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
    return await req.json() as WasenderWebhookEvent;
  };

  it('rejects missing signature', async () => {
    await expect(handleWebhook(makeReq({ type: 'something' })))
      .rejects.toThrow('Invalid signature');
  });

  it('rejects incorrect signature', async () => {
    await expect(handleWebhook(makeReq({ type: 'something' }, 'wrongsecret')))
      .rejects.toThrow('Invalid signature');
  });

  it('parses valid event with correct signature', async () => {
    const payload = { type: 'chats.upsert', data: [] };
    const req = makeReq(payload, SECRET);
    const evt = await handleWebhook(req);
    expect(evt.type).toBe('chats.upsert');
    expect(evt.data).toEqual([]);
  });
});