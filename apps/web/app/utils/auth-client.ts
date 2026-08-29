import { emailOTPClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/vue';

export const authClient = createAuthClient({
  basePath: '/api/v1/auth',
  plugins: [emailOTPClient()],
});
