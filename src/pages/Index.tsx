import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingBag, Star, TrendingUp, Shield } from 'lucide-react';

const Index = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            Selviks
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Profesionalna spletna trgovina s kakovostnimi izdelki po konkurenčnih cenah
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/products">{t('nav.products')}</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/categories">{t('nav.categories')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Zakaj izbrati nas?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Preverjeni izdelki</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Vsi naši izdelki so skrbno pregledani in preverjeni pred objavo
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Konkurenčne cene</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Odkrijte izjemne ponudbe z velikimi popusti na kakovostne izdelke
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Star className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Velike količine</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Kupujemo v velikih količinah, zato lahko ponudimo najboljše cene
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Začnite nakupovati danes</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Registrirajte se in odkrijte naše ekskluzivne ponudbe
          </p>
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/auth?mode=register">{t('nav.register')}</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/auth">{t('nav.login')}</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
