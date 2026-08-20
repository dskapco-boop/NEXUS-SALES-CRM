import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jwtOAuth2Client } from 'https://esm.sh/google-auth-library@9'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface UploadPayload {
  document_type: 'invoice' | 'completion_report' | 'quotation' | 'order' | 'iso_evidence' | 'audit_report'
  document_id: string
  entity_type: 'invoice' | 'completion_report' | 'quotation' | 'sales_order' | 'lead' | 'account'
  entity_id: string
  folder_name?: string
}

// Google Drive folder structure for ISO 9001 QMS compliance
const QMS_FOLDERS: Record<string, string> = {
  invoices: Deno.env.get('GOOGLE_DRIVE_INVOICES_FOLDER_ID') || '',
  reports: Deno.env.get('GOOGLE_DRIVE_REPORTS_FOLDER_ID') || '',
  quotations: Deno.env.get('GOOGLE_DRIVE_QUOTES_FOLDER_ID') || '',
  orders: Deno.env.get('GOOGLE_DRIVE_ORDERS_FOLDER_ID') || '',
  iso_evidence: Deno.env.get('GOOGLE_DRIVE_QMS_FOLDER_ID') || '',
  audit_reports: Deno.env.get('GOOGLE_DRIVE_AUDITS_FOLDER_ID') || '',
}

Deno.serve(async (req) => {
  try {
    const payload: UploadPayload = await req.json()
    
    // Get the document data from Supabase
    const { data: documentData, error: fetchError } = await supabase
      .from(payload.entity_type + 's')
      .select('*')
      .eq('id', payload.entity_id)
      .single()
    
    if (fetchError) throw fetchError
    
    // Generate document content
    let content: string
    let fileName: string
    
    switch (payload.document_type) {
      case 'invoice':
        content = generateInvoiceContent(documentData)
        fileName = `INV-${documentData.invoice_number}.pdf`
        if (payload.document_id) {
          await supabase
            .from('invoices')
            .update({ 
              sent_to_google_drive: true,
              google_drive_file_id: fileName,
              sent_at: new Date().toISOString() 
            })
            .eq('id', payload.entity_id)
        }
        break
      
      case 'completion_report':
        content = generateCompletionReportContent(documentData)
        fileName = `COMPREPORT-${payload.entity_id.substring(0, 8)}.pdf`
        await supabase
          .from('completion_reports')
          .update({ signoff_status: 'signed' })
          .eq('id', payload.entity_id)
        break
      
      case 'quotation':
        content = generateQuotationContent(documentData)
        fileName = `QUO-${documentData.quote_number}.pdf`
        break
      
      case 'order':
        content = generateOrderContent(documentData)
        fileName = `ORD-${payload.entity_id.substring(0, 8)}.pdf`
        break
      
      case 'iso_evidence':
        content = generateIsoEvidenceContent(documentData)
        fileName = `EVIDENCE-${payload.entity_id.substring(0, 8)}.pdf`
        break
      
      case 'audit_report':
        content = generateAuditReportContent(documentData)
        fileName = `AUDIT-${payload.entity_id.substring(0, 8)}.pdf`
        break
      
      default:
        content = JSON.stringify(documentData, null, 2)
        fileName = `${payload.entity_type}-${payload.entity_id.substring(0, 8)}.pdf`
    }
    
    // Upload to Google Drive
    const folderId = getFolderId(payload.document_type)
    const fileId = await uploadToGoogleDrive(fileName, content, folderId)
    
    // Log the upload in audit trail
    await supabase
      .from('audit_logs')
      .insert({
        user_id: documentData.created_by || documentData.owner_id,
        action: 'document_upload',
        entity_type: payload.entity_type,
        entity_id: payload.entity_id,
        details: JSON.stringify({
          document_type: payload.document_type,
          file_name: fileName,
          google_drive_id: fileId,
          folder: Object.keys(QMS_FOLDERS).find(k => QMS_FOLDERS[k] === folderId) || 'general',
        }),
      })
    
    return new Response(
      JSON.stringify({ success: true, file_id: fileId, file_name: fileName }),
      { headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error uploading to Google Drive:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

function getFolderId(documentType: string): string {
  // Map document type to appropriate folder
  const mapping: Record<string, string> = {
    'invoice': 'invoices',
    'completion_report': 'reports',
    'quotation': 'quotations',
    'order': 'orders',
    'iso_evidence': 'iso_evidence',
    'audit_report': 'audit_reports',
  }
  
  return QMS_FOLDERS[mapping[documentType]] || ''
}

function generateInvoiceContent(invoice: any): string {
  return `
    <html>
      <head><title>Invoice ${invoice.invoice_number}</title></head>
      <body>
        <h1>INVOICE</h1>
        <h2>${invoice.invoice_number}</h2>
        <p>Date: ${invoice.invoice_date}</p>
        <p>Due Date: ${invoice.due_date}</p>
        <p>Amount: ${invoice.currency} ${invoice.total_amount}</p>
        <p>Status: ${invoice.status}</p>
        <hr/>
        <p>This document has been automatically uploaded to Google Drive as part of the Nexus CRM QMS documentation system.</p>
        <p>ISO 9001:2015 compliant document control</p>
      </body>
    </html>
  `
}

function generateCompletionReportContent(report: any): string {
  return `
    <html>
      <head><title>Completion Report ${report.id}</title></head>
      <body>
        <h1>COMPLETION REPORT</h1>
        <h2>${report.report_title}</h2>
        <p>Signed: ${report.signoff_date || 'Pending'}</p>
        <p>Status: ${report.signoff_status}</p>
        <hr/>
        <h3>Delivery Details</h3>
        <p>${report.delivery_details}</p>
        <h3>Scope Delivered</h3>
        <p>${report.scope_delivered}</p>
        <h3>Client Feedback</h3>
        <p>${report.client_feedback}</p>
        <hr/>
        <p>ISO 9001:2015 compliant document - automatically stored in QMS</p>
      </body>
    </html>
  `
}

function generateQuotationContent(quote: any): string {
  return `
    <html>
      <head><title>Quotation ${quote.quote_number}</title></head>
      <body>
        <h1>QUOTATION</h1>
        <h2>${quote.quote_number}</h2>
        <p>Date: ${quote.quote_date}</p>
        <p>Valid Until: ${quote.valid_until}</p>
        <p>Total: ${quote.currency} ${quote.total_amount}</p>
        <p>Status: ${quote.status}</p>
        <hr/>
        <p>ISO 9001:2015 compliant document - automatically stored in QMS</p>
      </body>
    </html>
  `
}

function generateOrderContent(order: any): string {
  return `
    <html>
      <head><title>Order ${order.order_number}</title></head>
      <body>
        <h1>SALES ORDER</h1>
        <h2>${order.order_number}</h2>
        <p>Date: ${order.order_date}</p>
        <p>Status: ${order.status}</p>
        <p>Total: ${order.currency} ${order.total_amount}</p>
        <hr/>
        <p>ISO 9001:2015 compliant document - automatically stored in QMS</p>
      </body>
    </html>
  `
}

function generateIsoEvidenceContent(evidence: any): string {
  return `
    <html>
      <head><title>Evidence Document</title></head>
      <body>
        <h1>DOCUMENT OF CONFORMANCE EVIDENCE</h1>
        <h2>${evidence.title}</h2>
        <p>Type: ${evidence.document_type}</p>
        <p>Version: ${evidence.version}</p>
        <p>Uploaded: ${evidence.uploaded_at}</p>
        <p>Access Log: ${JSON.stringify(evidence.access_log)}</p>
        <hr/>
        <p>ISO 9001:2015 compliant evidence document - automatically stored in QMS</p>
      </body>
    </html>
  `
}

function generateAuditReportContent(audit: any): string {
  return `
    <html>
      <head><title>Audit Report ${audit.id}</title></head>
      <body>
        <h1>AUDIT REPORT</h1>
        <p>Date: ${audit.scheduled_date || audit.actual_date}</p>
        <p>Type: ${audit.type}</p>
        <p>Auditor: ${audit.auditor}</p>
        <p>Status: ${audit.status}</p>
        <hr/>
        <p>ISO 9001:2015 compliant audit record - automatically stored in QMS</p>
      </body>
    </html>
  `
}

async function uploadToGoogleDrive(
  fileName: string, 
  content: string, 
  folderId: string
): Promise<string> {
  const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')!
  const privateKey = Deno.env.get('GOOGLE_PRIVATE_KEY')!
  
  if (!serviceAccountEmail || !privateKey) {
    throw new Error('Google service account credentials not configured')
  }
  
  // Create OAuth2 client
  const jwtClient = new jwtOAuth2Client({
    email: serviceAccountEmail,
    privateKey: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.appdata',
    ],
  })
  
  await jwtClient.authorize()
  const accessToken = jwtClient.credentials.access_token!
  
  // Create file metadata
  const metadata = {
    name: fileName,
    mimeType: 'application/pdf',
    parents: folderId ? [folderId] : [],
  }
  
  // Create multipart form data for file upload
  const boundary = '-------nexus-boundary-' + Date.now()
  const delimiter = '--' + boundary
  const closeDelimiter = delimiter + '--'
  
  const multipartBody = [
    delimiter,
    'Content-Type: application/json',
    '',
    JSON.stringify(metadata),
    delimiter,
    'Content-Type: text/html; charset=utf-8',
    '',
    content,
    closeDelimiter,
  ].join('\r\n')
  
  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'Content-Length': multipartBody.length.toString(),
    },
    body: multipartBody,
  })
  
  if (!response.ok) {
    throw new Error(`Google Drive upload failed: ${response.status} ${response.statusText}`)
  }
  
  const result = await response.json()
  return result.id
}
