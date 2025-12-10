import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Property } from '../services/propertyService';
import { ThumbsUp, ThumbsDown, Trash2, Trash } from 'lucide-react';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface PropertyListProps {
  properties: Property[];
  onVote: (id: number, vote: 'up' | 'down') => void;
  onDelete: (id: number) => void;
  onPropertyClick?: (property: Property) => void;
  onDeleteAll?: () => void;
  isAdmin?: boolean;
}

const PropertyList: React.FC<PropertyListProps> = ({
  properties,
  onVote,
  onDelete,
  onPropertyClick,
  onDeleteAll,
  isAdmin = false,
}) => {
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [propertyToDelete, setPropertyToDelete] = React.useState<Property | null>(null);
  const [deleteAllModalOpen, setDeleteAllModalOpen] = React.useState(false);

  const handleDeleteClick = (property: Property) => {
    setPropertyToDelete(property);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (propertyToDelete) {
      onDelete(propertyToDelete.id);
      setDeleteModalOpen(false);
      setPropertyToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setPropertyToDelete(null);
  };

  const handleDeleteAllClick = () => {
    setDeleteAllModalOpen(true);
  };

  const handleConfirmDeleteAll = () => {
    onDeleteAll?.();
    setDeleteAllModalOpen(false);
  };

  const handleCancelDeleteAll = () => {
    setDeleteAllModalOpen(false);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Properties</CardTitle>
            {isAdmin && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAllClick}
                disabled={properties.length === 0}
                className="flex items-center gap-1"
              >
                <Trash className="h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No properties added yet. Add an address to get started!
            </div>
          ) : (
            <div className="space-y-4">
              {properties.map((property) => {
                return (
                  <div
                    key={property.id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => onPropertyClick?.(property)}
                  >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{property.address}</h3>
                          <p className="text-sm text-muted-foreground">{property.zoning}</p>
                          {property.createdByName && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Submitted by: {property.createdByName}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg text-primary">
                            {formatPrice(property.value)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onVote(property.id, 'up');
                            }}
                            className="flex items-center gap-1"
                          >
                            <ThumbsUp className="h-4 w-4" />
                            <span>{property.thumbsUp || 0}</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onVote(property.id, 'down');
                            }}
                            className="flex items-center gap-1"
                          >
                            <ThumbsDown className="h-4 w-4" />
                            <span>{property.thumbsDown || 0}</span>
                          </Button>
                        </div>
                        {isAdmin && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(property);
                            }}
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        propertyAddress={propertyToDelete?.address || ''}
      />
      <DeleteConfirmationModal
        isOpen={deleteAllModalOpen}
        onClose={handleCancelDeleteAll}
        onConfirm={handleConfirmDeleteAll}
        isDeleteAll={true}
      />
    </>
  );
};

export default PropertyList;

