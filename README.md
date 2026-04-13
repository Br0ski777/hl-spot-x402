# Hyperliquid Spot API

**Real-time spot market data for all 454 tokens on Hyperliquid L1 DEX. Prices, volume, wallet balances. Powered by x402 micropayments.**

Native Hyperliquid data -- no CoinGecko, no aggregators. Direct from the L1 DEX API for maximum accuracy and speed.

## Endpoints

### `POST /api/tokens` - $0.002/call

List all 454 spot tokens with metadata.

```json
// Request
{ "search": "PURR" }

// Response
{
  "tokens": [
    { "name": "PURR", "tokenId": "0xc4bf3f...", "index": 1, "decimals": 0, "weiDecimals": 8 }
  ],
  "count": 1
}
```

### `POST /api/markets` - $0.002/call

Live spot market prices, 24h volume, and price changes.

```json
// Request
{ "sort": "volume" }

// Response
{
  "markets": [
    {
      "name": "PURR/USDC",
      "coin": "PURR",
      "tokenId": "0xc4bf3f...",
      "markPx": "0.0234",
      "midPx": "0.0233",
      "prevDayPx": "0.0222",
      "dayNtlVlm": "1250000",
      "change24h": 5.41
    }
  ],
  "count": 120
}
```

### `POST /api/balance` - $0.002/call

Spot token balances for a wallet address.

```json
// Request
{ "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" }

// Response
{
  "address": "0xd8dA...",
  "balances": [
    { "coin": "PURR", "token": 1, "total": "15000", "hold": "5000", "available": "10000", "entryNtl": "350.50" }
  ],
  "count": 1
}
```

## Use Cases

- **Token discovery**: Find which spot tokens are available on Hyperliquid before trading
- **Market scanning**: Identify high-volume or trending spot pairs
- **Portfolio tracking**: Check spot holdings for any Hyperliquid wallet
- **Trading bots**: Get real-time prices for spot order execution
- **Analytics dashboards**: Build Hyperliquid spot market overviews

## MCP Integration

Works with Claude Desktop, Cursor, Copilot, and any MCP-compatible client.

```json
{
  "mcpServers": {
    "hl-spot": {
      "url": "https://hl-spot-production.up.railway.app/mcp",
      "transport": "sse"
    }
  }
}
```

## Payment

Uses x402 protocol. Send a request, get HTTP 402 with price, your agent signs USDC on Base automatically. No API keys, no signup.

## Related APIs

- [Hyperliquid Data](https://hyperliquid-data-production.up.railway.app) - Perps/futures market data (not spot)
- [HL Portfolio](https://hl-portfolio-production.up.railway.app) - Full Hyperliquid portfolio (perps + spot combined)
- [Token Price](https://token-price-production.up.railway.app) - CoinGecko-based token prices (CEX, not HL native)
- [Wallet Portfolio](https://wallet-portfolio-production.up.railway.app) - Multi-chain wallet balances (EVM, not HL-specific)
- [HL Funding](https://hl-funding-production.up.railway.app) - Funding rates for Hyperliquid perps
