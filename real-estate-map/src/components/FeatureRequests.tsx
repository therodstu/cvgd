import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Badge } from './ui/badge';
import { Trash2, CheckCircle, XCircle, Clock, Loader } from 'lucide-react';

interface FeatureRequest {
  id: number;
  description: string;
  user_email: string | null;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  created_at: string;
  updated_at: string;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const FeatureRequests: React.FC = () => {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<FeatureRequest | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      
      const response = await fetch(`${API_URL}/api/feature-requests`, {
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feature requests');
      }

      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching feature requests:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const updateStatus = async (id: number, status: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      
      const response = await fetch(`${API_URL}/api/feature-requests/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      await fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!requestToDelete) return;

    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      
      const response = await fetch(`${API_URL}/api/feature-requests/${requestToDelete.id}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to delete request');
      }

      setDeleteConfirmOpen(false);
      setRequestToDelete(null);
      await fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Failed to delete request. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: React.ReactNode, label: string }> = {
      'pending': { variant: 'outline', icon: <Clock className="h-3 w-3" />, label: 'Pending' },
      'in-progress': { variant: 'default', icon: <Loader className="h-3 w-3" />, label: 'In Progress' },
      'completed': { variant: 'default', icon: <CheckCircle className="h-3 w-3" />, label: 'Completed' },
      'rejected': { variant: 'destructive', icon: <XCircle className="h-3 w-3" />, label: 'Rejected' }
    };

    const config = variants[status] || variants['pending'];
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feature Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Feature Requests ({requests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-muted-foreground">No feature requests yet.</p>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(request.status)}
                        {request.user_email && (
                          <span className="text-sm text-muted-foreground">
                            from {request.user_email}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {formatDate(request.created_at)}
                      </p>
                      <p className="whitespace-pre-wrap">{request.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 flex-wrap">
                    <Button
                      size="sm"
                      variant={request.status === 'pending' ? 'default' : 'outline'}
                      onClick={() => updateStatus(request.id, 'pending')}
                    >
                      Pending
                    </Button>
                    <Button
                      size="sm"
                      variant={request.status === 'in-progress' ? 'default' : 'outline'}
                      onClick={() => updateStatus(request.id, 'in-progress')}
                    >
                      In Progress
                    </Button>
                    <Button
                      size="sm"
                      variant={request.status === 'completed' ? 'default' : 'outline'}
                      onClick={() => updateStatus(request.id, 'completed')}
                    >
                      Completed
                    </Button>
                    <Button
                      size="sm"
                      variant={request.status === 'rejected' ? 'destructive' : 'outline'}
                      onClick={() => updateStatus(request.id, 'rejected')}
                    >
                      Rejected
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setRequestToDelete(request);
                        setDeleteConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Feature Request?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this feature request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FeatureRequests;

