// Geocoding service using Nominatim (OpenStreetMap's geocoder)
export interface GeocodeResult {
  address: string;
  coordinates: [number, number]; // [lat, lng]
}

class GeocodingService {
  // Geocode an address to coordinates using Nominatim
  async geocodeAddress(address: string): Promise<GeocodeResult> {
    try {
      // Add "Clintonville, Ohio" if not already in the address
      const searchAddress = address.toLowerCase().includes('clintonville') 
        ? address 
        : `${address}, Clintonville, OH, USA`;
      
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ClintonvilleRealEstateMap/1.0' // Required by Nominatim
        }
      });
      
      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        throw new Error('Address not found');
      }
      
      const result = data[0];
      return {
        address: result.display_name || address,
        coordinates: [parseFloat(result.lat), parseFloat(result.lon)]
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }
}

export const geocodingService = new GeocodingService();





