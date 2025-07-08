import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    // Get order ID from URL params
    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Order ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    // Check if user is admin
    const { data: profile, error: profileError } = await supabase.from('profiles').select('vloga').eq('user_id', user.id).single();
    if (profileError) {
      return new Response(JSON.stringify({ error: 'Error checking user permissions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const isAdmin = profile?.vloga === 'admin';
    // Get order details - admin can access any order, others only their own
    let orderQuery = supabase.from('narocila').select('*').eq('id', orderId);
    if (!isAdmin) {
      orderQuery = orderQuery.eq('uporabnik_id', user.id);
    }
    const { data: order, error: orderError } = await orderQuery.single();
    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    // Generate PDF content
    const invoiceNumber = `INV-${order.datum.slice(0, 10).replace(/-/g, '')}-${order.id.slice(-6)}`;
    const invoiceDate = new Date(order.datum).toLocaleDateString('sl-SI', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    // Parse artikli
    const artikli = typeof order.artikli === 'string' ? JSON.parse(order.artikli) : order.artikli;
    // Calculate totals - DDV is already included in prices
    const totalWithVat = order.skupna_cena;
    const netValue = totalWithVat / 1.22;
    const vatAmount = totalWithVat - netValue;
    // Create HTML for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Račun | Slolan</title>
    <link rel="icon" type="image/png" href="https://www.slolan.com/logo.png">
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; line-height: 1.4; }
        .header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: start; }
        .company-info h1 { color: #2563eb; margin: 0 0 10px 0; font-size: 28px; }
        .company-info p { margin: 2px 0; color: #666; }
        .invoice-info { text-align: right; }
        .invoice-info h2 { color: #2563eb; margin: 0 0 10px 0; font-size: 24px; }
        .invoice-details { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .customer-info { margin: 30px 0; }
        .customer-info h3 { color: #2563eb; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 15px; }
        .items-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
        .items-table th { background: #2563eb; color: white; padding: 12px; text-align: left; border: 1px solid #ddd; }
        .items-table td { padding: 10px 12px; border: 1px solid #ddd; }
        .items-table tr:nth-child(even) { background: #f8fafc; }
        .total-section { margin-top: 30px; text-align: right; }
        .total-row { padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .total-row.final { font-weight: bold; font-size: 18px; color: #2563eb; border-bottom: 3px solid #2563eb; padding: 15px 0; }
        .business-notice { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 30px 0; font-weight: bold; color: #92400e; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-info">
            <h1>SIVAR D.O.O.</h1>
            <p>Ložice 8</p>
            <p>5210 Deskle, Slovenija</p>
            <p>Matična številka: 3507939000</p>
            <p>DDV ID: SI23998547</p>
            <p>TRR: SI56 1910 0001 0297 574</p>
            <p>Tel: +386 040 232500</p>
            <p>Email: loziceprodaja@gmail.com</p>
        </div>
        <div class="invoice-info">
            <h2>RAČUN</h2>
            <p><strong>Št.: ${invoiceNumber}</strong></p>
            <p>Datum: ${invoiceDate}</p>
        </div>
    </div>

    <div class="customer-info">
        <h3>Podatki kupca:</h3>
        ${order.customer_type === 'business' ? `
        <p><strong>${order.company_name}</strong></p>
        <p>${order.company_address}</p>
        <p>DDV ID: ${order.company_vat}</p>
        <p>Email: ${order.company_email}</p>
        ` : `
        <p><strong>Fizična oseba</strong></p>
        <p>${order.naslov_dostave}</p>
        <p>Tel: ${order.telefon_kontakt}</p>
        `}
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th>Opis</th>
                <th>Koda</th>
                <th>Količina</th>
                <th>Cena/kom</th>
                <th>Skupaj</th>
            </tr>
        </thead>
        <tbody>
            ${artikli.map((item)=>`
            <tr>
                <td>${item.naziv}${item.selected_variant ? ` (${item.selected_variant.color_name})` : ''}</td>
                <td>${item.koda}</td>
                <td>${item.quantity}</td>
                <td>€${item.final_price.toFixed(2)}</td>
                <td>€${(item.final_price * item.quantity).toFixed(2)}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>

    ${order.customer_type === 'business' ? `
    <div class="business-notice">
        ⚠️ Kupec je pravna oseba – prikazana je neto vrednost brez DDV v skladu s 1. točko 94. člena ZDDV-1
    </div>
    ` : ''}

    <div class="total-section">
        <div class="total-row">
            <span>Neto vrednost: €${netValue.toFixed(2)}</span>
        </div>
        ${order.customer_type === 'personal' ? `
        <div class="total-row">
            <span>DDV (22%): €${vatAmount.toFixed(2)}</span>
        </div>
        ` : ''}
        <div class="total-row final">
            <span>SKUPAJ ZA PLAČILO: €${totalWithVat.toFixed(2)}</span>
        </div>
    </div>

    <div class="footer">
        <p>Hvala za vaš nakup! | SIVAR D.O.O. | www.slolan.com</p>
        <p>Ta račun je bil avtomatsko generiran ${new Date().toLocaleString('sl-SI')}</p>
    </div>
</body>
</html>`;

    return new Response(htmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="racun-${invoiceNumber}.html"`
      }
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});