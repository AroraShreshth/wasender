import {
  TextMessage,
  ImageUrlMessage,
  VideoUrlMessage,
  DocumentUrlMessage,
  AudioUrlMessage,
  StickerUrlMessage,
  ContactCardMessage,
  LocationPinMessage,
  ContactCardPayload,
  LocationPinPayload,
} from '../src/messages';

describe('Message type guards', () => {
  it('recognizes TextMessage correctly', () => {
    const msg: TextMessage = { to: '+1', text: 'hello', messageType: 'text' };
    expect(msg.messageType).toBe('text');
    expect(msg.text).toBe('hello');
  });

  it('recognizes ImageUrlMessage correctly', () => {
    const msgWithCaption: ImageUrlMessage = {
      to: '+1',
      messageType: 'image',
      imageUrl: 'http://example.com/image.png',
      text: 'caption',
    };
    expect(msgWithCaption.messageType).toBe('image');
    expect(msgWithCaption.imageUrl).toBe('http://example.com/image.png');
    expect(msgWithCaption.text).toBe('caption');

    const msgWithoutCaption: ImageUrlMessage = {
      to: '+1',
      messageType: 'image',
      imageUrl: 'http://example.com/image.jpg',
    };
    expect(msgWithoutCaption.messageType).toBe('image');
    expect(msgWithoutCaption.imageUrl).toBe('http://example.com/image.jpg');
    expect(msgWithoutCaption.text).toBeUndefined();
  });

  it('recognizes VideoUrlMessage correctly', () => {
    const msgWithCaption: VideoUrlMessage = {
      to: '+1',
      messageType: 'video',
      videoUrl: 'http://example.com/video.mp4',
      text: 'watch this',
    };
    expect(msgWithCaption.messageType).toBe('video');
    expect(msgWithCaption.videoUrl).toBe('http://example.com/video.mp4');
    expect(msgWithCaption.text).toBe('watch this');

    const msgWithoutCaption: VideoUrlMessage = {
      to: '+1',
      messageType: 'video',
      videoUrl: 'http://example.com/video.mov',
    };
    expect(msgWithoutCaption.messageType).toBe('video');
    expect(msgWithoutCaption.videoUrl).toBe('http://example.com/video.mov');
    expect(msgWithoutCaption.text).toBeUndefined();
  });

  it('recognizes DocumentUrlMessage correctly', () => {
    const msgWithCaption: DocumentUrlMessage = {
      to: '+1',
      messageType: 'document',
      documentUrl: 'http://example.com/doc.pdf',
      text: 'important doc',
    };
    expect(msgWithCaption.messageType).toBe('document');
    expect(msgWithCaption.documentUrl).toBe('http://example.com/doc.pdf');
    expect(msgWithCaption.text).toBe('important doc');

    const msgWithoutCaption: DocumentUrlMessage = {
      to: '+1',
      messageType: 'document',
      documentUrl: 'http://example.com/doc.docx',
    };
    expect(msgWithoutCaption.messageType).toBe('document');
    expect(msgWithoutCaption.documentUrl).toBe('http://example.com/doc.docx');
    expect(msgWithoutCaption.text).toBeUndefined();
  });

  it('recognizes AudioUrlMessage correctly', () => {
    const msgWithText: AudioUrlMessage = { // API allows text, though typically not used for voice notes
      to: '+1',
      messageType: 'audio',
      audioUrl: 'http://example.com/audio.mp3',
      text: 'listen',
    };
    expect(msgWithText.messageType).toBe('audio');
    expect(msgWithText.audioUrl).toBe('http://example.com/audio.mp3');
    expect(msgWithText.text).toBe('listen');
    
    const msgWithoutText: AudioUrlMessage = {
      to: '+1',
      messageType: 'audio',
      audioUrl: 'http://example.com/audio.ogg',
    };
    expect(msgWithoutText.messageType).toBe('audio');
    expect(msgWithoutText.audioUrl).toBe('http://example.com/audio.ogg');
    expect(msgWithoutText.text).toBeUndefined();
  });

  it('recognizes StickerUrlMessage correctly', () => {
    const msg: StickerUrlMessage = {
      to: '+1',
      messageType: 'sticker',
      stickerUrl: 'http://example.com/sticker.webp',
    };
    expect(msg.messageType).toBe('sticker');
    expect(msg.stickerUrl).toBe('http://example.com/sticker.webp');
    expect(msg.text).toBeUndefined(); // text is 'never' for stickers
  });

  it('recognizes ContactCardMessage correctly', () => {
    const contactPayload: ContactCardPayload = {
      name: 'John Doe',
      phone: '+1234567890',
    };
    const msgWithCaption: ContactCardMessage = {
      to: '+1',
      messageType: 'contact',
      contact: contactPayload,
      text: 'John\'s contact',
    };
    expect(msgWithCaption.messageType).toBe('contact');
    expect(msgWithCaption.contact).toEqual(contactPayload);
    expect(msgWithCaption.text).toBe('John\'s contact');

    const msgWithoutCaption: ContactCardMessage = {
      to: '+1',
      messageType: 'contact',
      contact: contactPayload,
    };
    expect(msgWithoutCaption.messageType).toBe('contact');
    expect(msgWithoutCaption.contact).toEqual(contactPayload);
    expect(msgWithoutCaption.text).toBeUndefined();
  });

  it('recognizes LocationPinMessage correctly', () => {
    const locationPayload: LocationPinPayload = {
      latitude: 37.7749,
      longitude: -122.4194,
      name: 'SF Office',
      address: '123 Main St',
    };
    const msgWithCaption: LocationPinMessage = {
      to: '+1',
      messageType: 'location',
      location: locationPayload,
      text: 'Meet here',
    };
    expect(msgWithCaption.messageType).toBe('location');
    expect(msgWithCaption.location).toEqual(locationPayload);
    expect(msgWithCaption.text).toBe('Meet here');

    const msgWithoutCaption: LocationPinMessage = {
      to: '+1',
      messageType: 'location',
      location: { latitude: '10.0', longitude: '-20.5' }, // Test with string lat/long
    };
    expect(msgWithoutCaption.messageType).toBe('location');
    expect(msgWithoutCaption.location.latitude).toBe('10.0');
    expect(msgWithoutCaption.location.longitude).toBe('-20.5');
    expect(msgWithoutCaption.text).toBeUndefined();
  });
});