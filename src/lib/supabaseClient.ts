/**
 * Nexus CRM - Supabase Client Configuration
 * Zero-Cost B2B Sales CRM for General Trading & ISO Consultancy
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for common operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string
          name: string
          industry?: string
          company_type?: 'client' | 'prospect' | 'competitor' | 'partner'
          country?: string
          emirate?: string
          city?: string
          address?: string
          website?: string
          email?: string
          phone?: string
          whatsapp?: string
          primary_contact_id?: string
          rating?: 'hot' | 'warm' | 'cold'
          tags?: string[]
          source?: string
          estimated_deal_value?: number
          currency_preference?: string
          annual_revenue_aed?: number
          employee_count?: number
          verification_status?: 'verified' | 'pending' | 'unverified'
          verified_at?: string
          created_from_campaign_id?: string
          owner_id?: string
          iso_compliance_status?: 'pending' | 'in_review' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          industry?: string
          company_type?: 'client' | 'prospect' | 'competitor' | 'partner'
          country?: string
          emirate?: string
          city?: string
          address?: string
          website?: string
          email?: string
          phone?: string
          whatsapp?: string
          primary_contact_id?: string
          rating?: 'hot' | 'warm' | 'cold'
          tags?: string[]
          source?: string
          estimated_deal_value?: number
          currency_preference?: string
          annual_revenue_aed?: number
          employee_count?: number
          verification_status?: 'verified' | 'pending' | 'unverified'
          verified_at?: string
          created_from_campaign_id?: string
          owner_id?: string
          iso_compliance_status?: 'pending' | 'in_review' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          industry?: string
          company_type?: 'client' | 'prospect' | 'competitor' | 'partner'
          country?: string
          emirate?: string
          city?: string
          address?: string
          website?: string
          email?: string
          phone?: string
          whatsapp?: string
          primary_contact_id?: string
          rating?: 'hot' | 'warm' | 'cold'
          tags?: string[]
          source?: string
          estimated_deal_value?: number
          currency_preference?: string
          annual_revenue_aed?: number
          employee_count?: number
          verification_status?: 'verified' | 'pending' | 'unverified'
          verified_at?: string
          created_from_campaign_id?: string
          owner_id?: string
          iso_compliance_status?: 'pending' | 'in_review' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      // Additional table types would be defined here
    }
  }
}
