import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ShoppingBag, Search, Eye, Package, Calendar, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Order {
  id: string;
  datum: string;
  status: 'oddano' | 'potrjeno' | 'poslano' | 'dostavljeno' | 'preklicano';
  skupna_cena: number;
  artikli: any[];
  naslov_dostave: string;
  telefon_kontakt: string;
  opombe?: string;
  uporabnik_id: string;
  updated_at: string;
}

export default function AdminOrders() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (isAdmin) {
      loadOrders();
    }
  }, [isAdmin]);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('narocila')
        .select('*')
        .order('datum', { ascending: false });

      if (error) throw error;
      setOrders((data || []) as Order[]);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Napaka",
        description: "Napaka pri nalaganju naročil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase
        .from('narocila')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      await loadOrders();
      toast({
        title: "Status spremenjen",
        description: `Status naročila je bil spremenjen na "${newStatus}".`,
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Napaka",
        description: "Napaka pri spreminjanju statusa naročila.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    const statusMap = {
      oddano: { label: 'Oddano', variant: 'secondary' as const },
      potrjeno: { label: 'Potrjeno', variant: 'default' as const },
      poslano: { label: 'Poslano', variant: 'default' as const },
      dostavljeno: { label: 'Dostavljeno', variant: 'default' as const },
      preklicano: { label: 'Preklicano', variant: 'destructive' as const },
    };

    const statusInfo = statusMap[status];
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sl-SI', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.naslov_dostave.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.telefon_kontakt.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const orderStats = {
    total: orders.length,
    oddano: orders.filter(o => o.status === 'oddano').length,
    potrjeno: orders.filter(o => o.status === 'potrjeno').length,
    poslano: orders.filter(o => o.status === 'poslano').length,
    dostavljeno: orders.filter(o => o.status === 'dostavljeno').length,
    preklicano: orders.filter(o => o.status === 'preklicano').length,
    totalRevenue: orders
      .filter(o => o.status !== 'preklicano')
      .reduce((sum, o) => sum + o.skupna_cena, 0),
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Dostop zavrnjen</h1>
        <p className="text-muted-foreground">Nimate dovoljenja za dostop do te strani.</p>
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
        <ShoppingBag className="h-8 w-8" />
        Upravljanje naročil
      </motion.h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skupaj naročil</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oddana</CardTitle>
            <Package className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.oddano}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dostavljeno</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.dostavljeno}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skupen prihodek</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{orderStats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Poišči naročila..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtriraj po statusu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Vsi statusi</SelectItem>
            <SelectItem value="oddano">Oddano</SelectItem>
            <SelectItem value="potrjeno">Potrjeno</SelectItem>
            <SelectItem value="poslano">Poslano</SelectItem>
            <SelectItem value="dostavljeno">Dostavljeno</SelectItem>
            <SelectItem value="preklicano">Preklicano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Naročila ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Naročila</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Vrednost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Kontakt</TableHead>
                <TableHead>Dejanja</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="font-mono text-sm">
                      #{order.id.slice(-8)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(order.datum)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">€{order.skupna_cena.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.artikli.length} artikel{order.artikli.length !== 1 ? 'ov' : ''}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      {getStatusBadge(order.status)}
                      <Select
                        value={order.status}
                        onValueChange={(value: Order['status']) => handleStatusChange(order.id, value)}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="oddano">Oddano</SelectItem>
                          <SelectItem value="potrjeno">Potrjeno</SelectItem>
                          <SelectItem value="poslano">Poslano</SelectItem>
                          <SelectItem value="dostavljeno">Dostavljeno</SelectItem>
                          <SelectItem value="preklicano">Preklicano</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{order.telefon_kontakt}</div>
                      <div className="text-muted-foreground truncate max-w-32">
                        {order.naslov_dostave}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order);
                        setOrderDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Naročilo #{selectedOrder?.id.slice(-8)}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Informacije o naročilu</h4>
                  <div className="space-y-2 text-sm">
                    <div>Datum: {formatDate(selectedOrder.datum)}</div>
                    <div>Status: {getStatusBadge(selectedOrder.status)}</div>
                    <div>Skupna cena: €{selectedOrder.skupna_cena.toFixed(2)}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Dostava</h4>
                  <div className="space-y-2 text-sm">
                    <div>Telefon: {selectedOrder.telefon_kontakt}</div>
                    <div>Naslov: {selectedOrder.naslov_dostave}</div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold mb-2">Artikli ({selectedOrder.artikli.length})</h4>
                <div className="space-y-2">
                  {selectedOrder.artikli.map((artikel: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted rounded">
                      <div>
                        <div className="font-medium">{artikel.naziv}</div>
                        <div className="text-sm text-muted-foreground">
                          Količina: {artikel.kolicina} × €{artikel.cena.toFixed(2)}
                        </div>
                      </div>
                      <div className="font-semibold">
                        €{(artikel.cena * artikel.kolicina).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.opombe && (
                <div>
                  <h4 className="font-semibold mb-2">Opombe</h4>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded">
                    {selectedOrder.opombe}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}