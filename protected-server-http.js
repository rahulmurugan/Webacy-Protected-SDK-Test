#!/usr/bin/env node
import { FastMCP } from 'fastmcp';
import { RadiusMcpSdk } from '@radiustechsystems/mcp-sdk';
import { webacyTools, TOKEN_REQUIREMENTS } from './tools/webacy-tools.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Radius MCP SDK - Using environment variables from Railway
const radius = new RadiusMcpSdk({
  contractAddress: process.env.RADIUS_CONTRACT_ADDRESS || '0x9f2B42FB651b75CC3db4ef9FEd913A22BA4629Cf',
  chainId: parseInt(process.env.RADIUS_CHAIN_ID) || 1223953,
  rpcUrl: process.env.RADIUS_RPC_URL || 'https://rpc.testnet.radiustech.xyz',
  cache: {
    ttl: 300,
    maxSize: 1000,
    disabled: false
  },
  debug: process.env.DEBUG === 'true'
});

// Create FastMCP server with authentication handler
const server = new FastMCP({
  name: 'webacy-protected-sdk-test',
  version: '1.0.0',
  description: 'Webacy MCP server protected with @radiustechsystems/mcp-sdk',
  // NOTE: Authentication handler is called BEFORE tools execute
  // We can't capture __evmauth here because it comes with tool calls
  // So we'll handle it differently in the tool execution
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
    // IMPORTANT: We need to manually check for __evmauth in args
    execute = async (args) => {
      console.log(`\n🔍 [${toolName}] Raw args received:`, JSON.stringify(args, null, 2));
      
      // The issue: FastMCP strips __evmauth before passing to our handler
      // This is a fundamental incompatibility between FastMCP and RadiusTech SDK
      console.log(`❌ [${toolName}] FastMCP has stripped __evmauth parameter`);
      
      // Call RadiusTech SDK protect - it will fail without __evmauth
      const protectedHandler = radius.protect(tokenId, tool.handler);
      return await protectedHandler(args);
    };
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
    console.log(`🔐 Radius MCP protection: Enabled`);
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