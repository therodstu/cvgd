// Utility function to get property images
// Uses Google Street View Static API (free tier available)

export interface PropertyImageOptions {
  address?: string;
  coordinates?: [number, number]; // [lat, lng]
  width?: number;
  height?: number;
  fov?: number; // Field of view (90 is default)
  pitch?: number; // Camera pitch (-90 to 90, 0 is horizontal)
}

/**
 * Get Google Street View image URL for a property
 * @param options Property address or coordinates
 * @returns Street View image URL or null if coordinates are not available
 */
export function getPropertyImageUrl(options: PropertyImageOptions): string | null {
  const { address, coordinates, width = 400, height = 300, fov = 90, pitch = 0 } = options;

  // If we have coordinates, use them directly (more accurate)
  if (coordinates && coordinates.length === 2) {
    const [lat, lng] = coordinates;
    // Google Street View Static API
    // Note: This requires a Google Maps API key for production use
    // For now, we'll use a placeholder service or you can add your API key
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
    
    if (apiKey) {
      return `https://maps.googleapis.com/maps/api/streetview?size=${width}x${height}&location=${lat},${lng}&fov=${fov}&pitch=${pitch}&key=${apiKey}`;
    } else {
      // Fallback: Use a placeholder image service or generate a map thumbnail
      // Using Mapbox Static Images API as alternative (requires API key)
      // Or use a simple placeholder
      return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+ff0000(${lng},${lat})/${lng},${lat},15,0/${width}x${height}?access_token=${process.env.REACT_APP_MAPBOX_TOKEN || ''}`;
    }
  }

  // If we only have an address, we could geocode it first
  // For now, return null and let the component handle it
  return null;
}

/**
 * Get a placeholder image URL if Street View is not available
 */
export function getPlaceholderImageUrl(address?: string): string {
  // Using Unsplash Source API for placeholder images
  // You can replace this with any placeholder service
  const searchTerm = address ? encodeURIComponent(address.split(',')[0]) : 'house';
  return `https://source.unsplash.com/400x300/?${searchTerm},house,real-estate`;
}

/**
 * Get property image with fallback
 */
export function getPropertyImageWithFallback(options: PropertyImageOptions): string {
  const streetViewUrl = getPropertyImageUrl(options);
  
  if (streetViewUrl) {
    return streetViewUrl;
  }
  
  // Fallback to placeholder
  return getPlaceholderImageUrl(options.address);
}

