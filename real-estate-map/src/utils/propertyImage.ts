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
 * Get a static map image using a free service (no API key required!)
 * Uses a reliable static map service
 */
function getFreeStaticMapUrl(lat: number, lng: number, width: number, height: number): string {
  // Use StaticMapAPI service - free, reliable, no API key needed
  // This service generates static map images with markers
  const zoom = 15;
  
  // StaticMapAPI format: center=lat,lng&zoom=level&size=widthxheight&markers=lat,lng,color
  // This service is reliable and always returns an image
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&markers=${lat},${lng},red-pushpin`;
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
 */
export function getPlaceholderImageUrl(address?: string): string {
  // Use a reliable placeholder service that always works
  const addressPart = address ? address.split(',')[0].trim().substring(0, 20) : 'Property';
  
  // Use placeholder.com (always works, no API key, reliable, no CORS issues)
  // Format: https://via.placeholder.com/WIDTHxHEIGHT/COLOR/TEXTCOLOR?text=TEXT
  return `https://via.placeholder.com/400x300/6366f1/ffffff?text=${encodeURIComponent(addressPart)}`;
}

/**
 * Get property image with fallback - always returns a valid URL
 */
export function getPropertyImageWithFallback(options: PropertyImageOptions): string {
  // Try to get a real image first
  const imageUrl = getPropertyImageUrl(options);
  
  if (imageUrl) {
    return imageUrl;
  }
  
  // Fallback to placeholder with address
  return getPlaceholderImageUrl(options.address);
}

