import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { GlobalErrorBoundary } from "@/components/ui/error-boundary";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LockScreen } from "@/components/LockScreen";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Categories from "./pages/Categories";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Placilo from "./pages/Placilo";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import Wishlist from "./pages/Wishlist";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminCategories from "./pages/admin/AdminCategories";
import NotFound from "./pages/NotFound";
import "./lib/i18n";

const queryClient = new QueryClient();

const App = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has already unlocked the site
    const unlocked = localStorage.getItem('slolan-unlocked') === 'true';
    setIsUnlocked(unlocked);
    setIsLoading(false);
  }, []);

  const handleUnlock = () => {
    setIsUnlocked(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isUnlocked) {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <div className="min-h-screen flex flex-col">
                    <Header />
                    <main className="flex-1">
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/product/:id" element={<ProductDetail />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/placilo" element={<Placilo />} />
                        <Route path="/payment-success" element={<PaymentSuccess />} />
                        <Route path="/payment-cancel" element={<PaymentCancel />} />
                        <Route path="/wishlist" element={<Wishlist />} />
                        <Route path="/orders" element={<Orders />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/admin/users" element={<AdminUsers />} />
                        <Route path="/admin/products" element={<AdminProducts />} />
                        <Route path="/admin/categories" element={<AdminCategories />} />
                        <Route path="/admin/orders" element={<AdminOrders />} />
                        <Route path="/admin/reviews" element={<AdminReviews />} />
                        <Route path="/admin/analytics" element={<AdminAnalytics />} />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                    <Footer />
                  </div>
                </BrowserRouter>
              </TooltipProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
};

export default App;
