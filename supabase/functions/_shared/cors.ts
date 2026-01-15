// Centralized CORS configuration for all edge functions
export const allowedOrigins = [
  'https://acompanhamento-aaps.lovable.app',
  'https://id-preview--155cb470-7d4d-40fe-bb62-c5191491950a.lovable.app',
  'https://155cb470-7d4d-40fe-bb62-c5191491950a.lovableproject.com',
];

export function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

export function handleCorsPreflightRequest(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  return null;
}
