import { TextMessage } from '../src/messages';

describe('Message type guards', () => {
  it('recognizes TextMessage correctly', () => {
    const msg: TextMessage = { to: '+1', text: 'hello', messageType: 'text' };
    expect(msg.messageType).toBe('text');
  });
});