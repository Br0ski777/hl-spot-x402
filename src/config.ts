import type { ApiConfig } from "./shared.ts";

export const API_CONFIG: ApiConfig = {
  name: "Hyperliquid Spot API",
  slug: "hl-spot",
  description: "Hyperliquid SPOT market data: 454 tokens, live prices, 24h volume, wallet balances. Native L1 DEX data, no CoinGecko. The spot data layer agents need for Hyperliquid trading.",
  version: "1.0.0",
  routes: [
    {
      method: "POST",
      path: "/api/tokens",
      price: "$0.002",
      description: "List all 454 spot tokens on Hyperliquid with metadata: name, tokenId, index, decimals, wei decimals.",
      toolName: "hyperliquid_list_spot_tokens",
      toolDescription:
        `Use this when you need to list or search spot tokens available on Hyperliquid L1 DEX. Returns all 454 spot tokens with full metadata including token name, symbol, tokenId, index, decimals, and wei conversion factors.

Returns for each token:
1. name: token display name (e.g. "PURR", "HFUN")
2. tokenId: unique hex token identifier on Hyperliquid
3. index: integer index in the spot meta registry
4. decimals: token decimal precision (szDecimals)
5. weiDecimals: wei-level decimal precision for raw amounts

Optional filter: pass "search" to filter tokens by name/symbol substring match (case-insensitive). Returns all tokens if no search term provided.

Example output: { tokens: [{ name: "PURR", tokenId: "0xc4bf3f...", index: 1, decimals: 0, weiDecimals: 8 }], count: 454 }

Use this to discover which spot tokens exist on Hyperliquid before querying prices or balances. Essential for building trading interfaces or token lookups.

Do NOT use for perps/futures data -- use hyperliquid_get_perp_markets instead. Do NOT use for token prices on CEX/CoinGecko -- use token_get_price instead. Do NOT use for wallet portfolio across chains -- use wallet_get_portfolio instead. Do NOT use for Hyperliquid vault data -- use hyperliquid_get_vaults instead.`,
      inputSchema: {
        type: "object",
        properties: {
          search: {
            type: "string",
            description: "Optional filter: search tokens by name or symbol (case-insensitive substring match). Omit to return all 454 tokens.",
          },
        },
        required: [],
      },
      outputSchema: {
          "type": "object",
          "properties": {
            "tokens": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string"
                  },
                  "tokenId": {
                    "type": "string"
                  },
                  "index": {
                    "type": "number"
                  },
                  "decimals": {
                    "type": "number"
                  },
                  "weiDecimals": {
                    "type": "number"
                  }
                }
              }
            },
            "count": {
              "type": "number",
              "description": "Number of tokens returned"
            }
          },
          "required": [
            "tokens",
            "count"
          ]
        },
    },
    {
      method: "POST",
      path: "/api/markets",
      price: "$0.002",
      description: "Spot market prices, 24h volume, mid price, and trading pair info for all Hyperliquid spot pairs.",
      toolName: "hyperliquid_get_spot_markets",
      toolDescription:
        `Use this when you need live spot market data from Hyperliquid DEX: prices, 24h volume, and trading activity for all spot pairs. Returns merged token metadata + real-time market context for every active spot market.

Returns for each market:
1. name: token name (e.g. "PURR/USDC")
2. coin: base token symbol
3. tokenId: unique token identifier
4. markPx: current mark/mid price in USDC
5. midPx: mid price between best bid and ask
6. prevDayPx: previous day closing price
7. dayNtlVlm: 24h notional volume in USDC
8. change24h: percentage price change over 24 hours

Sortable by: "volume" (default, highest 24h volume first), "change" (biggest movers first), "name" (alphabetical).

Example output: { markets: [{ name: "PURR/USDC", markPx: "0.0234", dayNtlVlm: "1250000", change24h: 5.32 }], count: 120 }

Use this to find trending spot tokens, check current prices, or scan for high-volume trading opportunities on Hyperliquid.

Do NOT use for perps/futures markets -- use hyperliquid_get_perp_markets instead. Do NOT use for CoinGecko prices -- use token_get_price instead. Do NOT use for funding rates -- use hyperliquid_get_funding_rates instead. Do NOT use for historical OHLCV candles -- use token_get_ohlcv instead.`,
      inputSchema: {
        type: "object",
        properties: {
          sort: {
            type: "string",
            enum: ["volume", "change", "name"],
            description: "Sort order for results. 'volume' = highest 24h volume first (default), 'change' = biggest price movers first, 'name' = alphabetical.",
          },
        },
        required: [],
      },
      outputSchema: {
          "type": "object",
          "properties": {
            "markets": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string"
                  },
                  "coin": {
                    "type": "string"
                  },
                  "markPx": {
                    "type": "string"
                  },
                  "midPx": {
                    "type": "string"
                  },
                  "dayNtlVlm": {
                    "type": "string"
                  },
                  "change24h": {
                    "type": "number"
                  }
                }
              }
            },
            "count": {
              "type": "number",
              "description": "Number of markets"
            }
          },
          "required": [
            "markets",
            "count"
          ]
        },
    },
    {
      method: "POST",
      path: "/api/balance",
      price: "$0.002",
      description: "Spot token balances for any wallet address on Hyperliquid, including held and available amounts.",
      toolName: "hyperliquid_get_spot_balances",
      toolDescription:
        `Use this when you need to check spot token balances for a specific wallet address on Hyperliquid L1 DEX. Returns all non-zero spot token holdings with available and held (in-order) amounts.

Returns for each balance:
1. coin: token symbol
2. token: token index in spot registry
3. total: total balance (hold + available) as string
4. hold: amount currently held in open orders
5. available: amount available for trading or withdrawal
6. entryNtl: entry notional value in USDC

Input: wallet address (0x... format, 42 characters).

Example output: { address: "0xabc...", balances: [{ coin: "PURR", total: "15000", hold: "5000", available: "10000", entryNtl: "350.50" }], count: 3 }

Use this to check what spot tokens a Hyperliquid wallet holds before executing trades or analyzing portfolios.

Do NOT use for perps positions -- use hyperliquid_get_perp_positions instead. Do NOT use for cross-chain wallet balances -- use wallet_get_portfolio instead. Do NOT use for Hyperliquid vault balances -- use hyperliquid_get_vaults instead. Do NOT use for EVM token balances -- use token_get_balance instead.`,
      inputSchema: {
        type: "object",
        properties: {
          address: {
            type: "string",
            description: "Wallet address in 0x format (42 characters). Example: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
          },
        },
        required: ["address"],
      },
      outputSchema: {
          "type": "object",
          "properties": {
            "address": {
              "type": "string",
              "description": "Wallet address"
            },
            "balances": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "coin": {
                    "type": "string"
                  },
                  "total": {
                    "type": "string"
                  },
                  "hold": {
                    "type": "string"
                  },
                  "available": {
                    "type": "string"
                  },
                  "entryNtl": {
                    "type": "string"
                  }
                }
              }
            },
            "count": {
              "type": "number"
            }
          },
          "required": [
            "address",
            "balances",
            "count"
          ]
        },
    },
  ],
};
