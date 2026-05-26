export function parseUserAgent(ua) {
  if (!ua || typeof ua !== 'string') return 'Unknown device';
  const s = ua.toLowerCase();
  let os = 'Web';
  if (s.includes('windows')) os = 'Windows';
  else if (s.includes('iphone') || s.includes('ipad')) os = 'iOS';
  else if (s.includes('android')) os = 'Android';
  else if (s.includes('mac os') || s.includes('macintosh')) os = 'macOS';
  else if (s.includes('linux')) os = 'Linux';

  let browser = 'Browser';
  if (s.includes('edg/')) browser = 'Edge';
  else if (s.includes('chrome/') && !s.includes('edg/')) browser = 'Chrome';
  else if (s.includes('firefox/')) browser = 'Firefox';
  else if (s.includes('safari/') && !s.includes('chrome/')) browser = 'Safari';

  return `${browser} on ${os}`;
}

export function maskIp(ip) {
  if (!ip || ip === '::1' || ip === '127.0.0.1') return 'Local network';
  const parts = String(ip).split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.•••.•••`;
  return 'Hidden for security';
}
