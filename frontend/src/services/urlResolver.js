const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN || '').trim().replace(/\/+$/, '');

const LOCAL_BACKEND_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1):5000/i;

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(value);

const stripLocalBackendPrefix = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(LOCAL_BACKEND_REGEX, '')
    .replace(/^\/\/(localhost|127\.0\.0\.1):5000/i, '');
};

const shouldRouteThroughApiOrigin = (url) => {
  return url.startsWith('/api') || url.startsWith('/uploads') || url.startsWith('/invoices');
};

export const resolveApiRequestUrl = (inputUrl) => {
  if (typeof inputUrl !== 'string') return inputUrl;

  const normalized = stripLocalBackendPrefix(inputUrl.trim());
  if (!normalized || !API_ORIGIN) return normalized;

  if (!isAbsoluteUrl(normalized) && shouldRouteThroughApiOrigin(normalized)) {
    return `${API_ORIGIN}${normalized}`;
  }

  return normalized;
};

export const resolveAssetUrl = (inputUrl) => {
  if (typeof inputUrl !== 'string') return inputUrl;

  let normalized = stripLocalBackendPrefix(inputUrl.trim());
  if (!normalized || normalized === 'undefined' || normalized === 'null') return '';

  if (!isAbsoluteUrl(normalized)) {
    if (!normalized.startsWith('/')) {
      normalized = `/uploads/${normalized}`;
    }

    if (API_ORIGIN && shouldRouteThroughApiOrigin(normalized)) {
      return `${API_ORIGIN}${normalized}`;
    }
  }

  return normalized;
};
