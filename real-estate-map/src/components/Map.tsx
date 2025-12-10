import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { parcelService, ParcelData, ParcelFilters } from '../services/parcelService';
import { franklinCountyService, FranklinCountyParcel } from '../services/franklinCountyService';
import { getPropertyImageWithFallback } from '../utils/propertyImage';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});


interface MapProps {
  className?: string;
  properties: Property[];
  onPropertySelect: (property: Property) => void;
  onParcelSelect?: (parcel: ParcelData) => void;
  filters?: ParcelFilters;
  searchQuery?: string;
}

interface Property {
  id: number;
  address: string;
  zoning: string;
  value: number;
  notes: string;
  taxValue?: number;
  coordinates?: [number, number]; // [lat, lng]
  createdBy?: number;
  createdByName?: string;
}

// Component to handle map events
const MapEvents: React.FC<{ onParcelSelect?: (parcel: ParcelData) => void }> = ({ onParcelSelect }) => {
  const map = useMapEvents({
    moveend: () => {
      // Could trigger data refetch based on new bounds
      console.log('Map moved, bounds:', map.getBounds());
    },
    zoomend: () => {
      console.log('Map zoomed, zoom level:', map.getZoom());
    }
  });

  return null;
};

const Map: React.FC<MapProps> = ({ 
  className, 
  properties, 
  onPropertySelect, 
  onParcelSelect,
  filters,
  searchQuery 
}) => {
  const [parcels, setParcels] = useState<ParcelData[]>([]);
  const [realParcels, setRealParcels] = useState<FranklinCountyParcel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useRealData] = useState(true);

  // Clintonville, Ohio coordinates
  const center: [number, number] = [40.035, -83.025];
  const zoom = 15;

  // Fetch parcel data
  const fetchParcels = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (useRealData) {
        // Fetch real Franklin County data
        console.log('Fetching real Franklin County parcels...');
        const realParcels = await franklinCountyService.fetchParcels();
        console.log('Fetched real parcels:', realParcels.length, realParcels);
        
        // Apply filters if provided
        let filteredParcels = realParcels;
        if (filters) {
          filteredParcels = franklinCountyService.filterParcels(realParcels, {
            zoning: filters.zoning,
            landUse: filters.propertyType,
            minValue: filters.minValue,
            maxValue: filters.maxValue,
            minLotSize: filters.minLotSize,
            maxLotSize: filters.maxLotSize
          });
          console.log('Filtered real parcels:', filteredParcels.length);
        }
        
        // Apply search if provided
        if (searchQuery && searchQuery.trim()) {
          filteredParcels = franklinCountyService.searchParcels(filteredParcels, searchQuery);
          console.log('Searched real parcels:', filteredParcels.length);
        }
        
        setRealParcels(filteredParcels);
        console.log('Final real parcels set:', filteredParcels.length);
      } else {
        // Fetch mock data
        const mockParcels = await parcelService.fetchFranklinCountyParcels();
        console.log('Fetched mock parcels:', mockParcels.length);
        
        let filteredParcels = mockParcels;
        if (filters) {
          filteredParcels = parcelService.filterParcels(mockParcels, filters);
        }
        if (searchQuery && searchQuery.trim()) {
          filteredParcels = parcelService.searchParcels(filteredParcels, searchQuery);
        }
        
        setParcels(filteredParcels);
        console.log('Final mock parcels set:', filteredParcels.length);
      }
    } catch (err) {
      setError('Failed to load parcel data');
      console.error('Error fetching parcels:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery, useRealData]);

  // Fetch parcels on component mount and when filters/search change
  useEffect(() => {
    fetchParcels();
  }, [fetchParcels]);

  // Create custom icons for different property types
  const createPropertyIcon = (propertyType: string) => {
    const color = {
      'Residential': '#3b82f6', // blue
      'Commercial': '#10b981',   // green
      'Industrial': '#f59e0b',  // yellow
      'Mixed Use': '#8b5cf6'    // purple
    }[propertyType] || '#6b7280'; // gray default

    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="
        background-color: ${color};
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
  };

  return (
    <div className={className}>
      {loading && (
        <div className="absolute top-4 left-4 z-[1000] bg-white p-2 rounded shadow">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Loading parcels...</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute top-4 left-4 z-[1000] bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', minHeight: '500px' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapEvents onParcelSelect={onParcelSelect} />
        
        {/* Render parcel markers */}
        {useRealData ? (
          // Render real Franklin County parcels
          realParcels.map((parcel) => {
            console.log('Rendering real parcel marker:', parcel.parcel_id, parcel.coordinates);
            return (
              <Marker
                key={`real_${parcel.objectid}`}
                position={parcel.coordinates}
                icon={createPropertyIcon(parcel.land_use)}
                eventHandlers={{
                  click: () => onParcelSelect?.({
                    id: parcel.objectid.toString(),
                    address: parcel.address,
                    parcelId: parcel.parcel_id,
                    zoning: parcel.zoning,
                    propertyType: parcel.land_use as any,
                    assessedValue: parcel.assessed_value,
                    taxValue: parcel.tax_value,
                    lotSize: parcel.total_sqft,
                    buildingSqFt: parcel.building_sqft,
                    yearBuilt: parcel.year_built,
                    coordinates: parcel.coordinates,
                    geometry: parcel.geometry
                  }),
                }}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <h3 className="font-semibold text-lg mb-2">{parcel.address}</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Parcel ID:</span> {parcel.parcel_id}</p>
                      <p><span className="font-medium">Owner:</span> {parcel.owner_name}</p>
                      <p><span className="font-medium">Zoning:</span> {parcel.zoning}</p>
                      <p><span className="font-medium">Land Use:</span> {parcel.land_use}</p>
                      <p><span className="font-medium">Assessed Value:</span> ${parcel.assessed_value.toLocaleString()}</p>
                      <p><span className="font-medium">Tax Value:</span> ${parcel.tax_value.toLocaleString()}</p>
                      <p><span className="font-medium">Lot Size:</span> {parcel.total_sqft.toLocaleString()} sq ft</p>
                      <p><span className="font-medium">Building:</span> {parcel.building_sqft.toLocaleString()} sq ft</p>
                      <p><span className="font-medium">Year Built:</span> {parcel.year_built}</p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })
        ) : (
          // Render mock parcels
          parcels.map((parcel) => {
            console.log('Rendering mock parcel marker:', parcel.id, parcel.coordinates);
            return (
              <Marker
                key={parcel.id}
                position={parcel.coordinates}
                icon={createPropertyIcon(parcel.propertyType)}
                eventHandlers={{
                  click: () => onParcelSelect?.(parcel),
                }}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <h3 className="font-semibold text-lg mb-2">{parcel.address}</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Parcel ID:</span> {parcel.parcelId}</p>
                      <p><span className="font-medium">Zoning:</span> {parcel.zoning}</p>
                      <p><span className="font-medium">Type:</span> {parcel.propertyType}</p>
                      <p><span className="font-medium">Assessed Value:</span> ${parcel.assessedValue.toLocaleString()}</p>
                      <p><span className="font-medium">Tax Value:</span> ${parcel.taxValue.toLocaleString()}</p>
                      <p><span className="font-medium">Lot Size:</span> {parcel.lotSize.toLocaleString()} sq ft</p>
                      <p><span className="font-medium">Building:</span> {parcel.buildingSqFt.toLocaleString()} sq ft</p>
                      <p><span className="font-medium">Year Built:</span> {parcel.yearBuilt}</p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })
        )}
        
        {/* Render original property markers */}
        {properties.map((property) => {
          // Use coordinates if available, otherwise use default Clintonville location with slight offset
          const position: [number, number] = property.coordinates 
            ? property.coordinates 
            : [40.035 + (Math.random() - 0.5) * 0.01, -83.025 + (Math.random() - 0.5) * 0.01];
          
          return (
            <Marker
              key={`prop_${property.id}`}
              position={position}
              icon={L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="
                  background-color: #ef4444;
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                "></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
              })}
              eventHandlers={{
                click: () => onPropertySelect(property),
              }}
            >
              <Popup>
                <div className="min-w-[250px] max-w-[300px]">
                  {/* Property Image */}
                  {(() => {
                    const imageUrl = getPropertyImageWithFallback({
                      address: property.address,
                      coordinates: property.coordinates,
                      width: 250,
                      height: 150
                    });
                    
                    return (
                      <div className="w-full h-32 mb-2 overflow-hidden rounded bg-gray-100 flex items-center justify-center">
                        <img
                          src={imageUrl}
                          alt={property.address}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            // Final fallback if image fails to load
                            const target = e.target as HTMLImageElement;
                            const addressPart = property.address.split(',')[0].substring(0, 12);
                            target.src = `https://via.placeholder.com/250x150/6366f1/ffffff?text=${encodeURIComponent(addressPart)}`;
                          }}
                        />
                      </div>
                    );
                  })()}
                  
                  <h3 className="font-semibold text-lg mb-2">{property.address}</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Zoning:</span> {property.zoning}</p>
                    <p><span className="font-medium">Price:</span> ${property.value.toLocaleString()}</p>
                    {property.taxValue && <p><span className="font-medium">Tax Value:</span> ${property.taxValue.toLocaleString()}</p>}
                    {property.createdByName && <p><span className="font-medium">Submitted by:</span> {property.createdByName}</p>}
                    {property.notes && <p><span className="font-medium">Notes:</span> {property.notes}</p>}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default Map;
