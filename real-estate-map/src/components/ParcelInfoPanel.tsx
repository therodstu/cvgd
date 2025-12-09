import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ParcelData } from '../services/parcelService';

interface ParcelInfoPanelProps {
  parcel: ParcelData | null;
  onClose: () => void;
  onAddToProperties?: (parcel: ParcelData) => void;
}

const ParcelInfoPanel: React.FC<ParcelInfoPanelProps> = ({
  parcel,
  onClose,
  onAddToProperties
}) => {
  if (!parcel) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Parcel Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Click on a parcel marker to view detailed information
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatSquareFeet = (sqft: number) => {
    return new Intl.NumberFormat('en-US').format(sqft);
  };

  const getPropertyTypeColor = (type: string) => {
    const colors = {
      'Residential': 'bg-blue-100 text-blue-800',
      'Commercial': 'bg-green-100 text-green-800',
      'Industrial': 'bg-yellow-100 text-yellow-800',
      'Mixed Use': 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getZoningColor = (zoning: string) => {
    if (zoning.startsWith('R-')) return 'bg-blue-100 text-blue-800';
    if (zoning.startsWith('C-')) return 'bg-green-100 text-green-800';
    if (zoning.startsWith('M-')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg leading-tight">{parcel.address}</CardTitle>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            ×
          </Button>
        </div>
        <div className="flex gap-2 mt-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPropertyTypeColor(parcel.propertyType)}`}>
            {parcel.propertyType}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getZoningColor(parcel.zoning)}`}>
            {parcel.zoning}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Basic Information */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-700">Basic Information</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Parcel ID:</span>
              <p className="font-medium">{parcel.parcelId}</p>
            </div>
            <div>
              <span className="text-gray-500">Year Built:</span>
              <p className="font-medium">{parcel.yearBuilt}</p>
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-700">Financial Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Assessed Value:</span>
              <span className="font-medium">{formatCurrency(parcel.assessedValue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tax Value:</span>
              <span className="font-medium">{formatCurrency(parcel.taxValue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Value per Sq Ft:</span>
              <span className="font-medium">
                {formatCurrency(parcel.assessedValue / parcel.buildingSqFt)}
              </span>
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-700">Property Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Lot Size:</span>
              <span className="font-medium">{formatSquareFeet(parcel.lotSize)} sq ft</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Building Size:</span>
              <span className="font-medium">{formatSquareFeet(parcel.buildingSqFt)} sq ft</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Lot Coverage:</span>
              <span className="font-medium">
                {((parcel.buildingSqFt / parcel.lotSize) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Investment Analysis */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-700">Investment Analysis</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Price per Sq Ft:</span>
              <span className="font-medium">
                {formatCurrency(parcel.assessedValue / parcel.lotSize)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Building Ratio:</span>
              <span className="font-medium">
                {((parcel.buildingSqFt / parcel.lotSize) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Coordinates */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-700">Location</h3>
          <div className="text-sm text-gray-600">
            <p>Lat: {parcel.coordinates[1].toFixed(6)}</p>
            <p>Lng: {parcel.coordinates[0].toFixed(6)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t">
          <div className="space-y-2">
            {onAddToProperties && (
              <Button
                onClick={() => onAddToProperties(parcel)}
                className="w-full"
                variant="default"
              >
                Add to My Properties
              </Button>
            )}
            <Button
              onClick={() => {
                // Open in Google Maps
                const url = `https://www.google.com/maps?q=${parcel.coordinates[1]},${parcel.coordinates[0]}`;
                window.open(url, '_blank');
              }}
              variant="outline"
              className="w-full"
            >
              View in Google Maps
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ParcelInfoPanel;








