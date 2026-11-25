import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { ENV } from '../config/env.js';
import { ShortlinkModel, IShortlink, IShortlinkClick } from '../models/Shortlink.js';
import { auditLogsStore } from './apiController.js';
import {
  validateDestinationUrl,
  validateAlias,
  generateUniqueAlias,
  parseUserAgent,
  lookupIpGeo,
  sanitizeReferrer,
  formatToKolkataTime,
} from '../utils/shortlinkUtils.js';

// Multi-path persistence for shortlinks store (survives dev server reloads and restarts)
const getShortlinkCandidatePaths = () => [
  path.resolve(process.cwd(), 'backend/src/data/shortlinks.json'),
  path.resolve(process.cwd(), 'backend/dist/data/shortlinks.json'),
  path.resolve(__dirname, '../data/shortlinks.json'),
  path.resolve(__dirname, '../../src/data/shortlinks.json'),
  path.resolve(__dirname, '../../dist/data/shortlinks.json'),
];

let shortlinksStore: any[] = [];

// Seed default high-value hospital shortlinks if none exist
const initialShortlinks = [
  {
    id: 'lnk-aph-01',
    title: 'Incident Reporting Application Login Announcement',
    destinationUrl: 'https://incident.mapims.edu.in/auth/login?source=aph_connect',
    alias: 'incident-wa',
    campaignChannel: 'WhatsApp',
    isActive: true,
    expiresAt: null,
    createdBy: 'Super Admin',
    createdById: 'u-1',
    totalOpens: 842,
    humanOpens: 726,
    botOpens: 116,
    lastOpenedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    clicks: [
      {
        id: 'clk-001',
        timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        timestampIst: formatToKolkataTime(new Date(Date.now() - 1000 * 60 * 18)),
        isLikelyHuman: true,
        isBot: false,
        clickType: 'human',
        deviceType: 'Mobile',
        browser: 'Google Chrome',
        os: 'Android 14',
        country: 'India',
        region: 'Tamil Nadu',
        city: 'Kanchipuram',
        referrer: 'WhatsApp Mobile App',
        userAgentSummary: 'Chrome on Android 14 (Mobile)',
      },
      {
        id: 'clk-002',
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        timestampIst: formatToKolkataTime(new Date(Date.now() - 1000 * 60 * 25)),
        isLikelyHuman: false,
        isBot: true,
        clickType: 'preview',
        deviceType: 'Bot',
        browser: 'WhatsApp Link Preview',
        os: 'WhatsApp Service',
        country: 'India',
        region: 'Tamil Nadu',
        city: 'Hospital Intranet / Local',
        referrer: 'Unavailable',
        userAgentSummary: 'WhatsApp automated link previewer',
      },
      {
        id: 'clk-003',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        timestampIst: formatToKolkataTime(new Date(Date.now() - 1000 * 60 * 45)),
        isLikelyHuman: true,
        isBot: false,
        clickType: 'human',
        deviceType: 'Desktop',
        browser: 'Microsoft Edge',
        os: 'Windows 10/11',
        country: 'India',
        region: 'Tamil Nadu',
        city: 'Chennai',
        referrer: 'Unavailable',
        userAgentSummary: 'Microsoft Edge on Windows 10/11 (Desktop)',
      },
    ],
  },
  {
    id: 'lnk-aph-02',
    title: 'Emergency Night Shift Roster QR Code',
    destinationUrl: 'https://roster.mapims.edu.in/emergency-ward?shift=night',
    alias: 'duty-roster-qr',
    campaignChannel: 'QR Code',
    isActive: true,
    expiresAt: null,
    createdBy: 'Super Admin',
    createdById: 'u-1',
    totalOpens: 318,
    humanOpens: 304,
    botOpens: 14,
    lastOpenedAt: new Date(Date.now() - 1000 * 60 * 62).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    clicks: [
      {
        id: 'clk-004',
        timestamp: new Date(Date.now() - 1000 * 60 * 62).toISOString(),
        timestampIst: formatToKolkataTime(new Date(Date.now() - 1000 * 60 * 62)),
        isLikelyHuman: true,
        isBot: false,
        clickType: 'human',
        deviceType: 'Mobile',
        browser: 'Apple Safari',
        os: 'iOS',
        country: 'India',
        region: 'Tamil Nadu',
        city: 'Chengalpattu',
        referrer: 'QR Code Scan',
        userAgentSummary: 'Apple Safari on iOS (Mobile)',
      },
    ],
  },
  {
    id: 'lnk-aph-03',
    title: 'NABH Quality & Safety Compliance Checklist',
    destinationUrl: 'https://quality.mapims.edu.in/nabh-guidelines-2026.pdf',
    alias: 'nabh-safety',
    campaignChannel: 'Website',
    isActive: true,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    createdBy: 'Super Admin',
    createdById: 'u-1',
    totalOpens: 195,
    humanOpens: 172,
    botOpens: 23,
    lastOpenedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    clicks: [],
  },
];

// Load shortlinks from JSON on startup
try {
  let loaded = false;
  for (const p of getShortlinkCandidatePaths()) {
    if (fs.existsSync(p)) {
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (Array.isArray(data) && data.length > 0) {
        shortlinksStore = data;
        console.log(`[Shortlinks] Loaded ${shortlinksStore.length} links from ${p}`);
        loaded = true;
        break;
      }
    }
  }
  if (!loaded) {
    shortlinksStore = [...initialShortlinks];
    persistShortlinksStore();
  }
} catch (err: any) {
  console.error('[Shortlinks] Failed to read shortlinks store:', err.message);
  shortlinksStore = [...initialShortlinks];
}

// Persist shortlinks to disk across candidates
function persistShortlinksStore() {
  getShortlinkCandidatePaths().forEach((cp) => {
    try {
      if (fs.existsSync(path.dirname(cp))) {
        fs.writeFileSync(cp, JSON.stringify(shortlinksStore, null, 2), 'utf8');
      }
    } catch {}
  });
}

/**
 * Determine base URL for shortlinks:
 * Uses SHORTLINK_BASE_URL env if provided, or inspects incoming request host
 */
export function getShortlinkBaseUrl(req: Request): string {
  if (ENV.SHORTLINK_BASE_URL && ENV.SHORTLINK_BASE_URL.trim() !== '') {
    return ENV.SHORTLINK_BASE_URL.replace(/\/+$/, '');
  }

  // Otherwise, construct from request headers
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5173';
  return `${proto}://${host}`;
}

// Helper to decorate shortlink object with formatted dates, computed shortUrl, and status
function formatShortlinkForClient(link: any, req: Request) {
  const baseUrl = getShortlinkBaseUrl(req);
  const now = new Date();
  const isExpired = link.expiresAt ? new Date(link.expiresAt) < now : false;

  let computedStatus: 'Active' | 'Disabled' | 'Expired' = 'Active';
  if (!link.isActive) {
    computedStatus = 'Disabled';
  } else if (isExpired) {
    computedStatus = 'Expired';
  }

  return {
    ...link,
    shortUrl: `${baseUrl}/shortlinks/${link.alias}`,
    computedStatus,
    createdAtIst: formatToKolkataTime(link.createdAt),
    updatedAtIst: formatToKolkataTime(link.updatedAt),
    lastOpenedAtIst: link.lastOpenedAt ? formatToKolkataTime(link.lastOpenedAt) : 'Never',
    expiresAtIst: link.expiresAt ? formatToKolkataTime(link.expiresAt) : 'No Expiry',
  };
}

/**
 * GET /api/shortlinks
 * List all shortlinks with summary metrics
 */
export const getShortlinks = async (req: Request, res: Response) => {
  try {
    const formatted = shortlinksStore.map((l) => formatShortlinkForClient(l, req));

    // Summary statistics
    const totalLinks = formatted.length;
    const activeLinks = formatted.filter((l) => l.computedStatus === 'Active').length;
    const disabledLinks = formatted.filter((l) => l.computedStatus === 'Disabled').length;
    const expiredLinks = formatted.filter((l) => l.computedStatus === 'Expired').length;
    const totalOpens = formatted.reduce((acc, l) => acc + (l.totalOpens || 0), 0);
    const humanOpens = formatted.reduce((acc, l) => acc + (l.humanOpens || 0), 0);
    const botOpens = formatted.reduce((acc, l) => acc + (l.botOpens || 0), 0);

    res.json({
      success: true,
      count: totalLinks,
      summary: {
        totalLinks,
        activeLinks,
        disabledLinks,
        expiredLinks,
        totalOpens,
        humanOpens,
        botOpens,
        humanPercentage: totalOpens > 0 ? Math.round((humanOpens / totalOpens) * 100) : 0,
      },
      data: formatted,
    });
  } catch (err: any) {
    console.error('[Shortlinks] getShortlinks error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve shortlinks.' });
  }
};

/**
 * GET /api/shortlinks/:id
 * Retrieve a single shortlink by ID or alias
 */
export const getShortlinkById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const link = shortlinksStore.find((l) => l.id === id || l.alias === id.toLowerCase());

  if (!link) {
    return res.status(404).json({ success: false, message: 'Shortlink not found.' });
  }

  res.json({
    success: true,
    data: formatShortlinkForClient(link, req),
  });
};

/**
 * POST /api/shortlinks
 * Create a new shortlink with custom or auto-generated alias
 */
export const createShortlink = async (req: AuthRequest, res: Response) => {
  try {
    const { title, destinationUrl, customAlias, campaignChannel, expiresAt } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Link title is required.' });
    }

    const host = req.headers.host;
    const destValidation = validateDestinationUrl(destinationUrl, host);
    if (!destValidation.valid || !destValidation.cleanUrl) {
      return res.status(400).json({ success: false, message: destValidation.error });
    }

    // Determine alias
    let finalAlias = '';
    const existingAliases = new Set(shortlinksStore.map((l) => l.alias.toLowerCase()));

    if (customAlias && customAlias.trim() !== '') {
      const aliasValidation = validateAlias(customAlias);
      if (!aliasValidation.valid || !aliasValidation.cleanAlias) {
        return res.status(400).json({ success: false, message: aliasValidation.error });
      }

      finalAlias = aliasValidation.cleanAlias;
      if (existingAliases.has(finalAlias)) {
        return res.status(409).json({
          success: false,
          message: `The alias "/shortlinks/${finalAlias}" is already taken. Please choose another custom alias.`,
        });
      }
    } else {
      finalAlias = generateUniqueAlias(existingAliases);
    }

    // Expiry validation
    let validExpiry: string | null = null;
    if (expiresAt) {
      const expDate = new Date(expiresAt);
      if (isNaN(expDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid expiry date format.' });
      }
      if (expDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Expiry date and time must be set in the future.',
        });
      }
      validExpiry = expDate.toISOString();
    }

    const now = new Date();
    const newShortlink = {
      id: `lnk-${Date.now()}`,
      title: title.trim(),
      destinationUrl: destValidation.cleanUrl,
      alias: finalAlias,
      campaignChannel: (campaignChannel && campaignChannel.trim()) || 'General',
      isActive: true,
      expiresAt: validExpiry,
      createdBy: req.user?.name || 'Super Admin',
      createdById: req.user?.id || 'u-1',
      totalOpens: 0,
      humanOpens: 0,
      botOpens: 0,
      lastOpenedAt: null,
      clicks: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    shortlinksStore.unshift(newShortlink);
    persistShortlinksStore();

    // Async MongoDB sync if connected
    ShortlinkModel.create(newShortlink).catch(() => {});

    // Record in System Audit Trail
    auditLogsStore.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: req.user?.name || 'Super Admin',
      actorRole: req.user?.role || 'Super Admin',
      action: 'SHORTLINK_CREATED',
      module: 'Shortlink Management',
      resourceId: finalAlias,
      details: `Created shortlink "${title.trim()}" (/shortlinks/${finalAlias}) targeting ${destValidation.cleanUrl} for ${newShortlink.campaignChannel}.`,
      ipAddress: req.ip || '127.0.0.1',
      status: 'SUCCESS',
    });

    console.log(`[Shortlinks] Created shortlink "/shortlinks/${finalAlias}" -> ${destValidation.cleanUrl}`);

    res.status(201).json({
      success: true,
      message: `Shortlink "${title}" created successfully!`,
      data: formatShortlinkForClient(newShortlink, req),
    });
  } catch (err: any) {
    console.error('[Shortlinks] createShortlink error:', err);
    res.status(500).json({ success: false, message: 'Failed to create shortlink: ' + err.message });
  }
};

/**
 * PUT /api/shortlinks/:id
 * Update shortlink destination URL, title, campaign, or expiry while preserving alias and history
 */
export const updateShortlink = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, destinationUrl, campaignChannel, expiresAt } = req.body;

    const link = shortlinksStore.find((l) => l.id === id || l.alias === id.toLowerCase());
    if (!link) {
      return res.status(404).json({ success: false, message: 'Shortlink not found.' });
    }

    if (title && typeof title === 'string') {
      link.title = title.trim();
    }

    if (destinationUrl) {
      const host = req.headers.host;
      const destValidation = validateDestinationUrl(destinationUrl, host);
      if (!destValidation.valid || !destValidation.cleanUrl) {
        return res.status(400).json({ success: false, message: destValidation.error });
      }
      link.destinationUrl = destValidation.cleanUrl;
    }

    if (campaignChannel !== undefined) {
      link.campaignChannel = campaignChannel.trim() || 'General';
    }

    if (expiresAt !== undefined) {
      if (expiresAt === null || expiresAt === '') {
        link.expiresAt = null;
      } else {
        const expDate = new Date(expiresAt);
        if (isNaN(expDate.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid expiry date format.' });
        }
        link.expiresAt = expDate.toISOString();
      }
    }

    link.updatedAt = new Date().toISOString();
    link.updatedBy = req.user?.name || 'Super Admin';

    persistShortlinksStore();

    // Async MongoDB sync
    ShortlinkModel.updateOne({ alias: link.alias }, { $set: link }).catch(() => {});

    // Record in System Audit Trail
    auditLogsStore.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: req.user?.name || 'Super Admin',
      actorRole: req.user?.role || 'Super Admin',
      action: 'SHORTLINK_UPDATED',
      module: 'Shortlink Management',
      resourceId: link.alias,
      details: `Updated shortlink destination for "/shortlinks/${link.alias}" to ${link.destinationUrl}. Preserved short URL and click history.`,
      ipAddress: req.ip || '127.0.0.1',
      status: 'SUCCESS',
    });

    console.log(`[Shortlinks] Updated shortlink "/shortlinks/${link.alias}" destination to ${link.destinationUrl}`);

    res.json({
      success: true,
      message: `Shortlink "${link.title}" updated successfully!`,
      data: formatShortlinkForClient(link, req),
    });
  } catch (err: any) {
    console.error('[Shortlinks] updateShortlink error:', err);
    res.status(500).json({ success: false, message: 'Failed to update shortlink: ' + err.message });
  }
};

/**
 * PATCH /api/shortlinks/:id/toggle
 * Enable or disable a shortlink
 */
export const toggleShortlinkStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const link = shortlinksStore.find((l) => l.id === id || l.alias === id.toLowerCase());

    if (!link) {
      return res.status(404).json({ success: false, message: 'Shortlink not found.' });
    }

    link.isActive = !link.isActive;
    link.updatedAt = new Date().toISOString();
    link.updatedBy = req.user?.name || 'Super Admin';

    persistShortlinksStore();
    ShortlinkModel.updateOne({ alias: link.alias }, { $set: { isActive: link.isActive, updatedAt: link.updatedAt } }).catch(() => {});

    // Record in System Audit Trail
    auditLogsStore.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: req.user?.name || 'Super Admin',
      actorRole: req.user?.role || 'Super Admin',
      action: 'SHORTLINK_STATUS_TOGGLED',
      module: 'Shortlink Management',
      resourceId: link.alias,
      details: `Toggled shortlink "/shortlinks/${link.alias}" status to ${link.isActive ? 'Active' : 'Disabled'}.`,
      ipAddress: req.ip || '127.0.0.1',
      status: 'SUCCESS',
    });

    console.log(`[Shortlinks] Toggled "/shortlinks/${link.alias}" to ${link.isActive ? 'Active' : 'Disabled'}`);

    res.json({
      success: true,
      message: `Shortlink "${link.title}" is now ${link.isActive ? 'Enabled' : 'Disabled'}.`,
      data: formatShortlinkForClient(link, req),
    });
  } catch (err: any) {
    console.error('[Shortlinks] toggleShortlinkStatus error:', err);
    res.status(500).json({ success: false, message: 'Failed to toggle status.' });
  }
};

/**
 * GET /api/shortlinks/:id/analytics
 * Retrieve rich link analytics with date filtering
 */
export const getShortlinkAnalytics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const range = (req.query.range as string) || 'all'; // '24h', '7d', '30d', 'all'

    const link = shortlinksStore.find((l) => l.id === id || l.alias === id.toLowerCase());
    if (!link) {
      return res.status(404).json({ success: false, message: 'Shortlink not found.' });
    }

    const allClicks: IShortlinkClick[] = link.clicks || [];

    // Filter by date range
    const now = Date.now();
    let minTime = 0;
    if (range === '24h') minTime = now - 24 * 60 * 60 * 1000;
    else if (range === '7d') minTime = now - 7 * 24 * 60 * 60 * 1000;
    else if (range === '30d') minTime = now - 30 * 24 * 60 * 60 * 1000;

    const clicks = allClicks.filter((c) => {
      if (minTime === 0) return true;
      const t = new Date(c.timestamp).getTime();
      return !isNaN(t) && t >= minTime;
    });

    const totalOpens = clicks.length;
    const humanOpens = clicks.filter((c) => c.isLikelyHuman).length;
    const botOpens = clicks.filter((c) => c.isBot).length;
    const previewOpens = clicks.filter((c) => c.clickType === 'preview').length;
    const crawlerOpens = clicks.filter((c) => c.clickType === 'crawler').length;

    // Daily Timeline aggregation (in IST)
    const timelineMap = new Map<string, { date: string; human: number; automated: number; total: number }>();
    clicks.forEach((c) => {
      const d = c.timestampIst ? c.timestampIst.split(' ')[0] : c.timestamp.slice(0, 10);
      const existing = timelineMap.get(d) || { date: d, human: 0, automated: 0, total: 0 };
      existing.total++;
      if (c.isLikelyHuman) existing.human++;
      else existing.automated++;
      timelineMap.set(d, existing);
    });
    const opensOverTime = Array.from(timelineMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Device breakdown
    const deviceMap = new Map<string, number>();
    clicks.forEach((c) => {
      const dev = c.deviceType || 'Unknown';
      deviceMap.set(dev, (deviceMap.get(dev) || 0) + 1);
    });
    const deviceBreakdown = Array.from(deviceMap.entries()).map(([device, count]) => ({
      device,
      count,
      percentage: totalOpens > 0 ? Math.round((count / totalOpens) * 100) : 0,
    }));

    // Browser breakdown
    const browserMap = new Map<string, number>();
    clicks.forEach((c) => {
      const b = c.browser || 'Unknown';
      browserMap.set(b, (browserMap.get(b) || 0) + 1);
    });
    const browserBreakdown = Array.from(browserMap.entries())
      .map(([browser, count]) => ({ browser, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // OS breakdown
    const osMap = new Map<string, number>();
    clicks.forEach((c) => {
      const o = c.os || 'Unknown';
      osMap.set(o, (osMap.get(o) || 0) + 1);
    });
    const osBreakdown = Array.from(osMap.entries())
      .map(([os, count]) => ({ os, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Geo breakdown (Country, Region, City)
    const geoMap = new Map<string, { country: string; region: string; city: string; count: number }>();
    clicks.forEach((c) => {
      const key = `${c.city || 'Unknown'}, ${c.region || 'Unknown'}, ${c.country || 'India'}`;
      const existing = geoMap.get(key) || {
        country: c.country || 'India',
        region: c.region || 'Tamil Nadu',
        city: c.city || 'Local / Intranet',
        count: 0,
      };
      existing.count++;
      geoMap.set(key, existing);
    });
    const geoBreakdown = Array.from(geoMap.values()).sort((a, b) => b.count - a.count);

    // Referrers breakdown (query strings stripped!)
    const referrerMap = new Map<string, number>();
    clicks.forEach((c) => {
      const ref = c.referrer || 'Unavailable';
      referrerMap.set(ref, (referrerMap.get(ref) || 0) + 1);
    });
    const referrerBreakdown = Array.from(referrerMap.entries())
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count);

    // Recent activity (latest 50, stripped of raw IPs)
    const recentActivity = clicks
      .slice()
      .reverse()
      .slice(0, 50)
      .map((c) => ({
        id: c.id,
        timestampIst: c.timestampIst,
        timestampUtc: c.timestamp,
        isLikelyHuman: c.isLikelyHuman,
        clickType: c.clickType,
        deviceType: c.deviceType,
        browser: c.browser,
        os: c.os,
        location: `${c.city}, ${c.region}, ${c.country}`,
        referrer: c.referrer,
      }));

    res.json({
      success: true,
      link: formatShortlinkForClient(link, req),
      analytics: {
        range,
        totalOpens,
        humanOpens,
        botOpens,
        previewOpens,
        crawlerOpens,
        humanPercentage: totalOpens > 0 ? Math.round((humanOpens / totalOpens) * 100) : 0,
        lastOpenedAtIst: link.lastOpenedAt ? formatToKolkataTime(link.lastOpenedAt) : 'Never',
        opensOverTime,
        deviceBreakdown,
        browserBreakdown,
        osBreakdown,
        geoBreakdown,
        referrerBreakdown,
        recentActivity,
      },
    });
  } catch (err: any) {
    console.error('[Shortlinks] getShortlinkAnalytics error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate analytics.' });
  }
};

/**
 * Public Branded HTML status template for invalid, disabled, or expired links
 */
function renderBrandedStatusPage(params: {
  statusTitle: string;
  badgeLabel: string;
  badgeColor: 'amber' | 'rose' | 'slate';
  message: string;
  alias: string;
  details?: string;
  httpStatus: number;
}): string {
  const { statusTitle, badgeLabel, badgeColor, message, alias, details } = params;

  const colorStyles = {
    amber: {
      bg: '#FFFBEB',
      border: '#FDE68A',
      text: '#92400E',
      iconBg: '#FEF3C7',
      iconColor: '#D97706',
    },
    rose: {
      bg: '#FFF1F2',
      border: '#FECDD3',
      text: '#9F1239',
      iconBg: '#FFE4E6',
      iconColor: '#E11D48',
    },
    slate: {
      bg: '#F8FAFC',
      border: '#E2E8F0',
      text: '#334155',
      iconBg: '#F1F5F9',
      iconColor: '#64748B',
    },
  }[badgeColor];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${statusTitle} | APH Connect</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #F1F5F9;
      color: #0F172A;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: #FFFFFF;
      border-radius: 20px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      border: 1px solid #E2E8F0;
      max-width: 520px;
      width: 100%;
      overflow: hidden;
      text-align: center;
    }
    .header {
      background: #172554;
      padding: 24px 20px;
      color: white;
    }
    .logo-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 0.5px;
    }
    .org-sub {
      font-size: 11px;
      color: #94A3B8;
      margin-top: 4px;
    }
    .content {
      padding: 36px 28px;
    }
    .icon-container {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      background: ${colorStyles.iconBg};
      color: ${colorStyles.iconColor};
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px auto;
      font-size: 32px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-radius: 9999px;
      background: ${colorStyles.bg};
      color: ${colorStyles.text};
      border: 1px solid ${colorStyles.border};
      margin-bottom: 14px;
    }
    h1 {
      font-size: 22px;
      font-weight: 800;
      color: #0F172A;
      margin-bottom: 10px;
    }
    p {
      font-size: 14px;
      color: #475569;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .alias-box {
      background: #F8FAFC;
      border: 1px dashed #CBD5E1;
      padding: 10px 14px;
      border-radius: 10px;
      font-family: monospace;
      font-size: 13px;
      color: #334155;
      margin-bottom: 24px;
      word-break: break-all;
    }
    .btn {
      display: inline-block;
      background: #1E3A8A;
      color: white;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      padding: 12px 28px;
      border-radius: 10px;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #172554;
    }
    .footer {
      border-top: 1px solid #F1F5F9;
      padding: 16px 20px;
      background: #FAFBFD;
      font-size: 11px;
      color: #94A3B8;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo-badge">
        <span>APH Connect</span>
        <span style="background: #059669; padding: 2px 6px; border-radius: 4px; font-size: 10px;">MAPIMS</span>
      </div>
      <div class="org-sub">Adhiparasakthi Hospitals & Research Institute</div>
    </div>
    <div class="content">
      <div class="icon-container">⚠️</div>
      <div class="status-badge">${badgeLabel}</div>
      <h1>${statusTitle}</h1>
      <p>${message}</p>
      <div class="alias-box">Requested Shortlink: /shortlinks/${alias}</div>
      ${details ? `<p style="font-size: 12px; color: #64748B;">${details}</p>` : ''}
      <a href="/" class="btn">Return to Hospital Portal</a>
    </div>
    <div class="footer">
      Hospital Security & Information Governance • Melmaruvathur, Tamil Nadu
    </div>
  </div>
</body>
</html>`;
}

/**
 * Public Redirect Route Handler:
 * GET /s/:alias
 * - Works without signing in
 * - Records analytics asynchronously without delaying redirect
 * - If analytics fails, redirect still succeeds 100%
 * - Returns HTTP 302 for active link
 * - Returns branded page for invalid, disabled, or expired link
 */
export const handleShortlinkRedirect = async (req: Request, res: Response) => {
  const { alias } = req.params;

  if (!alias) {
    return res.status(404).send(
      renderBrandedStatusPage({
        statusTitle: 'Invalid Link URL',
        badgeLabel: '404 NOT FOUND',
        badgeColor: 'rose',
        message: 'No shortlink alias was provided in the request.',
        alias: '',
        httpStatus: 404,
      })
    );
  }

  const cleanAlias = alias.trim().toLowerCase();
  const link = shortlinksStore.find((l) => l.alias.toLowerCase() === cleanAlias);

  // 1. Link does not exist
  if (!link) {
    return res.status(404).send(
      renderBrandedStatusPage({
        statusTitle: 'Shortlink Not Found',
        badgeLabel: '404 NOT FOUND',
        badgeColor: 'rose',
        message: 'The shortlink you are trying to visit does not exist or may have been permanently removed.',
        alias: cleanAlias,
        httpStatus: 404,
      })
    );
  }

  // 2. Link is explicitly disabled by admin
  if (!link.isActive) {
    return res.status(403).send(
      renderBrandedStatusPage({
        statusTitle: 'Link Temporarily Deactivated',
        badgeLabel: 'LINK DISABLED',
        badgeColor: 'slate',
        message: 'This broadcast link has been temporarily disabled by hospital administration.',
        alias: cleanAlias,
        details: 'If you require access to this resource, please reach out to the communications department.',
        httpStatus: 403,
      })
    );
  }

  // 3. Link is expired
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    const expiredIst = formatToKolkataTime(link.expiresAt);
    return res.status(410).send(
      renderBrandedStatusPage({
        statusTitle: 'Shortlink Has Expired',
        badgeLabel: 'LINK EXPIRED',
        badgeColor: 'amber',
        message: 'This temporary hospital broadcast link has passed its scheduled expiry date.',
        alias: cleanAlias,
        details: `Link expired on: ${expiredIst} (IST)`,
        httpStatus: 410,
      })
    );
  }

  // 4. Link is Active: Capture Analytics Asynchronously and Redirect (HTTP 302)
  setImmediate(() => {
    try {
      const uaHeader = req.headers['user-agent'];
      const refHeader = req.headers['referer'] || req.headers['referrer'];
      const ipHeader =
        (req.headers['x-forwarded-for'] as string) ||
        (req.headers['x-real-ip'] as string) ||
        req.socket.remoteAddress;

      const uaInfo = parseUserAgent(uaHeader);
      const geoInfo = lookupIpGeo(ipHeader);
      const cleanReferrer = sanitizeReferrer(refHeader as string);

      const now = new Date();
      const clickEvent: IShortlinkClick = {
        id: `clk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: now.toISOString(),
        timestampIst: formatToKolkataTime(now),
        isLikelyHuman: uaInfo.isLikelyHuman,
        isBot: uaInfo.isBot,
        clickType: uaInfo.clickType,
        deviceType: uaInfo.deviceType,
        browser: uaInfo.browser,
        os: uaInfo.os,
        country: geoInfo.country,
        region: geoInfo.region,
        city: geoInfo.city,
        referrer: cleanReferrer,
        userAgentSummary: uaInfo.userAgentSummary,
      };

      link.totalOpens = (link.totalOpens || 0) + 1;
      if (uaInfo.isLikelyHuman) {
        link.humanOpens = (link.humanOpens || 0) + 1;
      } else {
        link.botOpens = (link.botOpens || 0) + 1;
      }
      link.lastOpenedAt = now.toISOString();

      if (!Array.isArray(link.clicks)) {
        link.clicks = [];
      }
      link.clicks.push(clickEvent);

      // Keep clicks history manageable (last 5,000 per link)
      if (link.clicks.length > 5000) {
        link.clicks = link.clicks.slice(-5000);
      }

      persistShortlinksStore();

      // Async update in Mongo if available
      ShortlinkModel.updateOne(
        { alias: link.alias },
        {
          $inc: {
            totalOpens: 1,
            humanOpens: uaInfo.isLikelyHuman ? 1 : 0,
            botOpens: uaInfo.isBot ? 1 : 0,
          },
          $set: { lastOpenedAt: now },
          $push: { clicks: { $each: [clickEvent], $slice: -5000 } },
        }
      ).catch(() => {});
    } catch (analyticsErr: any) {
      console.warn('[Shortlinks] Analytics recording notice:', analyticsErr.message);
    }
  });

  // Return HTTP 302 Temporary Redirect without adding a destination-page step
  res.redirect(302, link.destinationUrl);
};
