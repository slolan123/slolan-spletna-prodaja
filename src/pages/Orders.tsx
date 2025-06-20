import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Package, Calendar, CreditCard, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  id: string;
  datum: string;
  status: 'oddano' | 'potrjeno' | 'poslano' | 'dostavljeno' | 'preklicano';
  skupna_cena: number;
  artikli: any[];
  naslov_dostave: string;
  telefon_kontakt: string;
  opombe?: string;
}

export default function Orders() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
    });
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
                    {getStatusBadge(order.status)}
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
                      {order.artikli.map((artikel: any, index: number) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                          <div>
                            <span className="font-medium">{artikel.naziv}</span>
                            <span className="text-muted-foreground ml-2">
                              x{artikel.kolicina}
                            </span>
                          </div>
                          <span className="font-semibold">
                            €{(artikel.cena * artikel.kolicina).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.opombe && (
                    <div>
                      <h4 className="font-semibold mb-2">Opombe</h4>
                      <p className="text-muted-foreground text-sm">{order.opombe}</p>
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