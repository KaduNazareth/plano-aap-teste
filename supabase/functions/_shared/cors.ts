// Centralized CORS configuration for all edge functions
export const allowedOrigins = [
  'https://acompanhamento-aaps.lovable.app',
  'https://acompanhamento-aaps.org',
  'https://id-preview--155cb470-7d4d-40fe-bb62-c5191491950a.lovable.app',
  'https://155cb470-7d4d-40fe-bb62-c5191491950a.lovableproject.com',
];

export function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

export function handleCorsPreflightRequest(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  return null;
}
