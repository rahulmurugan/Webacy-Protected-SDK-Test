# Webacy SDK Test

This repository contains an unprotected Webacy MCP server for testing the `@matt_dionis/evmauth-sdk-test` NPM package.

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

### Step 3: Install EVMAuth SDK
```bash
npm install @matt_dionis/evmauth-sdk-test
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
├── protected-server.js      # Server with EVMAuth SDK (to be created)
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
WEBACY_API_KEY=your_key_here
WEBACY_API_URL=https://api.webacy.com
```

## EVMAuth SDK Configuration
The protected server uses the following hardcoded values from the NPM package:
- Contract: `0x5448Dc20ad9e0cDb5Dd0db25e814545d1aa08D96`
- Chain ID: `1223953`
- RPC URL: `https://rpc.testnet.radiustech.xyz/q6a4fqcof9cqfdpnehevb0degslmqdowyt3vijwzj0rj5ajg`