import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { signIn, signUp, user, loading } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'register'>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  );
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    ime: '',
    priimek: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError(t('auth.requiredField'));
      return false;
    }

    if (mode === 'register') {
      if (!formData.ime || !formData.priimek) {
        setError(t('auth.requiredField'));
        return false;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setError(t('auth.passwordMismatch'));
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        const { error: signInError } = await signIn(formData.email, formData.password);
        if (signInError) {
          setError(signInError);
        } else {
          navigate('/');
        }
      } else {
        const { error: signUpError } = await signUp(
          formData.email,
          formData.password,
          formData.ime,
          formData.priimek
        );
        if (signUpError) {
          setError(signUpError);
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError(t('errors.general'));
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {mode === 'login' ? t('auth.login') : t('auth.register')}
            </CardTitle>
            <CardDescription>
              {mode === 'login' 
                ? 'Prijavite se v svoj račun'
                : 'Ustvarite nov račun'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ime">{t('auth.firstName')}</Label>
                    <Input
                      id="ime"
                      name="ime"
                      type="text"
                      value={formData.ime}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priimek">{t('auth.lastName')}</Label>
                    <Input
                      id="priimek"
                      name="priimek"
                      type="text"
                      value={formData.priimek}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading 
                  ? t('common.loading')
                  : mode === 'login' 
                    ? t('auth.loginButton') 
                    : t('auth.registerButton')
                }
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="link"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-sm"
              >
                {mode === 'login' 
                  ? t('auth.noAccount') + ' ' + t('auth.register')
                  : t('auth.hasAccount') + ' ' + t('auth.login')
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}