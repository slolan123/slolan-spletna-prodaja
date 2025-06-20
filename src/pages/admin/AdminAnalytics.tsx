import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, DollarSign, Package, Users, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  revenueByMonth: { month: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  topProducts: { naziv: string; count: number; revenue: number }[];
  recentActivity: { date: string; revenue: number; orders: number }[];
}

export default function AdminAnalytics() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    revenueByMonth: [],
    ordersByStatus: [],
    topProducts: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      loadAnalytics();
    }
  }, [isAdmin]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Load basic stats
      const [ordersRes, productsRes, usersRes] = await Promise.all([
        supabase.from('narocila').select('*'),
        supabase.from('predmeti').select('*'),
        supabase.from('profiles').select('*'),
      ]);

      const orders = ordersRes.data || [];
      const products = productsRes.data || [];
      const users = usersRes.data || [];

      // Calculate totals
      const totalRevenue = orders
        .filter(o => o.status !== 'preklicano')
        .reduce((sum, o) => sum + o.skupna_cena, 0);

      // Revenue by month (last 6 months)
      const now = new Date();
      const revenueByMonth = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthRevenue = orders
          .filter(o => {
            const orderDate = new Date(o.datum);
            return orderDate >= monthStart && orderDate <= monthEnd && o.status !== 'preklicano';
          })
          .reduce((sum, o) => sum + o.skupna_cena, 0);

        revenueByMonth.push({
          month: date.toLocaleDateString('sl-SI', { month: 'short', year: 'numeric' }),
          revenue: monthRevenue
        });
      }

      // Orders by status
      const ordersByStatus = [
        { status: 'Oddano', count: orders.filter(o => o.status === 'oddano').length },
        { status: 'Potrjeno', count: orders.filter(o => o.status === 'potrjeno').length },
        { status: 'Poslano', count: orders.filter(o => o.status === 'poslano').length },
        { status: 'Dostavljeno', count: orders.filter(o => o.status === 'dostavljeno').length },
        { status: 'Preklicano', count: orders.filter(o => o.status === 'preklicano').length },
      ];

      // Top products (by quantity sold)
      const productSales: { [key: string]: { naziv: string; count: number; revenue: number } } = {};
      
      orders.filter(o => o.status !== 'preklicano').forEach(order => {
        (order.artikli as any[]).forEach((artikel: any) => {
          const key = artikel.naziv || 'Neznano';
          if (!productSales[key]) {
            productSales[key] = { naziv: key, count: 0, revenue: 0 };
          }
          productSales[key].count += artikel.kolicina || 1;
          productSales[key].revenue += (artikel.cena || 0) * (artikel.kolicina || 1);
        });
      });

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Recent activity (last 7 days)
      const recentActivity = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayOrders = orders.filter(o => 
          o.datum.startsWith(dateStr) && o.status !== 'preklicano'
        );
        
        recentActivity.push({
          date: date.toLocaleDateString('sl-SI', { month: 'short', day: 'numeric' }),
          revenue: dayOrders.reduce((sum, o) => sum + o.skupna_cena, 0),
          orders: dayOrders.length
        });
      }

      setAnalytics({
        totalRevenue,
        totalOrders: orders.length,
        totalProducts: products.length,
        totalUsers: users.length,
        revenueByMonth,
        ordersByStatus,
        topProducts,
        recentActivity,
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Dostop zavrnjen</h1>
        <p className="text-muted-foreground">Nimate dovoljenja za dostop do te strani.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-8 flex items-center gap-2"
      >
        <BarChart3 className="h-8 w-8" />
        Analitika in statistike
      </motion.h1>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skupen prihodek</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{analytics.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Iz {analytics.totalOrders} naročil
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Naročila</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Skupno naročil
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Izdelki</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              V katalogu
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uporabniki</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registriranih
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue by Month */}
        <Card>
          <CardHeader>
            <CardTitle>Prihodek po mesecih</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.revenueByMonth.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{item.month}</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-2 bg-primary rounded-full"
                      style={{ 
                        width: `${Math.max(10, (item.revenue / Math.max(...analytics.revenueByMonth.map(m => m.revenue), 1)) * 100)}px` 
                      }}
                    />
                    <span className="text-sm font-semibold w-16 text-right">
                      €{item.revenue.toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Naročila po statusu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.ordersByStatus.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{item.status}</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-2 bg-secondary rounded-full"
                      style={{ 
                        width: `${Math.max(10, (item.count / Math.max(...analytics.ordersByStatus.map(o => o.count), 1)) * 100)}px` 
                      }}
                    />
                    <span className="text-sm font-semibold w-8 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Najbolje prodajani izdelki</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topProducts.length > 0 ? (
                analytics.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded">
                    <div>
                      <div className="font-medium">{product.naziv}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.count} prodanih kosov
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">€{product.revenue.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">prihodek</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Ni podatkov o prodaji
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Aktivnost v zadnjih 7 dneh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recentActivity.map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{day.date}</span>
                  <div className="text-right">
                    <div className="font-semibold">€{day.revenue.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      {day.orders} naročil
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}