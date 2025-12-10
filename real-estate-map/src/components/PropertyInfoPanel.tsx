import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import NotesDialog from './NotesDialog';
import PropertyValuationModal from './PropertyValuationModal';
import LoanCalculatorModal from './LoanCalculatorModal';
import { Edit2, Check, X, Calculator, DollarSign } from 'lucide-react';
import { getPropertyImageWithFallback } from '../utils/propertyImage';

import { Property } from '../services/propertyService';

interface PropertyInfoPanelProps {
  property: Property | null;
  onClose: () => void;
  onEditNotes: (propertyId: number, notes: string) => void;
  onEditPrice?: (propertyId: number, price: number) => void;
  onUpdateProperty?: (propertyId: number, updates: { assessedValue?: number; capRate?: number; monthlyPayment?: number }) => void;
}

const PropertyInfoPanel: React.FC<PropertyInfoPanelProps> = ({
  property,
  onClose,
  onEditNotes,
  onEditPrice,
  onUpdateProperty
}) => {
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [isValuationModalOpen, setIsValuationModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);

  // Reset editing state when property changes
  useEffect(() => {
    setIsEditingPrice(false);
    setPriceInput('');
  }, [property?.id]);

  if (!property) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Property Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Click on a property marker to view detailed information
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

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg leading-tight">{property.address}</CardTitle>
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
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {property.zoning}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Property Image */}
        {(() => {
          const imageUrl = getPropertyImageWithFallback({
            address: property.address,
            coordinates: property.coordinates as [number, number] | undefined,
            width: 400,
            height: 250
          });

          return (
            <div className="w-full h-48 overflow-hidden rounded-lg bg-gray-100 mb-4 flex items-center justify-center">
              <img
                src={imageUrl}
                alt={property.address}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const addressPart = property.address.split(',')[0].substring(0, 15);
                  target.src = `https://via.placeholder.com/400x250/6366f1/ffffff?text=${encodeURIComponent(addressPart)}`;
                }}
              />
            </div>
          );
        })()}

        {/* Financial Information */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-700">Financial Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Price:</span>
              {isEditingPrice ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    className="w-32 h-8"
                    placeholder="200000"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const value = parseInt(priceInput.replace(/,/g, ''));
                      if (!isNaN(value) && value > 0 && onEditPrice) {
                        onEditPrice(property.id, value);
                        setIsEditingPrice(false);
                      }
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingPrice(false);
                      setPriceInput('');
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatCurrency(property.value)}</span>
                  {onEditPrice && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setPriceInput(property.value.toString());
                        setIsEditingPrice(true);
                      }}
                      className="h-6 w-6 p-0"
                      title="Edit price"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            {property.taxValue && (
              <div className="flex justify-between">
                <span className="text-gray-500">Tax Value:</span>
                <span className="font-medium">{formatCurrency(property.taxValue)}</span>
              </div>
            )}
            {property.assessedValue && (
              <div className="flex justify-between">
                <span className="text-gray-500">Assessed Value:</span>
                <span className="font-medium">{formatCurrency(property.assessedValue)}</span>
              </div>
            )}
            {property.capRate !== undefined && property.capRate !== null && (
              <div className="flex justify-between">
                <span className="text-gray-500">Cap Rate:</span>
                <span className="font-medium">{property.capRate.toFixed(2)}%</span>
              </div>
            )}
            {property.monthlyPayment && (
              <div className="flex justify-between">
                <span className="text-gray-500">Monthly Payment:</span>
                <span className="font-medium">{formatCurrency(property.monthlyPayment)}</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Button
              onClick={() => setIsValuationModalOpen(true)}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Valuation
            </Button>
            <Button
              onClick={() => setIsLoanModalOpen(true)}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Loan Calc
            </Button>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-700">Notes</h3>
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            {property.notes || 'No notes added yet'}
          </div>
          <Button
            onClick={() => setIsNotesDialogOpen(true)}
            variant="outline"
            className="w-full"
          >
            Edit Notes
          </Button>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t">
          <Button
            onClick={() => {
              // Open in Google Maps
              const url = `https://www.google.com/maps/search/${encodeURIComponent(property.address)}`;
              window.open(url, '_blank');
            }}
            variant="outline"
            className="w-full"
          >
            View in Google Maps
          </Button>
        </div>
      </CardContent>

      {/* Notes Dialog */}
      <NotesDialog
        isOpen={isNotesDialogOpen}
        onClose={() => setIsNotesDialogOpen(false)}
        propertyId={property.id}
        currentNotes={property.notes}
        onSave={onEditNotes}
      />

      {/* Property Valuation Modal */}
      <PropertyValuationModal
        isOpen={isValuationModalOpen}
        onClose={() => setIsValuationModalOpen(false)}
        onSave={(assessedValue, capRate) => {
          if (onUpdateProperty && property) {
            onUpdateProperty(property.id, { assessedValue, capRate });
          }
        }}
        currentPrice={property.value}
        currentAssessedValue={property.assessedValue}
        currentCapRate={property.capRate}
      />

      {/* Loan Calculator Modal */}
      <LoanCalculatorModal
        isOpen={isLoanModalOpen}
        onClose={() => setIsLoanModalOpen(false)}
        onSave={(monthlyPayment) => {
          if (onUpdateProperty && property) {
            onUpdateProperty(property.id, { monthlyPayment });
          }
        }}
        propertyPrice={property.value}
        taxValue={property.taxValue}
        currentMonthlyPayment={property.monthlyPayment}
      />
    </Card>
  );
};

export default PropertyInfoPanel;




