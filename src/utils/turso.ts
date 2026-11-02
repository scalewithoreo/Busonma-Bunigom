import { createClient, Client } from '@libsql/client/web';

const tursoUrl: string = import.meta.env.VITE_TURSO_DATABASE_URL || '';
const tursoAuthToken: string = import.meta.env.VITE_TURSO_AUTH_TOKEN || '';

/**
 * Checks whether valid Turso credentials have been configured in .env
 */
export function isTursoConfigured(): boolean {
  return Boolean(
    tursoUrl && 
    tursoAuthToken && 
    (tursoUrl.startsWith('libsql://') || tursoUrl.startsWith('https://'))
  );
}

let clientInstance: Client | null = null;

/**
 * Returns a singleton instance of the Turso database client (web/edge compatible)
 */
export function getTursoClient(): Client | null {
  if (!isTursoConfigured()) {
    return null;
  }
  if (!clientInstance) {
    try {
      clientInstance = createClient({
        url: tursoUrl,
        authToken: tursoAuthToken,
      });
    } catch (err) {
      console.error('[turso] Failed to initialize client:', err);
      return null;
    }
  }
  return clientInstance;
}
