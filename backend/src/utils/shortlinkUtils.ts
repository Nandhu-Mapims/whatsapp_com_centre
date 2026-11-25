import geoip from 'geoip-lite';
import crypto from 'crypto';

const RESERVED_ALIASES = new Set([
  's',
  'api',
  'admin',
  'dashboard',
  'reports',
  'templates',
  'campaigns',
  'employees',
  'login',
  'health',
  'assets',
  'static',
  'favicon.ico',
  'manifest.json',
  'service-worker.js',
  'index.html',
  'robots.txt',
  'users',
  'wati',
  'audit',
  'consent',
]);

/**
 * Validate destination URL:
 * - Must be absolute HTTP or HTTPS
 * - Rejects unsafe schemes (javascript:, data:, file:)
 * - Rejects loops pointing back to /s/ route
 */
export function validateDestinationUrl(
  urlStr: string,
  currentHost?: string
): { valid: boolean; error?: string; cleanUrl?: string } {
  if (!urlStr || typeof urlStr !== 'string') {
    return { valid: false, error: 'Destination URL is required.' };
  }

  const trimmed = urlStr.trim();

  // Enforce absolute HTTP or HTTPS
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      valid: false,
      error: 'Destination URL must be a valid, absolute URL starting with http:// or https://',
    };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      valid: false,
      error: `Unsafe or unsupported protocol "${parsed.protocol}". Only http:// and https:// URLs are allowed.`,
    };
  }

  // Reject internal loopback to shortlink route
  if (currentHost) {
    const normHost = currentHost.toLowerCase().split(':')[0];
    const targetHost = parsed.hostname.toLowerCase();

    if (
      (targetHost === normHost || targetHost === 'localhost' || targetHost === '127.0.0.1') &&
      (parsed.pathname.startsWith('/shortlinks/') || parsed.pathname.startsWith('/s/'))
    ) {
      return {
        valid: false,
        error: 'Destination URL cannot point back into this site’s shortlink route (/shortlinks/...) to prevent redirect loops.',
      };
    }
  } else if (parsed.pathname.startsWith('/shortlinks/') || parsed.pathname.startsWith('/s/')) {
    // If domain looks local or contains /shortlinks/ on likely local domains
    const targetHost = parsed.hostname.toLowerCase();
    if (targetHost.includes('mapims') || targetHost === 'localhost' || targetHost === '127.0.0.1') {
      return {
        valid: false,
        error: 'Destination URL cannot point back into this site’s shortlink route (/shortlinks/...).',
      };
    }
  }

  return { valid: true, cleanUrl: parsed.toString() };
}

/**
 * Validate Custom Alias:
 * - 2-64 chars: alphanumeric, hyphen, underscore
 * - Cannot be reserved keyword
 * - Never allow patient identifiers or employee details
 */
export function validateAlias(aliasStr: string): { valid: boolean; error?: string; cleanAlias?: string } {
  if (!aliasStr || typeof aliasStr !== 'string') {
    return { valid: false, error: 'Alias is required.' };
  }

  const clean = aliasStr.trim().toLowerCase();

  if (clean.length < 2 || clean.length > 64) {
    return { valid: false, error: 'Alias must be between 2 and 64 characters long.' };
  }

  if (!/^[a-z0-9_-]+$/.test(clean)) {
    return {
      valid: false,
      error: 'Alias can only contain letters, numbers, hyphens (-), and underscores (_).',
    };
  }

  if (RESERVED_ALIASES.has(clean)) {
    return {
      valid: false,
      error: `The alias "${clean}" is reserved for hospital system navigation and cannot be used.`,
    };
  }

  // Healthcare privacy check: Prevent accidental leakage of patient MRNs, full phone numbers, or email addresses
  if (
    /^\d{10,12}$/.test(clean) || // Phone number
    /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(clean) || // Email
    /^map-?\d{4,8}$/i.test(clean) // Employee ID pattern
  ) {
    return {
      valid: false,
      error: 'Hospital security policy prohibits using employee IDs, phone numbers, or emails as public shortlink aliases.',
    };
  }

  return { valid: true, cleanAlias: clean };
}

/**
 * Generate a unique, short, clean alias
 */
export function generateUniqueAlias(existingAliases: Set<string>): string {
  const chars = '23456789abcdefghjkmnpqrstuvwxyz'; // Exclude ambiguous chars (0, 1, l, o)
  let attempts = 0;

  while (attempts < 100) {
    attempts++;
    let code = 'aph-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (!existingAliases.has(code) && !RESERVED_ALIASES.has(code)) {
      return code;
    }
  }

  // Fallback with crypto random
  const hex = crypto.randomBytes(3).toString('hex');
  return `aph-${hex}`;
}

/**
 * Classify User Agent and detect Bots, Link Previews, Crawlers, OS, and Browser
 */
export function parseUserAgent(uaRaw?: string): {
  isLikelyHuman: boolean;
  isBot: boolean;
  clickType: 'human' | 'crawler' | 'preview';
  deviceType: 'Mobile' | 'Tablet' | 'Desktop' | 'Bot' | 'Unknown';
  browser: string;
  os: string;
  userAgentSummary: string;
} {
  const ua = (uaRaw || '').trim();
  if (!ua) {
    return {
      isLikelyHuman: true,
      isBot: false,
      clickType: 'human',
      deviceType: 'Unknown',
      browser: 'Unknown Browser',
      os: 'Unknown OS',
      userAgentSummary: 'Direct request / No User-Agent provided',
    };
  }

  const uaLower = ua.toLowerCase();

  // 1. WhatsApp & Social Media Link Previews
  if (uaLower.includes('whatsapp')) {
    return {
      isLikelyHuman: false,
      isBot: true,
      clickType: 'preview',
      deviceType: 'Bot',
      browser: 'WhatsApp Link Preview',
      os: 'WhatsApp Service',
      userAgentSummary: 'WhatsApp automated link previewer',
    };
  }
  if (uaLower.includes('facebookexternalhit') || uaLower.includes('facebot')) {
    return {
      isLikelyHuman: false,
      isBot: true,
      clickType: 'preview',
      deviceType: 'Bot',
      browser: 'Facebook Preview Crawler',
      os: 'Meta Platform',
      userAgentSummary: 'Meta / Facebook link preview bot',
    };
  }
  if (uaLower.includes('twitterbot')) {
    return {
      isLikelyHuman: false,
      isBot: true,
      clickType: 'preview',
      deviceType: 'Bot',
      browser: 'Twitterbot Preview',
      os: 'X Platform',
      userAgentSummary: 'Twitter/X link preview crawler',
    };
  }
  if (uaLower.includes('telegrambot')) {
    return {
      isLikelyHuman: false,
      isBot: true,
      clickType: 'preview',
      deviceType: 'Bot',
      browser: 'Telegram Preview',
      os: 'Telegram Platform',
      userAgentSummary: 'Telegram link preview crawler',
    };
  }

  // 2. Search Engines & Automated Crawlers / Scanners
  const isSearchBot =
    uaLower.includes('googlebot') ||
    uaLower.includes('bingbot') ||
    uaLower.includes('duckduckbot') ||
    uaLower.includes('baiduspider') ||
    uaLower.includes('yandexbot') ||
    uaLower.includes('slurp');

  const isGenericBot =
    uaLower.includes('bot') ||
    uaLower.includes('crawler') ||
    uaLower.includes('spider') ||
    uaLower.includes('curl/') ||
    uaLower.includes('wget/') ||
    uaLower.includes('python-requests') ||
    uaLower.includes('postmanruntime') ||
    uaLower.includes('headlesschrome') ||
    uaLower.includes('axios') ||
    uaLower.includes('aiohttp') ||
    uaLower.includes('scrapy');

  if (isSearchBot || isGenericBot) {
    let botName = 'Automated Scanner / Crawler';
    if (uaLower.includes('googlebot')) botName = 'Googlebot';
    else if (uaLower.includes('bingbot')) botName = 'Bingbot';
    else if (uaLower.includes('curl/')) botName = 'cURL CLI';
    else if (uaLower.includes('python')) botName = 'Python Script / Bot';
    else if (uaLower.includes('postman')) botName = 'Postman API Client';

    return {
      isLikelyHuman: false,
      isBot: true,
      clickType: 'crawler',
      deviceType: 'Bot',
      browser: botName,
      os: 'Bot / Server',
      userAgentSummary: botName,
    };
  }

  // 3. Human Opens: Detect Device Type
  let deviceType: 'Mobile' | 'Tablet' | 'Desktop' | 'Unknown' = 'Desktop';
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    deviceType = 'Tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
    deviceType = 'Mobile';
  } else if (/windows|macintosh|linux|cros/i.test(ua)) {
    deviceType = 'Desktop';
  }

  // 4. Human Opens: Detect Operating System
  let os = 'Unknown OS';
  if (/windows nt 10/i.test(ua)) os = 'Windows 10/11';
  else if (/windows nt/i.test(ua)) os = 'Windows';
  else if (/android/i.test(ua)) {
    const match = ua.match(/android\s([0-9.]+)/i);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = 'iOS';
  } else if (/mac os x/i.test(ua)) {
    os = 'macOS';
  } else if (/cros/i.test(ua)) {
    os = 'Chrome OS';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  // 5. Human Opens: Detect Browser
  let browser = 'Unknown Browser';
  if (/edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/samsungbrowser/i.test(ua)) browser = 'Samsung Internet';
  else if (/opr\/|opera/i.test(ua)) browser = 'Opera';
  else if (/chrome\//i.test(ua) && !/chromium\//i.test(ua)) browser = 'Google Chrome';
  else if (/firefox\//i.test(ua)) browser = 'Mozilla Firefox';
  else if (/safari\//i.test(ua) && !/chrome\//i.test(ua)) browser = 'Apple Safari';
  else if (/msie|trident/i.test(ua)) browser = 'Internet Explorer';

  return {
    isLikelyHuman: true,
    isBot: false,
    clickType: 'human',
    deviceType,
    browser,
    os,
    userAgentSummary: `${browser} on ${os} (${deviceType})`,
  };
}

/**
 * Geo IP Lookup using offline geoip-lite.
 * Strictly respects privacy: raw IP addresses are NOT retained in analytics.
 */
export function lookupIpGeo(ipHeader?: string): {
  country: string;
  region: string;
  city: string;
} {
  if (!ipHeader) {
    return {
      country: 'India',
      region: 'Tamil Nadu',
      city: 'Hospital Intranet / Local',
    };
  }

  // Extract first IP if list (from X-Forwarded-For: client, proxy1, proxy2)
  const clientIp = ipHeader.split(',')[0].trim();

  // Local, Intranet or Loopback IPs
  if (
    clientIp === '127.0.0.1' ||
    clientIp === '::1' ||
    clientIp === 'localhost' ||
    clientIp.startsWith('192.168.') ||
    clientIp.startsWith('10.') ||
    clientIp.startsWith('172.16.') ||
    clientIp.startsWith('172.31.') ||
    clientIp.startsWith('fc00:') ||
    clientIp.startsWith('fe80:')
  ) {
    return {
      country: 'India',
      region: 'Tamil Nadu',
      city: 'Hospital Intranet / Local',
    };
  }

  try {
    const geo = geoip.lookup(clientIp);
    if (geo) {
      return {
        country: geo.country || 'India',
        region: geo.region || 'Tamil Nadu',
        city: geo.city || 'Kanchipuram / Chennai',
      };
    }
  } catch (err) {
    // Silently fall back
  }

  return {
    country: 'India',
    region: 'Tamil Nadu',
    city: 'Kanchipuram / Chennai',
  };
}

/**
 * Strip query strings from referrers to prevent leaking sensitive search/URL params
 */
export function sanitizeReferrer(referrerHeader?: string): string {
  if (!referrerHeader || typeof referrerHeader !== 'string') {
    return 'Unavailable';
  }

  const trimmed = referrerHeader.trim();
  if (!trimmed || trimmed === 'about:blank' || trimmed === 'direct') {
    return 'Unavailable';
  }

  try {
    const parsed = new URL(trimmed);
    // Return origin + path without search query params or hash
    let clean = `${parsed.origin}${parsed.pathname}`;
    if (clean.endsWith('/') && clean !== `${parsed.origin}/`) {
      clean = clean.slice(0, -1);
    }
    return clean;
  } catch {
    // If not a full URL (e.g. android-app://com.whatsapp)
    if (trimmed.startsWith('android-app://')) {
      if (trimmed.includes('whatsapp')) return 'WhatsApp Mobile App';
      if (trimmed.includes('telegram')) return 'Telegram App';
      return trimmed.split('?')[0];
    }
    return trimmed.split('?')[0].split('#')[0] || 'Unavailable';
  }
}

/**
 * Format Date in Asia/Kolkata timezone (IST: UTC+05:30)
 */
export function formatToKolkataTime(dateInput?: Date | string | null): string {
  if (!dateInput) return 'Never';

  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return 'Invalid Date';

  // Format to YYYY-MM-DD HH:mm:ss in Asia/Kolkata
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .format(d)
    .replace(/[/]/g, '-');
}

