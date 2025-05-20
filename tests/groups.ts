import {
  GroupParticipant,
  BasicGroupInfo,
  GroupMetadata,
  ModifyGroupParticipantsPayload,
  UpdateGroupSettingsPayload,
  ParticipantActionStatus,
  UpdateGroupSettingsResponseData,
  GetAllGroupsResponse,
  GetGroupMetadataResponse,
  GetGroupParticipantsResponse,
  ModifyGroupParticipantsResponse,
  UpdateGroupSettingsResponse,
  GetAllGroupsResult,
  GetGroupMetadataResult,
  GetGroupParticipantsResult,
  ModifyGroupParticipantsResult,
  UpdateGroupSettingsResult,
} from '../src/groups';
import { RateLimitInfo } from '../src/messages';

describe('Groups tests', () => {
  it('should have tests', () => {
    expect(true).toBe(true);
  });
});

describe('Group Type Definitions', () => {


  const mockAdminParticipant: GroupParticipant = {
    id: 'admin@s.whatsapp.net',
    admin: "superadmin",
  };

  const mockParticipant: GroupParticipant = {
    id: 'participant@s.whatsapp.net',
  };

  const mockBasicGroupInfo: BasicGroupInfo = {
    id: '1234567890-1234567890@g.us',
    name: 'Test Group Name',
    imgUrl: 'https://group.pic/image.png',
  };
  
  const mockBasicGroupInfoNulls: BasicGroupInfo = {
    id: '1234567890-1234567891@g.us',
    name: null,
    imgUrl: null,
  };

  const mockGroupMetadata: GroupMetadata = {
    ...mockBasicGroupInfo,
    creation: 1678886400,
    owner: 'owner@s.whatsapp.net',
    desc: 'This is a test group description.',
    participants: [mockAdminParticipant, mockParticipant],
    subject: 'Test Group Subject',
  };

  describe('Core Data Structures', () => {
    it('GroupParticipant type should be correct', () => {
      const admin: GroupParticipant = { ...mockAdminParticipant };
      expect(admin.id).toBe('admin@s.whatsapp.net');
      expect(admin.admin).toBe("superadmin");

      const member: GroupParticipant = { ...mockParticipant };
      expect(member.admin).toBe(undefined);
    });

    it('BasicGroupInfo type should be correct', () => {
      const group: BasicGroupInfo = { ...mockBasicGroupInfo };
      expect(group.id).toBe('1234567890-1234567890@g.us');
      expect(group.name).toBe('Test Group Name');
      expect(group.imgUrl).toBe('https://group.pic/image.png');
      
      const groupNulls: BasicGroupInfo = { ...mockBasicGroupInfoNulls };
      expect(groupNulls.name).toBeNull();
      expect(groupNulls.imgUrl).toBeNull();
    });

    it('GroupMetadata type should be correct', () => {
      const metadata: GroupMetadata = { ...mockGroupMetadata };
      expect(metadata.id).toBe(mockBasicGroupInfo.id);
      expect(metadata.creation).toBe(1678886400);
      expect(metadata.owner).toBe('owner@s.whatsapp.net');
      expect(metadata.desc).toBe('This is a test group description.');
      expect(metadata.participants.length).toBe(2);
      expect(metadata.participants[0].admin).toBe("superadmin");
      expect(metadata.subject).toBe('Test Group Subject');
    });
     it('GroupMetadata type should allow optional owner and desc', () => {
      const minimalMetadata: GroupMetadata = {
        id: 'groupjid@g.us',
        name: 'Minimal Group',
        imgUrl: null,
        creation: 1678886401,
        owner: undefined,
        participants: [mockParticipant],
        subject : 'Minimal Subject',
      };
      expect(minimalMetadata.owner).toBeUndefined();
      expect(minimalMetadata.desc).toBeUndefined();
      expect(minimalMetadata.subject).toBe('Minimal Subject');
    });
  });

  describe('API Request Payloads', () => {
    it('ModifyGroupParticipantsPayload type should be correct', () => {
      const payload: ModifyGroupParticipantsPayload = {
        participants: ['1234567890', '0987654321'],
      };
      expect(payload.participants.length).toBe(2);
      expect(payload.participants).toContain('1234567890');
    });

    it('UpdateGroupSettingsPayload type should be correct (all fields)', () => {
      const payload: UpdateGroupSettingsPayload = {
        subject: 'New Subject',
        description: 'New Description',
        announce: true,
        restrict: true,
      };
      expect(payload.subject).toBe('New Subject');
      expect(payload.announce).toBe(true);
    });

    it('UpdateGroupSettingsPayload type should allow partial updates', () => {
      const payload1: UpdateGroupSettingsPayload = { subject: 'Only Subject' };
      const payload2: UpdateGroupSettingsPayload = { announce: false };
      const payload3: UpdateGroupSettingsPayload = {};
      expect(payload1.subject).toBe('Only Subject');
      expect(payload1.description).toBeUndefined();
      expect(payload2.announce).toBe(false);
      expect(payload3.restrict).toBeUndefined();
    });
  });

  describe('API Response Data Structures', () => {
    it('ParticipantActionStatus type should be correct', () => {
      const status1: ParticipantActionStatus = { status: 200, jid: '123', message: 'added' };
      const status2: ParticipantActionStatus = { status: 403, jid: '456', message: 'not-authorized' };
      expect(status1.status).toBe(200);
      expect(status1.message).toBe('added');
      expect(status2.jid).toBe('456');
    });

    it('UpdateGroupSettingsResponseData type should be correct', () => {
      const data: UpdateGroupSettingsResponseData = {
        subject: 'Updated Subject',
        description: 'Updated Description',
      };
      expect(data.subject).toBe('Updated Subject');
      expect(data.description).toBe('Updated Description');
       const partialData: UpdateGroupSettingsResponseData = {
        subject: 'Only Subject Updated',
      };
      expect(partialData.subject).toBe('Only Subject Updated');
      expect(partialData.description).toBeUndefined();
    });
  });

  describe('API Success Response Types', () => {
    it('GetAllGroupsResponse type should be correct', () => {
      const response: GetAllGroupsResponse = {
        success: true,
        message: 'Groups retrieved',
        data: [mockBasicGroupInfo, mockBasicGroupInfoNulls],
      };
      expect(response.success).toBe(true);
      expect(response.data.length).toBe(2);
      expect(response.data[0].name).toBe('Test Group Name');
      expect(response.data[1].name).toBeNull();
    });

    it('GetGroupMetadataResponse type should be correct', () => {
      const response: GetGroupMetadataResponse = {
        success: true,
        message: 'Metadata retrieved',
        data: mockGroupMetadata,
      };
      expect(response.success).toBe(true);
      expect(response.data.desc).toBe('This is a test group description.');
    });

    it('GetGroupParticipantsResponse type should be correct', () => {
      const response: GetGroupParticipantsResponse = {
        success: true,
        message: 'Participants retrieved',
        data: [mockAdminParticipant, mockParticipant],
      };
      expect(response.success).toBe(true);
      expect(response.data.length).toBe(2);
      expect(response.data[0].admin).toBe('superadmin');
    });

    it('ModifyGroupParticipantsResponse type should be correct', () => {
      const actionStatus1: ParticipantActionStatus = { status: 200, jid: '123', message: 'added' };
      const actionStatus2: ParticipantActionStatus = { status: 403, jid: '456', message: 'not-authorized' };
      const response: ModifyGroupParticipantsResponse = {
        success: true,
        message: 'Participant modification processed',
        data: [actionStatus1, actionStatus2],
      };
      expect(response.success).toBe(true);
      expect(response.data[0].status).toBe(200);
      expect(response.data[1].message).toBe('not-authorized');
    });

    it('UpdateGroupSettingsResponse type should be correct', () => {
      const response: UpdateGroupSettingsResponse = {
        success: true,
        message: 'Settings updated',
        data: { subject: 'Final Subject', description: 'Final Description' },
      };
      expect(response.success).toBe(true);
      expect(response.data.subject).toBe('Final Subject');
    });
  });

  describe('Result Types (Response + RateLimitInfo)', () => {
    it('GetAllGroupsResult type should be correct', () => {
      const result: GetAllGroupsResult = {
        response: { success: true, message: 'Groups fetched', data: [mockBasicGroupInfo] },
      };
      expect(result.response.data[0].id).toBe(mockBasicGroupInfo.id);
    });

    it('GetGroupMetadataResult type should be correct', () => {
      const result: GetGroupMetadataResult = {
        response: { success: true, message: 'Metadata fetched', data: mockGroupMetadata },
      };
      expect(result.response.data.owner).toBe('owner@s.whatsapp.net');
    });

    it('GetGroupParticipantsResult type should be correct', () => {
      const result: GetGroupParticipantsResult = {
        response: { success: true, message: 'Participants fetched', data: [mockParticipant] },
      };
      expect(result.response.data[0].admin).toBe(undefined);
    });

    it('ModifyGroupParticipantsResult type should be correct', () => {
      const result: ModifyGroupParticipantsResult = {
        response: {
          success: true,
          message: 'Participants modified',
          data: [{ status: 200, jid: 'p1', message: 'added' }],
        },
      };
      expect(result.response.data[0].message).toBe('added');
    });

    it('UpdateGroupSettingsResult type should be correct', () => {
      const result: UpdateGroupSettingsResult = {
        response: {
          success: true,
          message: 'Settings changed',
          data: { description: 'Desc only' },
        },
      };
      expect(result.response.data.description).toBe('Desc only');
    });
  });
});
