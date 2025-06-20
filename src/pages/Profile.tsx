import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function Profile() {
  const { t } = useTranslation();
  const { user, profile, isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ime: profile?.ime || '',
    priimek: profile?.priimek || '',
    telefon: profile?.telefon || '',
    naslov: profile?.naslov || '',
  });

  const handleSave = async () => {
    if (!profile?.user_id) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          ime: formData.ime,
          priimek: formData.priimek,
          telefon: formData.telefon,
          naslov: formData.naslov,
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      // Refresh profile by reloading the page or fetching profile again
      window.location.reload();
      setEditing(false);
      
      toast({
        title: "Profil posodobljen",
        description: "Vaši podatki so bili uspešno posodobljeni.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Napaka",
        description: "Prišlo je do napake pri posodabljanju profila.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      ime: profile?.ime || '',
      priimek: profile?.priimek || '',
      telefon: profile?.telefon || '',
      naslov: profile?.naslov || '',
    });
    setEditing(false);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Prijavite se za dostop do profila</h1>
        <p className="text-muted-foreground">Za urejanje profila se morate prijaviti.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-8"
      >
        Moj profil
      </motion.h1>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Osebni podatki
            </CardTitle>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Badge variant="secondary">Admin</Badge>
              )}
              {!editing ? (
                <Button variant="outline" onClick={() => setEditing(true)}>
                  Uredi
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Prekliči
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={loading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Shrani
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Ime
              </label>
              {editing ? (
                <Input
                  value={formData.ime}
                  onChange={(e) => setFormData({ ...formData, ime: e.target.value })}
                  placeholder="Vnesite ime"
                />
              ) : (
                <p className="py-2 px-3 bg-muted rounded-md">
                  {profile?.ime || 'Ni nastavljeno'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Priimek
              </label>
              {editing ? (
                <Input
                  value={formData.priimek}
                  onChange={(e) => setFormData({ ...formData, priimek: e.target.value })}
                  placeholder="Vnesite priimek"
                />
              ) : (
                <p className="py-2 px-3 bg-muted rounded-md">
                  {profile?.priimek || 'Ni nastavljeno'}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              E-pošta
            </label>
            <p className="py-2 px-3 bg-muted rounded-md text-muted-foreground">
              {user.email} (ni mogoče spremeniti)
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telefon
            </label>
            {editing ? (
              <Input
                value={formData.telefon}
                onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                placeholder="Vnesite telefonsko številko"
              />
            ) : (
              <p className="py-2 px-3 bg-muted rounded-md">
                {profile?.telefon || 'Ni nastavljeno'}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Naslov
            </label>
            {editing ? (
              <Input
                value={formData.naslov}
                onChange={(e) => setFormData({ ...formData, naslov: e.target.value })}
                placeholder="Vnesite naslov"
              />
            ) : (
              <p className="py-2 px-3 bg-muted rounded-md">
                {profile?.naslov || 'Ni nastavljeno'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}