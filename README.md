# Hyperliquid Spot API

[![MCP Server](https://img.shields.io/badge/MCP-server-blue)](https://hl-spot.api.klymax402.com/mcp)
[![x402](https://img.shields.io/badge/payments-x402-6E56CF)](https://x402.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Hyperliquid SPOT market data: 454 tokens, live prices, 24h volume, wallet balances. Native L1 DEX data, no CoinGecko. The spot data layer agents need for Hyperliquid trading. Pay-per-call via [x402](https://x402.org) (USDC on Base L2) -- no API key, no signup, no rate-limit wall.

Part of the [klymax402](https://klymax402.com) marketplace -- 100 x402 micropayment APIs for AI agents, one wallet, USDC on Base.

## Quickstart -- MCP

Add to your MCP client config (Claude Desktop, Cursor, ElizaOS, etc.):

```json
{
  "mcpServers": {
    "hl-spot": {
      "url": "https://hl-spot.api.klymax402.com/mcp"
    }
  }
}
```

## Quickstart -- HTTP (x402)

```bash
curl -X POST "https://hl-spot.api.klymax402.com/api/tokens" \
  -H "Content-Type: application/json" \
  -d '{}'
# -> 402 Payment Required, with an x402 payment challenge in the response body
```

Any x402-aware client ([`@x402/fetch`](https://www.npmjs.com/package/@x402/fetch), [`x402-agent-tools`](https://www.npmjs.com/package/x402-agent-tools), ATXP) handles the 402 -> sign -> retry cycle automatically.

## Tools

| Tool | Method | Path | Price | Description |
|---|---|---|---|---|
| `hyperliquid_list_spot_tokens` | POST | `/api/tokens` | $0.002 | List all 454 spot tokens on Hyperliquid with metadata: name, tokenId, index, decimals, wei decimals. |
| `hyperliquid_get_spot_markets` | POST | `/api/markets` | $0.002 | Spot market prices, 24h volume, mid price, and trading pair info for all Hyperliquid spot pairs. |
| `hyperliquid_get_spot_balances` | POST | `/api/balance` | $0.002 | Spot token balances for any wallet address on Hyperliquid, including held and available amounts. |

### `hyperliquid_list_spot_tokens`

Use this when you need to list or search spot tokens available on Hyperliquid L1 DEX. Returns all 454 spot tokens with full metadata including token name, symbol, tokenId, index, decimals, and wei conversion factors.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `search` | string | no | Optional filter: search tokens by name or symbol (case-insensitive substring match). Omit to return all 454 tokens. |

Example response:

```json
{ tokens: [{ name: "PURR", tokenId: "0xc4bf3f...", index: 1, decimals: 0, weiDecimals: 8 }], count: 454 }
```

**Not for**: perps/futures data (use `hyperliquid_get_perp_markets`), token prices on CEX/CoinGecko (use `token_get_price`), wallet portfolio across chains (use `wallet_get_portfolio`), Hyperliquid vault data (use `hyperliquid_get_vaults`).

### `hyperliquid_get_spot_markets`

Use this when you need live spot market data from Hyperliquid DEX: prices, 24h volume, and trading activity for all spot pairs. Returns merged token metadata + real-time market context for every active spot market.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `sort` | string | no | Sort order for results. 'volume' = highest 24h volume first (default), 'change' = biggest price movers first, 'name' = alphabetical. |

Example response:

```json
{ markets: [{ name: "PURR/USDC", markPx: "0.0234", dayNtlVlm: "1250000", change24h: 5.32 }], count: 120 }
```

**Not for**: perps/futures markets (use `hyperliquid_get_perp_markets`), CoinGecko prices (use `token_get_price`), funding rates (use `hyperliquid_get_funding_rates`), historical OHLCV candles (use `token_get_ohlcv`).

### `hyperliquid_get_spot_balances`

Use this when you need to check spot token balances for a specific wallet address on Hyperliquid L1 DEX. Returns all non-zero spot token holdings with available and held (in-order) amounts.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `address` | string | yes | Wallet address in 0x format (42 characters). Example: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 |

Example response:

```json
{ address: "0xabc...", balances: [{ coin: "PURR", total: "15000", hold: "5000", available: "10000", entryNtl: "350.50" }], count: 3 }
```

**Not for**: perps positions (use `hyperliquid_get_perp_positions`), Hyperliquid vault balances (use `hyperliquid_get_vaults`), EVM token balances (use `token_get_balance`).

## Example agent prompts

- "List or search spot tokens available on Hyperliquid L1 DEX"
- "Live spot market data from Hyperliquid DEX: prices, 24h volume, and trading activity for all spot pairs"
- "Check spot token balances for a specific wallet address on Hyperliquid L1 DEX"

## Payment

- Protocol: [x402](https://x402.org) -- HTTP-native pay-per-call, no signup, no API key
- Network: Base L2 (`eip155:8453`)
- Asset: USDC
- Facilitator: Coinbase CDP (primary), PayAI (fallback)
- Also reachable via [ATXP](https://atxp.ai) (OAuth-wrapped x402, RFC 9728 protected-resource metadata)

## Part of klymax402

100 x402 micropayment APIs for AI agents -- one wallet, USDC on Base, zero signup.

- Catalog: https://klymax402.com/llms.txt
- Full API reference: https://klymax402.com/llms-full.txt
- Live stats: https://klymax402.com/stats

## License

MIT
