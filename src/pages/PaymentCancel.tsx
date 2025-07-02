
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

export default function PaymentCancel() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-slate-100">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center"
        >
          <Card className="shadow-2xl border-0 rounded-3xl overflow-hidden">
            <CardContent className="p-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-8"
              >
                <XCircle className="h-24 w-24 text-red-500 mx-auto" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold text-gray-900 mb-4"
              >
                Plačilo preklicano
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-gray-600 mb-8"
              >
                Vaše plačilo je bilo preklicano. Noben znesek ni bil odtegnjen
                z vaše kartice.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gray-50 rounded-2xl p-6 mb-8"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Kaj se je zgodilo?
                </h3>
                <ul className="text-left text-gray-600 space-y-2">
                  <li>• Plačilo ste prekinili sami</li>
                  <li>• Prišlo je do napake pri komunikaciji z banko</li>
                  <li>• Seja je potekla</li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-4"
              >
                <p className="text-gray-600 mb-6">
                  Ne skrbite - vaše naročilo je še vedno aktivno in lahko
                  poskusite znova.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => navigate('/placilo')}
                    size="lg"
                    className="rounded-xl bg-gradient-to-r from-primary to-primary/90"
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    Poskusi znova
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/cart')}
                    variant="outline"
                    size="lg"
                    className="rounded-xl"
                  >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Nazaj na košarico
                  </Button>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
