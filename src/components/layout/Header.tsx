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
import { User, Settings, LogOut, ShoppingBag, Heart, Search } from 'lucide-react';
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
    <header className="bg-background border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-2xl font-bold text-primary">
              LoziceProdaja
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('common.search')}
                className="pl-10 w-full"
              />
            </div>
          </div>

          {/* Navigation and User Menu */}
          <div className="flex items-center space-x-4">
            {/* Main Navigation */}
            <nav className="hidden lg:flex items-center space-x-6">
              <Link to="/categories" className="text-foreground hover:text-primary transition-colors">
                {t('nav.categories')}
              </Link>
              <Link to="/products" className="text-foreground hover:text-primary transition-colors">
                {t('nav.products')}
              </Link>
              {user && (
                <>
                  <Link to="/wishlist" className="text-foreground hover:text-primary transition-colors flex items-center">
                    <Heart className="h-4 w-4 mr-1" />
                    {t('nav.wishlist')}
                  </Link>
                  <Link to="/orders" className="text-foreground hover:text-primary transition-colors flex items-center">
                    <ShoppingBag className="h-4 w-4 mr-1" />
                    {t('nav.orders')}
                  </Link>
                </>
              )}
            </nav>

            {/* Language Selector */}
            <LanguageSelector />

            {/* Cart Icon */}
            <CartIcon />

            {/* User Menu or Auth Buttons */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
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
                      {t('nav.profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/orders">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      {t('nav.orders')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/wishlist">
                      <Heart className="mr-2 h-4 w-4" />
                      {t('nav.wishlist')}
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin">
                          <Settings className="mr-2 h-4 w-4" />
                          {t('nav.admin')}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link to="/auth">{t('nav.login')}</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth?mode=register">{t('nav.register')}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('common.search')}
              className="pl-10 w-full"
            />
          </div>
        </div>
      </div>
    </header>
  );
};