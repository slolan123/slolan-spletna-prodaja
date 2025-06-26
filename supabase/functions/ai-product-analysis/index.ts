
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, existingData } = await req.json();
    
    console.log('AI analysis request received');
    console.log('Image URL:', imageUrl);
    console.log('Existing data:', existingData);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    console.log('Environment check:');
    console.log('OPENAI_API_KEY exists:', !!openAIApiKey);
    console.log('OPENAI_API_KEY length:', openAIApiKey ? openAIApiKey.length : 0);
    console.log('OPENAI_API_KEY starts with sk-:', openAIApiKey ? openAIApiKey.startsWith('sk-') : false);

    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment');
      return new Response(
        JSON.stringify({ error: 'OpenAI API ključ ni nastavljen v Supabase Secrets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Test API key validity with a simple request first
    console.log('Testing API key validity...');
    const testResponse = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('API key test response status:', testResponse.status);
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('API key test failed:', errorText);
      return new Response(
        JSON.stringify({ error: 'OpenAI API ključ je neveljaven. Preverite nastavitve.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('API key is valid, proceeding with image analysis...');

    // Create a prompt based on existing data and image
    let prompt = `Analiziraj to sliko izdelka in predlagaj vrednosti za prazna polja. Tukaj je to, kar že vemo:`;
    
    if (existingData.naziv) prompt += `\nNaziv izdelka: ${existingData.naziv}`;
    if (existingData.koda) prompt += `\nKoda izdelka: ${existingData.koda}`;
    if (existingData.cena) prompt += `\nCena: €${existingData.cena}`;
    if (existingData.barva) prompt += `\nBarva: ${existingData.barva}`;
    if (existingData.opis) prompt += `\nOpis: ${existingData.opis}`;

    prompt += `\n\nProsim analiziraj sliko in podaj predloge za naslednja prazna polja v slovenščini:`;
    if (!existingData.naziv) prompt += `\n- naziv (ime izdelka)`;
    if (!existingData.barva) prompt += `\n- barva (barva izdelka)`;
    if (!existingData.opis) prompt += `\n- opis (kratek opis izdelka - največ 200 znakov)`;
    if (!existingData.masa) prompt += `\n- masa (ocenjena teža v kg)`;
    if (!existingData.seo_slug) prompt += `\n- seo_slug (URL-prijazna povezava)`;

    prompt += `\n\nVrni SAMO veljaven JSON objekt s predlaganimi vrednostmi za prazna polja. Primer formata:
{
  "naziv": "predlagani naziv",
  "barva": "predlagana barva", 
  "opis": "predlagan opis",
  "masa": "0.5",
  "seo_slug": "predlagan-slug"
}`;

    const messages = [
      { 
        role: 'system', 
        content: 'Si strokovnjak za analizo izdelkov. Analiziraj slike izdelkov in predlagaj ustrezne vrednosti polj v slovenščini. Vrni samo veljaven JSON.' 
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }
    ];

    console.log('Sending request to OpenAI API with model gpt-4o-mini...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    console.log('OpenAI API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      let errorMessage = `OpenAI API napaka: ${response.status}`;
      if (response.status === 401) {
        errorMessage = 'Napačen OpenAI API ključ. Preverite nastavitve v Supabase Secrets.';
      } else if (response.status === 429) {
        errorMessage = 'Preveč zahtev na OpenAI API. Poskusite kasneje.';
      } else if (response.status === 400) {
        errorMessage = 'Napačna zahteva na OpenAI API. Preverite sliko in podatke.';
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('OpenAI API response received');
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (!data.choices || data.choices.length === 0) {
      console.error('No choices in OpenAI response');
      return new Response(
        JSON.stringify({ error: 'Ni odgovora od OpenAI API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const aiResponse = data.choices[0].message.content;
    console.log('AI response content:', aiResponse);

    // Try to parse the JSON response
    let suggestions;
    try {
      suggestions = JSON.parse(aiResponse);
      console.log('Parsed suggestions:', suggestions);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw AI response:', aiResponse);
      
      // Try to extract JSON from the response if it's wrapped in text
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          suggestions = JSON.parse(jsonMatch[0]);
          console.log('Extracted and parsed suggestions:', suggestions);
        } catch (extractError) {
          console.error('Failed to extract JSON:', extractError);
          return new Response(
            JSON.stringify({ error: 'Napaka pri razčlenjevanju AI odgovora' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ error: 'AI odgovor ni v JSON formatu' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Returning successful response with suggestions');
    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-product-analysis function:', error);
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({ 
      error: `Napaka pri AI analizi: ${error.message}` 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
