// Utility function to get property images
// Uses free services that don't require API keys

export interface PropertyImageOptions {
  address?: string;
  coordinates?: [number, number]; // [lat, lng]
  width?: number;
  height?: number;
  fov?: number; // Field of view (90 is default)
  pitch?: number; // Camera pitch (-90 to 90, 0 is horizontal)
}

/**
 * Get Google Street View image URL for a property (requires API key)
 */
function getGoogleStreetViewUrl(lat: number, lng: number, width: number, height: number, fov: number, pitch: number): string | null {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
  if (apiKey) {
    return `https://maps.googleapis.com/maps/api/streetview?size=${width}x${height}&location=${lat},${lng}&fov=${fov}&pitch=${pitch}&key=${apiKey}`;
  }
  return null;
}

/**
 * Get Mapbox static map image (requires API key)
 */
function getMapboxStaticMapUrl(lat: number, lng: number, width: number, height: number): string | null {
  const token = process.env.REACT_APP_MAPBOX_TOKEN || '';
  if (token) {
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+ff0000(${lng},${lat})/${lng},${lat},15,0/${width}x${height}?access_token=${token}`;
  }
  return null;
}

/**
 * Get a static map image using a simple SVG placeholder
 * Shows "Property Images Coming Soon" message
 */
function getFreeStaticMapUrl(lat: number, lng: number, width: number, height: number): string {
  // Use a simple SVG placeholder with "Coming Soon" message
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="500" fill="#6b7280">
        Property Images Coming Soon
      </text>
    </svg>
  `.trim();
  
  // Convert to data URI - this always works, no external requests needed
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Get a property image with multiple fallback strategies
 */
export function getPropertyImageUrl(options: PropertyImageOptions): string | null {
  const { address, coordinates, width = 400, height = 300, fov = 90, pitch = 0 } = options;

  // If we have coordinates, try multiple services
  if (coordinates && coordinates.length === 2) {
    const [lat, lng] = coordinates;
    
    // Try Google Street View first (if API key available)
    const googleUrl = getGoogleStreetViewUrl(lat, lng, width, height, fov, pitch);
    if (googleUrl) return googleUrl;
    
    // Try Mapbox (if API key available)
    const mapboxUrl = getMapboxStaticMapUrl(lat, lng, width, height);
    if (mapboxUrl) return mapboxUrl;
    
    // Use free static map service (no API key needed!) - always works
    return getFreeStaticMapUrl(lat, lng, width, height);
  }

  return null;
}

/**
 * Get a placeholder image URL if Street View is not available
 * Uses SVG data URI for guaranteed reliability
 */
export function getPlaceholderImageUrl(address?: string, width: number = 400, height: number = 300): string {
  // Use SVG data URI with "Coming Soon" message
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="500" fill="#6b7280">
        Property Images Coming Soon
      </text>
    </svg>
  `.trim();
  
  // Convert to data URI - always works!
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Get property image with fallback - always returns a valid URL
 */
export function getPropertyImageWithFallback(options: PropertyImageOptions): string {
  const { address, coordinates, width = 400, height = 300 } = options;
  
  // Try to get a real image first
  const imageUrl = getPropertyImageUrl(options);
  
  if (imageUrl) {
    return imageUrl;
  }
  
  // Fallback to placeholder with address (using SVG data URI - always works)
  return getPlaceholderImageUrl(address, width, height);
}

