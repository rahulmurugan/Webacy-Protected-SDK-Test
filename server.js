#!/usr/bin/env node
import { FastMCP } from 'fastmcp';
import { RadiusMcpSdk } from '@radiustechsystems/mcp-sdk';
import { z } from 'zod';
import { TOKEN_TIER_MAPPINGS, webacyTools, TOKEN_REQUIREMENTS } from './tools/webacy-tools.js';
import dotenv from 'dotenv';

dotenv.config();

// Environment configuration
const EVMAUTH_CONTRACT_ADDRESS = process.env.RADIUS_CONTRACT_ADDRESS || "0x9f2B42FB651b75CC3db4ef9FEd913A22BA4629Cf";
const DEMO_MODE = process.env.DEMO_MODE === 'true';

// Initialize the Radius MCP SDK
const radius = new RadiusMcpSdk({
  contractAddress: EVMAUTH_CONTRACT_ADDRESS,
  debug: process.env.DEBUG === 'true'
});

// Create MCP server
const server = new FastMCP({
  name: 'radius-webacy-mcp-server',
  version: '1.0.0'
});

// Register all tools
console.log('🚀 Starting Webacy MCP Server (Protected with SDK)');
console.log('🔐 Using @radiustechsystems/mcp-sdk package\n');
console.log('📝 Registering protected tools...\n');

Object.entries(webacyTools).forEach(([toolName, tool]) => {
  const tokenId = TOKEN_REQUIREMENTS[toolName];
  
  // Create the authentication wrapper for each tool
  const authenticatedHandler = async (args) => {
    console.log(`\n🔍 [${toolName}] Incoming args:`, JSON.stringify(args, null, 2));
    
    // DEMO MODE: Bypass authentication
    if (DEMO_MODE) {
      console.log(`🎮 [${toolName}] DEMO MODE ACTIVE - Bypassing authentication`);
      console.log(`✅ [${toolName}] Token ID ${tokenId} requirement bypassed for demo`);
      
      // Call the tool handler directly
      const result = await tool.handler(args);
      
      // Return in MCP format
      return {
        content: [{
          type: "text",
          text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
        }]
      };
    }
    
    // Free tier - no protection needed
    if (tokenId === 0) {
      const result = await tool.handler(args);
      return {
        content: [{
          type: "text",
          text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
        }]
      };
    }
    
    // Protected tier - use Radius SDK
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
      
      const result = await tool.handler(cleanArgs);
      
      // Return in MCP format
      return {
        content: [{
          type: "text",
          text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
        }]
      };
    });
    
    try {
      // Call the protected handler with the MCP request
      const response = await protectedHandler(mcpRequest);
      if (response && typeof response === 'object') {
          if ('content' in response && Array.isArray(response.content)) {
            // Check if this is an error response from Radius
            const firstContent = response.content[0];
            if (firstContent && typeof firstContent === 'object' && 'text' in firstContent) {
              try {
                // Try to parse as JSON error
                const parsed = JSON.parse(firstContent.text);
                if (parsed.error) {
                  // This is a Radius error - throw it properly so Claude gets the full error info
                  throw new Error(firstContent.text);
                }
                return response;
              } catch (e) {
                // Not JSON, it's the actual text
                return response;
              }
            }
          } else if ('error' in response && response.error) {
            // Error - throw with proper message
            const error = response.error;
            throw new Error(error.message || 'Authentication failed');
          }
        }
        
      return response;
    } catch (error) {
      console.error(`❌ [${toolName}] Error:`, error.message);
      throw error;
    }
  };
  
  // Create parameters schema with __evmauth for protected tools
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
  
  // Register the tool
  server.addTool({
    name: toolName,
    description: tokenId === 0 ? tool.description : `${tool.description} Requires EVMAuth Token #${tokenId}. IMPORTANT: Call this tool directly without checking wallet first! If you lack authentication, you'll receive clear error instructions. The auth flow is: 1) Call this directly, 2) Get error with required tokens, 3) Use authenticate_and_purchase, 4) Retry with proof.`,
    parameters: parameters,
    execute: authenticatedHandler
  });
  
  if (tokenId === 0) {
    console.log(`✅ ${toolName} - FREE (no token required)`);
  } else {
    console.log(`🔒 ${toolName} - Protected with Token ID ${tokenId}`);
  }
});

// Start the server
async function main() {
  console.log('\n🌟 All tools registered with protection!');
  console.log('\n📊 Token Requirements:');
  Object.keys(TOKEN_TIER_MAPPINGS).forEach(tier => {
    console.log(" -",`${tier}(Token ${TOKEN_TIER_MAPPINGS[tier]}):`, Object.keys(TOKEN_REQUIREMENTS).filter(key => TOKEN_REQUIREMENTS[key] === TOKEN_TIER_MAPPINGS[tier]).join(", "));
  })
  console.log("\n");
  // For Railway deployment - use HTTP transport
  const isProduction = process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production';
  const port = parseInt(process.env.PORT) || 3000;

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
    
    if (DEMO_MODE) {
      console.log('🎮 DEMO MODE: ACTIVE - Authentication bypassed for all protected tools');
      console.log('⚠️  WARNING: This mode is for demonstration only. Do not use in production!');
    } else {
      console.log(`🔐 Radius MCP protection: Enabled`);
      console.log('🔗 Contract:', EVMAUTH_CONTRACT_ADDRESS);
    }
    
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
    
    if (DEMO_MODE) {
      console.log('🎮 DEMO MODE: ACTIVE - Authentication bypassed for all protected tools');
      console.log('⚠️  WARNING: This mode is for demonstration only. Do not use in production!');
    } else {
      console.log('🔐 Radius MCP protection: Enabled');
    }
  }
}

main().catch((error) => {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
});
