import React, { useState } from 'react';
import { Button } from './ui/button';
import { useUser } from '../contexts/UserContext';
import AuthDialog from './AuthDialog';
import { Users, LogIn } from 'lucide-react';

interface UserMenuProps {
  onManageUsers?: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onManageUsers }) => {
  const { user, logout, isAuthenticated, isAdmin } = useUser();
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="text-sm font-medium text-primary-foreground">{user.name}</div>
          <div className="text-xs text-primary-foreground/70">{user.role}</div>
        </div>
        {isAdmin && onManageUsers && (
          <Button 
            onClick={onManageUsers} 
            variant="secondary" 
            size="default"
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold px-4 py-2 flex items-center gap-2 shadow-md"
          >
            <Users className="h-4 w-4" />
            Manage Users
          </Button>
        )}
        <Button 
          onClick={logout} 
          variant="secondary"
          size="default"
          className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold px-4 py-2 shadow-md"
        >
          Logout
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button 
        onClick={() => {
          setIsAuthDialogOpen(true);
        }} 
        variant="secondary"
        size="default"
        className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold px-6 py-2 flex items-center gap-2 shadow-md"
      >
        <LogIn className="h-4 w-4" />
        Sign In
      </Button>
      <AuthDialog
        isOpen={isAuthDialogOpen}
        onClose={() => setIsAuthDialogOpen(false)}
      />
    </>
  );
};

export default UserMenu;




