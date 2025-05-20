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
import { createWasender } from '../src/main';
import { WasenderAPIError } from '../src/errors';
import '@jest/globals';

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
    status: 'CONNECTED',
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
      expect(session.status).toBe<WhatsAppSessionStatus>('CONNECTED');
      expect(session.webhook_events).toEqual(['message', 'group_update']);
    });

    it('WhatsAppSessionStatus type should allow valid statuses', () => {
      const status1: WhatsAppSessionStatus = 'CONNECTED';
      const status2: WhatsAppSessionStatus = 'NEED_SCAN';
      expect(status1).toBe('CONNECTED');
      expect(status2).toBe('NEED_SCAN');
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
        status: 'NEED_SCAN',
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACA...',
      };
      expect(data.status).toBe<WhatsAppSessionStatus>('NEED_SCAN');
      expect(data.qrCode).toBe('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACA...');
    });
    
    it('ConnectSessionResponseData type should be correct (CONNECTED)', () => {
      const data: ConnectSessionResponseData = {
        status: 'CONNECTED',
        message: 'Session already connected'
      };
      expect(data.status).toBe<WhatsAppSessionStatus>('CONNECTED');
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
        status: 'DISCONNECTED',
        message: 'WhatsApp session disconnected successfully',
      };
      expect(data.status).toBe<WhatsAppSessionStatus>('DISCONNECTED');
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
      const data: SessionStatusData = { status: 'CONNECTED' };
      expect(data.status).toBe<WhatsAppSessionStatus>('CONNECTED');
    });
  });

  describe('API Success Response Types', () => {
    it('GetAllWhatsAppSessionsResponse type should be correct', () => {
      const response: GetAllWhatsAppSessionsResponse = {
        success: true,
        message: 'Sessions retrieved successfully',
        data: [mockWhatsAppSession, { ...mockWhatsAppSession, id: 2, name: 'Support WhatsApp', status: 'DISCONNECTED' }],
      };
      expect(response.success).toBe(true);
      expect(response.message).toBe('Sessions retrieved successfully');
      expect(response.data.length).toBe(2);
      expect(response.data[0].id).toBe(1);
      expect(response.data[1].status).toBe<WhatsAppSessionStatus>('DISCONNECTED');
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
        data: { ...mockWhatsAppSession, id: 3, status: 'DISCONNECTED' },
      };
      expect(response.success).toBe(true);
      expect(response.message).toBe('Session created successfully');
      expect(response.data.id).toBe(3);
      expect(response.data.status).toBe<WhatsAppSessionStatus>('DISCONNECTED');
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
        data: { status: 'NEED_SCAN', qrCode: 'qrdata...' },
      };
      expect(response.success).toBe(true);
      expect(response.message).toBe('Connect action processed');
      expect(response.data.status).toBe<WhatsAppSessionStatus>('NEED_SCAN');
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
        data: { status: 'DISCONNECTED', message: 'Disconnected.' },
      };
      expect(response.success).toBe(true);
      expect(response.message).toBe('Disconnect action processed');
      expect(response.data.status).toBe<WhatsAppSessionStatus>('DISCONNECTED');
    });
    
    it('GetSessionStatusResponse type should be correct (special structure)', () => {
      const response: GetSessionStatusResponse = {
        status: 'CONNECTED',
      };
      expect(response.status).toBe<WhatsAppSessionStatus>('CONNECTED');
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
      expect(result.rateLimit.limit).toBe(100);
    });

    it('GetWhatsAppSessionDetailsResult type should be correct', () => {
      const result: GetWhatsAppSessionDetailsResult = {
        response: { success: true, message: 'Details retrieved', data: mockWhatsAppSession },
        rateLimit: mockRateLimitInfo,
      };
      expect(result.response.message).toBe('Details retrieved');
      expect(result.response.data.id).toBe(1);
      expect(result.rateLimit.remaining).toBe(99);
    });
    
    it('CreateWhatsAppSessionResult type should be correct', () => {
      const result: CreateWhatsAppSessionResult = {
        response: { success: true, message: 'Session created', data: mockWhatsAppSession },
        rateLimit: mockRateLimitInfo,
      };
      expect(result.response.message).toBe('Session created');
      expect(result.response.data.status).toBe('CONNECTED');
      expect(result.rateLimit.limit).toBe(100);
    });

    it('UpdateWhatsAppSessionResult type should be correct', () => {
      const result: UpdateWhatsAppSessionResult = {
        response: { success: true, message: 'Session updated', data: mockWhatsAppSession },
        rateLimit: mockRateLimitInfo,
      };
      expect(result.response.message).toBe('Session updated');
      expect(result.response.data.phone_number).toBe('+1234567890');
      expect(result.rateLimit.remaining).toBe(99);
    });

    it('DeleteWhatsAppSessionResult type should be correct', () => {
      const result: DeleteWhatsAppSessionResult = {
        response: { success: true, message: 'Session deleted', data: null },
        rateLimit: mockRateLimitInfo,
      };
      expect(result.response.message).toBe('Session deleted');
      expect(result.response.data).toBeNull();
      expect(result.rateLimit.limit).toBe(100);
    });

    it('ConnectSessionResult type should be correct', () => {
      const result: ConnectSessionResult = {
        response: { success: true, message: 'Connect action done', data: { status: 'NEED_SCAN', qrCode: 'testQR' } },
        rateLimit: mockRateLimitInfo,
      };
      expect(result.response.message).toBe('Connect action done');
      expect(result.response.data.qrCode).toBe('testQR');
      expect(result.rateLimit.remaining).toBe(99);
    });

    it('GetQRCodeResult type should be correct', () => {
      const result: GetQRCodeResult = {
        response: { success: true, message: 'QR code fetched', data: { qrCode: 'testQRagain' } },
        rateLimit: mockRateLimitInfo,
      };
      expect(result.response.message).toBe('QR code fetched');
      expect(result.response.data.qrCode).toBe('testQRagain');
      expect(result.rateLimit.limit).toBe(100);
    });

    it('DisconnectSessionResult type should be correct', () => {
      const result: DisconnectSessionResult = {
        response: { success: true, message: 'Disconnected action performed', data: { status: 'DISCONNECTED', message: 'Done' } },
        rateLimit: mockRateLimitInfo,
      };
      expect(result.response.message).toBe('Disconnected action performed');
      expect(result.response.data.message).toBe('Done');
      expect(result.rateLimit.remaining).toBe(99);
    });

    it('RegenerateApiKeyResult type should be correct', () => {
      const result: RegenerateApiKeyResult = {
        response: { success: true, api_key: 'newKey123' },
        rateLimit: mockRateLimitInfo,
      };
      expect(result.response.api_key).toBe('newKey123');
      expect(result.rateLimit.limit).toBe(100);
    });
    
    it('GetSessionStatusResult type should be correct', () => {
      const result: GetSessionStatusResult = {
        response: { status: 'LOGGED_OUT' },
        rateLimit: mockRateLimitInfo,
      };
      expect(result.response.status).toBe<WhatsAppSessionStatus>('LOGGED_OUT');
      expect(result.rateLimit.remaining).toBe(99);
    });
  });
});

describe('Session endpoints personal token tests', () => {
  const apiKey = "apiKey123";
  const personalToken = "personalToken123";

  const wasenderapi = createWasender(apiKey, undefined, undefined, undefined, undefined, personalToken);

  // Test account-scoped endpoints (should use personal token)
  test('getAllWhatsAppSessions should use personal token as Bearer token', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({ success: true, data: [] })
    });

    const testWasender = createWasender(apiKey, undefined, mockFetch, undefined, undefined, personalToken);
    await testWasender.getAllWhatsAppSessions();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': `Bearer ${personalToken}`
        })
      })
    );
  });

  // Test session-scoped endpoint (should use API key as Bearer token)
  test('getSessionStatus should use API key as Bearer token', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({ status: 'CONNECTED' })
    });

    const testWasender = createWasender(apiKey, undefined, mockFetch, undefined, undefined, personalToken);
    await testWasender.getSessionStatus();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': `Bearer ${apiKey}`
        })
      })
    );
  });

  // Test error handling when personal token is missing for account-scoped endpoint
  test('should throw error when personal token is missing for account-scoped endpoint', async () => {
    const testWasender = createWasender(apiKey);
    
    await expect(testWasender.getAllWhatsAppSessions()).rejects.toThrow(WasenderAPIError);
  });

  // Test successful session creation with personal token
  test('createWhatsAppSession should use personal token as Bearer token', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({
        success: true,
        data: {
          id: 1,
          name: 'Test Session',
          status: 'DISCONNECTED'
        }
      })
    });

    const testWasender = createWasender(apiKey, undefined, mockFetch, undefined, undefined, personalToken);
    const result = await testWasender.createWhatsAppSession({
      name: 'Test Session',
      phone_number: '+1234567890',
      account_protection: true,
      log_messages: true
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': `Bearer ${personalToken}`
        })
      })
    );
    expect(result.response.success).toBe(true);
  });
});
