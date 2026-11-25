import { Shortlink, ShortlinkAnalytics } from '../types';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('aph_auth_token') || localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface CreateShortlinkPayload {
  title: string;
  destinationUrl: string;
  customAlias?: string;
  campaignChannel?: string;
  expiresAt?: string | null;
}

export interface UpdateShortlinkPayload {
  title?: string;
  destinationUrl?: string;
  campaignChannel?: string;
  expiresAt?: string | null;
}

export interface ShortlinkListResponse {
  success: boolean;
  count: number;
  summary: {
    totalLinks: number;
    activeLinks: number;
    disabledLinks: number;
    expiredLinks: number;
    totalOpens: number;
    humanOpens: number;
    botOpens: number;
    humanPercentage: number;
  };
  data: Shortlink[];
  message?: string;
}

export interface ShortlinkDetailResponse {
  success: boolean;
  data: Shortlink;
  message?: string;
}

export interface ShortlinkAnalyticsResponse {
  success: boolean;
  link: Shortlink;
  analytics: ShortlinkAnalytics;
  message?: string;
}

export const shortlinkService = {
  async getAll(): Promise<ShortlinkListResponse> {
    const res = await fetch('/api/shortlinks', {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to fetch shortlinks');
    }
    return json;
  },

  async getById(id: string): Promise<ShortlinkDetailResponse> {
    const res = await fetch(`/api/shortlinks/${encodeURIComponent(id)}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to fetch shortlink details');
    }
    return json;
  },

  async create(payload: CreateShortlinkPayload): Promise<ShortlinkDetailResponse> {
    const res = await fetch('/api/shortlinks', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to create shortlink');
    }
    return json;
  },

  async update(id: string, payload: UpdateShortlinkPayload): Promise<ShortlinkDetailResponse> {
    const res = await fetch(`/api/shortlinks/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to update shortlink');
    }
    return json;
  },

  async toggleStatus(id: string): Promise<ShortlinkDetailResponse> {
    const res = await fetch(`/api/shortlinks/${encodeURIComponent(id)}/toggle`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to toggle shortlink status');
    }
    return json;
  },

  async getAnalytics(id: string, range = 'all'): Promise<ShortlinkAnalyticsResponse> {
    const res = await fetch(`/api/shortlinks/${encodeURIComponent(id)}/analytics?range=${encodeURIComponent(range)}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to fetch analytics');
    }
    return json;
  },
};

