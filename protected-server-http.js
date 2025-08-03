#!/usr/bin/env node
import { FastMCP } from 'fastmcp';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { EVMAuthSDK } = require('@matt_dionis/evmauth-sdk-test');
import { webacyTools, TOKEN_REQUIREMENTS } from './tools/webacy-tools.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize EVMAuth SDK - Using environment variables from Railway
const evmauth = new EVMAuthSDK({
  contractAddress: process.env.EVMAUTH_CONTRACT_ADDRESS || '0x5448Dc20ad9e0cDb5Dd0db25e814545d1aa08D96',
  chainId: parseInt(process.env.EVMAUTH_CHAIN_ID) || 1223953,
  rpcUrl: process.env.EVMAUTH_RPC_URL || 'https://rpc.testnet.radiustech.xyz/q6a4fqcof9cqfdpnehevb0degslmqdowyt3vijwzj0rj5ajg'
});

// Create FastMCP server
const server = new FastMCP({
  name: 'webacy-protected-sdk-test',
  version: '1.0.0',
  description: 'Webacy MCP server protected with @matt_dionis/evmauth-sdk-test'
});

// Register all tools with appropriate protection
console.log('🚀 Starting Webacy MCP Server (Protected with SDK)');
console.log('🔐 Using @matt_dionis/evmauth-sdk-test package\n');
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
    // Protected tiers - wrap with EVMAuth SDK
    execute = evmauth.protect(tokenId, tool.handler);
    console.log(`🔒 ${toolName} - Protected with Token ID ${tokenId}`);
  }
  
  // Register the tool with the appropriate handler
  server.addTool({
    name: toolName,
    description: tool.description,
    parameters: tool.inputSchema,
    execute: async (args) => {
      console.log(`\n🔧 Executing tool: ${toolName}`);
      try {
        // The SDK should handle authentication
        return await execute(args);
      } catch (error) {
        console.error(`❌ Error in ${toolName}:`, error);
        throw error;
      }
    }
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
  
  // For Railway deployment - use HTTP transport
  const isProduction = process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production';
  const port = parseInt(process.env.PORT) || 3001;

  if (isProduction) {
    // HTTP transport for Railway
    await server.start({
      transportType: "httpStream",
      httpStream: {
        port: port,
        endpoint: "/mcp",
        host: "0.0.0.0"
      }
    });
    
    console.log(`✅ FastMCP server running on http://0.0.0.0:${port}`);
    console.log(`📍 MCP endpoint: http://0.0.0.0:${port}/mcp`);
    console.log(`🔍 Health check: http://0.0.0.0:${port}/health`);
    console.log(`🔐 EVMAuth protection: Enabled`);
    console.log(`🌐 Ready to accept connections`);
    
    // Keep process alive
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      process.exit(0);
    });
  } else {
    // Local development - stdio
    await server.start();
    console.log('✨ Protected Webacy MCP Server is running (stdio)');
  }
}

main().catch((error) => {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
});