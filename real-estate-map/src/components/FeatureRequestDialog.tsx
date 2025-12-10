import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Input } from './ui/input';

interface FeatureRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FeatureRequestDialog: React.FC<FeatureRequestDialogProps> = ({ open, onOpenChange }) => {
  const [featureDescription, setFeatureDescription] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!featureDescription.trim()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch(`${API_URL}/api/feature-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: featureDescription,
          userEmail: userEmail || 'Not provided',
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFeatureDescription('');
        setUserEmail('');
        setTimeout(() => {
          onOpenChange(false);
          setSubmitStatus('idle');
        }, 2000);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting feature request:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request a Feature</DialogTitle>
          <DialogDescription>
            Have an idea for a new feature? Let us know what you'd like to see!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Your Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="feature">Feature Description *</Label>
              <Textarea
                id="feature"
                placeholder="Describe the feature you'd like to see..."
                value={featureDescription}
                onChange={(e) => setFeatureDescription(e.target.value)}
                rows={6}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setFeatureDescription('');
                setUserEmail('');
                setSubmitStatus('idle');
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !featureDescription.trim()}>
              {isSubmitting ? 'Sending...' : 'Submit Request'}
            </Button>
          </DialogFooter>
          {submitStatus === 'success' && (
            <div className="mt-2 text-sm text-green-600 text-center">
              Thank you! Your feature request has been sent.
            </div>
          )}
          {submitStatus === 'error' && (
            <div className="mt-2 text-sm text-red-600 text-center">
              Failed to send request. Please try again.
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeatureRequestDialog;

