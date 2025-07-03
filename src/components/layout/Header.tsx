
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { User, Settings, LogOut, ShoppingBag, Heart, Search, Menu } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { Input } from '@/components/ui/input';
import { CartIcon } from './CartIcon';

export const Header = () => {
  const { t } = useTranslation();
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-2xl font-bold text-black">
              Slolan
            </Link>
          </div>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Iščite izdelke..."
                className="pl-10 w-full border-gray-200 focus:border-black focus:ring-black"
              />
            </div>
          </div>

          {/* Navigation and User Menu */}
          <div className="flex items-center space-x-4">
            {/* Main Navigation - Hidden on mobile */}
            <nav className="hidden lg:flex items-center space-x-6">
              <Link to="/categories" className="text-gray-700 hover:text-black transition-colors font-medium">
                Kategorije
              </Link>
              <Link to="/products" className="text-gray-700 hover:text-black transition-colors font-medium">
                Izdelki
              </Link>
              {user && (
                <>
                  <Link to="/wishlist" className="text-gray-700 hover:text-black transition-colors flex items-center font-medium">
                    <Heart className="h-4 w-4 mr-1" />
                    Želje
                  </Link>
                  <Link to="/orders" className="text-gray-700 hover:text-black transition-colors flex items-center font-medium">
                    <ShoppingBag className="h-4 w-4 mr-1" />
                    Naročila
                  </Link>
                </>
              )}
            </nav>

            {/* Language Selector - Hidden on mobile */}
            <div className="hidden md:block">
              <LanguageSelector />
            </div>

            {/* Cart Icon */}
            <CartIcon />

            {/* User Menu or Auth Buttons */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-black text-white text-sm">
                        {profile?.ime?.[0]}{profile?.priimek?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">
                        {profile?.ime} {profile?.priimek}
                      </p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                      {isAdmin && (
                        <Badge variant="secondary" className="w-fit">
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/orders">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Naročila
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/wishlist">
                      <Heart className="mr-2 h-4 w-4" />
                      Želje
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="md:hidden" />
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link to="/categories">
                      <Menu className="mr-2 h-4 w-4" />
                      Kategorije
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link to="/products">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Izdelki
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin">
                          <Settings className="mr-2 h-4 w-4" />
                          Admin
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Odjava
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link to="/auth">Prijava</Link>
                </Button>
                <Button asChild className="bg-black text-white hover:bg-gray-800">
                  <Link to="/auth?mode=register">Registracija</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Iščite izdelke..."
              className="pl-10 w-full border-gray-200 focus:border-black focus:ring-black"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
