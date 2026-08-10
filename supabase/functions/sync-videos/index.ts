import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const YT_HANDLE = 'animemomentsanimeofficiel';

// No keyword filter — import every episode from the channel.
function isBlocked(_text: string | null | undefined): boolean {
  return false;
}

type Row = {
  source: 'youtube' | 'tiktok' | 'prime';
  external_id: string;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  video_url: string;
  published_at?: string | null;
};

async function fetchYouTube(apiKey: string): Promise<Row[]> {
  // 1. Resolve channel by handle -> uploads playlist id
  const chRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=@${YT_HANDLE}&key=${apiKey}`,
  );
  const chJson = await chRes.json();
  if (!chRes.ok) throw new Error(`YouTube channel error: ${JSON.stringify(chJson)}`);
  const uploadsId = chJson.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsId) return [];

  // 2. Paginate through ALL uploads (50 per page, up to 10 pages = 500 videos)
  const items: any[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < 10; page++) {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('playlistId', uploadsId);
    url.searchParams.set('key', apiKey);
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const plRes = await fetch(url.toString());
    const plJson = await plRes.json();
    if (!plRes.ok) throw new Error(`YouTube playlist error: ${JSON.stringify(plJson)}`);
    items.push(...(plJson.items ?? []));
    pageToken = plJson.nextPageToken;
    if (!pageToken) break;
  }

  return items.map((it: any): Row => {
    const sn = it.snippet ?? {};
    const vid = sn.resourceId?.videoId;
    const thumb =
      sn.thumbnails?.maxres?.url ||
      sn.thumbnails?.standard?.url ||
      sn.thumbnails?.high?.url ||
      sn.thumbnails?.medium?.url ||
      `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
    return {
      source: 'youtube',
      external_id: vid,
      title: sn.title ?? 'Sans titre',
      description: sn.description ?? null,
      thumbnail_url: thumb,
      video_url: `https://www.youtube.com/watch?v=${vid}`,
      published_at: sn.publishedAt ?? null,
    };
  }).filter((r) => !isBlocked(r.title) && !isBlocked(r.description));
}

async function fetchTikTok(): Promise<Row[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const TIKTOK_API_KEY = Deno.env.get('TIKTOK_API_KEY');
  if (!LOVABLE_API_KEY || !TIKTOK_API_KEY) return [];

  const url =
    'https://connector-gateway.lovable.dev/tiktok/video/list/?fields=id,title,video_description,cover_image_url,share_url,create_time';
  const all: any[] = [];
  let cursor: number | undefined;
  // Paginate through ALL TikTok videos (max ~20 per page, up to 25 pages = 500)
  for (let page = 0; page < 25; page++) {
    const body: Record<string, unknown> = { max_count: 20 };
    if (cursor) body.cursor = cursor;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TIKTOK_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      console.error('TikTok gateway error', res.status, json);
      break;
    }
    const list = json?.data?.videos ?? [];
    all.push(...list);
    const hasMore = json?.data?.has_more;
    cursor = json?.data?.cursor;
    if (!hasMore || !cursor || list.length === 0) break;
  }
  return all.map((v: any): Row => ({
    source: 'tiktok',
    external_id: String(v.id),
    title: v.title || v.video_description?.slice(0, 80) || 'TikTok',
    description: v.video_description ?? null,
    thumbnail_url: v.cover_image_url ?? null,
    video_url: v.share_url,
    published_at: v.create_time ? new Date(v.create_time * 1000).toISOString() : null,
  })).filter((r) => !isBlocked(r.title) && !isBlocked(r.description));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // --- Auth guard --------------------------------------------------------
  // Callers must either present the shared SYNC_SECRET (used by cron and
  // internal jobs) or a Supabase JWT belonging to an admin. This prevents
  // any anonymous user from exhausting external API quotas / DB writes.
  const SYNC_SECRET = Deno.env.get('SYNC_SECRET');
  const sharedHeader = req.headers.get('x-sync-secret');
  let authorized = !!SYNC_SECRET && !!sharedHeader && sharedHeader === SYNC_SECRET;

  // Fallback: compare against the vault-stored SYNC_SECRET (kept in sync
  // with cron header). Lets us recover if the edge-function env secret and
  // the vault value drift apart.
  if (!authorized && sharedHeader) {
    try {
      const admin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      const { data } = await admin.rpc('sync_secret_header_value' as never);
      if (typeof data === 'string' && data.length > 0 && data === sharedHeader) {
        authorized = true;
      }
    } catch (_e) { /* ignore */ }
  }

  if (!authorized) {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (authHeader.startsWith('Bearer ')) {
      try {
        const authClient = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_ANON_KEY')!,
          { global: { headers: { Authorization: authHeader } } },
        );
        const token = authHeader.slice('Bearer '.length);
        const { data: claimsData } = await authClient.auth.getClaims(token);
        const userId = claimsData?.claims?.sub;
        if (userId) {
          const admin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
          );
          const { data: roleRow } = await admin
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .eq('role', 'admin')
            .maybeSingle();
          authorized = !!roleRow;
        }
      } catch (_err) {
        authorized = false;
      }
    }
  }

  if (!authorized) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY') || Deno.env.get('GOOGLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Parse optional body: { mode?: "full" | "incremental", platform?: "youtube" | "tiktok" | "prime" | "all" }
    let mode: 'full' | 'incremental' = 'incremental';
    let platformFilter: 'youtube' | 'tiktok' | 'prime' | 'all' = 'all';
    try {
      const raw = await req.json().catch(() => ({}));
      if (raw?.mode === 'full') mode = 'full';
      if (['youtube', 'tiktok', 'prime', 'all'].includes(raw?.platform)) {
        platformFilter = raw.platform;
      }
    } catch { /* body optional */ }

    const results: { source: string; count: number; error?: string }[] = [];
    const allRows: Row[] = [];

    if (YOUTUBE_API_KEY && (platformFilter === 'all' || platformFilter === 'youtube')) {
      try {
        const yt = await fetchYouTube(YOUTUBE_API_KEY);
        allRows.push(...yt);
        results.push({ source: 'youtube', count: yt.length });
      } catch (e) {
        console.error('sync-videos youtube failed', e);
        results.push({ source: 'youtube', count: 0, error: 'Sync failed' });
      }
    }

    if (platformFilter === 'all' || platformFilter === 'tiktok') {
      try {
        const tt = await fetchTikTok();
        allRows.push(...tt);
        results.push({ source: 'tiktok', count: tt.length });
      } catch (e) {
        console.error('sync-videos tiktok failed', e);
        results.push({ source: 'tiktok', count: 0, error: 'Sync failed' });
      }
    }

    if (allRows.length > 0) {
      // In-batch dedupe (keep first occurrence of each source+external_id)
      const seen = new Set<string>();
      const deduped = allRows.filter((r) => {
        if (!r.external_id) return true;
        const key = `${r.source}:${r.external_id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const { error } = await supabase
        .from('imported_videos')
        .upsert(deduped, {
          onConflict: 'source,external_id',
          ignoreDuplicates: false,
        });
      if (error) throw error;
      results.push({ source: 'upserted', count: deduped.length });

      // ---- FULL MODE: garbage-collect stale rows -------------------------
      // Remove rows whose external_id no longer appears in the fresh fetch
      // for the sources we actually synced (never wipe unrelated sources).
      if (mode === 'full') {
        const bySrc = new Map<string, string[]>();
        for (const r of deduped) {
          if (!r.external_id) continue;
          const arr = bySrc.get(r.source) ?? [];
          arr.push(r.external_id);
          bySrc.set(r.source, arr);
        }
        for (const [src, keepIds] of bySrc) {
          if (keepIds.length === 0) continue;
          const { error: delErr, count } = await supabase
            .from('imported_videos')
            .delete({ count: 'exact' })
            .eq('source', src)
            .not('external_id', 'in', `(${keepIds.map((id) => `"${id.replace(/"/g, '')}"`).join(',')})`);
          if (delErr) console.error('full-sync gc failed', src, delErr);
          else results.push({ source: `${src}:gc`, count: count ?? 0 });
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, mode, platform: platformFilter, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('sync-videos failed', e);
    return new Response(JSON.stringify({ ok: false, error: 'Sync failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});