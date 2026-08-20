import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface IsoAuditPayload {
  type: 'audit_created' | 'finding_added' | 'evidence_uploaded' | 'certification_updated'
  audit_id?: string
  client_id?: string
  data: Record<string, any>
}

Deno.serve(async (req) => {
  try {
    const payload: IsoAuditPayload = await req.json()
    
    switch (payload.type) {
      case 'audit_created':
        await handleAuditCreated(payload)
        break
      case 'finding_added':
        await handleFindingAdded(payload)
        break
      case 'evidence_uploaded':
        await handleEvidenceUploaded(payload)
        break
      case 'certification_updated':
        await handleCertificationUpdated(payload)
        break
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('ISO module error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function handleAuditCreated(payload: IsoAuditPayload) {
  if (!payload.audit_id) return
  
  // Create audit tasks for each finding type
  const tasks = [
    {
      title: `Gap analysis for ${payload.data.standard || 'ISO 9001'}`,
      related_type: 'iso_audit',
      related_id: payload.audit_id,
      type: 'task',
      priority: 'high',
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks
    },
    {
      title: `Schedule ${payload.data.type || 'internal'} audit`,
      related_type: 'iso_audit',
      related_id: payload.audit_id,
      type: 'task',
      priority: 'medium',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week
    },
  ]
  
  // Create tasks in activities table
  for (const task of tasks) {
    await supabase.from('activities').insert({
      ...task,
      description: 'Auto-generated task from ISO audit creation workflow',
    })
  }
  
  // Log to audit trail
  await supabase.from('audit_logs').insert({
    action: 'iso_audit_created',
    entity_type: 'iso_audit',
    entity_id: payload.audit_id,
    details: JSON.stringify({
      audit_type: payload.data.type,
      scheduled_date: payload.data.scheduled_date,
      tasks_created: tasks.length,
    }),
  })
}

async function handleFindingAdded(payload: IsoAuditPayload) {
  if (!payload.audit_id || !payload.data.finding) return
  
  const finding = payload.data.finding
  
  // Create a corrective action task
  const severity = finding.severity || 'minor'
  const dueDays = severity === 'critical' ? 7 : severity === 'major' ? 30 : 60
  
  await supabase.from('activities').insert({
    related_type: 'audit_finding',
    related_id: finding.id,
    type: 'task',
    subject: `Corrective action for finding: ${finding.description?.substring(0, 50)}...`,
    description: finding.corrective_action,
    priority: severity === 'critical' ? 'high' : severity === 'major' ? 'medium' : 'low',
    due_date: new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString(),
    assigned_to: finding.responsible_person,
    status: 'planned',
  })
  
  // Update audit status if needed
  await supabase.from('iso_audits').update({
    status: 'completed',
    updated_at: new Date().toISOString(),
  }).eq('id', payload.audit_id)
}

async function handleEvidenceUploaded(payload: IsoAuditPayload) {
  // This would trigger the Google Drive upload function
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/google-drive-upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'document_upload',
      document_type: 'iso_evidence',
      entity_type: 'evidence_document',
      entity_id: payload.data.document_id,
    }),
  })
  
  await response.json()
}

async function handleCertificationUpdated(payload: IsoAuditPayload) {
  if (!payload.client_id) return
  
  // Check if certification is expiring within 90 days
  const { data: client, error } = await supabase
    .from('iso_clients')
    .select('account_id, certification_status, audit_schedule')
    .eq('id', payload.client_id)
    .single()
  
  if (error || !client) return
  
  // Create renewal reminder task if expiring soon
  const auditSchedule = client.audit_schedule as any
  const nextAuditDate = auditSchedule?.next_surveillance
  
  if (nextAuditDate) {
    const daysUntilAudit = Math.ceil(
      (new Date(nextAuditDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysUntilAudit <= 90 && daysUntilAudit > 0) {
      await supabase.from('activities').insert({
        related_type: 'iso_client',
        related_id: payload.client_id,
        type: 'task',
        subject: `ISO recertification audit upcoming (${daysUntilAudit} days)`,
        description: `Client ${client.account_id} certification audit scheduled in ${daysUntilAudit} days`,
        priority: 'high',
        due_date: new Date(nextAuditDate).toISOString(),
        status: 'planned',
      })
    }
  }
}
