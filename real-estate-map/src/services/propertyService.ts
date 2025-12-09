// Property API service for communicating with the backend
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export interface Property {
  id: number;
  address: string;
  zoning: string;
  value: number;
  notes: string;
  taxValue?: number;
  assessedValue?: number;
  capRate?: number;
  monthlyPayment?: number;
  coordinates?: [number, number]; // [lat, lng]
  thumbsUp?: number;
  thumbsDown?: number;
  createdBy?: number;
  createdByName?: string;
  lastUpdated?: string;
}

class PropertyService {
  // Fetch all properties from the backend
  async fetchProperties(): Promise<Property[]> {
    try {
      const response = await fetch(`${API_URL}/api/properties`);
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      const data = await response.json();
      
      // Transform backend format to frontend format
      return data.map((prop: any) => ({
        id: prop.id,
        address: prop.address,
        zoning: prop.zoning,
        value: prop.value,
        notes: prop.notes || '',
        taxValue: prop.taxValue,
        assessedValue: prop.assessedValue,
        capRate: prop.capRate,
        monthlyPayment: prop.monthlyPayment,
        coordinates: prop.coordinates || prop.position, // Support both field names
        thumbsUp: prop.thumbsUp || 0,
        thumbsDown: prop.thumbsDown || 0,
        createdBy: prop.createdBy,
        createdByName: prop.createdByName,
        lastUpdated: prop.lastUpdated
      }));
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  }

  // Get auth token
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Create a new property
  async createProperty(property: Omit<Property, 'id' | 'lastUpdated' | 'createdBy' | 'createdByName'>): Promise<Property> {
    try {
      const token = this.getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/properties`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...property,
          position: property.coordinates, // Backend expects 'position'
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        throw new Error(error.error || 'Failed to create property');
      }

      const data = await response.json();
      
      // Transform backend format to frontend format
      return {
        id: data.id,
        address: data.address,
        zoning: data.zoning,
        value: data.value,
        notes: data.notes || '',
        taxValue: data.taxValue,
        assessedValue: data.assessedValue,
        capRate: data.capRate,
        monthlyPayment: data.monthlyPayment,
        coordinates: data.coordinates || data.position,
        thumbsUp: data.thumbsUp || 0,
        thumbsDown: data.thumbsDown || 0,
        createdBy: data.createdBy,
        createdByName: data.createdByName,
        lastUpdated: data.lastUpdated
      };
    } catch (error) {
      console.error('Error creating property:', error);
      throw error;
    }
  }

  // Delete a property
  async deleteProperty(id: number): Promise<void> {
    try {
      const token = this.getAuthToken();
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/properties/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        throw new Error(error.error || 'Failed to delete property');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  }


  // Delete all properties
  async deleteAllProperties(): Promise<void> {
    try {
      const token = this.getAuthToken();
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/properties`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to delete all properties`);
      }
    } catch (error) {
      console.error('Error deleting all properties:', error);
      throw error;
    }
  }

  // Vote on a property (thumbs up or down)
  async voteProperty(id: number, vote: 'up' | 'down'): Promise<Property> {
    try {
      const response = await fetch(`${API_URL}/api/properties/${id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vote }),
      });

      if (!response.ok) {
        throw new Error('Failed to vote on property');
      }

      const data = await response.json();
      
      // Transform backend format to frontend format
      return {
        id: data.id,
        address: data.address,
        zoning: data.zoning,
        value: data.value,
        notes: data.notes || '',
        taxValue: data.taxValue,
        assessedValue: data.assessedValue,
        capRate: data.capRate,
        monthlyPayment: data.monthlyPayment,
        coordinates: data.coordinates || data.position,
        thumbsUp: data.thumbsUp || 0,
        thumbsDown: data.thumbsDown || 0,
        createdBy: data.createdBy,
        createdByName: data.createdByName,
        lastUpdated: data.lastUpdated
      };
    } catch (error) {
      console.error('Error voting on property:', error);
      throw error;
    }
  }

  // Update an existing property
  async updateProperty(id: number, updates: Partial<Property>): Promise<Property> {
    try {
      const response = await fetch(`${API_URL}/api/properties/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updates,
          position: updates.coordinates, // Backend expects 'position'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update property');
      }

      const data = await response.json();
      
      // Transform backend format to frontend format
      return {
        id: data.id,
        address: data.address,
        zoning: data.zoning,
        value: data.value,
        notes: data.notes || '',
        taxValue: data.taxValue,
        assessedValue: data.assessedValue,
        capRate: data.capRate,
        monthlyPayment: data.monthlyPayment,
        coordinates: data.coordinates || data.position,
        thumbsUp: data.thumbsUp || 0,
        thumbsDown: data.thumbsDown || 0,
        createdBy: data.createdBy,
        createdByName: data.createdByName,
        lastUpdated: data.lastUpdated
      };
    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
    }
  }
}

export const propertyService = new PropertyService();

