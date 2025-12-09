import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ParcelFilters } from '../services/parcelService';

interface ParcelFiltersProps {
  onFiltersChange: (filters: ParcelFilters) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
}

const ParcelFiltersComponent: React.FC<ParcelFiltersProps> = ({
  onFiltersChange,
  onSearchChange,
  onClearFilters
}) => {
  const [filters, setFilters] = useState<ParcelFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  const propertyTypes = ['Residential', 'Commercial', 'Industrial', 'Mixed Use'];
  const zoningTypes = ['R-2', 'R-3', 'C-1', 'C-2', 'M-1', 'M-2'];

  const handleFilterChange = (key: keyof ParcelFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearchChange(query);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
    onClearFilters();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Parcel Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search Address or Parcel ID</Label>
          <Input
            id="search"
            type="text"
            placeholder="Enter address or parcel ID..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        {/* Property Type */}
        <div className="space-y-2">
          <Label>Property Type</Label>
          <div className="grid grid-cols-2 gap-2">
            {propertyTypes.map((type) => (
              <label key={type} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.propertyType?.includes(type) || false}
                  onChange={(e) => {
                    const currentTypes = filters.propertyType || [];
                    const newTypes = e.target.checked
                      ? [...currentTypes, type]
                      : currentTypes.filter(t => t !== type);
                    handleFilterChange('propertyType', newTypes.length > 0 ? newTypes : undefined);
                  }}
                  className="rounded"
                />
                <span className="text-sm">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Zoning */}
        <div className="space-y-2">
          <Label>Zoning</Label>
          <div className="grid grid-cols-2 gap-2">
            {zoningTypes.map((zoning) => (
              <label key={zoning} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.zoning?.includes(zoning) || false}
                  onChange={(e) => {
                    const currentZoning = filters.zoning || [];
                    const newZoning = e.target.checked
                      ? [...currentZoning, zoning]
                      : currentZoning.filter(z => z !== zoning);
                    handleFilterChange('zoning', newZoning.length > 0 ? newZoning : undefined);
                  }}
                  className="rounded"
                />
                <span className="text-sm">{zoning}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Value Range */}
        <div className="space-y-2">
          <Label>Value Range</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="minValue" className="text-xs">Min Value ($)</Label>
              <Input
                id="minValue"
                type="number"
                placeholder="100000"
                value={filters.minValue || ''}
                onChange={(e) => handleFilterChange('minValue', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
            <div>
              <Label htmlFor="maxValue" className="text-xs">Max Value ($)</Label>
              <Input
                id="maxValue"
                type="number"
                placeholder="500000"
                value={filters.maxValue || ''}
                onChange={(e) => handleFilterChange('maxValue', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>
        </div>

        {/* Lot Size Range */}
        <div className="space-y-2">
          <Label>Lot Size Range (sq ft)</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="minLotSize" className="text-xs">Min Size</Label>
              <Input
                id="minLotSize"
                type="number"
                placeholder="5000"
                value={filters.minLotSize || ''}
                onChange={(e) => handleFilterChange('minLotSize', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
            <div>
              <Label htmlFor="maxLotSize" className="text-xs">Max Size</Label>
              <Input
                id="maxLotSize"
                type="number"
                placeholder="15000"
                value={filters.maxLotSize || ''}
                onChange={(e) => handleFilterChange('maxLotSize', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>
        </div>

        {/* Clear Filters Button */}
        <Button
          onClick={handleClearFilters}
          variant="outline"
          className="w-full"
        >
          Clear All Filters
        </Button>
      </CardContent>
    </Card>
  );
};

export default ParcelFiltersComponent;








