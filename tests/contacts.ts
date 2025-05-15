import {
  Contact,
  GetAllContactsResponse,
  GetContactInfoResponse,
  GetContactProfilePictureResponse,
  ContactActionResponse,
  GetAllContactsResult,
  GetContactInfoResult,
  GetContactProfilePictureResult,
  ContactActionResult,
} from '../src/contacts';
import { RateLimitInfo } from '../src/messages';

describe('Contact Type Definitions', () => {
  const mockRateLimitInfo: RateLimitInfo = {
    limit: 100,
    remaining: 99,
    resetTimestamp: Date.now() / 1000 + 3600,
    getResetTimestampAsDate: () => new Date((mockRateLimitInfo.resetTimestamp || 0) * 1000),
  };

  const mockContact: Contact = {
    jid: '1234567890',
    name: 'Contact Name',
    notify: 'Contact Display Name',
    verifiedName: 'Verified Business Name',
    imgUrl: 'https://profile.pic.url/image.jpg',
    status: 'Hey there! I am using WhatsApp.',
  };

  describe('Core Data Structures', () => {
    it('Contact type should be correct (all fields)', () => {
      const contact: Contact = { ...mockContact, exists: true };
      expect(contact.jid).toBe('1234567890');
      expect(contact.name).toBe('Contact Name');
      expect(contact.notify).toBe('Contact Display Name');
      expect(contact.verifiedName).toBe('Verified Business Name');
      expect(contact.imgUrl).toBe('https://profile.pic.url/image.jpg');
      expect(contact.status).toBe('Hey there! I am using WhatsApp.');
      expect(contact.exists).toBe(true);
    });

    it('Contact type should allow optional fields to be undefined', () => {
      const minimalContact: Contact = {
        jid: '0987654321',
      };
      expect(minimalContact.jid).toBe('0987654321');
      expect(minimalContact.name).toBeUndefined();
      expect(minimalContact.notify).toBeUndefined();
      expect(minimalContact.verifiedName).toBeUndefined();
      expect(minimalContact.imgUrl).toBeUndefined();
      expect(minimalContact.status).toBeUndefined();
      expect(minimalContact.exists).toBeUndefined();
    });
  });

  describe('API Response Types', () => {
    it('GetAllContactsResponse type should be correct', () => {
      const response: GetAllContactsResponse = {
        success: true,
        message: 'Contacts retrieved successfully',
        data: [mockContact, { ...mockContact, jid: '1122334455', name: 'Another Contact' }],
      };
      expect(response.success).toBe(true);
      expect(response.message).toBe('Contacts retrieved successfully');
      expect(response.data.length).toBe(2);
      expect(response.data[0].jid).toBe('1234567890');
      expect(response.data[1].name).toBe('Another Contact');
    });

    it('GetContactInfoResponse type should be correct', () => {
      const response: GetContactInfoResponse = {
        success: true,
        message: 'Contact info retrieved',
        data: { ...mockContact, exists: true },
      };
      expect(response.success).toBe(true);
      expect(response.message).toBe('Contact info retrieved');
      expect(response.data.jid).toBe('1234567890');
      expect(response.data.exists).toBe(true);
    });

    it('GetContactProfilePictureResponse type should be correct (with imgUrl)', () => {
      const response: GetContactProfilePictureResponse = {
        success: true,
        message: 'Profile picture URL retrieved',
        data: {
          imgUrl: 'https://profile.pic.url/image.jpg',
        },
      };
      expect(response.success).toBe(true);
      expect(response.message).toBe('Profile picture URL retrieved');
      expect(response.data.imgUrl).toBe('https://profile.pic.url/image.jpg');
    });

    it('GetContactProfilePictureResponse type should be correct (null imgUrl)', () => {
      const response: GetContactProfilePictureResponse = {
        success: true,
        message: 'Profile picture URL retrieved, but not set',
        data: {
          imgUrl: null,
        },
      };
      expect(response.success).toBe(true);
      expect(response.message).toBe('Profile picture URL retrieved, but not set');
      expect(response.data.imgUrl).toBeNull();
    });

    it('ContactActionResponse type should be correct (block)', () => {
      const response: ContactActionResponse = {
        success: true,
        message: 'Contact action successful', // Outer message for the success response itself
        data: {
          message: 'Contact blocked', // Inner message specific to the data payload
        },
      };
      expect(response.success).toBe(true);
      expect(response.message).toBe('Contact action successful');
      expect(response.data.message).toBe('Contact blocked');
    });

    it('ContactActionResponse type should be correct (unblock)', () => {
      const response: ContactActionResponse = {
        success: true,
        message: 'Contact action successful',
        data: {
          message: 'Contact unblocked',
        },
      };
      expect(response.success).toBe(true);
      expect(response.data.message).toBe('Contact unblocked');
    });
  });

  describe('Result Types (Response + RateLimitInfo)', () => {
    it('GetAllContactsResult type should be correct', () => {
      const result: GetAllContactsResult = {
        response: {
          success: true,
          message: 'Fetched contacts',
          data: [mockContact],
        },
        rateLimit: mockRateLimitInfo,
      };
      expect(result.response.data[0].name).toBe('Contact Name');
      expect(result.rateLimit.limit).toBe(100);
    });

    it('GetContactInfoResult type should be correct', () => {
      const result: GetContactInfoResult = {
        response: {
          success: true,
          message: 'Fetched contact info',
          data: { ...mockContact, exists: false },
        },
        rateLimit: mockRateLimitInfo,
      };
      expect(result.response.data.jid).toBe('1234567890');
      expect(result.response.data.exists).toBe(false);
      expect(result.rateLimit.remaining).toBe(99);
    });

    it('GetContactProfilePictureResult type should be correct', () => {
      const result: GetContactProfilePictureResult = {
        response: {
          success: true,
          message: 'Fetched profile picture',
          data: { imgUrl: 'https://some.url/pic.png' },
        },
        rateLimit: mockRateLimitInfo,
      };
      expect(result.response.data.imgUrl).toBe('https://some.url/pic.png');
      expect(result.rateLimit.resetTimestamp).toBeGreaterThan(0);
    });

    it('ContactActionResult type should be correct', () => {
      const result: ContactActionResult = {
        response: {
          success: true,
          message: 'Action performed',
          data: { message: 'Contact blocked successfully' },
        },
        rateLimit: mockRateLimitInfo,
      };
      expect(result.response.data.message).toBe('Contact blocked successfully');
      expect(result.rateLimit.getResetTimestampAsDate!()).toBeInstanceOf(Date);
    });
  });
});
