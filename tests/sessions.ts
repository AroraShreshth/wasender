import {
  WhatsAppSession,
  WhatsAppSessionStatus,
  CreateWhatsAppSessionPayload,
  UpdateWhatsAppSessionPayload,
  ConnectSessionPayload,
  ConnectSessionResponseData,
  QRCodeResponseData,
  DisconnectSessionResponseData,
  RegenerateApiKeyResponse,
  SessionStatusData,
  GetAllWhatsAppSessionsResponse,
  GetWhatsAppSessionDetailsResponse,
  CreateWhatsAppSessionResponse,
  UpdateWhatsAppSessionResponse,
  DeleteWhatsAppSessionResponse,
  ConnectSessionResponse,
  GetQRCodeResponse,
  DisconnectSessionResponse,
  GetSessionStatusResponse,
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
} from '../src/sessions';
import { RateLimitInfo, WasenderSuccessResponse } from '../src/messages';
import { createWasender, FetchImplementation } from '../src/main';
import { WasenderAPIError } from '../src/errors';

describe('Sessions tests', () => {
  it('should have tests', () => {
    expect(true).toBe(true);
  });
});

describe('Session Type Definitions', () => {
  const mockRateLimitInfo: RateLimitInfo = {
    limit: 100,
    remaining: 99,
    resetTimestamp: Date.now() / 1000 + 3600,
    getResetTimestampAsDate: () => new Date((mockRateLimitInfo.resetTimestamp || 0) * 1000),
  };

  const mockWhatsAppSession: WhatsAppSession = {
    id: 1,
    name: 'Business WhatsApp',
    phone_number: '+1234567890',
    status: 'connected',
    account_protection: true,
    log_messages: true,
    webhook_url: 'https://example.com/webhook',
    webhook_enabled: true,
    webhook_events: ['message', 'group_update'],
    created_at: '2025-04-01T12:00:00Z',
    updated_at: '2025-05-08T15:30:00Z',
  };

  describe('Core Data Structures', () => {
    it('WhatsAppSession type should be correct', () => {
      const session: WhatsAppSession = { ...mockWhatsAppSession };
      expect(session.id).toBe(1);
      expect(session.name).toBe('Business WhatsApp');
      expect(session.status).toBe<WhatsAppSessionStatus>('connected');
      expect(session.webhook_events).toEqual(['message', 'group_update']);
    });

    it('WhatsAppSessionStatus type should allow valid statuses', () => {
      const status1: WhatsAppSessionStatus = 'connected';
      const status2: WhatsAppSessionStatus = 'need_scan';
      expect(status1).toBe('connected');
      expect(status2).toBe('need_scan');
    });
  });

  describe('API Request Payloads', () => {
    it('CreateWhatsAppSessionPayload type should be correct (all fields)', () => {
      const payload: CreateWhatsAppSessionPayload = {
        name: 'Test Session',
        phone_number: '+19998887777',
        account_protection: false,
        log_messages: false,
        webhook_url: 'https://test.com/hook',
        webhook_enabled: true,
        webhook_events: ['messages.upsert'],
      };
      expect(payload.name).toBe('Test Session');
      expect(payload.webhook_events).toEqual(['messages.upsert']);
    });

    it('CreateWhatsAppSessionPayload type should be correct (required fields only)', () => {
      const payload: CreateWhatsAppSessionPayload = {
        name: 'Minimal Session',
        phone_number: '+12223334444',
        account_protection: true,
        log_messages: true,
      };
      expect(payload.name).toBe('Minimal Session');
      expect(payload.webhook_url).toBeUndefined();
    });

    it('UpdateWhatsAppSessionPayload type should allow partial updates', () => {
      const payload1: UpdateWhatsAppSessionPayload = { name: 'Updated Name' };
      const payload2: UpdateWhatsAppSessionPayload = { webhook_enabled: false, webhook_events: [] };
      const payload3: UpdateWhatsAppSessionPayload = {};
      expect(payload1.name).toBe('Updated Name');
      expect(payload2.webhook_events).toEqual([]);
      expect(payload3.name).toBeUndefined();
    });

    it('ConnectSessionPayload type should be correct', () => {
      const payload1: ConnectSessionPayload = { qr_as_image: true };
      const payload2: ConnectSessionPayload = { qr_as_image: false };
      const payload3: ConnectSessionPayload = {};
      expect(payload1.qr_as_image).toBe(true);
      expect(payload2.qr_as_image).toBe(false);
      expect(payload3.qr_as_image).toBeUndefined();
    });
  });

  describe('API Response Data Structures', () => {
    it('ConnectSessionResponseData type should be correct (NEED_SCAN)', () => {
      const data: ConnectSessionResponseData = {
        status: 'need_scan',
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACA...',
      };
      expect(data.status).toBe<WhatsAppSessionStatus>('need_scan');
      expect(data.qrCode).toBe('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACA...');
    });
    
    it('ConnectSessionResponseData type should be correct (CONNECTED)', () => {
      const data: ConnectSessionResponseData = {
        status: 'connected',
        message: 'Session already connected'
      };
      expect(data.status).toBe<WhatsAppSessionStatus>('connected');
      expect(data.message).toBe('Session already connected');
      expect(data.qrCode).toBeUndefined();
    });

    it('QRCodeResponseData type should be correct', () => {
      const data: QRCodeResponseData = {
        qrCode: 'data:image/png;base64,anotherQrCode...',
      };
      expect(data.qrCode).toBe('data:image/png;base64,anotherQrCode...');
    });

    it('DisconnectSessionResponseData type should be correct', () => {
      const data: DisconnectSessionResponseData = {
        status: 'disconnected',
        message: 'WhatsApp session disconnected successfully',
      };
      expect(data.status).toBe<WhatsAppSessionStatus>('disconnected');
      expect(data.message).toBe('WhatsApp session disconnected successfully');
    });
    
    it('RegenerateApiKeyResponse type should be correct', () => {
      const response: RegenerateApiKeyResponse = {
        success: true,
        api_key: 'new_whatsapp_api_key_abc456',
      };
      expect(response.success).toBe(true);
      expect(response.api_key).toBe('new_whatsapp_api_key_abc456');
    });

    it('SessionStatusData type should be correct', () => {
      const data: SessionStatusData = { status: 'connected' };
      expect(data.status).toBe<WhatsAppSessionStatus>('connected');
    });
  });

  describe('API Success Response Types', () => {
    it('GetAllWhatsAppSessionsResponse type should be correct', () => {
      const response: GetAllWhatsAppSessionsResponse = {
        success: true,
        message: 'Sessions retrieved successfully',
        data: [mockWhatsAppSession, { ...mockWhatsAppSession, id: 2, name: 'Support WhatsApp', status: 'disconnected' }],
      };
      expect(response.success).toBe(true);
      expect(response.message).toBe('Sessions retrieved successfully');
      expect(response.data.length).toBe(2);
      expect(response.data[0].id).toBe(1);
      expect(response.data[1].status).toBe<WhatsAppSessionStatus>('disconnected');
    });

    it('GetWhatsAppSessionDetailsResponse type should be correct', () => {
      const response: GetWhatsAppSessionDetailsResponse = {
        success: true,
        message: 'Session details retrieved',
        data: mockWhatsAppSession,
      };
      expect(response.success).toBe(true);
      expect(response.message).toBe('Session details retrieved');
      expect(response.data.name).toBe('Business WhatsApp');
    });

    it('CreateWhatsAppSessionResponse type should be correct', () => {
      const response: CreateWhatsAppSessionResponse = {
        success: true,
        message: 'Session created successfully',
        data: { ...mockWhatsAppSession, id: 3, status: 'disconnected' },
      };
      expect(response.success).toBe(true);
      expect(response.message).toBe('Session created successfully');
      expect(response.data.id).toBe(3);
      expect(response.data.status).toBe<WhatsAppSessionStatus>('disconnected');
    });

    it('UpdateWhatsAppSessionResponse type should be correct', () => {
      const response: UpdateWhatsAppSessionResponse = {
        success: true,
        message: 'Session updated successfully',
        data: { ...mockWhatsAppSession, name: 'Updated Session Name' },
      };
      expect(response.success).toBe(true);
      expect(response.message).toBe('Session updated successfully');
      expect(response.data.name).toBe('Updated Session Name');
    });

    it('DeleteWhatsAppSessionResponse type should be correct', () => {
      const response: DeleteWhatsAppSessionResponse = {
        success: true,
        message: 'Session deleted successfully',
        data: null,
      };
      expect(response.success).toBe(true);
      expect(response.message).toBe('Session deleted successfully');
      expect(response.data).toBeNull();
    });

    it('ConnectSessionResponse type should be correct', () => {
      const response: ConnectSessionResponse = {
        success: true,
        message: 'Connect action processed',
        data: { status: 'need_scan', qrCode: 'qrdata...' },
      };
      expect(response.success).toBe(true);
      expect(response.message).toBe('Connect action processed');
      expect(response.data.status).toBe<WhatsAppSessionStatus>('need_scan');
    });

    it('GetQRCodeResponse type should be correct', () => {
      const response: GetQRCodeResponse = {
        success: true,
        message: 'QR code retrieved',
        data: { qrCode: 'qrdata...' },
      };
      expect(response.success).toBe(true);
      expect(response.message).toBe('QR code retrieved');
      expect(response.data.qrCode).toBe('qrdata...');
    });

    it('DisconnectSessionResponse type should be correct', () => {
      const response: DisconnectSessionResponse = {
        success: true,
        message: 'Disconnect action processed',
        data: { status: 'disconnected', message: 'Disconnected.' },
      };
      expect(response.success).toBe(true);
      expect(response.message).toBe('Disconnect action processed');
      expect(response.data.status).toBe<WhatsAppSessionStatus>('disconnected');
    });
    
    it('GetSessionStatusResponse type should be correct (special structure)', () => {
      const response: GetSessionStatusResponse = {
        status: 'connected',
      };
      expect(response.status).toBe<WhatsAppSessionStatus>('connected');
      // Check for absence of success/data fields if that's the contract
      expect((response as any).success).toBeUndefined();
      expect((response as any).data).toBeUndefined();
    });
  });

  describe('Result Types (Response + RateLimitInfo)', () => {
    it('GetAllWhatsAppSessionsResult type should be correct', () => {
      const result: GetAllWhatsAppSessionsResult = {
        response: { success: true, message: 'Sessions retrieved', data: [mockWhatsAppSession] },
        rateLimit: mockRateLimitInfo,
      };
      expect(result.response.message).toBe('Sessions retrieved');
      expect(result.response.data[0].name).toBe('Business WhatsApp');
      expect(result.rateLimit).toBeDefined();
      if (result.rateLimit) {
        expect(result.rateLimit.limit).toBe(100);
      }
    });

    it('GetWhatsAppSessionDetailsResult type should be correct', () => {
      const result: GetWhatsAppSessionDetailsResult = {
        response: { success: true, message: 'Details retrieved', data: mockWhatsAppSession },
        rateLimit: mockRateLimitInfo,
      };
      expect(result.response.message).toBe('Details retrieved');
      expect(result.response.data.id).toBe(1);
      expect(result.rateLimit).toBeDefined();
      if (result.rateLimit) {
        expect(result.rateLimit.remaining).toBe(99);
      }
    });
    
    it('CreateWhatsAppSessionResult type should be correct', () => {
      const result: CreateWhatsAppSessionResult = {
        response: { success: true, message: 'Session created', data: mockWhatsAppSession },
        rateLimit: mockRateLimitInfo,
      };
      expect(result.response.message).toBe('Session created');
      expect(result.response.data.status).toBe('connected');
      expect(result.rateLimit).toBeDefined();
      if (result.rateLimit) {
        expect(result.rateLimit.limit).toBe(100);
      }
    });

    it('UpdateWhatsAppSessionResult type should be correct', () => {
      const result: UpdateWhatsAppSessionResult = {
        response: { success: true, message: 'Session updated', data: mockWhatsAppSession },
        rateLimit: mockRateLimitInfo,
      };
      expect(result.response.message).toBe('Session updated');
      expect(result.response.data.phone_number).toBe('+1234567890');
      expect(result.rateLimit).toBeDefined();
      if (result.rateLimit) {
        expect(result.rateLimit.remaining).toBe(99);
      }
    });

    it('DeleteWhatsAppSessionResult type should be correct', () => {
      const result: DeleteWhatsAppSessionResult = {
        response: { success: true, message: 'Session deleted', data: null },
        rateLimit: mockRateLimitInfo,
      };
      expect(result.response.message).toBe('Session deleted');
      expect(result.response.data).toBeNull();
      expect(result.rateLimit).toBeDefined();
      if (result.rateLimit) {
        expect(result.rateLimit.limit).toBe(100);
      }
    });

    it('ConnectSessionResult type should be correct', () => {
      const result: ConnectSessionResult = {
        response: { success: true, message: 'Connect action done', data: { status: 'need_scan', qrCode: 'testQR' } },
        rateLimit: mockRateLimitInfo,
      };
      expect(result.response.message).toBe('Connect action done');
      expect(result.response.data.qrCode).toBe('testQR');
      expect(result.rateLimit).toBeDefined();
      if (result.rateLimit) {
        expect(result.rateLimit.remaining).toBe(99);
      }
    });

    it('GetQRCodeResult type should be correct', () => {
      const result: GetQRCodeResult = {
        response: { success: true, message: 'QR code fetched', data: { qrCode: 'testQRagain' } },
        rateLimit: mockRateLimitInfo,
      };
      expect(result.response.message).toBe('QR code fetched');
      expect(result.response.data.qrCode).toBe('testQRagain');
      expect(result.rateLimit).toBeDefined();
      if (result.rateLimit) {
        expect(result.rateLimit.limit).toBe(100);
      }
    });

    it('DisconnectSessionResult type should be correct', () => {
      const result: DisconnectSessionResult = {
        response: { success: true, message: 'Disconnected action performed', data: { status: 'disconnected', message: 'Done' } },
        rateLimit: mockRateLimitInfo,
      };
      expect(result.response.message).toBe('Disconnected action performed');
      expect(result.response.data.message).toBe('Done');
      expect(result.rateLimit).toBeDefined();
      if (result.rateLimit) {
        expect(result.rateLimit.remaining).toBe(99);
      }
    });

    it('RegenerateApiKeyResult type should be correct', () => {
      const result: RegenerateApiKeyResult = {
        response: { success: true, api_key: 'newKey123' },
        rateLimit: mockRateLimitInfo,
      };
      expect(result.response.api_key).toBe('newKey123');
      expect(result.rateLimit).toBeDefined();
      if (result.rateLimit) {
        expect(result.rateLimit.limit).toBe(100);
      }
    });
    
    it('GetSessionStatusResult type should be correct', () => {
      const result: GetSessionStatusResult = {
        response: { status: 'logged_out' },
        rateLimit: mockRateLimitInfo,
      };
      expect(result.response.status).toBe<WhatsAppSessionStatus>('logged_out');
      expect(result.rateLimit).toBeDefined();
      if (result.rateLimit) {
        expect(result.rateLimit.remaining).toBe(99);
      }
    });
  });
});

// New tests for Personal Access Token
describe('Session endpoints personal token tests', () => {
  const apiKey = "sessionApiKey123"; // A session-specific API key
  const personalAccessToken = "patSuperSecretToken456"; // A Personal Access Token

  // Test account-scoped endpoints (should use personal token)
  test('getAllWhatsAppSessions should use personalAccessToken as Bearer token', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({ success: true, data: [] })
    }) as jest.MockedFunction<FetchImplementation>;

    const testWasender = createWasender(apiKey, personalAccessToken, undefined, mockFetch);
    await testWasender.getAllWhatsAppSessions();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/whatsapp-sessions'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': `Bearer ${personalAccessToken}`
        })
      })
    );
  });

  // Test /status endpoint (should use personalAccessToken)
  test('getSessionStatus should use personalAccessToken as Bearer token', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({ status: 'connected' })
    }) as jest.MockedFunction<FetchImplementation>;

    const testWasender = createWasender(apiKey, personalAccessToken, undefined, mockFetch);
    await testWasender.getSessionStatus();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/status'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': `Bearer ${personalAccessToken}`
        })
      })
    );
  });

  // Test error handling when personalAccessToken is missing for an account-scoped endpoint
  test('getAllWhatsAppSessions should throw WasenderAPIError when personalAccessToken is missing', async () => {
    // Initialize SDK without personalAccessToken (passing undefined for it)
    const testWasender = createWasender(apiKey, undefined);

    // We expect this to throw because the request method will find personalAccessToken to be undefined
    // for an account-scoped path and throw an error before making a fetch call.
    await expect(testWasender.getAllWhatsAppSessions()).rejects.toThrow(WasenderAPIError);
    await expect(testWasender.getAllWhatsAppSessions()).rejects.toThrow(
        "Personal Access Token is required for this operation but was not provided during SDK initialization."
    );
  });

  // Test successful session creation with personalAccessToken
  test('createWhatsAppSession should use personalAccessToken as Bearer token', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({
        success: true,
        data: {
          id: 1,
          name: 'Test Session',
          status: 'disconnected'
        }
      })
    }) as jest.MockedFunction<FetchImplementation>;

    const testWasender = createWasender(apiKey, personalAccessToken, undefined, mockFetch);
    const result = await testWasender.createWhatsAppSession({
      name: 'Test Session',
      phone_number: '+1234567890',
      account_protection: true,
      log_messages: true
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/whatsapp-sessions'), // Path for create is /whatsapp-sessions
      expect.objectContaining({
        method: 'POST', // Ensure it's a POST request
        headers: expect.objectContaining({
          'Authorization': `Bearer ${personalAccessToken}`
        }),
        body: JSON.stringify({
          name: 'Test Session',
          phone_number: '+1234567890',
          account_protection: true,
          log_messages: true
        })
      })
    );
    expect(result.response.success).toBe(true);
  });

  // Test that a non-session-management endpoint (e.g., getContacts) uses apiKey
  test('getContacts should use apiKey as Bearer token when PAT is also present', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({ success: true, data: [] })
    }) as jest.MockedFunction<FetchImplementation>;

    const testWasender = createWasender(apiKey, personalAccessToken, undefined, mockFetch);
    await testWasender.getContacts(); // Assuming getContacts is a method that uses apiKey

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/contacts'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': `Bearer ${apiKey}`
        })
      })
    );
  });

 test('getContacts should throw WasenderAPIError if only PAT is provided and apiKey is undefined', async () => {
    const testWasender = createWasender(undefined, personalAccessToken);
    await expect(testWasender.getContacts()).rejects.toThrow(WasenderAPIError);
    await expect(testWasender.getContacts()).rejects.toThrow(
        "Session API Key is required for this operation but was not provided or is not applicable."
    );
 });

});
