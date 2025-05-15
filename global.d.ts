// global.d.ts
declare module 'jest-fetch-mock' {
  import { Mock } from 'jest-mock';
  const fetchMock: Mock;
  export default fetchMock;
} 