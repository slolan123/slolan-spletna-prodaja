
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingBag, Star, TrendingUp, Shield, ArrowRight, Sparkles } from 'lucide-react';
import { HeroAnimation } from '@/components/animations/HeroAnimation';

const Index = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="bg-background relative">
      {/* Hero Section with Animation */}
      <section className="relative py-20 px-4 overflow-hidden">
        <HeroAnimation />
        <div className="container mx-auto text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-4xl md:text-6xl font-bold mb-6 text-foreground bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
          >
            <Sparkles className="inline-block w-8 h-8 md:w-12 md:h-12 mr-2 text-primary" />
            Slolan
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto"
          >
            Profesionalna spletna trgovina s kakovostnimi izdelki po konkurenčnih cenah
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button size="lg" asChild className="group">
              <Link to="/products">
                <ShoppingBag className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                {t('nav.products')}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/categories">{t('nav.categories')}</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold text-center mb-12"
          >
            Zakaj izbrati nas?
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Preverjeni izdelki", desc: "Vsi naši izdelki so skrbno pregledani in preverjeni pred objavo", delay: 0 },
              { icon: TrendingUp, title: "Konkurenčne cene", desc: "Odkrijte izjemne ponudbe z velikimi popusti na kakovostne izdelke", delay: 0.1 },
              { icon: Star, title: "Velike količine", desc: "Kupujemo v velikih količinah, zato lahko ponudimo najboljše cene", delay: 0.2 }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: item.delay }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 group">
                  <CardHeader>
                    <item.icon className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                    <CardTitle>{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{item.desc}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
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
