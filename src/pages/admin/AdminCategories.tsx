import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FolderOpen, Search, Plus, Edit, Trash2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Category {
  id: string;
  naziv: string;
  naziv_en?: string;
  naziv_de?: string;
  naziv_it?: string;
  naziv_ru?: string;
  opis?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminCategories() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    naziv: '',
    naziv_en: '',
    naziv_de: '',
    naziv_it: '',
    naziv_ru: '',
    opis: ''
  });

  useEffect(() => {
    if (isAdmin) {
      loadCategories();
    }
  }, [isAdmin]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('kategorije')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: "Napaka",
        description: "Napaka pri nalaganju kategorij.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      naziv: '',
      naziv_en: '',
      naziv_de: '',
      naziv_it: '',
      naziv_ru: '',
      opis: ''
    });
  };

  const handleAdd = async () => {
    if (!formData.naziv.trim()) {
      toast({
        title: "Napaka",
        description: "Naziv kategorije je obvezen.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('kategorije')
        .insert({
          naziv: formData.naziv.trim(),
          naziv_en: formData.naziv_en.trim() || null,
          naziv_de: formData.naziv_de.trim() || null,
          naziv_it: formData.naziv_it.trim() || null,
          naziv_ru: formData.naziv_ru.trim() || null,
          opis: formData.opis.trim() || null
        });

      if (error) throw error;

      toast({
        title: "Kategorija dodana",
        description: "Kategorija je bila uspešno dodana.",
      });

      await loadCategories();
      resetForm();
      setAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Napaka",
        description: "Napaka pri dodajanju kategorije.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    if (!selectedCategory || !formData.naziv.trim()) {
      return;
    }

    try {
      const { error } = await supabase
        .from('kategorije')
        .update({
          naziv: formData.naziv.trim(),
          naziv_en: formData.naziv_en.trim() || null,
          naziv_de: formData.naziv_de.trim() || null,
          naziv_it: formData.naziv_it.trim() || null,
          naziv_ru: formData.naziv_ru.trim() || null,
          opis: formData.opis.trim() || null
        })
        .eq('id', selectedCategory.id);

      if (error) throw error;

      toast({
        title: "Kategorija posodobljena",
        description: "Kategorija je bila uspešno posodobljena.",
      });

      await loadCategories();
      resetForm();
      setEditDialogOpen(false);
      setSelectedCategory(null);
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Napaka",
        description: "Napaka pri posodabljanju kategorije.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Ali ste prepričani, da želite izbrisati to kategorijo?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('kategorije')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: "Kategorija izbrisana",
        description: "Kategorija je bila uspešno izbrisana.",
      });

      await loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Napaka",
        description: "Napaka pri brisanju kategorije.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      naziv: category.naziv,
      naziv_en: category.naziv_en || '',
      naziv_de: category.naziv_de || '',
      naziv_it: category.naziv_it || '',
      naziv_ru: category.naziv_ru || '',
      opis: category.opis || ''
    });
    setEditDialogOpen(true);
  };

  const filteredCategories = categories.filter(category =>
    category.naziv.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.opis?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const CategoryForm = ({ isEdit = false }) => (
    <div className="space-y-6">
      <Tabs defaultValue="sl" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sl">SL</TabsTrigger>
          <TabsTrigger value="en">EN</TabsTrigger>
          <TabsTrigger value="de">DE</TabsTrigger>
          <TabsTrigger value="it">IT</TabsTrigger>
          <TabsTrigger value="ru">RU</TabsTrigger>
        </TabsList>

        <TabsContent value="sl" className="space-y-4">
          <div>
            <label className="text-sm font-medium">Naziv (slovenščina) *</label>
            <Input
              value={formData.naziv}
              onChange={(e) => setFormData({ ...formData, naziv: e.target.value })}
              placeholder="Elektronika"
            />
          </div>
        </TabsContent>

        <TabsContent value="en" className="space-y-4">
          <div>
            <label className="text-sm font-medium">Naziv (angleščina)</label>
            <Input
              value={formData.naziv_en}
              onChange={(e) => setFormData({ ...formData, naziv_en: e.target.value })}
              placeholder="Electronics"
            />
          </div>
        </TabsContent>

        <TabsContent value="de" className="space-y-4">
          <div>
            <label className="text-sm font-medium">Naziv (nemščina)</label>
            <Input
              value={formData.naziv_de}
              onChange={(e) => setFormData({ ...formData, naziv_de: e.target.value })}
              placeholder="Elektronik"
            />
          </div>
        </TabsContent>

        <TabsContent value="it" className="space-y-4">
          <div>
            <label className="text-sm font-medium">Naziv (italijanščina)</label>
            <Input
              value={formData.naziv_it}
              onChange={(e) => setFormData({ ...formData, naziv_it: e.target.value })}
              placeholder="Elettronica"
            />
          </div>
        </TabsContent>

        <TabsContent value="ru" className="space-y-4">
          <div>
            <label className="text-sm font-medium">Naziv (ruščina)</label>
            <Input
              value={formData.naziv_ru}
              onChange={(e) => setFormData({ ...formData, naziv_ru: e.target.value })}
              placeholder="Электроника"
            />
          </div>
        </TabsContent>
      </Tabs>

      <div>
        <label className="text-sm font-medium">Opis</label>
        <Textarea
          value={formData.opis}
          onChange={(e) => setFormData({ ...formData, opis: e.target.value })}
          placeholder="Kratka opisna informacija o kategoriji"
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={isEdit ? handleEdit : handleAdd} className="flex-1">
          {isEdit ? 'Posodobi' : 'Dodaj'} kategorijo
        </Button>
        <Button 
          variant="outline" 
          onClick={() => {
            isEdit ? setEditDialogOpen(false) : setAddDialogOpen(false);
            resetForm();
          }}
          className="flex-1"
        >
          Prekliči
        </Button>
      </div>
    </div>
  );

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
        <FolderOpen className="h-8 w-8" />
        Upravljanje kategorij
      </motion.h1>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skupaj kategorij</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Večjezične</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.filter(c => c.naziv_en || c.naziv_de || c.naziv_it || c.naziv_ru).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Poišči kategorije..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setAddDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Dodaj kategorijo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Dodaj novo kategorijo</DialogTitle>
            </DialogHeader>
            <CategoryForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kategorije ({filteredCategories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naziv</TableHead>
                <TableHead>Opis</TableHead>
                <TableHead>Prevodi</TableHead>
                <TableHead>Ustvarjeno</TableHead>
                <TableHead>Dejanja</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="font-medium">{category.naziv}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground max-w-xs truncate">
                      {category.opis || 'Ni opisa'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {category.naziv_en && <span className="px-1 bg-blue-100 text-blue-800 text-xs rounded">EN</span>}
                      {category.naziv_de && <span className="px-1 bg-green-100 text-green-800 text-xs rounded">DE</span>}
                      {category.naziv_it && <span className="px-1 bg-purple-100 text-purple-800 text-xs rounded">IT</span>}
                      {category.naziv_ru && <span className="px-1 bg-red-100 text-red-800 text-xs rounded">RU</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(category.created_at).toLocaleDateString('sl-SI')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Uredi kategorijo</DialogTitle>
          </DialogHeader>
          <CategoryForm isEdit={true} />
        </DialogContent>
      </Dialog>
    </div>
  );
}