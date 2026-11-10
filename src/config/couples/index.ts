import { WeddingConfig } from '../../types/wedding';
import { oreDaraConfig } from './ore-dara';
import { miracleMalvinConfig } from './miracle-malvin';
import { busonmaBunigomConfig } from './busonma-bunigom';

export const COUPLE_CONFIGS: Record<string, WeddingConfig> = {
  'ore-dara': oreDaraConfig,
  'miracle-malvin': miracleMalvinConfig,
  'busonma-bunigom': busonmaBunigomConfig,
};

export const ALL_COUPLES: WeddingConfig[] = Object.values(COUPLE_CONFIGS);

export const DEFAULT_COUPLE_ID =
  (import.meta.env.VITE_DEFAULT_COUPLE as string) || 'ore-dara';

export function resolveCoupleId(identifier?: string): string {
  if (!identifier) return DEFAULT_COUPLE_ID;

  const clean = identifier.trim().toLowerCase();

  // 1. Direct match by ID
  if (COUPLE_CONFIGS[clean]) {
    return clean;
  }

  // 2. Match by slug
  for (const config of ALL_COUPLES) {
    if (config.slug.toLowerCase() === clean) {
      return config.id;
    }
  }

  // 3. Match by domain or substring
  for (const config of ALL_COUPLES) {
    if (config.domains.some(d => d.toLowerCase() === clean || clean.includes(d.toLowerCase()))) {
      return config.id;
    }
  }

  // 4. Match common keywords
  if (clean.includes('busonma') || clean.includes('bunigom') || clean.includes('bunigo') || clean.includes('bunigonma') || clean.includes('chibum') || clean.includes('mbamalu') || clean.includes('obiagwu')) {
    return 'busonma-bunigom';
  }
  if (clean.includes('miracle') || clean.includes('malvin')) {
    return 'miracle-malvin';
  }
  if (clean.includes('ore') || clean.includes('dara') || clean.includes('okunade')) {
    return 'ore-dara';
  }

  return DEFAULT_COUPLE_ID;
}

export function getWeddingConfig(identifier?: string): WeddingConfig {
  const coupleId = resolveCoupleId(identifier);
  return COUPLE_CONFIGS[coupleId] || oreDaraConfig;
}
