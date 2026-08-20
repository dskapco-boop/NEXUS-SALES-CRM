import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, supabaseAdmin } from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/useAuth'
import {
  Save,
  Send,
  ArrowLeft,
  X,
  User,
  Building,
  Tag,
  Calendar,
  FileText,
  Users,
} from 'lucide-react'

interface Account {
  id: string
  name: string
}

interface Contact {
  id: string
  first_name: string
  last_name?: string
  email?: string
  mobile?: string
  title?: string
}

interface LeadSource {
  id: string
  name: string
}

export default function LeadCreate() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [formData, setFormData] = useState({
    source: 'other',
    source_detail: '',
    account_id: '',
    contact_id: '',
    assigned_to: user?.id || '',
    status: 'new',
    score: 50,
    stage: 'New',
    estimated_value: '',
    notes: '',
    tags: [] as string[],
    next_action_date: '',
    lead_value: '',
  })

  const [accounts, setAccounts] = useState<Account[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [users, setUsers] = useState<Array<{id: string, first_name?: string, last_name?: string}>>([])
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch dropdown data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch accounts
        const { data: accountsData, error: accountsError } = await supabaseAdmin
          .from('accounts')
          .select('id, name')
          .order('name')
        
        if (accountsError) throw accountsError
        setAccounts(accountsData || [])

        // Fetch contacts
        const { data: contactsData, error: contactsError } = await supabaseAdmin
          .from('contacts')
          .select(`
            id,
            first_name,
            last_name,
            email,
            mobile,
            title,
            accounts (name)
          `)
          .order('first_name')
        
        if (contactsError) throw contactsError
        setContacts(contactsData || [])

        // Fetch users (for assignment)
        const { data: usersData, error: usersError } = await supabaseAdmin
          .from('users')
          .select('id, first_name, last_name')
          .eq('status', 'active')
          .order('first_name')
        
        if (usersError) throw usersError
        setUsers(usersData || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error on change
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleTagAdd = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }))
      setTagInput('')
    }
  }

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.estimated_value && !formData.lead_value) {
      newErrors.estimated_value = 'Please enter an estimated value'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (status: string = 'new') => {
    if (!validateForm()) return
    
    setLoading(true)
    try {
      const { data, error } = await supabaseAdmin
        .from('leads')
        .insert({
          ...formData,
          status: status === 'new' ? formData.status : status,
          created_by: user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()

      if (error) throw error

      // Show success message
      navigate('/leads', { 
        state: { message: 'Lead created successfully' } 
      })
    } catch (error) {
      console.error('Error creating lead:', error)
      setErrors({ submit: 'Failed to create lead. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDraft = () => handleSubmit('draft')
  const handleSubmitStatus = () => handleSubmit('new')

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/leads"
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Create New Lead</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={loading}
            className="flex items-center gap-2 border border-border px-4 py-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </button>
          <button
            onClick={handleSubmitStatus}
            disabled={loading}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
            Create Lead
          </button>
        </div>
      </div>

      {/* Error banner */}
      {errors.submit && (
        <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg mb-4">
          {errors.submit}
        </div>
      )}

      {/* Form */}
      <form className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">
              Lead Source *
            </label>
            <select
              value={formData.source}
              onChange={(e) => handleChange('source', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="event">Trade Show / Event</option>
              <option value="cold_outreach">Cold Outreach</option>
              <option value="social_media">Social Media</option>
              <option value="advertisement">Advertisement</option>
              <option value="other">Other</option>
            </select>
            {formData.source === 'other' && (
              <input
                type="text"
                placeholder="Enter source details"
                value={formData.source_detail}
                onChange={(e) => handleChange('source_detail', e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Account *
            </label>
            <select
              value={formData.account_id}
              onChange={(e) => handleChange('account_id', e.target.value)}
              className={`w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring ${errors.account_id ? 'border-danger' : ''}`}
            >
              <option value="">Select Account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
            {errors.account_id && <p className="text-xs text-danger mt-1">{errors.account_id}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">
              Contact Person
            </label>
            <select
              value={formData.contact_id}
              onChange={(e) => handleChange('contact_id', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select Contact</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.first_name} {contact.last_name} ({contact.title})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Assigned To
            </label>
            <select
              value={formData.assigned_to}
              onChange={(e) => handleChange('assigned_to', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.first_name} {u.last_name || ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">
              Stage
            </label>
            <select
              value={formData.stage}
              onChange={(e) => handleChange('stage', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Proposal Sent">Proposal Sent</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
              <option value="dead">Dead</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Next Action Date
            </label>
            <input
              type="date"
              value={formData.next_action_date}
              onChange={(e) => handleChange('next_action_date', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Value & Score */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">
              Estimated Deal Value (AED)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">AED</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.estimated_value}
                onChange={(e) => handleChange('estimated_value', parseFloat(e.target.value) || undefined)}
                className={`w-full pl-12 pr-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring ${errors.estimated_value ? 'border-danger' : ''}`}
              />
            </div>
            {errors.estimated_value && (
              <p className="text-xs text-danger mt-1">{errors.estimated_value}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Lead Score (1-100)
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={formData.score}
              onChange={(e) => handleChange('score', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1</span>
              <span className="font-medium text-foreground">{formData.score}</span>
              <span>100</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-1">Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map((tag, index) => (
              <span 
                key={index} 
                className="inline-flex items-center gap-1 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleTagRemove(tag)}
                  className="hover:text-secondary/70 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleTagAdd(tagInput)
                }
              }}
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
            <button
              type="button"
              onClick={() => handleTagAdd(tagInput)}
              className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm"
            >
              Add
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={4}
            placeholder="Add notes about this lead..."
            className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm"
          />
        </div>
      </form>
    </div>
  )
}
