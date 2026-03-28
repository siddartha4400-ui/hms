const IPV4_SEGMENT_PATTERN = "(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)";
const IPV4_ADDRESS_REGEX = new RegExp(`^${IPV4_SEGMENT_PATTERN}(?:\\.${IPV4_SEGMENT_PATTERN}){3}$`);

export function isIpv4Address(hostName: string): boolean {
  const host = (hostName || '').trim().toLowerCase();
  return IPV4_ADDRESS_REGEX.test(host);
}

export function isMainSiteHost(hostName: string, baseDomain?: string | null): boolean {
  const host = (hostName || '').trim().toLowerCase();
  const normalizedBaseDomain = (baseDomain || '').trim().toLowerCase();

  if (!host) {
    return false;
  }

  if (normalizedBaseDomain && (host === normalizedBaseDomain || host === `www.${normalizedBaseDomain}`)) {
    return true;
  }

  if (host === 'localhost' || host === '127.0.0.1' || host === 'hms.local' || host === 'www.hms.local') {
    return true;
  }

  return isIpv4Address(host);
}

export function resolveHostSubsiteKey(hostName: string, baseDomain: string): string | null {
  const host = (hostName || '').trim().toLowerCase();
  if (!host || host === 'localhost' || host === '127.0.0.1' || isIpv4Address(host)) {
    return null;
  }

  if (baseDomain && host.endsWith(`.${baseDomain}`)) {
    const leftPart = host.slice(0, -(`.${baseDomain}`).length);
    const candidate = leftPart.split('.')[0]?.trim().toLowerCase();
    if (!candidate || candidate === 'www' || candidate === 'backend') {
      return null;
    }
    return candidate;
  }

  const parts = host.split('.').filter(Boolean);
  if (parts.length >= 3) {
    const candidate = parts[0]?.trim().toLowerCase();
    if (!candidate || candidate === 'www' || candidate === 'backend') {
      return null;
    }
    return candidate;
  }

  return null;
}