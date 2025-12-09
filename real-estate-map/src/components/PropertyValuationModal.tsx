import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface PropertyValuationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assessedValue: number, capRate: number) => void;
  currentPrice?: number;
  currentAssessedValue?: number;
  currentCapRate?: number;
}

const PropertyValuationModal: React.FC<PropertyValuationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentPrice = 0,
  currentAssessedValue,
  currentCapRate,
}) => {
  const [propertyPrice, setPropertyPrice] = useState(currentPrice.toString());
  const [annualRent, setAnnualRent] = useState('');
  const [operatingExpenses, setOperatingExpenses] = useState('');
  const [vacancyRate, setVacancyRate] = useState('5');
  const [calculatedAssessedValue, setCalculatedAssessedValue] = useState<number | null>(null);
  const [calculatedCapRate, setCalculatedCapRate] = useState<number | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const calculateValuation = () => {
    const price = parseFloat(propertyPrice.replace(/,/g, '')) || 0;
    const rent = parseFloat(annualRent.replace(/,/g, '')) || 0;
    const expenses = parseFloat(operatingExpenses.replace(/,/g, '')) || 0;
    const vacancy = parseFloat(vacancyRate) || 0;

    if (rent > 0 && price > 0) {
      // Calculate NOI (Net Operating Income)
      const grossRent = rent;
      const vacancyLoss = grossRent * (vacancy / 100);
      const effectiveGrossIncome = grossRent - vacancyLoss;
      const noi = effectiveGrossIncome - expenses;

      // Calculate Cap Rate
      const capRate = (noi / price) * 100;
      setCalculatedCapRate(capRate);

      // Calculate Assessed Value using Cap Rate method
      // If NOI is positive, value = NOI / Cap Rate
      // For simplicity, we'll use the property price as base and adjust based on cap rate
      if (capRate > 0 && noi > 0) {
        const assessedValue = noi / (capRate / 100);
        setCalculatedAssessedValue(assessedValue);
      } else {
        setCalculatedAssessedValue(price);
      }
    }
  };

  const handleSave = () => {
    if (calculatedAssessedValue !== null && calculatedCapRate !== null) {
      onSave(calculatedAssessedValue, calculatedCapRate);
      onClose();
    }
  };

  const handleReset = () => {
    setPropertyPrice(currentPrice.toString());
    setAnnualRent('');
    setOperatingExpenses('');
    setVacancyRate('5');
    setCalculatedAssessedValue(null);
    setCalculatedCapRate(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Commercial Property Valuation Calculator</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="property-price">Property Price</Label>
              <Input
                id="property-price"
                type="text"
                value={propertyPrice}
                onChange={(e) => setPropertyPrice(e.target.value.replace(/[^0-9,]/g, ''))}
                placeholder="1,000,000"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="annual-rent">Annual Rental Income</Label>
              <Input
                id="annual-rent"
                type="text"
                value={annualRent}
                onChange={(e) => setAnnualRent(e.target.value.replace(/[^0-9,]/g, ''))}
                placeholder="120,000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="operating-expenses">Annual Operating Expenses</Label>
              <Input
                id="operating-expenses"
                type="text"
                value={operatingExpenses}
                onChange={(e) => setOperatingExpenses(e.target.value.replace(/[^0-9,]/g, ''))}
                placeholder="40,000"
              />
              <p className="text-xs text-muted-foreground">
                Includes property taxes, insurance, maintenance, management fees, etc.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vacancy-rate">Vacancy Rate (%)</Label>
              <Input
                id="vacancy-rate"
                type="number"
                value={vacancyRate}
                onChange={(e) => setVacancyRate(e.target.value)}
                placeholder="5"
                min="0"
                max="100"
              />
            </div>
          </div>

          <Button onClick={calculateValuation} className="w-full">
            Calculate Valuation
          </Button>

          {(calculatedAssessedValue !== null || calculatedCapRate !== null) && (
            <div className="border-t pt-4 space-y-3">
              <h3 className="font-semibold text-sm">Calculation Results</h3>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Assessed Value:</span>
                  <span className="font-semibold text-lg">
                    {calculatedAssessedValue !== null ? formatCurrency(calculatedAssessedValue) : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cap Rate:</span>
                  <span className="font-semibold text-lg">
                    {calculatedCapRate !== null ? `${calculatedCapRate.toFixed(2)}%` : 'N/A'}
                  </span>
                </div>

                {calculatedCapRate !== null && (
                  <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                    <p>
                      <strong>NOI Calculation:</strong>
                    </p>
                    <p>
                      Gross Rent: {formatCurrency(parseFloat(annualRent.replace(/,/g, '')) || 0)}
                    </p>
                    <p>
                      Vacancy Loss ({vacancyRate}%): {formatCurrency((parseFloat(annualRent.replace(/,/g, '')) || 0) * (parseFloat(vacancyRate) || 0) / 100)}
                    </p>
                    <p>
                      Operating Expenses: {formatCurrency(parseFloat(operatingExpenses.replace(/,/g, '')) || 0)}
                    </p>
                    <p>
                      <strong>NOI: {formatCurrency(
                        (parseFloat(annualRent.replace(/,/g, '')) || 0) - 
                        ((parseFloat(annualRent.replace(/,/g, '')) || 0) * (parseFloat(vacancyRate) || 0) / 100) - 
                        (parseFloat(operatingExpenses.replace(/,/g, '')) || 0)
                      )}</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={calculatedAssessedValue === null || calculatedCapRate === null}
          >
            Save to Property
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyValuationModal;


