import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'equipmentImages',
  access: (allow) => ({
    'equipment/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.groups(['admin']).to(['read', 'write', 'delete']),
    ],
  }),
});
