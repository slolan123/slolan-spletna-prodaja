import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';

export const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-black text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">
              Slolan
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Profesionalna spletna trgovina za kakovostne izdelke po konkurenčnih cenah. 
              Vaš zaupanja vreden partner za nakupovanje.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Nakupovanje</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/categories" className="text-gray-300 hover:text-white transition-colors">
                  Kategorije
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-gray-300 hover:text-white transition-colors">
                  Vsi izdelki
                </Link>
              </li>
              <li>
                <Link to="/products?status=novo" className="text-gray-300 hover:text-white transition-colors">
                  Novi izdelki
                </Link>
              </li>
              <li>
                <Link to="/products?status=znizano" className="text-gray-300 hover:text-white transition-colors">
                  Akcijske ponudbe
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Podpora</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Pogoji poslovanja
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Zasebnost
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Dostava in vračila
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Pogosta vprašanja
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Kontakt</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3 text-gray-300">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>loziceprodaja@gmail.com</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>+386 040 232500</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>Ložice 8, 5210 Deskle</span>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                <p>SIVAR D.O.O.</p>
                <p>Matična: 3507939000</p>
                <p>DDV: SI23998547</p>
                <p>TRR: SI56 1910 0001 0297 574</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-sm text-gray-400">
            &copy; 2024 Slolan. Vse pravice pridržane. | Izdelano z ❤️ v Sloveniji
          </p>
        </div>
      </div>
    </footer>
  );
};
