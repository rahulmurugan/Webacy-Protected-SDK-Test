import dotenv from 'dotenv';
dotenv.config();

export const WEBACY_CONFIG = {
  apiKey: process.env.WEBACY_API_KEY || '',
  apiUrl: process.env.WEBACY_API_URL || 'https://api.webacy.com',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Helper function to make Webacy API requests
export async function makeWebacyRequest(endpoint, options = {}) {
  const url = `${WEBACY_CONFIG.apiUrl}${endpoint}`;
  
  const fetchOptions = {
    method: options.method || 'GET',
    headers: {
      ...WEBACY_CONFIG.headers,
      'X-API-Key': WEBACY_CONFIG.apiKey,
      ...options.headers
    },
    timeout: WEBACY_CONFIG.timeout
  };

  if (options.body) {
    fetchOptions.body = options.body;
  }

  try {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`Webacy API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error calling Webacy API ${endpoint}:`, error);
    throw error;
  }
}