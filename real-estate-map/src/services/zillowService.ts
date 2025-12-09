// Zillow property value estimation service
// Note: Zillow no longer provides a public API, so we'll use alternative approaches

export interface ZillowEstimate {
  zillowValue?: number;
  zillowUrl?: string;
  estimateRange?: {
    low: number;
    high: number;
  };
}

class ZillowService {
  // Fetch Zillow estimate for an address
  // Since Zillow API is not publicly available, we'll use a combination of approaches
  async getZillowEstimate(address: string, coordinates?: [number, number]): Promise<ZillowEstimate> {
    try {
      // Option 1: Try to get from backend if we have a proxy/scraper endpoint
      // Option 2: Use estimated value based on similar properties (for now)
      
      // For now, we'll try to fetch from a backend endpoint that can scrape/estimate
      // If that's not available, we'll return undefined and let the frontend handle it
      
      // You could integrate with services like:
      // - RapidAPI's Zillow API (if available)
      // - PropertyRadar API
      // - HomeSnap API
      // - Or create a backend proxy that scrapes (respecting rate limits and ToS)
      
      // For demo purposes, we'll attempt to get a rough estimate
      // In production, you'd want to use a proper property valuation API
      
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      try {
        // Try to get from backend proxy endpoint
        const response = await fetch(`${API_URL}/api/zillow-estimate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ address, coordinates }),
        });
        
        if (response.ok) {
          const data = await response.json();
          return {
            zillowValue: data.zestimate,
            zillowUrl: data.url,
            estimateRange: data.range
          };
        }
      } catch (error) {
        console.log('Backend Zillow endpoint not available, using fallback');
      }
      
      // Fallback: Return undefined - the backend can try to fetch it later
      return {};
    } catch (error) {
      console.error('Error fetching Zillow estimate:', error);
      return {};
    }
  }
}

export const zillowService = new ZillowService();





