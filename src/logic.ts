import type { Hono } from "hono";


// ATXP: requirePayment only fires inside an ATXP context (set by atxpHono middleware).
// For raw x402 requests, the existing @x402/hono middleware handles the gate.
// If neither protocol is active (ATXP_CONNECTION unset), tryRequirePayment is a no-op.
async function tryRequirePayment(price: number): Promise<void> {
  if (!process.env.ATXP_CONNECTION) return;
  try {
    const { requirePayment } = await import("@atxp/server");
    const BigNumber = (await import("bignumber.js")).default;
    await requirePayment({ price: BigNumber(price) });
  } catch (e: any) {
    if (e?.code === -30402) throw e;
  }
}

// ─── Cache ──────────────────────────────────────────────────────────────────

interface CacheEntry { data: any; ts: number }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 60_000; // 60 seconds

function cached<T>(key: string): T | null {
  const e = cache.get(key);
  return e && Date.now() - e.ts < CACHE_TTL ? (e.data as T) : null;
}
function setCache(key: string, data: any) { cache.set(key, { data, ts: Date.now() }); }

// ─── Hyperliquid API ────────────────────────────────────────────────────────

const HL_API = "https://api.hyperliquid.xyz/info";

async function hlPost(body: Record<string, unknown>): Promise<any> {
  const resp = await fetch(HL_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  if (!resp.ok) throw new Error(`Hyperliquid API error: ${resp.status} ${resp.statusText}`);
  return resp.json();
}

// ─── Token interfaces ───────────────────────────────────────────────────────

interface SpotToken {
  name: string;
  tokenId: string;
  index: number;
  decimals: number;
  weiDecimals: number;
}

interface SpotMarket {
  name: string;
  coin: string;
  tokenId: string;
  index: number;
  markPx: string;
  midPx: string;
  prevDayPx: string;
  dayNtlVlm: string;
  change24h: number;
}

interface SpotBalance {
  coin: string;
  token: number;
  total: string;
  hold: string;
  available: string;
  entryNtl: string;
}

// ─── Logic functions ────────────────────────────────────────────────────────

async function getSpotTokens(search?: string): Promise<{ tokens: SpotToken[]; count: number }> {
  const cacheKey = "spotMeta";
  let meta = cached<any>(cacheKey);
  if (!meta) {
    meta = await hlPost({ type: "spotMeta" });
    setCache(cacheKey, meta);
  }

  const universe: any[] = meta.universe || [];
  const tokens: any[] = meta.tokens || [];

  let result: SpotToken[] = universe.map((u: any, i: number) => {
    const tokenEntry = tokens.find((t: any) => t.index === u.index) || tokens[i] || {};
    return {
      name: u.name || `Token-${u.index}`,
      tokenId: tokenEntry.tokenId || u.tokens?.[0] || "unknown",
      index: u.index ?? i,
      decimals: u.szDecimals ?? 0,
      weiDecimals: tokenEntry.weiDecimals ?? u.weiDecimals ?? 8,
    };
  });

  if (search) {
    const term = search.toLowerCase();
    result = result.filter((t) =>
      t.name.toLowerCase().includes(term) ||
      t.tokenId.toLowerCase().includes(term)
    );
  }

  return { tokens: result, count: result.length };
}

async function getSpotMarkets(sort: string = "volume"): Promise<{ markets: SpotMarket[]; count: number }> {
  const cacheKey = "spotMetaAndAssetCtxs";
  let data = cached<any>(cacheKey);
  if (!data) {
    data = await hlPost({ type: "spotMetaAndAssetCtxs" });
    setCache(cacheKey, data);
  }

  // Response is [spotMeta, assetCtxs[]]
  const [spotMeta, assetCtxs] = data;
  const universe: any[] = spotMeta?.universe || [];

  const markets: SpotMarket[] = universe.map((u: any, i: number) => {
    const ctx = assetCtxs?.[i] || {};
    const markPx = ctx.markPx || "0";
    const prevDayPx = ctx.prevDayPx || "0";
    const markNum = parseFloat(markPx);
    const prevNum = parseFloat(prevDayPx);
    const change24h = prevNum > 0 ? ((markNum - prevNum) / prevNum) * 100 : 0;

    return {
      name: `${u.name || "?"}/USDC`,
      coin: u.name || `Token-${u.index}`,
      tokenId: u.tokens?.[0] || "unknown",
      index: u.index ?? i,
      markPx,
      midPx: ctx.midPx || "0",
      prevDayPx,
      dayNtlVlm: ctx.dayNtlVlm || "0",
      change24h: Math.round(change24h * 100) / 100,
    };
  });

  // Sort
  switch (sort) {
    case "change":
      markets.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
      break;
    case "name":
      markets.sort((a, b) => a.coin.localeCompare(b.coin));
      break;
    case "volume":
    default:
      markets.sort((a, b) => parseFloat(b.dayNtlVlm) - parseFloat(a.dayNtlVlm));
      break;
  }

  return { markets, count: markets.length };
}

async function getSpotBalances(address: string): Promise<{ address: string; balances: SpotBalance[]; count: number }> {
  const cacheKey = `balance_${address}`;
  let data = cached<any>(cacheKey);
  if (!data) {
    data = await hlPost({ type: "spotClearinghouseState", user: address });
    setCache(cacheKey, data);
  }

  const balances: SpotBalance[] = (data.balances || []).map((b: any) => ({
    coin: b.coin || "unknown",
    token: b.token ?? 0,
    total: b.total || "0",
    hold: b.hold || "0",
    available: String(parseFloat(b.total || "0") - parseFloat(b.hold || "0")),
    entryNtl: b.entryNtl || "0",
  }));

  return { address, balances, count: balances.length };
}

// ─── Routes ─────────────────────────────────────────────────────────────────

export function registerRoutes(app: Hono) {
  // List spot tokens
  app.post("/api/tokens", async (c) => {
    await tryRequirePayment(0.002);
    const body = await c.req.json().catch(() => ({}));
    const search: string | undefined = body.search?.trim() || undefined;

    try {
      const result = await getSpotTokens(search);
      return c.json(result);
    } catch (e: any) {
      return c.json({ error: `Failed to fetch spot tokens: ${e.message}` }, 500);
    }
  });

  // Spot market data
  app.post("/api/markets", async (c) => {
    await tryRequirePayment(0.002);
    const body = await c.req.json().catch(() => ({}));
    const sort: string = body.sort || "volume";

    if (!["volume", "change", "name"].includes(sort)) {
      return c.json({ error: "Invalid sort. Must be one of: volume, change, name" }, 400);
    }

    try {
      const result = await getSpotMarkets(sort);
      return c.json(result);
    } catch (e: any) {
      return c.json({ error: `Failed to fetch spot markets: ${e.message}` }, 500);
    }
  });

  // Spot balances
  app.post("/api/balance", async (c) => {
    await tryRequirePayment(0.002);
    const body = await c.req.json().catch(() => null);
    if (!body?.address) {
      return c.json({ error: "Missing required field: address (0x... format)" }, 400);
    }

    const address: string = body.address.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return c.json({ error: "Invalid address format. Must be 0x followed by 40 hex characters." }, 400);
    }

    try {
      const result = await getSpotBalances(address);
      return c.json(result);
    } catch (e: any) {
      return c.json({ error: `Failed to fetch spot balances: ${e.message}` }, 500);
    }
  });
}
