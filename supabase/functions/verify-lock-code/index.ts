import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Store the correct code in environment variable (more secure than hardcoded)
const CORRECT_CODE = Deno.env.get('LOCK_SCREEN_CODE') || '123456'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { code } = await req.json()

    if (!code) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Koda je obvezna'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      })
    }

    // Add rate limiting check (simple implementation)
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const rateLimitKey = `lock_attempts_${clientIP}`
    
    // In a real implementation, you'd use Redis or database for rate limiting
    // For now, we'll just validate the code
    
    const isValid = code === CORRECT_CODE

    if (isValid) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Koda je pravilna'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      })
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Napačna koda'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 401
      })
    }

  } catch (error) {
    console.error('Error verifying lock code:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Napaka pri preverjanju kode'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    })
  }
}) 