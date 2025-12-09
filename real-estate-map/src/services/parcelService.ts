// Parcel data service for Clintonville, Ohio
export interface ParcelData {
  id: string;
  address: string;
  parcelId: string;
  zoning: string;
  propertyType: 'Residential' | 'Commercial' | 'Industrial' | 'Mixed Use';
  assessedValue: number;
  taxValue: number;
  lotSize: number; // in square feet
  buildingSqFt: number;
  yearBuilt: number;
  coordinates: [number, number]; // [longitude, latitude]
  geometry?: any; // GeoJSON geometry
}

export interface ParcelFilters {
  propertyType?: string[];
  zoning?: string[];
  minValue?: number;
  maxValue?: number;
  minLotSize?: number;
  maxLotSize?: number;
}

class ParcelService {
  private baseUrl = 'https://auditor.franklin.ohio.gov/api';
  private cache: Map<string, ParcelData[]> = new Map();
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  // Fetch parcels from Franklin County Auditor
  async fetchFranklinCountyParcels(bounds?: { north: number; south: number; east: number; west: number }): Promise<ParcelData[]> {
    const cacheKey = `franklin_${JSON.stringify(bounds)}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached && this.isCacheValid(cacheKey)) {
        return cached;
      }
    }

    try {
      // For now, we'll use mock data since the actual API might require authentication
      // In production, you'd replace this with actual API calls
      const mockData = this.generateMockParcelData(bounds);
      
      // Cache the data
      this.cache.set(cacheKey, mockData);
      this.setCacheTimestamp(cacheKey);
      
      return mockData;
    } catch (error) {
      console.error('Error fetching Franklin County parcels:', error);
      throw new Error('Failed to fetch parcel data');
    }
  }

  // Fetch parcels from OpenStreetMap
  async fetchOSMParcels(bounds?: { north: number; south: number; east: number; west: number }): Promise<ParcelData[]> {
    const cacheKey = `osm_${JSON.stringify(bounds)}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached && this.isCacheValid(cacheKey)) {
        return cached;
      }
    }

    try {
      const overpassQuery = `
        [out:json][timeout:25];
        (
          way["landuse"="residential"]["addr:city"="Columbus"]["addr:neighbourhood"="Clintonville"];
          way["landuse"="commercial"]["addr:city"="Columbus"]["addr:neighbourhood"="Clintonville"];
          way["landuse"="industrial"]["addr:city"="Columbus"]["addr:neighbourhood"="Clintonville"];
        );
        out geom;
      `;

      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`);
      const data = await response.json();
      
      const parcels = this.convertOSMToParcelData(data.elements);
      
      // Cache the data
      this.cache.set(cacheKey, parcels);
      this.setCacheTimestamp(cacheKey);
      
      return parcels;
    } catch (error) {
      console.error('Error fetching OSM parcels:', error);
      throw new Error('Failed to fetch OSM parcel data');
    }
  }

  // Convert OSM data to our ParcelData format
  private convertOSMToParcelData(elements: any[]): ParcelData[] {
    return elements.map((element, index) => ({
      id: `osm_${element.id}`,
      address: element.tags?.['addr:street'] || `Unknown Address ${index}`,
      parcelId: element.id.toString(),
      zoning: this.determineZoning(element.tags),
      propertyType: this.determinePropertyType(element.tags),
      assessedValue: this.generateMockValue(),
      taxValue: this.generateMockValue(),
      lotSize: this.generateMockLotSize(),
      buildingSqFt: this.generateMockBuildingSqFt(),
      yearBuilt: this.generateMockYearBuilt(),
      coordinates: this.calculateCenter(element.geometry || element.nodes),
      geometry: element.geometry || element.nodes
    }));
  }

  // Generate mock data for development/testing
  private generateMockParcelData(bounds?: { north: number; south: number; east: number; west: number }): ParcelData[] {
    const mockParcels: ParcelData[] = [];
    const numParcels = 50; // Generate 50 mock parcels

    console.log('Generating mock parcel data...');

    for (let i = 0; i < numParcels; i++) {
      const parcel: ParcelData = {
        id: `franklin_${i + 1}`,
        address: this.generateMockAddress(i),
        parcelId: `FC${String(i + 1).padStart(6, '0')}`,
        zoning: this.generateMockZoning(),
        propertyType: this.generateMockPropertyType(),
        assessedValue: this.generateMockValue(),
        taxValue: this.generateMockValue(),
        lotSize: this.generateMockLotSize(),
        buildingSqFt: this.generateMockBuildingSqFt(),
        yearBuilt: this.generateMockYearBuilt(),
        coordinates: this.generateMockCoordinates(bounds)
      };
      mockParcels.push(parcel);
    }

    console.log('Generated mock parcels:', mockParcels.length);
    return mockParcels;
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

  private generateMockPropertyType(): 'Residential' | 'Commercial' | 'Industrial' | 'Mixed Use' {
    const types: ('Residential' | 'Commercial' | 'Industrial' | 'Mixed Use')[] = 
      ['Residential', 'Commercial', 'Industrial', 'Mixed Use'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private generateMockValue(): number {
    return Math.floor(Math.random() * 500000) + 100000; // $100k - $600k
  }

  private generateMockLotSize(): number {
    return Math.floor(Math.random() * 10000) + 5000; // 5k - 15k sq ft
  }

  private generateMockBuildingSqFt(): number {
    return Math.floor(Math.random() * 3000) + 1000; // 1k - 4k sq ft
  }

  private generateMockYearBuilt(): number {
    return Math.floor(Math.random() * 50) + 1970; // 1970 - 2020
  }

  private generateMockCoordinates(bounds?: { north: number; south: number; east: number; west: number }): [number, number] {
    // Clintonville approximate bounds
    const defaultBounds = {
      north: 40.05,
      south: 40.02,
      east: -83.00,
      west: -83.05
    };

    const boundsToUse = bounds || defaultBounds;
    
    const lat = boundsToUse.south + Math.random() * (boundsToUse.north - boundsToUse.south);
    const lng = boundsToUse.west + Math.random() * (boundsToUse.east - boundsToUse.west);
    
    return [lng, lat];
  }

  private determineZoning(tags: any): string {
    if (tags?.['landuse'] === 'residential') return 'R-2';
    if (tags?.['landuse'] === 'commercial') return 'C-1';
    if (tags?.['landuse'] === 'industrial') return 'M-1';
    return 'R-2';
  }

  private determinePropertyType(tags: any): 'Residential' | 'Commercial' | 'Industrial' | 'Mixed Use' {
    if (tags?.['landuse'] === 'residential') return 'Residential';
    if (tags?.['landuse'] === 'commercial') return 'Commercial';
    if (tags?.['landuse'] === 'industrial') return 'Industrial';
    return 'Residential';
  }

  private calculateCenter(geometry: any): [number, number] {
    if (!geometry || geometry.length === 0) {
      return [-83.025, 40.035]; // Default Clintonville center
    }

    let totalLat = 0;
    let totalLng = 0;
    let count = 0;

    geometry.forEach((point: any) => {
      if (point.lat && point.lon) {
        totalLat += point.lat;
        totalLng += point.lon;
        count++;
      }
    });

    if (count === 0) {
      return [-83.025, 40.035];
    }

    return [totalLng / count, totalLat / count];
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

  // Filter parcels based on criteria
  filterParcels(parcels: ParcelData[], filters: ParcelFilters): ParcelData[] {
    return parcels.filter(parcel => {
      if (filters.propertyType && !filters.propertyType.includes(parcel.propertyType)) {
        return false;
      }
      if (filters.zoning && !filters.zoning.includes(parcel.zoning)) {
        return false;
      }
      if (filters.minValue && parcel.assessedValue < filters.minValue) {
        return false;
      }
      if (filters.maxValue && parcel.assessedValue > filters.maxValue) {
        return false;
      }
      if (filters.minLotSize && parcel.lotSize < filters.minLotSize) {
        return false;
      }
      if (filters.maxLotSize && parcel.lotSize > filters.maxLotSize) {
        return false;
      }
      return true;
    });
  }

  // Search parcels by address or parcel ID
  searchParcels(parcels: ParcelData[], query: string): ParcelData[] {
    const lowercaseQuery = query.toLowerCase();
    return parcels.filter(parcel => 
      parcel.address.toLowerCase().includes(lowercaseQuery) ||
      parcel.parcelId.toLowerCase().includes(lowercaseQuery)
    );
  }
}

export const parcelService = new ParcelService();
