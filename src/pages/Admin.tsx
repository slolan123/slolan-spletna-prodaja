import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Settings, Users, Package, BarChart3, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';

export default function Admin() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const adminSections = [
    {
      title: 'Uporabniki',
      description: 'Upravljanje uporabnikov in dovoljenj',
      icon: Users,
      href: '/admin/users',
      color: 'text-blue-500',
    },
    {
      title: 'Izdelki',
      description: 'Dodajanje in urejanje izdelkov',
      icon: Package,
      href: '/admin/products',
      color: 'text-green-500',
    },
    {
      title: 'Naročila',
      description: 'Pregled in upravljanje naročil',
      icon: FileText,
      href: '/admin/orders',
      color: 'text-purple-500',
    },
    {
      title: 'Statistike',
      description: 'Pregled prodajnih statistik',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        Admin panel
      </motion.h1>
      <p className="text-muted-foreground mb-8">
        Upravljanje spletne trgovine in sistema
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {adminSections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={section.href}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <section.icon className={`h-6 w-6 ${section.color}`} />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{section.description}</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Sistemske informacije
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Verzija:</span>
                <p className="text-muted-foreground">1.0.0</p>
              </div>
              <div>
                <span className="font-medium">Zadnja posodobitev:</span>
                <p className="text-muted-foreground">Danes</p>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <p className="text-green-600">Aktivno</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
