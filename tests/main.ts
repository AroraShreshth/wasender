import fetchMock from 'jest-fetch-mock';
import { Wasender } from '../src/main';

// beforeAll(() => { // Removed as fetchMock.enableMocks() is now in tests/setup.ts
//   fetchMock.enableMocks();
// });

afterEach(() => {
  fetchMock.resetMocks();
});

describe('Wasender SDK', () => {
  it('sends text payload with correct headers', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ success: true, message: 'ok' }));

    const sdk = new Wasender('API_KEY');
    const res = await sdk.sendText({ to: '+123', text: 'yo' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('https://www.wasenderapi.com/api/send-message');
    expect(opts?.headers).toMatchObject({
      Authorization: 'Bearer API_KEY',
      'Content-Type': 'application/json'
    });
    expect(res.response.message).toBe('ok');
  });
});