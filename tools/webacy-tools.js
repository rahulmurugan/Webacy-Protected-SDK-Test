import { z } from 'zod';
import { makeWebacyRequest } from '../config/webacy-config.js';

// Tool definitions with their handlers
export const webacyTools = {
  // Free Tier Tool
  ping: {
    name: 'ping',
    description: 'Server health check and information',
    inputSchema: z.object({}),
    handler: async () => {
      return JSON.stringify({
        status: "OK",
        service: "Webacy Risk Analysis MCP Server (Unprotected)",
        timestamp: new Date().toISOString(),
        message: "Server is running and ready to analyze blockchain security risks"
      }, null, 2);
    }
  },

  // Basic Tier Tools (would require Token ID 1 in protected version)
  checkAddressThreat: {
    name: 'checkAddressThreat',
    description: 'Analyze threat considerations for an address - checks if address poses risk to others',
    inputSchema: z.object({
      address: z.string().describe("The blockchain address to analyze for threat risks"),
      chain: z.string().optional().describe("Chain to query (eth, arb, base, bsc, pol, opt, sol, sei, sui, ton). Defaults to eth"),
      show_low_risk: z.boolean().optional().describe("Return details on low risk issues found with the address")
    }),
    handler: async (args) => {
      const endpoint = `/addresses/${args.address}`;
      const queryParams = new URLSearchParams();
      
      if (args.chain) {
        queryParams.append('chain', args.chain);
      }
      if (args.show_low_risk !== undefined) {
        queryParams.append('show_low_risk', args.show_low_risk.toString());
      }
      
      const finalEndpoint = queryParams.toString() ? `${endpoint}?${queryParams}` : endpoint;
      const data = await makeWebacyRequest(finalEndpoint);
      
      return JSON.stringify(data, null, 2);
    }
  },

  checkSanctionStatus: {
    name: 'checkSanctionStatus',
    description: 'Check if a wallet address is sanctioned or included in any sanctioned address databases',
    inputSchema: z.object({
      walletAddress: z.string().describe("The wallet address to check for sanctions")
    }),
    handler: async (args) => {
      const endpoint = `/addresses/sanctioned/${args.walletAddress}`;
      const data = await makeWebacyRequest(endpoint);
      
      return JSON.stringify(data, null, 2);
    }
  },

  // Premium Tier Tools (would require Token ID 3 in protected version)
  analyzeContract: {
    name: 'analyzeContract',
    description: 'Real-time smart contract risk analysis through fuzzing, static analysis, and dynamic analysis',
    inputSchema: z.object({
      contractAddress: z.string().describe("The smart contract address to analyze"),
      fromBytecode: z.boolean().optional().describe("Set to true for bytecode scanning of unverified contracts (slower but more thorough)"),
      refreshCache: z.boolean().optional().describe("Set to true to re-run analysis, false to retrieve cached results"),
      callback: z.string().optional().describe("Callback URL to retrieve delayed data from bytecode analysis")
    }),
    handler: async (args) => {
      const endpoint = `/contracts/${args.contractAddress}`;
      const queryParams = new URLSearchParams();
      
      if (args.fromBytecode !== undefined) {
        queryParams.append('fromBytecode', args.fromBytecode.toString());
      }
      if (args.refreshCache !== undefined) {
        queryParams.append('refreshCache', args.refreshCache.toString());
      }
      if (args.callback) {
        queryParams.append('callback', args.callback);
      }
      
      const finalEndpoint = queryParams.toString() ? `${endpoint}?${queryParams}` : endpoint;
      const data = await makeWebacyRequest(finalEndpoint);
      
      return JSON.stringify(data, null, 2);
    }
  },

  analyzeTransaction: {
    name: 'analyzeTransaction',
    description: 'Get risk analysis for a specific transaction hash including counterparty risks and asset risks',
    inputSchema: z.object({
      txHash: z.string().describe("The transaction hash to analyze")
    }),
    handler: async (args) => {
      const endpoint = `/transactions/${args.txHash}`;
      const data = await makeWebacyRequest(endpoint);
      
      return JSON.stringify(data, null, 2);
    }
  },

  // Pro Tier Tool (would require Token ID 5 in protected version)
  analyzeUrl: {
    name: 'analyzeUrl',
    description: 'Predict maliciousness of a URL using ML models trained on web3 data - detect phishing and scam sites',
    inputSchema: z.object({
      url: z.string().describe("The URL to analyze for risks")
    }),
    handler: async (args) => {
      const endpoint = '/url';
      const data = await makeWebacyRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ url: args.url })
      });
      
      return JSON.stringify(data, null, 2);
    }
  }
};

// Export tool names and their token requirements for reference
export const TOKEN_REQUIREMENTS = {
  ping: 0,                    // Free tier
  checkAddressThreat: 1,      // Basic tier (Token ID 1)
  checkSanctionStatus: 1,     // Basic tier (Token ID 1)
  analyzeContract: 3,         // Premium tier (Token ID 3)
  analyzeTransaction: 3,      // Premium tier (Token ID 3)  
  analyzeUrl: 5              // Pro tier (Token ID 5)
};

export const TOKEN_TIER_MAPPINGS = {
  "Free": 0,
  "Basic": 1,
  "Premium": 3,
  "Pro": 5,
};
