const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self' ws: wss:",
].join('; ')

export default defineEventHandler((event) => {
  setResponseHeaders(event, {
    'Content-Security-Policy': contentSecurityPolicy,
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), geolocation=(), microphone=(self)',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '0',
  })

  if (getRequestURL(event).pathname.startsWith('/api/')) {
    setResponseHeaders(event, {
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
      Vary: 'Cookie',
    })
  }
})
