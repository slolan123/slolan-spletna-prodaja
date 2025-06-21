import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Review {
  id: string;
  uporabnik_id: string;
  ocena: number;
  komentar: string;
  odobreno: boolean;
  created_at: string;
  profiles?: {
    ime: string;
    priimek: string;
  };
}

interface ProductReviewsProps {
  productId: string;
}

export const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);

  useEffect(() => {
    loadReviews();
    if (user) {
      loadUserReview();
    }
  }, [productId, user]);

  const loadReviews = async () => {
    try {
      // First get approved reviews
      const { data: reviewsData, error } = await supabase
        .from('ocene_izdelkov')
        .select('*')
        .eq('izdelek_id', productId)
        .eq('odobreno', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Then get user profiles for each review
      const reviewsWithProfiles = await Promise.all(
        (reviewsData || []).map(async (review) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('ime, priimek')
            .eq('user_id', review.uporabnik_id)
            .single();
          
          return {
            ...review,
            profiles: profile
          };
        })
      );

      setReviews(reviewsWithProfiles);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserReview = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('ocene_izdelkov')
        .select('*')
        .eq('izdelek_id', productId)
        .eq('uporabnik_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setUserReview(data);
      
      if (data) {
        setRating(data.ocena);
        setComment(data.komentar || '');
      }
    } catch (error) {
      console.error('Error loading user review:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast({
        title: "Prijava potrebna",
        description: "Za oddajo ocene se morate prijaviti.",
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Ocena potrebna",
        description: "Prosimo, dodajte oceno.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const reviewData = {
        izdelek_id: productId,
        uporabnik_id: user.id,
        ocena: rating,
        komentar: comment.trim() || null,
        odobreno: false
      };

      let error;
      if (userReview) {
        // Update existing review
        const { error: updateError } = await supabase
          .from('ocene_izdelkov')
          .update(reviewData)
          .eq('id', userReview.id);
        error = updateError;
      } else {
        // Create new review
        const { error: insertError } = await supabase
          .from('ocene_izdelkov')
          .insert(reviewData);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Ocena oddana",
        description: "Vaša ocena je bila uspešno oddana in čaka na odobritev.",
      });

      await loadUserReview();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Napaka",
        description: "Napaka pri oddaji ocene.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (count: number, interactive = false, size = 16) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-${size/4} h-${size/4} ${
          i < count ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
        onClick={interactive ? () => setRating(i + 1) : undefined}
      />
    ));
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.ocena, 0) / reviews.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" />
            {t('products.reviews')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {renderStars(Math.round(averageRating))}
                <span className="text-lg font-semibold">
                  {averageRating.toFixed(1)}
                </span>
              </div>
              <span className="text-muted-foreground">
                ({reviews.length} {reviews.length === 1 ? 'ocena' : 'ocen'})
              </span>
            </div>
          ) : (
            <p className="text-muted-foreground">{t('products.noReviews')}</p>
          )}
        </CardContent>
      </Card>

      {/* Write Review */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle>
              {userReview ? 'Uredite svojo oceno' : t('products.writeReview')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('products.rating')}
              </label>
              <div className="flex gap-1">
                {renderStars(rating, true, 20)}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Komentar (neobvezno)
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Napišite svojo izkušnjo z izdelkom..."
                rows={3}
              />
            </div>

            <Button 
              onClick={handleSubmitReview}
              disabled={submitting || rating === 0}
            >
              {submitting ? 'Oddajam...' : (userReview ? 'Posodobi oceno' : t('products.submitReview'))}
            </Button>

            {userReview && !userReview.odobreno && (
              <p className="text-sm text-muted-foreground">
                Vaša ocena čaka na odobritev administratorja.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
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
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {new Date(review.created_at).toLocaleDateString('sl-SI')}
                  </p>
                  {review.komentar && (
                    <p className="text-sm">{review.komentar}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};