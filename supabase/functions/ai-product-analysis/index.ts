
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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

    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a prompt based on existing data and image
    let prompt = `Analyze this product image and suggest values for empty fields. Here's what we know:`;
    
    if (existingData.naziv) prompt += `\nProduct name: ${existingData.naziv}`;
    if (existingData.koda) prompt += `\nProduct code: ${existingData.koda}`;
    if (existingData.cena) prompt += `\nPrice: €${existingData.cena}`;
    if (existingData.barva) prompt += `\nColor: ${existingData.barva}`;
    if (existingData.opis) prompt += `\nDescription: ${existingData.opis}`;

    prompt += `\n\nPlease analyze the image and provide suggestions for the following empty fields in Slovenian language:`;
    if (!existingData.naziv) prompt += `\n- naziv (product name)`;
    if (!existingData.barva) prompt += `\n- barva (color)`;
    if (!existingData.opis) prompt += `\n- opis (description - max 200 characters)`;
    if (!existingData.masa) prompt += `\n- masa (estimated weight in kg)`;
    if (!existingData.seo_slug) prompt += `\n- seo_slug (URL-friendly slug)`;

    prompt += `\n\nReturn ONLY a valid JSON object with suggested values for empty fields. Example format:
{
  "naziv": "suggested name",
  "barva": "suggested color",
  "opis": "suggested description",
  "masa": "0.5",
  "seo_slug": "suggested-slug"
}`;

    const messages = [
      { 
        role: 'system', 
        content: 'You are a product analyst. Analyze product images and suggest appropriate field values in Slovenian language. Return only valid JSON.' 
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }
    ];

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

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Try to parse the JSON response
    let suggestions;
    try {
      suggestions = JSON.parse(aiResponse);
    } catch {
      // If parsing fails, return a fallback response
      suggestions = { error: 'Could not parse AI response' };
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-product-analysis function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
