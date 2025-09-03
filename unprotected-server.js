#!/usr/bin/env node
import { FastMCP } from 'fastmcp';
import { webacyTools } from './tools/webacy-tools.js';
import { logInfo } from './logger.js';

// Create FastMCP server
const server = new FastMCP({
  name: 'webacy-unprotected',
  version: '1.0.0',
  description: 'Unprotected Webacy MCP server for testing EVMAuth SDK'
});

// Register all tools without any protection
logInfo('🚀 Starting Webacy MCP Server (Unprotected)');
logInfo('📝 Registering tools...\n');

// Register each tool
Object.entries(webacyTools).forEach(([toolName, tool]) => {
  server.addTool({
    name: toolName,
    description: tool.description,
    parameters: tool.inputSchema,
    execute: tool.handler
  });
  
  logInfo(`✅ Registered: ${toolName} - ${tool.description}`);
});

// Start the server
async function main() {
  logInfo('\n🌟 All tools registered successfully!');
  logInfo('⚠️  WARNING: This server has NO token protection!');
  logInfo('📊 All Webacy API tools are freely accessible.\n');
  
  await server.start();
  
  logInfo('✨ Webacy MCP Server is running');
  logInfo('🔌 Ready to accept connections...\n');
}

main().catch((error) => {
  logInfo(`❌ Server failed to start: ${error}`);
  process.exit(1);
});