import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  record: Record<string, any>
  table: string
  schema: string
}

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json()
  
  // Handle different table triggers
  switch (payload.table) {
    case 'leads':
      return await handleLeadEvent(payload)
    case 'quotations':
      return await handleQuotationEvent(payload)
    case 'sales_orders':
      return await handleOrderEvent(payload)
    case 'invoices':
      return await handleInvoiceEvent(payload)
    default:
      return new Response('OK', { status: 200 })
  }
})

async function handleLeadEvent(payload: WebhookPayload) {
  if (payload.type === 'INSERT') {
    const lead = payload.record
    
    // Auto-score the lead using OmniRoute AI
    if (lead.score === 0 || !lead.score) {
      const aiScore = await calculateLeadScore(lead)
      
      await supabase
        .from('leads')
        .update({ score: aiScore })
        .eq('id', lead.id)
    }
    
    // Create initial activity record
    await supabase
      .from('activities')
      .insert({
        related_type: 'lead',
        related_id: lead.id,
        type: 'note',
        subject: 'Lead created',
        description: `New lead from ${lead.source}`,
        owner_id: lead.owner_id,
        status: 'completed',
      })
  }
  
  return new Response('OK', { status: 200 })
}

async function handleQuotationEvent(payload: WebhookPayload) {
  if (payload.type === 'INSERT') {
    const quote = payload.record
    
    // Auto-generate quote number
    if (!quote.quote_number || quote.quote_number.startsWith('TMP')) {
      const year = new Date().getFullYear()
      const { data: lastQuote } = await supabase
        .from('quotations')
        .select('quote_number')
        .like('quote_number', `QUO-${year}-%`)
        .order('quote_number', { ascending: false })
        .limit(1)
        .single()
      
      const lastNum = lastQuote?.quote_number 
        ? parseInt(lastQuote.quote_number.split('-').pop() || '0') + 1 
        : 1
      const newQuoteNumber = `QUO-${year}-${lastNum.toString().padStart(4, '0')}`
      
      await supabase
        .from('quotations')
        .update({ quote_number: newQuoteNumber })
        .eq('id', quote.id)
    }
    
    // Calculate totals
    if (quote.line_items && Array.isArray(quote.line_items)) {
      const subtotal = quote.line_items.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.unit_price), 0)
      const discountAmount = (subtotal * (quote.discount_percent || 0)) / 100
      const taxableAmount = subtotal - discountAmount
      const taxAmount = (taxableAmount * (quote.tax_rate || 5)) / 100
      const totalAmount = subtotal - discountAmount + taxAmount
      
      await supabase
        .from('quotations')
        .update({
          subtotal,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          total_amount: totalAmount,
        })
        .eq('id', quote.id)
    }
  }
  
  return new Response('OK', { status: 200 })
}

async function handleOrderEvent(payload: WebhookPayload) {
  if (payload.type === 'INSERT') {
    const order = payload.record
    
    // Auto-generate order number based on type
    if (!order.order_number || order.order_number.startsWith('TMP')) {
      const prefix = order.type === 'supply' ? 'SO' : 
                     order.type === 'service' ? 'SVC' : 'PRJ'
      const year = new Date().getFullYear()
      
      const { data: lastOrder } = await supabase
        .from('sales_orders')
        .select('order_number')
        .like('order_number', `${prefix}-${year}-%`)
        .order('order_number', { ascending: false })
        .limit(1)
        .single()
      
      const lastNum = lastOrder?.order_number 
        ? parseInt(lastOrder.order_number.split('-').pop() || '0') + 1 
        : 1
      const newOrderNumber = `${prefix}-${year}-${lastNum.toString().padStart(4, '0')}`
      
      await supabase
        .from('sales_orders')
        .update({ order_number: newOrderNumber })
        .eq('id', order.id)
    }
  }
  
  return new Response('OK', { status: 200 })
}

async function handleInvoiceEvent(payload: WebhookPayload) {
  if (payload.type === 'INSERT') {
    const invoice = payload.record
    
    // Auto-generate invoice number
    if (!invoice.invoice_number || invoice.invoice_number.startsWith('TMP')) {
      const year = new Date().getFullYear()
      const { data: lastInvoice } = await supabase
        .from('invoices')
        .select('invoice_number')
        .like('invoice_number', `INV-${year}-%`)
        .order('invoice_number', { ascending: false })
        .limit(1)
        .single()
      
      const lastNum = lastInvoice?.invoice_number 
        ? parseInt(lastInvoice.invoice_number.split('-').pop() || '0') + 1 
        : 1
      const newInvoiceNumber = `INV-${year}-${lastNum.toString().padStart(4, '0')}`
      
      await supabase
        .from('invoices')
        .update({ invoice_number: newInvoiceNumber })
        .eq('id', invoice.id)
    }
  }
  
  return new Response('OK', { status: 200 })
}

// AI-powered lead scoring using OmniRoute
async function calculateLeadScore(lead: any): Promise<number> {
  try {
    const omniRouteKey = Deno.env.get('OMNIROUTE_API_KEY')
    const omniRouteUrl = Deno.env.get('OMNIROUTE_BASE_URL') || 'http://localhost:20128'
    
    if (!omniRouteKey) {
      // Fallback scoring without AI
      return calculateLeadScoreFallback(lead)
    }
    
    const prompt = `
      Score this sales lead on a scale of 0-100 for conversion likelihood.
      Consider these factors:
      - Lead source: ${lead.source || 'unknown'}
      - Company: ${lead.company || 'N/A'}
      - Industry: ${lead.industry || 'N/A'}
      - Estimated value: ${lead.estimated_value || 'N/A'} AED
      - Urgency: ${lead.urgency || 'N/A'}
      
      Return only a number between 1 and 100. No other text.
    `
    
    const response = await fetch(`${omniRouteUrl}/api/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${omniRouteKey}`,
      },
      body: JSON.stringify({
        model: 'captian',
        messages: [
          { role: 'system', content: 'You are a sales lead qualification assistant.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 10,
      }),
    })
    
    if (!response.ok) {
      throw new Error(`OmniRoute API error: ${response.status}`)
    }
    
    const result = await response.json()
    const score = parseInt(result.choices?.[0]?.message?.content?.trim() || '')
    return isNaN(score) ? calculateLeadScoreFallback(lead) : Math.max(1, Math.min(100, score))
  } catch (error) {
    console.error('Error calling OmniRoute for lead scoring:', error)
    return calculateLeadScoreFallback(lead)
  }
}

// Fallback scoring when AI is unavailable
function calculateLeadScoreFallback(lead: any): number {
  let score = 50
  
  // Boost score based on source
  const sourceScores: Record<string, number> = {
    'website': 5,
    'referral': 10,
    'event': 8,
    'social_media': 7,
    'advertisement': 6,
    'cold_outreach': 3,
    'other': 0,
  }
  score += sourceScores[lead.source] || 0
  
  // Boost for budget
  if (lead.estimated_value) {
    if (lead.estimated_value > 10000) score += 15
    else if (lead.estimated_value > 5000) score += 10
    else if (lead.estimated_value > 1000) score += 5
  }
  
  // Boost for urgency
  const urgencyScores: Record<string, number> = {
    'urgent': 15,
    'high': 10,
    'medium': 5,
    'low': 0,
  }
  score += urgencyScores[lead.urgency] || 0
  
  return Math.max(1, Math.min(100, score))
}
