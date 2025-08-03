#!/usr/bin/env node
import { FastMCP } from 'fastmcp';
import { webacyTools } from './tools/webacy-tools.js';

// Create FastMCP server
const server = new FastMCP({
  name: 'webacy-unprotected',
  version: '1.0.0',
  description: 'Unprotected Webacy MCP server for testing EVMAuth SDK'
});

// Register all tools without any protection
console.log('🚀 Starting Webacy MCP Server (Unprotected)');
console.log('📝 Registering tools...\n');

// Register each tool
Object.entries(webacyTools).forEach(([toolName, tool]) => {
  server.addTool({
    name: toolName,
    description: tool.description,
    parameters: tool.inputSchema,
    execute: tool.handler
  });
  
  console.log(`✅ Registered: ${toolName} - ${tool.description}`);
});

// Start the server
async function main() {
  console.log('\n🌟 All tools registered successfully!');
  console.log('⚠️  WARNING: This server has NO token protection!');
  console.log('📊 All Webacy API tools are freely accessible.\n');
  
  await server.start();
  
  console.log('✨ Webacy MCP Server is running');
  console.log('🔌 Ready to accept connections...\n');
}

main().catch((error) => {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
});