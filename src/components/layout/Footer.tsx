
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-semibold text-primary mb-4">
              Slolan
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Profesionalna trgovina za zasežene predmete z velikimi količinami in konkurenčnimi cenami.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">{t('common.more')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/categories" className="text-muted-foreground hover:text-primary transition-colors">
                  {t('nav.categories')}
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-muted-foreground hover:text-primary transition-colors">
                  {t('nav.products')}
                </Link>
              </li>
              <li>
                <Link to="/products?status=novo" className="text-muted-foreground hover:text-primary transition-colors">
                  {t('products.newProducts')}
                </Link>
              </li>
              <li>
                <Link to="/products?status=znizano" className="text-muted-foreground hover:text-primary transition-colors">
                  {t('products.discountedProducts')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-4">{t('nav.categories')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/categories/elektronika" className="text-muted-foreground hover:text-primary transition-colors">
                  {t('categories.electronics')}
                </Link>
              </li>
              <li>
                <Link to="/categories/oblacila" className="text-muted-foreground hover:text-primary transition-colors">
                  {t('categories.clothing')}
                </Link>
              </li>
              <li>
                <Link to="/categories/nakit" className="text-muted-foreground hover:text-primary transition-colors">
                  {t('categories.jewelry')}
                </Link>
              </li>
              <li>
                <Link to="/categories/vozila" className="text-muted-foreground hover:text-primary transition-colors">
                  {t('categories.vehicles')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Kontakt</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Email: info@slolan.si</p>
              <p>Telefon: +386 1 234 5678</p>
              <p>Naslov: Ljubljana, Slovenija</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Slolan. Vse pravice pridržane.</p>
        </div>
      </div>
    </footer>
  );
};
