import { defineFunction } from '@aws-amplify/backend';

export const fetchImageFn = defineFunction({
  name: 'fetchImage',
  entry: './handler.ts',
  timeoutSeconds: 30,
  memoryMB: 256,
});
