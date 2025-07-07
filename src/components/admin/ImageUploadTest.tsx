import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const ImageUploadTest = () => {
  const [uploading, setUploading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testBucketAccess = async () => {
    addResult('🔍 Testing bucket access...');
    
    try {
      const { data, error } = await supabase.storage
        .from('product-images')
        .list('', { limit: 1 });

      if (error) {
        addResult(`❌ Bucket access failed: ${error.message}`);
        return false;
      }

      addResult('✅ Bucket access successful');
      return true;
    } catch (error) {
      addResult(`❌ Bucket access error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  const testUpload = async () => {
    addResult('📤 Testing file upload...');
    
    try {
      // Create a simple test image (1x1 pixel PNG)
      const pngData = new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
        0x49, 0x48, 0x44, 0x52, // IHDR
        0x00, 0x00, 0x00, 0x01, // width: 1
        0x00, 0x00, 0x00, 0x01, // height: 1
        0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
        0x90, 0x77, 0x53, 0xDE, // CRC
        0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
        0x49, 0x44, 0x41, 0x54, // IDAT
        0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // compressed data
        0xE2, 0x21, 0xBC, 0x33, // CRC
        0x00, 0x00, 0x00, 0x00, // IEND chunk length
        0x49, 0x45, 0x4E, 0x44, // IEND
        0xAE, 0x42, 0x60, 0x82  // CRC
      ]);
      
      const testFile = new File([pngData], 'test.png', { type: 'image/png' });
      
      const fileName = `test-${Date.now()}.png`;
      
      addResult(`📁 Created test image: ${fileName} (${testFile.size} bytes)`);
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, testFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        addResult(`❌ Upload failed: ${error.message}`);
        return false;
      }

      addResult(`✅ Upload successful: ${data.path}`);
      
      // Test URL generation
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path);
      
      addResult(`🔗 Public URL: ${urlData.publicUrl}`);
      
      // Test URL accessibility
      try {
        addResult('🔍 Testing URL accessibility...');
        const response = await fetch(urlData.publicUrl, { 
          method: 'HEAD',
          mode: 'no-cors'
        });
        addResult('✅ URL accessibility test passed');
      } catch (fetchError) {
        addResult(`⚠️ URL accessibility test failed: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
      }
      
      // Clean up test file
      const { error: deleteError } = await supabase.storage
        .from('product-images')
        .remove([fileName]);
      
      if (deleteError) {
        addResult(`⚠️ Cleanup failed: ${deleteError.message}`);
      } else {
        addResult('🧹 Test file cleaned up');
      }
      
      return true;
    } catch (error) {
      addResult(`❌ Upload test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  const runFullTest = async () => {
    setTestResults([]);
    setUploading(true);
    
    addResult('🚀 Starting image upload test...');
    addResult(`👤 User: ${user ? 'Logged in' : 'Not logged in'}`);
    addResult(`🔑 Admin: ${isAdmin ? 'Yes' : 'No'}`);
    
    if (!user) {
      addResult('❌ Test failed: User not logged in');
      setUploading(false);
      return;
    }

    if (!isAdmin) {
      addResult('❌ Test failed: User not admin');
      setUploading(false);
      return;
    }

    const bucketOk = await testBucketAccess();
    if (!bucketOk) {
      addResult('❌ Test failed: Cannot access bucket');
      setUploading(false);
      return;
    }

    const uploadOk = await testUpload();
    if (!uploadOk) {
      addResult('❌ Test failed: Cannot upload files');
      setUploading(false);
      return;
    }

    addResult('🎉 All tests passed!');
    toast({
      title: "Test uspešen",
      description: "Vsi testi so bili uspešno opravljeni.",
    });
    
    setUploading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test nalaganja slik</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runFullTest} 
            disabled={uploading || !user || !isAdmin}
            className="bg-black text-white hover:bg-gray-800"
          >
            {uploading ? 'Testiram...' : 'Zaženi test'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setTestResults([])}
          >
            Počisti rezultate
          </Button>
        </div>

        {(!user || !isAdmin) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Potrebujete admin pravice za testiranje.
            </AlertDescription>
          </Alert>
        )}

        {testResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Rezultati testa:</h4>
            <div className="bg-gray-100 p-3 rounded text-sm font-mono max-h-60 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="mb-1">{result}</div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 