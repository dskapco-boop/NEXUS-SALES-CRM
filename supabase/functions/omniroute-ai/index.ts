// OmniRoute AI Integration for Nexus CRM
// Routes all AI calls through local OmniRoute gateway (localhost:20128)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface AIRequest {
  action: string
  model?: string
  data: Record<string, any>
}

// AI prompts for different CRM operations
const PROMPTS: Record<string, string> = {
  lead_scoring: `
    You are a sales lead qualification assistant for a B2B trading and ISO consultancy company.
    Score this lead 1-100 for conversion likelihood.
    Consider: source, company size, industry relevance, estimated budget, urgency.
    Return only a number, no other text.
  `,
  
  sales_forecast: `
    You are a sales forecasting assistant. Based on the pipeline data provided,
    generate a 3-month sales forecast with confidence intervals.
    Return JSON format with monthly predictions.
  `,
  
  quote_optimization: `
    You are a sales optimization assistant. Review this quotation and suggest:
    1. Pricing adjustments for competitiveness
    2. Terms improvements
    3. Risk factors
    Return as structured JSON.
  `,
  
  email_drafting: `
    You are a professional sales email writer. Draft a concise, professional email
    based on the context provided. Keep it under 150 words.
  `,
  
  document_extraction: `
    You are a document analysis assistant. Extract structured data from the provided
    document text. Return JSON with appropriate fields for our CRM system.
    Fields to extract: company_name, contact_person, email, phone, product_interest,
    estimated_budget, urgency_level, delivery_requirements.
  `,
  
  iso_gap_analysis: `
    You are an ISO 9001:2015 compliance assistant. Analyze the provided audit
    findings and identify gaps in the quality management system.
    Rate each gap as critical, major, or minor. Suggest corrective actions.
  `,
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('OK', { headers: corsHeaders })
  }

  try {
    const payload: AIRequest = await req.json()
    const action = payload.action
    
    if (!PROMPTS[action]) {
      return new Response(
        JSON.stringify({ error: 'Unknown AI action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Connect to OmniRoute gateway
    const omniRouteUrl = Deno.env.get('OMNIROUTE_BASE_URL') || 'http://localhost:20128'
    const omniRouteKey = Deno.env.get('OMNIROUTE_API_KEY')
    const model = payload.model || Deno.env.get('OMNIROUTE_MODEL') || 'captian'
    
    if (!omniRouteKey) {
      throw new Error('OMNIROUTE_API_KEY not configured')
    }
    
    // Build the prompt based on action
    const userPrompt = buildPrompt(action, payload.data)
    const systemPrompt = PROMPTS[action]
    
    const response = await fetch(`${omniRouteUrl}/api/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${omniRouteKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: action === 'lead_scoring' ? 0.3 : 0.7,
        max_tokens: 2000,
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OmniRoute API error: ${response.status} ${errorText}`)
    }
    
    const aiResponse = await response.json()
    const content = aiResponse.choices?.[0]?.message?.content || ''
    
    // Parse response based on action
    let result: any
    if (action === 'lead_scoring') {
      const score = parseInt(content.trim())
      result = { score: isNaN(score) ? 50 : score }
    } else if (action === 'sales_forecast' || action === 'quote_optimization' || action === 'document_extraction' || action === 'iso_gap_analysis') {
      try {
        result = JSON.parse(content)
      } catch {
        result = { text: content, raw: true }
      }
    } else {
      result = { content: content.trim() }
    }
    
    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('AI integration error:', error)
    
    // Fall back to rule-based responses
    const fallbackResult = getFallbackResponse(payload.action, payload.data)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        result: fallbackResult,
        fallback: true,
        error: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function buildPrompt(action: string, data: Record<string, any>): string {
  switch (action) {
    case 'lead_scoring':
      return `
        Score this lead 1-100:
        Source: ${data.source || 'unknown'}
        Company: ${data.company || 'N/A'}
        Industry: ${data.industry || 'N/A'}
        Estimated Value: ${data.estimated_value || 'N/A'} AED
        Urgency: ${data.urgency || 'N/A'}
        Notes: ${data.notes || 'N/A'}
        Return only a number.
      `
    
    case 'sales_forecast':
      return `
        Generate a 3-month forecast based on this pipeline data:
        Leads: ${data.total_leads || 0} total, ${data.qualified_leads || 0} qualified
        Opportunities: ${JSON.stringify(data.opportunities || [])}
        Current pipeline value: ${data.pipeline_value || 0} AED
      `
    
    case 'quote_optimization':
      return `
        Review this quotation and suggest improvements:
        Total Amount: ${data.total_amount} ${data.currency}
        Line Items: ${JSON.stringify(data.line_items || [])}
        Customer: ${data.account_name || 'N/A'}
        Competitor: ${data.competitor || 'N/A'}
      `
    
    case 'email_drafting':
      return `
        Draft an email for: ${data.type}
        Customer: ${data.customer_name || 'N/A'}
        Subject: ${data.subject || 'Follow-up on your inquiry'}
        Key points: ${data.key_points || 'None provided'}
      `
    
    case 'document_extraction':
      return `
        Extract CRM data from this document:
        ${data.document_text || 'No text provided'}
      `
    
    case 'iso_gap_analysis':
      return `
        Analyze for ISO 9001:2015 compliance:
        Audit Findings: ${JSON.stringify(data.findings || [])}
        Company: ${data.company_name || 'N/A'}
        Standard: ${data.standard || 'ISO 9001:2015'}
      `
    
    default:
      return JSON.stringify(data)
  }
}

function getFallbackResponse(action: string, data: Record<string, any>): any {
  switch (action) {
    case 'lead_scoring':
      // Simple rule-based scoring
      let score = 50
      const sourceScores: Record<string, number> = {
        'website': 5, 'referral': 10, 'event': 8,
        'social_media': 7, 'advertisement': 6, 'cold_outreach': 3
      }
      score += sourceScores[data.source] || 0
      
      if (data.estimated_value) {
        if (data.estimated_value > 50000) score += 15
        else if (data.estimated_value > 10000) score += 10
        else if (data.estimated_value > 1000) score += 5
      }
      
      return { score: Math.max(1, Math.min(100, score)) }
    
    case 'email_drafting':
      return {
        content: `Thank you for your interest in our services. We will review your inquiry and get back to you shortly.\n\nBest regards,\n${data.sender_name || 'Nexus CRM Team'}`
      }
    
    case 'sales_forecast':
      return {
        months: [
          { month: 'Current', forecast: data.pipeline_value * 0.3, confidence: '70%' },
          { month: 'Next', forecast: data.pipeline_value * 0.2, confidence: '60%' },
          { month: 'Following', forecast: data.pipeline_value * 0.1, confidence: '50%' },
        ]
      }
    
    default:
      return { content: 'AI processing unavailable. Using fallback logic.', fallback: true }
  }
}
