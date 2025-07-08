import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ShoppingBag, Search, Eye, Package, Calendar, CreditCard, Download } from 'lucide-react';
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

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Napaka",
          description: "Ni aktivne seje.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-invoice?orderId=${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `racun-${orderId}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Račun prenesen",
        description: "Račun je bil uspešno prenesen.",
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: "Napaka",
        description: "Prišlo je do napake pri generiranju računa.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: Order['status'], opombe?: string) => {
    // Check if this is a proforma invoice order
    if (opombe && opombe.includes('PLAČILO PO PREDRAČUNU')) {
      return <Badge variant="secondary">Predračun</Badge>;
    }

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
                      {getStatusBadge(order.status, order.opombe)}
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
                    <div className="flex gap-2">
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadInvoice(order.id)}
                        title="Prenesi račun"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-600 max-h-90vh overflow-y-auto p-6">
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
                    <div>Status: {getStatusBadge(selectedOrder.status, selectedOrder.opombe)}</div>
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
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border rounded bg-white">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-3 py-2 text-left">Naziv</th>
                        <th className="px-3 py-2 text-right">Količina</th>
                        <th className="px-3 py-2 text-right">Cena/kom</th>
                        <th className="px-3 py-2 text-right">Skupaj</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.artikli.map((artikel: any, index: number) => (
                        <tr key={index} className="border-b last:border-b-0">
                          <td className="px-3 py-2 font-medium">{artikel.naziv}</td>
                          <td className="px-3 py-2 text-right">{artikel.kolicina}</td>
                          <td className="px-3 py-2 text-right">€{artikel.cena ? artikel.cena.toFixed(2) : '-'}</td>
                          <td className="px-3 py-2 text-right">€{artikel.cena && artikel.kolicina ? (artikel.cena * artikel.kolicina).toFixed(2) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.opombe && (
                <div>
                  <h4 className="font-semibold mb-2">Opombe</h4>
                  <div className="text-sm text-muted-foreground p-3 bg-muted rounded break-words whitespace-pre-wrap">
                    {(() => {
                      try {
                        const parsed = JSON.parse(selectedOrder.opombe);
                        // Prikažem samo ključne podatke, če obstajajo
                        const keys = ['payment_status', 'amount_cents', 'currency', 'payment_provider', 'payment_session_id', 'nexi_transaction_id'];
                        return (
                          <ul className="list-disc pl-5">
                            {keys.filter(k => parsed[k]).map(k => (
                              <li key={k}><b>{k.replace(/_/g, ' ')}:</b> {parsed[k]}</li>
                            ))}
                          </ul>
                        );
                      } catch {
                        // Če ni JSON, prikažem kot tekst
                        return selectedOrder.opombe;
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}