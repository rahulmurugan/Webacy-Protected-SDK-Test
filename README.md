# Webacy SDK Test

This repository contains a Webacy MCP server for testing the `@radiustechsystems/mcp-sdk` NPM package.

## Implementation Steps

### Step 1: Setup Unprotected Server ✅
1. Clone/create this repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and add your Webacy API key
4. Run the unprotected server: `npm start`

### Step 2: Test Unprotected Server
1. Configure in Claude Desktop settings or your MCP client
2. Test all 6 tools work without any authentication:
   - `ping` - Server health check
   - `checkAddressThreat` - Address threat analysis
   - `checkSanctionStatus` - Sanctions check
   - `analyzeContract` - Contract security audit
   - `analyzeTransaction` - Transaction risk analysis
   - `analyzeUrl` - URL phishing detection

### Step 3: Install RadiusTech MCP SDK
```bash
npm install @radiustechsystems/mcp-sdk
```

### Step 4: Create Protected Server
Create `protected-server.js` that uses the SDK to add token protection.

### Step 5: Test Protection
Compare behavior between unprotected and protected servers:
- Free tier (ping) should work without tokens
- Other tools should require appropriate tokens
- Error messages should guide users to purchase tokens

## Project Structure
```
webacy-sdk-test/
├── unprotected-server.js    # Base server without protection
├── protected-server.js      # Server with RadiusTech MCP SDK
├── protected-server-http.js # HTTP server for Railway deployment
├── tools/
│   └── webacy-tools.js     # All 6 Webacy tools
├── config/
│   └── webacy-config.js    # API configuration
└── test/
    ├── test-unprotected.js # Test suite for unprotected
    └── test-protected.js   # Test suite for protected
```

## Token Requirements (for protected version)
- **Free Tier (Token 0)**: ping
- **Basic Tier (Token 1)**: checkAddressThreat, checkSanctionStatus
- **Premium Tier (Token 3)**: analyzeContract, analyzeTransaction
- **Pro Tier (Token 5)**: analyzeUrl

## Environment Variables
```
# Webacy API Configuration
WEBACY_API_KEY=your_webacy_api_key_here
WEBACY_API_URL=https://api.webacy.com

# Radius MCP SDK Configuration
RADIUS_CONTRACT_ADDRESS=0x5448Dc20ad9e0cDb5Dd0db25e814545d1aa08D96
RADIUS_CHAIN_ID=1223953
RADIUS_RPC_URL=https://rpc.testnet.radiustech.xyz
DEBUG=false

# Server Configuration
PORT=3001
NODE_ENV=development
```

## RadiusTech MCP SDK Configuration
The protected server uses the following configuration from the NPM package:
- Contract: `0x5448Dc20ad9e0cDb5Dd0db25e814545d1aa08D96`
- Chain ID: `1223953`
- RPC URL: `https://rpc.testnet.radiustech.xyz`
- Cache: TTL 300s, max size 1000, enabled
- Debug: Configurable via DEBUG environment variable

## Available Scripts
- `npm start` - Run unprotected server
- `npm run start:protected` - Run protected server (stdio)
- `npm run start:http` - Run protected server (HTTP for Railway)
- `npm test` - Run unprotected tests
- `npm run test:protected` - Run protected tests