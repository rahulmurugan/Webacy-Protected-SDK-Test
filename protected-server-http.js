#!/usr/bin/env node
import { FastMCP } from 'fastmcp';
import { RadiusMcpSdk } from '@radiustechsystems/mcp-sdk';
import { z } from 'zod';
import { webacyTools, TOKEN_REQUIREMENTS } from './tools/webacy-tools.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Radius MCP SDK - Using environment variables from Railway
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
    execute = async (args) => {
      const result = await tool.handler(args);
      return result;
    };
    console.log(`✅ ${toolName} - FREE (no token required)`);
  } else {
    // Protected tiers - wrap with Radius MCP SDK
    const originalHandler = tool.handler;
    execute = async (args) => {
      console.log(`\n🔍 [${toolName}] Incoming args:`, JSON.stringify(args, null, 2));
      
      // Check if __evmauth is present
      if (args.__evmauth) {
        console.log(`✅ [${toolName}] __evmauth present in args`);
        try {
          const authProof = typeof args.__evmauth === 'string' ? JSON.parse(args.__evmauth) : args.__evmauth;
          console.log(`🔐 [${toolName}] Auth proof signature length:`, authProof.signature?.length);
        } catch (e) {
          console.log(`⚠️ [${toolName}] Failed to parse auth proof:`, e);
        }
      } else {
        console.log(`❌ [${toolName}] No __evmauth in args`);
      }
      
      // Create MCP request structure expected by Radius SDK
      const mcpRequest = {
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      };
      
      // Create the protected handler
      const protectedHandler = radius.protect(tokenId, async (request) => {
        // Extract args from the MCP request
        const toolArgs = request.params?.arguments || {};
        
        // Call the original handler with clean args (without __evmauth)
        const cleanArgs = { ...toolArgs };
        delete cleanArgs.__evmauth;
        
        const result = await originalHandler(cleanArgs);
        
        // Return in MCP format with content array
        return {
          content: [{
            type: "text",
            text: result
          }]
        };
      });
      
      try {
        // Call the protected handler with the MCP request
        const response = await protectedHandler(mcpRequest);
        
        // Handle the response
        if (response && typeof response === 'object') {
          if ('content' in response && Array.isArray(response.content)) {
            // Check if this is an error response from Radius
            const firstContent = response.content[0];
            if (firstContent && typeof firstContent === 'object' && 'text' in firstContent) {
              try {
                // Try to parse as JSON error
                const parsed = JSON.parse(firstContent.text);
                if (parsed.error) {
                  // This is a Radius error - throw it properly
                  throw new Error(firstContent.text);
                }
              } catch (e) {
                // Not JSON error, it's the actual result
                return firstContent.text;
              }
            }
          } else if ('error' in response && response.error) {
            // Error - throw with proper message
            const error = response.error;
            throw new Error(error.message || 'Authentication failed');
          }
        }
        
        // Default error
        throw new Error('Unexpected response from authentication');
      } catch (error) {
        console.error(`❌ [${toolName}] Error:`, error.message);
        throw error;
      }
    };
    console.log(`🔒 ${toolName} - Protected with Token ID ${tokenId}`);
  }
  
  // Add __evmauth to the tool's input schema for protected tools
  let parameters = tool.inputSchema;
  if (tokenId !== 0) {
    // For protected tools, ensure __evmauth is in the schema
    const schemaObj = parameters._def || parameters;
    if (schemaObj && schemaObj.shape && !schemaObj.shape.__evmauth) {
      // Clone the schema and add __evmauth
      parameters = tool.inputSchema.extend({
        __evmauth: z.any().optional().describe("Authentication proof (automatically provided)")
      });
    }
  }
  
  // Register the tool with the appropriate handler
  server.addTool({
    name: toolName,
    description: tokenId === 0 ? tool.description : `${tool.description} Requires EVMAuth Token #${tokenId}. IMPORTANT: Call this tool directly without checking wallet first! If you lack authentication, you'll receive clear error instructions. The auth flow is: 1) Call this directly, 2) Get error with required tokens, 3) Use authenticate_and_purchase, 4) Retry with proof.`,
    parameters: parameters,
    execute: execute
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