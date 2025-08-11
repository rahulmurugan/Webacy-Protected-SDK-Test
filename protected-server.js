#!/usr/bin/env node
import { FastMCP } from 'fastmcp';
import { RadiusMcpSdk } from '@radiustechsystems/mcp-sdk';
import { webacyTools, TOKEN_REQUIREMENTS } from './tools/webacy-tools.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Radius MCP SDK - Using environment variables
const radius = new RadiusMcpSdk({
  contractAddress: process.env.RADIUS_CONTRACT_ADDRESS || '0x5448Dc20ad9e0cDb5Dd0db25e814545d1aa08D96',
  chainId: parseInt(process.env.RADIUS_CHAIN_ID) || 1223953,
  rpcUrl: process.env.RADIUS_RPC_URL || 'https://rpc.testnet.radiustech.xyz',
  cache: {
    ttl: 300,
    maxSize: 1000,
    disabled: false
  },
  debug: process.env.DEBUG === 'true'
});

// Create FastMCP server
const server = new FastMCP({
  name: 'webacy-protected-sdk-test',
  version: '1.0.0',
  description: 'Webacy MCP server protected with @radiustechsystems/mcp-sdk'
});

// Register all tools with appropriate protection
console.log('🚀 Starting Webacy MCP Server (Protected with SDK)');
console.log('🔐 Using @radiustechsystems/mcp-sdk package\n');
console.log('📝 Registering protected tools...\n');

Object.entries(webacyTools).forEach(([toolName, tool]) => {
  const tokenId = TOKEN_REQUIREMENTS[toolName];
  
  // Create handler based on token requirement
  let execute;
  if (tokenId === 0) {
    // Free tier - no protection
    execute = tool.handler;
    console.log(`✅ ${toolName} - FREE (no token required)`);
  } else {
    // Protected tiers - wrap with Radius MCP SDK
    execute = radius.protect(tokenId, tool.handler);
    console.log(`🔒 ${toolName} - Protected with Token ID ${tokenId}`);
  }
  
  // Register the tool with the appropriate handler
  server.addTool({
    name: toolName,
    description: tool.description,
    parameters: tool.inputSchema,
    execute: execute  // Direct assignment
  });
});

// Start the server
async function main() {
  console.log('\n🌟 All tools registered with protection!');
  console.log('\n📊 Token Requirements:');
  console.log('  - Free (Token 0): ping');
  console.log('  - Basic (Token 1): checkAddressThreat, checkSanctionStatus');
  console.log('  - Premium (Token 3): analyzeContract, analyzeTransaction');
  console.log('  - Pro (Token 5): analyzeUrl\n');
  
  await server.start();
  
  console.log('✨ Protected Webacy MCP Server is running');
  console.log('🔌 Ready to accept authenticated connections...\n');
}

main().catch((error) => {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
});