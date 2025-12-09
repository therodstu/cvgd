import React, { useState, useEffect } from 'react';
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

interface LoanCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (monthlyPayment: number) => void;
  propertyPrice?: number;
  taxValue?: number;
  currentMonthlyPayment?: number;
}

const LoanCalculatorModal: React.FC<LoanCalculatorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  propertyPrice = 0,
  taxValue = 0,
  currentMonthlyPayment,
}) => {
  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState('6.5');
  const [loanTerm, setLoanTerm] = useState('30');
  const [annualTax, setAnnualTax] = useState('');
  const [annualInsurance, setAnnualInsurance] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState<number | null>(null);
  const [principalAndInterest, setPrincipalAndInterest] = useState<number | null>(null);

  useEffect(() => {
    if (propertyPrice > 0 && loanAmount === '') {
      // Default to 80% LTV
      setLoanAmount((propertyPrice * 0.8).toString());
    }
    if (taxValue > 0 && annualTax === '') {
      // Estimate annual tax as 1.5% of assessed value
      setAnnualTax((taxValue * 0.015).toString());
    }
  }, [propertyPrice, taxValue, loanAmount, annualTax]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const calculateLoan = () => {
    const amount = parseFloat(loanAmount.replace(/,/g, '')) || 0;
    const rate = parseFloat(interestRate) || 0;
    const term = parseFloat(loanTerm) || 30;
    const tax = parseFloat(annualTax.replace(/,/g, '')) || 0;
    const insurance = parseFloat(annualInsurance.replace(/,/g, '')) || 0;

    if (amount > 0 && rate > 0 && term > 0) {
      // Calculate monthly principal and interest
      // M = P * [r(1+r)^n] / [(1+r)^n - 1]
      const monthlyRate = rate / 100 / 12;
      const numberOfPayments = term * 12;
      
      const monthlyPI = amount * 
        (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

      setPrincipalAndInterest(monthlyPI);

      // Calculate total monthly payment including tax and insurance
      const monthlyTax = tax / 12;
      const monthlyIns = insurance / 12;
      const totalPayment = monthlyPI + monthlyTax + monthlyIns;

      setMonthlyPayment(totalPayment);
    }
  };

  const handleSave = () => {
    if (monthlyPayment !== null) {
      onSave(monthlyPayment);
      onClose();
    }
  };

  const handleReset = () => {
    setLoanAmount('');
    setInterestRate('6.5');
    setLoanTerm('30');
    setAnnualTax('');
    setAnnualInsurance('');
    setMonthlyPayment(null);
    setPrincipalAndInterest(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Commercial Loan Calculator</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loan-amount">Loan Amount</Label>
              <Input
                id="loan-amount"
                type="text"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value.replace(/[^0-9,]/g, ''))}
                placeholder="800,000"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="interest-rate">Interest Rate (%)</Label>
              <Input
                id="interest-rate"
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="6.5"
                min="0"
                max="30"
                step="0.125"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loan-term">Loan Term (Years)</Label>
              <Input
                id="loan-term"
                type="number"
                value={loanTerm}
                onChange={(e) => setLoanTerm(e.target.value)}
                placeholder="30"
                min="1"
                max="40"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="annual-tax">Annual Property Tax</Label>
              <Input
                id="annual-tax"
                type="text"
                value={annualTax}
                onChange={(e) => setAnnualTax(e.target.value.replace(/[^0-9,]/g, ''))}
                placeholder="12,000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="annual-insurance">Annual Insurance</Label>
            <Input
              id="annual-insurance"
              type="text"
              value={annualInsurance}
              onChange={(e) => setAnnualInsurance(e.target.value.replace(/[^0-9,]/g, ''))}
              placeholder="3,600"
            />
          </div>

          <Button onClick={calculateLoan} className="w-full">
            Calculate Payment
          </Button>

          {monthlyPayment !== null && (
            <div className="border-t pt-4 space-y-3">
              <h3 className="font-semibold text-sm">Payment Breakdown</h3>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Principal & Interest:</span>
                  <span className="font-medium">
                    {principalAndInterest !== null ? formatCurrency(principalAndInterest) : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Property Tax:</span>
                  <span className="font-medium">
                    {formatCurrency((parseFloat(annualTax.replace(/,/g, '')) || 0) / 12)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Insurance:</span>
                  <span className="font-medium">
                    {formatCurrency((parseFloat(annualInsurance.replace(/,/g, '')) || 0) / 12)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-semibold">Total Monthly Payment:</span>
                  <span className="font-bold text-lg text-primary">
                    {formatCurrency(monthlyPayment)}
                  </span>
                </div>

                {principalAndInterest !== null && (
                  <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                    <p>
                      <strong>Loan Details:</strong>
                    </p>
                    <p>Loan Amount: {formatCurrency(parseFloat(loanAmount.replace(/,/g, '')) || 0)}</p>
                    <p>Interest Rate: {interestRate}%</p>
                    <p>Loan Term: {loanTerm} years</p>
                    <p>Total Interest Paid: {formatCurrency(
                      (principalAndInterest * parseFloat(loanTerm) * 12) - (parseFloat(loanAmount.replace(/,/g, '')) || 0)
                    )}</p>
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
            disabled={monthlyPayment === null}
          >
            Save to Property
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoanCalculatorModal;


