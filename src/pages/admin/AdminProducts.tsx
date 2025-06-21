import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Package, Search, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ImageUpload } from '@/components/admin/ImageUpload';

interface Product {
  id: string;
  naziv: string;
  cena: number;
  popust?: number;
  slika_url?: string;
  status: 'novo' | 'znizano' | 'prodano';
  zaloga: number;
  na_voljo: boolean;
  koda: string;
  seo_slug?: string;
  barva?: string;
  kategorija_id?: string;
  opis?: string;
  created_at: string;
}

interface Category {
  id: string;
  naziv: string;
}

export default function AdminProducts() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    naziv: '',
    cena: '',
    popust: '',
    slika_url: '',
    status: 'novo' as 'novo' | 'znizano' | 'prodano',
    zaloga: '',
    na_voljo: true,
    koda: '',
    seo_slug: '',
    barva: '',
    kategorija_id: '',
    opis: '',
  });

  useEffect(() => {
    if (isAdmin) {
      loadProducts();
      loadCategories();
    }
  }, [isAdmin]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('predmeti')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Napaka",
        description: "Napaka pri nalaganju izdelkov.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('kategorije')
        .select('id, naziv')
        .order('naziv');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      naziv: '',
      cena: '',
      popust: '',
      slika_url: '',
      status: 'novo',
      zaloga: '',
      na_voljo: true,
      koda: '',
      seo_slug: '',
      barva: '',
      kategorija_id: '',
      opis: '',
    });
  };

  const handleAdd = async () => {
    try {
      const productData = {
        naziv: formData.naziv,
        cena: parseFloat(formData.cena),
        popust: formData.popust ? parseFloat(formData.popust) : 0,
        slika_url: formData.slika_url || null,
        status: formData.status,
        zaloga: parseInt(formData.zaloga),
        na_voljo: formData.na_voljo,
        koda: formData.koda,
        seo_slug: formData.seo_slug || null,
        barva: formData.barva || null,
        kategorija_id: formData.kategorija_id || null,
        opis: formData.opis || null,
      };

      const { error } = await supabase
        .from('predmeti')
        .insert([productData]);

      if (error) throw error;

      await loadProducts();
      setAddDialogOpen(false);
      resetForm();
      
      toast({
        title: "Izdelek dodan",
        description: "Izdelek je bil uspešno dodan.",
      });
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Napaka",
        description: "Napaka pri dodajanju izdelka.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    if (!selectedProduct) return;

    try {
      const productData = {
        naziv: formData.naziv,
        cena: parseFloat(formData.cena),
        popust: formData.popust ? parseFloat(formData.popust) : 0,
        slika_url: formData.slika_url || null,
        status: formData.status,
        zaloga: parseInt(formData.zaloga),
        na_voljo: formData.na_voljo,
        koda: formData.koda,
        seo_slug: formData.seo_slug || null,
        barva: formData.barva || null,
        kategorija_id: formData.kategorija_id || null,
        opis: formData.opis || null,
      };

      const { error } = await supabase
        .from('predmeti')
        .update(productData)
        .eq('id', selectedProduct.id);

      if (error) throw error;

      await loadProducts();
      setEditDialogOpen(false);
      setSelectedProduct(null);
      resetForm();
      
      toast({
        title: "Izdelek posodobljen",
        description: "Izdelek je bil uspešno posodobljen.",
      });
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Napaka",
        description: "Napaka pri posodabljanju izdelka.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Ali ste prepričani, da želite izbrisati ta izdelek?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('predmeti')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      await loadProducts();
      toast({
        title: "Izdelek izbrisan",
        description: "Izdelek je bil uspešno izbrisan.",
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Napaka",
        description: "Napaka pri brisanju izdelka.",
        variant: "destructive",
      });
    }
  };

  const handleToggleAvailability = async (productId: string, naVoljo: boolean) => {
    try {
      const { error } = await supabase
        .from('predmeti')
        .update({ na_voljo: naVoljo })
        .eq('id', productId);

      if (error) throw error;

      await loadProducts();
      toast({
        title: naVoljo ? "Izdelek aktiviran" : "Izdelek deaktiviran",
        description: `Izdelek je bil ${naVoljo ? 'aktiviran' : 'deaktiviran'}.`,
      });
    } catch (error) {
      console.error('Error toggling product availability:', error);
      toast({
        title: "Napaka",
        description: "Napaka pri spreminjanju dostopnosti izdelka.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      naziv: product.naziv,
      cena: product.cena.toString(),
      popust: product.popust?.toString() || '',
      slika_url: product.slika_url || '',
      status: product.status,
      zaloga: product.zaloga.toString(),
      na_voljo: product.na_voljo,
      koda: product.koda,
      seo_slug: product.seo_slug || '',
      barva: product.barva || '',
      kategorija_id: product.kategorija_id || '',
      opis: product.opis || '',
    });
    setEditDialogOpen(true);
  };

  const filteredProducts = products.filter(product => 
    product.naziv.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.koda.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const productStats = {
    total: products.length,
    available: products.filter(p => p.na_voljo).length,
    outOfStock: products.filter(p => p.zaloga === 0).length,
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Dostop zavrnjen</h1>
        <p className="text-muted-foreground">Nimate dovoljenja za dostop do te strani.</p>
      </div>
    );
  }

  const ProductForm = ({ isEdit = false }) => (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Naziv</label>
          <Input
            value={formData.naziv}
            onChange={(e) => setFormData({ ...formData, naziv: e.target.value })}
            placeholder="Naziv izdelka"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Koda</label>
          <Input
            value={formData.koda}
            onChange={(e) => setFormData({ ...formData, koda: e.target.value })}
            placeholder="Koda izdelka"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Cena (€)</label>
          <Input
            type="number"
            value={formData.cena}
            onChange={(e) => setFormData({ ...formData, cena: e.target.value })}
            placeholder="0.00"
            step="0.01"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Popust (%)</label>
          <Input
            type="number"
            value={formData.popust}
            onChange={(e) => setFormData({ ...formData, popust: e.target.value })}
            placeholder="0"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Zaloga</label>
          <Input
            type="number"
            value={formData.zaloga}
            onChange={(e) => setFormData({ ...formData, zaloga: e.target.value })}
            placeholder="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Status</label>
          <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="novo">Novo</SelectItem>
              <SelectItem value="znizano">Znižano</SelectItem>
              <SelectItem value="prodano">Prodano</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Kategorija</label>
          <Select value={formData.kategorija_id} onValueChange={(value) => setFormData({ ...formData, kategorija_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Izberi kategorijo" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.naziv}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Barva</label>
          <Input
            value={formData.barva}
            onChange={(e) => setFormData({ ...formData, barva: e.target.value })}
            placeholder="Barva izdelka"
          />
        </div>
        <div>
          <label className="text-sm font-medium">SEO slug</label>
          <Input
            value={formData.seo_slug}
            onChange={(e) => setFormData({ ...formData, seo_slug: e.target.value })}
            placeholder="seo-slug-izdelka"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Slika izdelka</label>
        <ImageUpload
          value={formData.slika_url}
          onChange={(url) => setFormData({ ...formData, slika_url: url })}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Opis</label>
        <Textarea
          value={formData.opis}
          onChange={(e) => setFormData({ ...formData, opis: e.target.value })}
          placeholder="Opis izdelka"
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.na_voljo}
          onCheckedChange={(checked) => setFormData({ ...formData, na_voljo: checked })}
        />
        <label className="text-sm font-medium">Na voljo</label>
      </div>

      <div className="flex gap-2">
        <Button onClick={isEdit ? handleEdit : handleAdd} className="flex-1">
          {isEdit ? 'Posodobi' : 'Dodaj'} izdelek
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

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-8 flex items-center gap-2"
      >
        <Package className="h-8 w-8" />
        Upravljanje izdelkov
      </motion.h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skupaj izdelkov</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Na voljo</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productStats.available}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ni na zalogi</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productStats.outOfStock}</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Poišči izdelke..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setAddDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Dodaj izdelek
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Dodaj nov izdelek</DialogTitle>
            </DialogHeader>
            <ProductForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Izdelki ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Izdelek</TableHead>
                <TableHead>Cena</TableHead>
                <TableHead>Zaloga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Na voljo</TableHead>
                <TableHead>Dejanja</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img 
                        src={product.slika_url || '/placeholder.svg'} 
                        alt={product.naziv}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <div className="font-medium">{product.naziv}</div>
                        <div className="text-sm text-muted-foreground">{product.koda}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">€{product.cena.toFixed(2)}</div>
                      {product.popust && product.popust > 0 && (
                        <div className="text-sm text-green-600">-{product.popust}%</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.zaloga > 0 ? 'default' : 'destructive'}>
                      {product.zaloga} kos
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        product.status === 'novo' ? 'default' :
                        product.status === 'znizano' ? 'secondary' : 'destructive'
                      }
                    >
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={product.na_voljo}
                      onCheckedChange={(checked) => handleToggleAvailability(product.id, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
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
            <DialogTitle>Uredi izdelek</DialogTitle>
          </DialogHeader>
          <ProductForm isEdit={true} />
        </DialogContent>
      </Dialog>
    </div>
  );
}