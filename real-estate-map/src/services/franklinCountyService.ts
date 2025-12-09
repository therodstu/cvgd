// Franklin County parcel data service
export interface FranklinCountyParcel {
  objectid: number;
  parcel_id: string;
  address: string;
  owner_name: string;
  zoning: string;
  land_use: string;
  total_acres: number;
  total_sqft: number;
  building_sqft: number;
  year_built: number;
  assessed_value: number;
  tax_value: number;
  geometry: any; // GeoJSON geometry
  coordinates: [number, number]; // [lng, lat]
}

class FranklinCountyService {
  private baseUrl = 'https://services2.arcgis.com/qvkbeam7Wir18dnF/arcgis/rest/services';
  private cache: Map<string, FranklinCountyParcel[]> = new Map();
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  // Fetch parcels from Franklin County ArcGIS REST API
  async fetchParcels(bounds?: { north: number; south: number; east: number; west: number }): Promise<FranklinCountyParcel[]> {
    const cacheKey = `franklin_real_${JSON.stringify(bounds)}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached && this.isCacheValid(cacheKey)) {
        return cached;
      }
    }

    try {
      // Franklin County ArcGIS REST API endpoint
      const url = `${this.baseUrl}/Parcels/FeatureServer/0/query`;
      
      // Clintonville bounds (approximate)
      const defaultBounds = {
        north: 40.05,
        south: 40.02,
        east: -83.00,
        west: -83.05
      };

      const boundsToUse = bounds || defaultBounds;
      
      const params = new URLSearchParams({
        where: '1=1', // Get all parcels
        outFields: 'OBJECTID,PARCEL_ID,ADDRESS,OWNER_NAME,ZONING,LAND_USE,TOTAL_ACRES,TOTAL_SQFT,BUILDING_SQFT,YEAR_BUILT,ASSESSED_VALUE,TAX_VALUE',
        outSR: '4326', // WGS84 coordinate system
        f: 'geojson',
        geometry: `${boundsToUse.west},${boundsToUse.south},${boundsToUse.east},${boundsToUse.north}`,
        geometryType: 'esriGeometryEnvelope',
        spatialRel: 'esriSpatialRelIntersects'
      });

      console.log('Fetching Franklin County parcels from:', url);
      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Franklin County API response:', data);

      if (data.features && data.features.length > 0) {
        const parcels = this.convertToParcelData(data.features);
        
        // Cache the data
        this.cache.set(cacheKey, parcels);
        this.setCacheTimestamp(cacheKey);
        
        return parcels;
      } else {
        console.log('No parcels found in response');
        return [];
      }

    } catch (error) {
      console.error('Error fetching Franklin County parcels:', error);
      
      // Fallback to mock data if API fails
      console.log('Falling back to mock data...');
      return this.generateFallbackData();
    }
  }

  // Convert ArcGIS features to our parcel format
  private convertToParcelData(features: any[]): FranklinCountyParcel[] {
    return features.map((feature, index) => {
      const props = feature.properties;
      const geometry = feature.geometry;
      
      // Calculate center coordinates
      const coordinates = this.calculateCenter(geometry);
      
      return {
        objectid: props.OBJECTID || index,
        parcel_id: props.PARCEL_ID || `FC${String(index + 1).padStart(6, '0')}`,
        address: props.ADDRESS || `Unknown Address ${index}`,
        owner_name: props.OWNER_NAME || 'Unknown Owner',
        zoning: props.ZONING || 'R-2',
        land_use: props.LAND_USE || 'Residential',
        total_acres: props.TOTAL_ACRES || 0.1,
        total_sqft: props.TOTAL_SQFT || 5000,
        building_sqft: props.BUILDING_SQFT || 1500,
        year_built: props.YEAR_BUILT || 1980,
        assessed_value: props.ASSESSED_VALUE || 200000,
        tax_value: props.TAX_VALUE || 180000,
        geometry: geometry,
        coordinates: coordinates
      };
    });
  }

  // Calculate center coordinates from geometry
  private calculateCenter(geometry: any): [number, number] {
    if (geometry.type === 'Point') {
      return [geometry.coordinates[0], geometry.coordinates[1]];
    } else if (geometry.type === 'Polygon') {
      // Calculate centroid of polygon
      const coords = geometry.coordinates[0];
      let totalLat = 0;
      let totalLng = 0;
      
      coords.forEach((coord: number[]) => {
        totalLng += coord[0];
        totalLat += coord[1];
      });
      
      return [totalLng / coords.length, totalLat / coords.length];
    }
    
    // Default Clintonville center
    return [-83.025, 40.035];
  }

  // Generate fallback data if API fails
  private generateFallbackData(): FranklinCountyParcel[] {
    const fallbackParcels: FranklinCountyParcel[] = [];
    const numParcels = 25; // Fewer parcels for fallback

    for (let i = 0; i < numParcels; i++) {
      const parcel: FranklinCountyParcel = {
        objectid: i + 1,
        parcel_id: `FC${String(i + 1).padStart(6, '0')}`,
        address: this.generateMockAddress(i),
        owner_name: `Owner ${i + 1}`,
        zoning: this.generateMockZoning(),
        land_use: this.generateMockLandUse(),
        total_acres: Math.random() * 0.5 + 0.1,
        total_sqft: Math.floor(Math.random() * 10000) + 5000,
        building_sqft: Math.floor(Math.random() * 3000) + 1000,
        year_built: Math.floor(Math.random() * 50) + 1970,
        assessed_value: Math.floor(Math.random() * 500000) + 100000,
        tax_value: Math.floor(Math.random() * 450000) + 90000,
        geometry: null,
        coordinates: this.generateMockCoordinates()
      };
      fallbackParcels.push(parcel);
    }

    return fallbackParcels;
  }

  // Helper methods for generating mock data
  private generateMockAddress(index: number): string {
    const streets = ['High Street', 'North Broadway', 'Indianola Avenue', 'Clinton Street', 'Weinland Park'];
    const numbers = [100, 200, 300, 400, 500, 600, 700, 800, 900];
    const street = streets[index % streets.length];
    const number = numbers[index % numbers.length] + (index * 10);
    return `${number} ${street}`;
  }

  private generateMockZoning(): string {
    const zoningTypes = ['R-2', 'R-3', 'C-1', 'C-2', 'M-1', 'M-2'];
    return zoningTypes[Math.floor(Math.random() * zoningTypes.length)];
  }

  private generateMockLandUse(): string {
    const landUses = ['Residential', 'Commercial', 'Industrial', 'Mixed Use'];
    return landUses[Math.floor(Math.random() * landUses.length)];
  }

  private generateMockCoordinates(): [number, number] {
    // Clintonville approximate bounds
    const lat = 40.02 + Math.random() * 0.03; // 40.02 to 40.05
    const lng = -83.05 + Math.random() * 0.05; // -83.05 to -83.00
    return [lng, lat];
  }

  // Cache management
  private isCacheValid(key: string): boolean {
    const timestamp = localStorage.getItem(`cache_${key}`);
    if (!timestamp) return false;
    
    const cacheTime = parseInt(timestamp);
    return Date.now() - cacheTime < this.cacheExpiry;
  }

  private setCacheTimestamp(key: string): void {
    localStorage.setItem(`cache_${key}`, Date.now().toString());
  }

  // Search parcels by address or parcel ID
  searchParcels(parcels: FranklinCountyParcel[], query: string): FranklinCountyParcel[] {
    const lowercaseQuery = query.toLowerCase();
    return parcels.filter(parcel => 
      parcel.address.toLowerCase().includes(lowercaseQuery) ||
      parcel.parcel_id.toLowerCase().includes(lowercaseQuery) ||
      parcel.owner_name.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Filter parcels by criteria
  filterParcels(parcels: FranklinCountyParcel[], filters: {
    zoning?: string[];
    landUse?: string[];
    minValue?: number;
    maxValue?: number;
    minLotSize?: number;
    maxLotSize?: number;
  }): FranklinCountyParcel[] {
    return parcels.filter(parcel => {
      if (filters.zoning && !filters.zoning.includes(parcel.zoning)) {
        return false;
      }
      if (filters.landUse && !filters.landUse.includes(parcel.land_use)) {
        return false;
      }
      if (filters.minValue && parcel.assessed_value < filters.minValue) {
        return false;
      }
      if (filters.maxValue && parcel.assessed_value > filters.maxValue) {
        return false;
      }
      if (filters.minLotSize && parcel.total_sqft < filters.minLotSize) {
        return false;
      }
      if (filters.maxLotSize && parcel.total_sqft > filters.maxLotSize) {
        return false;
      }
      return true;
    });
  }
}

export const franklinCountyService = new FranklinCountyService();








