# Webacy MCP server with Radius EVMAuth

This repository contains a Webacy MCP server monetized & protected by Radius SDK

## Setup

1. Clone/create this repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and add your Webacy API key

## Usage

### Running the Server

**Unprotected Server (Demo Mode)**
```bash
npm run start:unprotected        # Basic unprotected server
npm run start:unprotected-stdio  # Development mode with stdio transport
```

**Protected Server (EVMAuth)**
```bash
npm run start:protected          # Protected server with token authentication
npm run start:protected-stdio    # Development mode with stdio transport
```

### Available Tools

The server provides 6 Webacy security tools:
- `ping` - Server health check
- `checkAddressThreat` - Address threat analysis
- `checkSanctionStatus` - Sanctions check
- `analyzeContract` - Contract security audit
- `analyzeTransaction` - Transaction risk analysis
- `analyzeUrl` - URL phishing detection

### Testing the Implementation

1. **Test Unprotected Server**: Configure in Claude Desktop settings or your MCP client and verify all tools work without authentication
2. **Test Protected Server**: Compare behavior - free tier (ping) works without tokens, other tools require appropriate tokens

## Project Structure
```
radius-webacy-mcp-server/
├── server.js               # Main MCP server
├── unprotected-server.js   # Sample server without protection
├── tools/
│   └── webacy-tools.js     # All 6 Webacy tools
├── config/
│   └── webacy-config.js    # API configuration
├── Procfile                # Railway deployment config
├── railway.json            # Railway settings
└── package.json            # Dependencies and scripts
```

## Token Requirements (for protected version)
- **Free Tier (Token 0)**: ping
- **Basic Tier (Token 1)**: checkAddressThreat, checkSanctionStatus
- **Premium Tier (Token 3)**: analyzeContract, analyzeTransaction
- **Pro Tier (Token 5)**: analyzeUrl


## RadiusTech MCP SDK Configuration
The protected server uses the following configuration from the NPM package:
- Contract: `0x5448Dc20ad9e0cDb5Dd0db25e814545d1aa08D96`
- Chain ID: `1223953`
- RPC URL: `https://rpc.testnet.radiustech.xyz`
- Cache: TTL 300s, max size 1000, enabled
- Debug: Configurable via DEBUG environment variable

## Available Scripts
- `npm run start:unprotected` - Run unprotected server (demo mode)
- `npm run start:protected` - Run protected server with EVMAuth
- `npm run start:unprotected-stdio` - Run unprotected server in development mode
- `npm run start:protected-stdio` - Run protected server in development mode