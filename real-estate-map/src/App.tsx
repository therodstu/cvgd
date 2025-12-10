import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import Map from './components/Map';
import PropertyInfoPanel from './components/PropertyInfoPanel';
import PropertyList from './components/PropertyList';
import AdminUserManagement from './components/AdminUserManagement';
import FeatureRequests from './components/FeatureRequests';
import { UserProvider, useUser } from './contexts/UserContext';
import UserMenu from './components/UserMenu';
import FeatureRequestDialog from './components/FeatureRequestDialog';
import { ParcelData } from './services/parcelService';
import { geocodingService } from './services/geocodingService';
import { propertyService, Property } from './services/propertyService';
import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';

function App() {
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showFeatureRequest, setShowFeatureRequest] = useState(false);
  const [showFeatureRequests, setShowFeatureRequests] = useState(false);
  const { isAdmin } = useUser();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [, setSelectedParcel] = useState<ParcelData | null>(null);
  const [addressInput, setAddressInput] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Initialize Socket.io connection
  useEffect(() => {
    socketRef.current = io(API_URL, {
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to server via Socket.io');
    });

    // Listen for new properties created by other users
    socketRef.current.on('propertyCreated', (newProperty: any) => {
      const transformedProperty: Property = {
        id: newProperty.id,
        address: newProperty.address,
        zoning: newProperty.zoning,
        value: newProperty.value,
        notes: newProperty.notes || '',
        taxValue: newProperty.taxValue,
        assessedValue: newProperty.assessedValue,
        capRate: newProperty.capRate,
        monthlyPayment: newProperty.monthlyPayment,
        coordinates: newProperty.coordinates || newProperty.position,
        thumbsUp: newProperty.thumbsUp || 0,
        thumbsDown: newProperty.thumbsDown || 0,
        createdBy: newProperty.createdBy,
        createdByName: newProperty.createdByName,
        lastUpdated: newProperty.lastUpdated
      };
      setProperties(prev => {
        // Avoid duplicates
        if (prev.find(p => p.id === transformedProperty.id)) {
          return prev;
        }
        return [...prev, transformedProperty];
      });
    });

    // Listen for property updates from other users
    socketRef.current.on('propertyUpdated', (updatedProperty: any) => {
      const transformedProperty: Property = {
        id: updatedProperty.id,
        address: updatedProperty.address,
        zoning: updatedProperty.zoning,
        value: updatedProperty.value,
        notes: updatedProperty.notes || '',
        taxValue: updatedProperty.taxValue,
        assessedValue: updatedProperty.assessedValue,
        capRate: updatedProperty.capRate,
        monthlyPayment: updatedProperty.monthlyPayment,
        coordinates: updatedProperty.coordinates || updatedProperty.position,
        thumbsUp: updatedProperty.thumbsUp || 0,
        thumbsDown: updatedProperty.thumbsDown || 0,
        createdBy: updatedProperty.createdBy,
        createdByName: updatedProperty.createdByName,
        lastUpdated: updatedProperty.lastUpdated
      };
      setProperties(prev =>
        prev.map(prop => prop.id === transformedProperty.id ? transformedProperty : prop)
      );
      // Update selected property if it's the one being updated
      if (selectedProperty && selectedProperty.id === transformedProperty.id) {
        setSelectedProperty(transformedProperty);
      }
    });

    // Listen for property deletions from other users
    socketRef.current.on('propertyDeleted', (data: { id: number }) => {
      setProperties(prev => prev.filter(prop => prop.id !== data.id));
      // Clear selected property if it was deleted
      if (selectedProperty && selectedProperty.id === data.id) {
        setSelectedProperty(null);
      }
    });

    // Listen for all properties deleted
    socketRef.current.on('allPropertiesDeleted', (data: { count: number }) => {
      setProperties([]);
      setSelectedProperty(null);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [API_URL, selectedProperty]);

  // Fetch properties from API on mount
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        // Clear properties first to ensure fresh state
        setProperties([]);
        const fetchedProperties = await propertyService.fetchProperties();
        console.log(`Fetched ${fetchedProperties.length} properties from API`);
        setProperties(fetchedProperties);
      } catch (error) {
        console.error('Failed to fetch properties:', error);
        // Clear properties on error to ensure no stale data
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    setSelectedParcel(null); // Clear any parcel selection
  };

  const handleParcelSelect = (parcel: ParcelData) => {
    // Parcel info panel removed - just clear any selection
    setSelectedProperty(null);
    setSelectedParcel(null);
  };

  const handleCloseProperty = () => {
    setSelectedProperty(null);
  };

  const handleEditNotes = async (propertyId: number, notes: string) => {
    try {
      const updatedProperty = await propertyService.updateProperty(propertyId, { notes });
      
      setProperties(prev =>
        prev.map(prop =>
          prop.id === propertyId ? updatedProperty : prop
        )
      );

      // Update selected property if it's the one being edited
      if (selectedProperty && selectedProperty.id === propertyId) {
        setSelectedProperty(updatedProperty);
      }
    } catch (error) {
      console.error('Failed to update property notes:', error);
      alert('Failed to save notes. Please try again.');
    }
  };

  const handleEditPrice = async (propertyId: number, price: number) => {
    try {
      const updatedProperty = await propertyService.updateProperty(propertyId, { value: price });
      
      setProperties(prev =>
        prev.map(prop =>
          prop.id === propertyId ? updatedProperty : prop
        )
      );

      // Update selected property if it's the one being edited
      if (selectedProperty && selectedProperty.id === propertyId) {
        setSelectedProperty(updatedProperty);
      }
    } catch (error) {
      console.error('Failed to update price:', error);
      alert('Failed to save price. Please try again.');
    }
  };

  const handleUpdateProperty = async (propertyId: number, updates: { assessedValue?: number; capRate?: number; monthlyPayment?: number }) => {
    try {
      const updatedProperty = await propertyService.updateProperty(propertyId, updates);
      
      setProperties(prev =>
        prev.map(prop =>
          prop.id === propertyId ? updatedProperty : prop
        )
      );

      // Update selected property if it's the one being edited
      if (selectedProperty && selectedProperty.id === propertyId) {
        setSelectedProperty(updatedProperty);
      }
    } catch (error) {
      console.error('Failed to update property:', error);
      alert('Failed to save property data. Please try again.');
    }
  };


  const handleAddAddress = async () => {
    if (!addressInput.trim()) return;
    
    setIsGeocoding(true);
    try {
      const result = await geocodingService.geocodeAddress(addressInput);
      
      const newProperty = await propertyService.createProperty({
        address: result.address,
        zoning: "Residential", // Default, could be enhanced
        value: 200000, // Default price
        notes: `Added from address search`,
        coordinates: result.coordinates
      });
      
      // The property will be added via Socket.io event, but we can add it optimistically
      setProperties(prev => {
        if (prev.find(p => p.id === newProperty.id)) {
          return prev;
        }
        return [...prev, newProperty];
      });
      setAddressInput('');
    } catch (error) {
      alert(`Failed to add address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleAddressKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddAddress();
    }
  };

  const handleVote = async (id: number, vote: 'up' | 'down') => {
    try {
      const updatedProperty = await propertyService.voteProperty(id, vote);
      setProperties(prev =>
        prev.map(prop => prop.id === id ? updatedProperty : prop)
      );
      // Update selected property if it's the one being voted on
      if (selectedProperty && selectedProperty.id === id) {
        setSelectedProperty(updatedProperty);
      }
    } catch (error) {
      console.error('Failed to vote on property:', error);
      alert('Failed to vote. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await propertyService.deleteProperty(id);
      setProperties(prev => prev.filter(prop => prop.id !== id));
      // Clear selected property if it was deleted
      if (selectedProperty && selectedProperty.id === id) {
        setSelectedProperty(null);
      }
    } catch (error) {
      console.error('Failed to delete property:', error);
      alert('Failed to delete property. Please try again.');
    }
  };

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
    setSelectedParcel(null);
  };


  const handleDeleteAll = async () => {
    try {
      await propertyService.deleteAllProperties();
      setProperties([]);
      setSelectedProperty(null);
      alert('All properties have been deleted.');
    } catch (error) {
      console.error('Failed to delete all properties:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to delete all properties: ${errorMessage}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-6 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold">
              Clintonville Girl Dads
            </h1>
            <p className="mt-2 text-primary-foreground/80">
              Interactive parcel mapping with zoning and valuation data
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-primary-foreground/20"
              onClick={() => setShowFeatureRequest(true)}
            >
              Request a Feature
            </Button>
            {isAdmin && (
              <Button
                variant="outline"
                className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-primary-foreground/20"
                onClick={() => setShowFeatureRequests(!showFeatureRequests)}
              >
                View Requests
              </Button>
            )}
            <UserMenu onManageUsers={() => setShowUserManagement(!showUserManagement)} />
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
          {/* Address Input */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label htmlFor="address-input" className="block text-sm font-medium mb-2">
                    Add Address to Map
                  </label>
                  <Input
                    id="address-input"
                    type="text"
                    placeholder="Enter address (e.g., 123 High St, Clintonville, OH)"
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    onKeyPress={handleAddressKeyPress}
                    disabled={isGeocoding}
                  />
                </div>
                <Button 
                  onClick={handleAddAddress}
                  disabled={isGeocoding || !addressInput.trim()}
                >
                  {isGeocoding ? 'Adding...' : 'Add Marker'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Map Section - Expanded */}
            <div className="lg:col-span-9">
              <Card className="h-[600px]">
                <CardHeader>
                  <CardTitle>Interactive Map</CardTitle>
                  <CardDescription>
                    Click on parcels to view property information
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 h-[calc(100%-80px)]">
                  <Map
                    className="h-full"
                    properties={properties}
                    onPropertySelect={handlePropertySelect}
                    onParcelSelect={handleParcelSelect}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Info Panel */}
            <div className="lg:col-span-3">
              <PropertyInfoPanel
                property={selectedProperty}
                onClose={handleCloseProperty}
                onEditNotes={handleEditNotes}
                onEditPrice={handleEditPrice}
                onUpdateProperty={handleUpdateProperty}
              />
            </div>
          </div>

          {/* Properties List */}
          <div className="mt-6">
            <PropertyList
              properties={properties}
              onVote={handleVote}
              onDelete={handleDelete}
              onPropertyClick={handlePropertyClick}
              onDeleteAll={handleDeleteAll}
              isAdmin={isAdmin}
            />
          </div>

          {/* User Management (Admin Only) */}
          {isAdmin && showUserManagement && (
            <div className="mt-6">
              <AdminUserManagement />
            </div>
          )}

          {isAdmin && showFeatureRequests && (
            <div className="mt-6">
              <FeatureRequests />
            </div>
          )}
        </main>

        {/* Feature Request Dialog */}
        <FeatureRequestDialog
          open={showFeatureRequest}
          onOpenChange={setShowFeatureRequest}
        />
      </div>
  );
}

function AppWrapper() {
  return (
    <UserProvider>
      <App />
    </UserProvider>
  );
}

export default AppWrapper;