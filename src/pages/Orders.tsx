import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Package, Calendar, CreditCard, MapPin, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface Order {
  id: string;
  datum: string;
  status: 'oddano' | 'potrjeno' | 'poslano' | 'dostavljeno' | 'preklicano';
  skupna_cena: number;
  artikli: any[];
  naslov_dostave: string;
  telefon_kontakt: string;
  opombe?: string;
  selected_variants?: any[];
}

export default function Orders() {
  const { t } = useTranslation();
  const { user, session } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const downloadInvoice = async (orderId: string) => {
    if (!session) return;

    try {
      // Fetch invoice HTML with Authorization header
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-invoice?orderId=${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Napaka pri generiranju računa');
      }

      const html = await response.text();
      // Odpri HTML v novem oknu
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.open();
        newWindow.document.write(html);
        newWindow.document.close();
      }

      toast({
        title: 'Račun generiran',
        description: 'Račun se odpira v novem oknu. Lahko ga natisnete ali shranite kot PDF.',
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: 'Napaka',
        description: 'Prišlo je do napake pri generiranju računa.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('narocila')
        .select('*')
        .eq('uporabnik_id', user?.id)
        .order('datum', { ascending: false });

      if (error) throw error;
      setOrders((data || []) as Order[]);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, opombe?: string) => {
    // Check if this is a proforma invoice order
    if (opombe && opombe.includes('PLAČILO PO PREDRAČUNU')) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Predračun</span>;
    }

    const statusMap: { [key: string]: string } = {
      oddano: 'bg-yellow-100 text-yellow-800',
      potrjeno: 'bg-blue-100 text-blue-800',
      poslano: 'bg-purple-100 text-purple-800',
      dostavljeno: 'bg-green-100 text-green-800',
      preklicano: 'bg-red-100 text-red-800',
    };

    const statusClass = statusMap[status] || 'bg-gray-100 text-gray-800';
    const statusLabel = {
      oddano: 'Oddano',
      potrjeno: 'Potrjeno',
      poslano: 'Poslano',
      dostavljeno: 'Dostavljeno',
      preklicano: 'Preklicano',
    }[status] || status;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
        {statusLabel}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sl-SI', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Helper function to get selected variant info for an item
  const getVariantInfo = (artikel: any, order: Order) => {
    if (!order.selected_variants) return null;
    
    return order.selected_variants.find(variant => 
      variant.product_id === artikel.id
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Prijavite se za ogled naročil</h1>
        <p className="text-muted-foreground">Za dostop do vaših naročil se morate prijaviti.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-8"
      >
        Moja naročila
      </motion.h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Ni naročil</h2>
          <p className="text-muted-foreground">
            Trenutno nimate nobenih naročil. Začnite nakupovati in si oglejte svoja naročila tukaj.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Naročilo #{order.id.slice(-8)}
                    </CardTitle>
                    {getStatusBadge(order.status, order.opombe)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(order.datum)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">
                        €{order.skupna_cena.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{order.naslov_dostave}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Artikli ({order.artikli.length})</h4>
                    <div className="space-y-2">
                      {order.artikli.map((artikel: any, index: number) => {
                        const variantInfo = getVariantInfo(artikel, order);
                        return (
                          <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{artikel.naziv}</span>
                                <span className="text-muted-foreground">
                                  x{artikel.quantity}
                                </span>
                              </div>
                              {variantInfo && (
                                <div className="flex items-center gap-2 mt-1">
                                  {artikel.selected_variant?.color_value && (
                                    <div 
                                      className="w-3 h-3 rounded-full border border-gray-300"
                                      style={{ backgroundColor: artikel.selected_variant.color_value }}
                                    />
                                  )}
                                  <span className="text-xs text-muted-foreground capitalize">
                                    Barva: {variantInfo.color_name}
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="font-semibold">
                              €{(artikel.final_price * artikel.quantity).toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {order.opombe && typeof order.opombe === 'string' && !order.opombe.trim().startsWith('{') && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      <strong>Opombe:</strong> {order.opombe}
                    </div>
                  )}

                  {/* Download Invoice Button - now also for 'oddano' orders */}
                  {(['oddano', 'potrjeno', 'poslano', 'dostavljeno'].includes(order.status)) && (
                    <div className="pt-4 border-t">
                      <Button
                        onClick={() => downloadInvoice(order.id)}
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Prenesi račun (PDF)
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
