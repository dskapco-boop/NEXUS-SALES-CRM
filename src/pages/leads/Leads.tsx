import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, supabaseAdmin } from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/useAuth'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  User,
  Calendar,
  Tag,
  TrendingUp,
  GripVertical,
} from 'lucide-react'

interface Lead {
  id: string
  source: string
  account_id: string
  account?: {
    name: string
  }
  contact_id?: string
  assigned_to?: string
  user?: {
    first_name?: string
    last_name?: string
  }
  status: string
  score?: number
  stage: string
  estimated_value?: number
  notes?: string
  tags?: string[]
  next_action_date?: string
  last_contacted_at?: string
  created_at: string
  updated_at: string
}

const LEAD_STAGES = [
  { name: 'New', color: 'bg-slate-400', dot: 'stage-new' },
  { name: 'Contacted', color: 'bg-blue-400', dot: 'stage-contacted' },
  { name: 'Qualified', color: 'bg-green-400', dot: 'stage-qualified' },
  { name: 'Proposal Sent', color: 'bg-amber-400', dot: 'stage-proposal' },
  { name: 'Negotiation', color: 'bg-orange-400', dot: 'stage-negotiation' },
  { name: 'Won', color: 'bg-green-500', dot: 'stage-won' },
  { name: 'Lost', color: 'bg-red-500', dot: 'stage-lost' },
]

export const LEAD_STATUS_COLORS = {
  new: 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400',
  contacted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  qualified: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  converted: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  dead: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
}

export const LEAD_STAGE_COLORS = {
  New: 'bg-slate-100 text-slate-800',
  Contacted: 'bg-blue-100 text-blue-800',
  Qualified: 'bg-green-100 text-green-800',
  'Proposal Sent': 'bg-amber-100 text-amber-800',
  Negotiation: 'bg-orange-100 text-orange-800',
  Won: 'bg-green-100 text-green-800',
  Lost: 'bg-red-100 text-red-800',
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [stageFilter, setStageFilter] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())

  const { user } = useAuth()
  const navigate = useNavigate()

  // Fetch leads
  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true)
      try {
        let query = supabaseAdmin
          .from('leads')
          .select(`
            *,
            accounts!inner (name),
            users!leads_assigned_to_fkey (first_name, last_name)
          `)
          .order('created_at', { ascending: false })

        // Apply data scope based on user permissions
        const scope = user?.view_permission
        if (scope === 'individual' && user) {
          query = query.eq('assigned_to', user.id)
        } else if (scope === 'team' && user) {
          // Get team members and filter by their IDs
          const { data: teamMembers } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('region_id', user?.region_id || '')
          if (teamMembers) {
            const teamIds = teamMembers.map(m => m.id)
            query = query.in('assigned_to', teamIds)
          }
        }

        const { data, error } = await query

        if (error) throw error
        setLeads(data as Lead[] || [])
      } catch (error) {
        console.error('Error fetching leads:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeads()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = [...leads]
    
    if (searchTerm) {
      filtered = filtered.filter(lead =>
        (lead.account?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.contact_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.score?.toString() || '').includes(searchTerm)
      )
    }

    if (statusFilter) {
      filtered = filtered.filter(lead => lead.status === statusFilter)
    }

    if (stageFilter) {
      filtered = filtered.filter(lead => lead.stage === stageFilter)
    }

    setFilteredLeads(filtered)
  }, [leads, searchTerm, statusFilter, stageFilter])

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  // Handle status filter
  const handleStatusFilter = (status: string | null) => {
    setStatusFilter(status)
  }

  // Handle stage filter (Kanban)
  const handleStageFilter = (stage: string | null) => {
    setStageFilter(stage)
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      const { error } = await supabaseAdmin
        .from('leads')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting lead:', error)
      } else {
        setLeads(leads.filter(lead => lead.id !== id))
      }
    }
  }

  // Handle bulk actions
  const handleDeleteSelected = async () => {
    if (selectedLeads.size === 0) return
    if (!window.confirm(`Delete ${selectedLeads.size} lead(s)? This cannot be undone.`)) return

    const { error } = await supabaseAdmin
      .from('leads')
      .delete()
      .in('id', Array.from(selectedLeads))

    if (error) {
      console.error('Error deleting leads:', error)
    } else {
      setLeads(leads.filter(lead => !selectedLeads.has(lead.id)))
      setSelectedLeads(new Set())
    }
  }

  // Handle stage change (Kanban drag or dropdown)
  const handleStageChange = async (leadId: string, newStage: string) => {
    const { error } = await supabaseAdmin
      .from('leads')
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq('id', leadId)

    if (error) {
      console.error('Error updating lead stage:', error)
    } else {
      setLeads(leads.map(lead => 
        lead.id === leadId 
          ? { ...lead, stage: newStage, updated_at: new Date().toISOString() }
          : lead
      ))
    }
  }

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (!amount) return '—'
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED'
    }).format(amount)
  }

  // Get stage color
  const getStageColor = (stage: string) => {
    return LEAD_STAGE_COLORS[stage as keyof typeof LEAD_STAGE_COLORS] || LEAD_STAGE_COLORS.New
  }

  // Get status color
  const getStatusColor = (status: string) => {
    return LEAD_STATUS_COLORS[status as keyof typeof LEAD_STATUS_COLORS] || LEAD_STATUS_COLORS.new
  }

  // Kanban view
  const renderKanban = () => {
    const stages = LEAD_STAGES.filter(s => s.name !== 'Won' && s.name !== 'Lost')
    
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageLeads = filteredLeads.filter(lead => lead.stage === stage.name)
          return (
            <div key={stage.name} className="flex-1 min-w-[280px] bg-muted/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">{stage.name}</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {stageLeads.length}
                </span>
              </div>
              <div className="space-y-2">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="bg-card border border-border rounded-lg p-3 cursor-move hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{lead.account?.name || lead.title || 'Unnamed Lead'}</p>
                        {lead.estimated_value && (
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(lead.estimated_value)}
                          </p>
                        )}
                        {lead.next_action_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Follow-up: {formatDate(lead.next_action_date)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {lead.tags && lead.tags.length > 0 && (
                          <Tag className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Table view
  const renderTable = () => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4">
                <input
                  type="checkbox"
                  checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedLeads(new Set(filteredLeads.map(l => l.id)))
                    } else {
                      setSelectedLeads(new Set())
                    }
                  }}
                  className="rounded border-border"
                />
              </th>
              <th className="text-left py-3 px-4 font-medium">Account</th>
              <th className="text-left py-3 px-4 font-medium">Stage</th>
              <th className="text-left py-3 px-4 font-medium">Status</th>
              <th className="text-left py-3 px-4 font-medium">Value</th>
              <th className="text-left py-3 px-4 font-medium">Assigned To</th>
              <th className="text-left py-3 px-4 font-medium">Next Action</th>
              <th className="text-left py-3 px-4 font-medium">Created</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead) => (
              <tr key={lead.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedLeads.has(lead.id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedLeads)
                      if (e.target.checked) {
                        newSelected.add(lead.id)
                      } else {
                        newSelected.delete(lead.id)
                      }
                      setSelectedLeads(newSelected)
                    }}
                    className="rounded border-border"
                  />
                </td>
                <td className="py-3 px-4">
                  <div>
                    <Link 
                      to={`/leads/${lead.id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {lead.account?.name || 'Unnamed Account'}
                    </Link>
                    {lead.tags && lead.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {lead.tags.slice(0, 2).map((tag, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-secondary/10 text-secondary">
                            {tag}
                          </span>
                        ))}
                        {lead.tags.length > 2 && (
                          <span className="text-xs text-muted-foreground">+{lead.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(lead.stage)}`}>
                    {lead.stage}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                  {lead.score !== undefined && (
                    <div className="mt-1">
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div 
                          className="bg-primary h-1.5 rounded-full" 
                          style={{ width: `${Math.min(lead.score, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-muted-foreground">{lead.score} points</span>
                    </div>
                  )}
                </td>
                <td className="py-3 px-4">
                  {lead.estimated_value ? formatCurrency(lead.estimated_value) : '—'}
                </td>
                <td className="py-3 px-4">
                  {lead.user ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground">
                        {lead.user.first_name?.[0] || lead.user.last_name?.[0] || '?'}
                      </div>
                      {lead.user.first_name} {lead.user.last_name}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {lead.next_action_date ? formatDate(lead.next_action_date) : '—'}
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  {formatDate(lead.created_at)}
                </td>
                <td className="py-3 px-4">
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpenId(menuOpenId === lead.id ? null : lead.id)
                      }}
                      className="p-1 rounded-md hover:bg-muted transition-colors"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    
                    {menuOpenId === lead.id && (
                      <div 
                        className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-lg shadow-lg py-1 z-50"
                        onClick={() => setMenuOpenId(null)}
                      >
                        <Link 
                          to={`/leads/${lead.id}`}
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Link>
                        <Link 
                          to={`/leads/${lead.id}/edit`}
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-danger transition-colors w-full text-left"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
        <div className="h-96 bg-muted rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Top toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Leads</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{filteredLeads.length} lead(s)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'table' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'kanban' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Kanban
            </button>
          </div>

          {/* Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-md hover:bg-muted transition-colors"
            title="Filters"
          >
            <Filter className="h-4 w-4" />
          </button>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-8 pr-3 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
          </div>

          {/* Bulk actions */}
          {selectedLeads.size > 0 && (
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
              <span className="text-sm text-muted-foreground">
                {selectedLeads.size} selected
              </span>
              <button
                onClick={handleDeleteSelected}
                className="text-danger hover:text-danger/80 text-sm font-medium"
              >
                Delete
              </button>
            </div>
          )}

          {/* Create button */}
          <Link
            to="/leads/create"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Lead
          </Link>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={statusFilter || ''}
                onChange={(e) => handleStatusFilter(e.target.value || null)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
                <option value="dead">Dead</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stage</label>
              <select
                value={stageFilter || ''}
                onChange={(e) => handleStageFilter(e.target.value || null)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
              >
                <option value="">All Stages</option>
                {LEAD_STAGES.map((stage) => (
                  <option key={stage.name} value={stage.name}>{stage.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter(null)
                  setStageFilter(null)
                  setSearchTerm('')
                }}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {viewMode === 'kanban' ? renderKanban() : renderTable()}

      {/* Empty state */}
      {filteredLeads.length === 0 && !loading && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No leads found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter || stageFilter
              ? 'Try adjusting your filters'
              : 'Get started by creating your first lead'}
          </p>
          <Link
            to="/leads/create"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Lead
          </Link>
        </div>
      )}
    </div>
  )
}
