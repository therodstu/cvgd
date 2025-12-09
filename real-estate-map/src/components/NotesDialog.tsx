import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

interface NotesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: number;
  currentNotes: string;
  onSave: (propertyId: number, notes: string) => void;
}

const NotesDialog: React.FC<NotesDialogProps> = ({
  isOpen,
  onClose,
  propertyId,
  currentNotes,
  onSave
}) => {
  const [notes, setNotes] = useState(currentNotes);

  const handleSave = () => {
    onSave(propertyId, notes);
    onClose();
  };

  const handleClose = () => {
    setNotes(currentNotes); // Reset to original notes
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Property Notes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your notes about this property..."
            className="min-h-[100px]"
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Notes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotesDialog;








