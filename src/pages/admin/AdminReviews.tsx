import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Star, CheckCircle, XCircle, User, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Review {
  id: string;
  uporabnik_id: string;
  izdelek_id: string;
  ocena: number;
  komentar: string;
  odobreno: boolean;
  created_at: string;
  profiles?: {
    ime: string;
    priimek: string;
  };
  predmeti?: {
    naziv: string;
    koda: string;
  };
}

export default function AdminReviews() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');

  useEffect(() => {
    if (isAdmin) {
      loadReviews();
    }
  }, [isAdmin, filter]);

  const loadReviews = async () => {
    try {
      // First get reviews based on filter
      let query = supabase
        .from('ocene_izdelkov')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('odobreno', false);
      } else if (filter === 'approved') {
        query = query.eq('odobreno', true);
      }

      const { data: reviewsData, error } = await query;

      if (error) throw error;

      // Then get user profiles and product info for each review
      const reviewsWithDetails = await Promise.all(
        (reviewsData || []).map(async (review) => {
          const [{ data: profile }, { data: product }] = await Promise.all([
            supabase
              .from('profiles')
              .select('ime, priimek')
              .eq('user_id', review.uporabnik_id)
              .single(),
            supabase
              .from('predmeti')
              .select('naziv, koda')
              .eq('id', review.izdelek_id)
              .single()
          ]);
          
          return {
            ...review,
            profiles: profile,
            predmeti: product
          };
        })
      );

      setReviews(reviewsWithDetails);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast({
        title: "Napaka",
        description: "Napaka pri nalaganju ocen.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('ocene_izdelkov')
        .update({ odobreno: true })
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: "Ocena odobrena",
        description: "Ocena je bila uspešno odobrena.",
      });

      await loadReviews();
    } catch (error) {
      console.error('Error approving review:', error);
      toast({
        title: "Napaka",
        description: "Napaka pri odobritvi ocene.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('ocene_izdelkov')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: "Ocena zavrnjena",
        description: "Ocena je bila uspešno zavrnjena in izbrisana.",
      });

      await loadReviews();
    } catch (error) {
      console.error('Error rejecting review:', error);
      toast({
        title: "Napaka",
        description: "Napaka pri zavrnitvi ocene.",
        variant: "destructive",
      });
    }
  };

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < count ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => !r.odobreno).length,
    approved: reviews.filter(r => r.odobreno).length,
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
        <Star className="h-8 w-8" />
        Upravljanje ocen
      </motion.h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skupaj ocen</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Čakajo na odobritev</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Odobrene</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
        >
          Na čakanju ({stats.pending})
        </Button>
        <Button
          variant={filter === 'approved' ? 'default' : 'outline'}
          onClick={() => setFilter('approved')}
        >
          Odobrene ({stats.approved})
        </Button>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          Vse ({stats.total})
        </Button>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {review.profiles?.ime} {review.profiles?.priimek}
                      </span>
                      <div className="flex gap-1">
                        {renderStars(review.ocena)}
                      </div>
                      <Badge variant={review.odobreno ? 'default' : 'secondary'}>
                        {review.odobreno ? 'Odobreno' : 'Na čakanju'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {review.predmeti?.naziv} ({review.predmeti?.koda})
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {new Date(review.created_at).toLocaleDateString('sl-SI')}
                    </p>
                    
                    {review.komentar && (
                      <p className="text-sm bg-muted p-3 rounded">{review.komentar}</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {!review.odobreno && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(review.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Odobri
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(review.id)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Zavrni
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {reviews.length === 0 && !loading && (
          <div className="text-center py-12">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {filter === 'pending' ? 'Ni ocen na čakanju.' : 
               filter === 'approved' ? 'Ni odobrenih ocen.' : 
               'Ni ocen.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}