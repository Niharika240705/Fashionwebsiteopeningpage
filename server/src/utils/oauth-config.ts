const PLACEHOLDER_ID = 'your-google-client-id-here';
const PLACEHOLDER_SECRET = 'your-google-client-secret-here';

export function isGoogleOAuthConfigured(): boolean {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  return Boolean(id && secret && id !== PLACEHOLDER_ID && secret !== PLACEHOLDER_SECRET);
}
