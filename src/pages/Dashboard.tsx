import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase, supabaseAdmin } from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/useAuth'
import {
  Target,
  FileText,
  ShoppingCart,
  User,
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  BarChart3,
  Clock,
} from 'lucide-react'

interface DashboardStats {
  total_leads: number
  active_leads: number
  leads_this_month: number
  active_opportunities_value: number
  pending_quotes: number
  pending_quotes_value: number
  active_orders_count: number
  active_orders_value: number
  overdue_invoices_count: number
  overdue_invoices_amount: number
}

interface RecentLead {
  id: string
  source: string
  accounts: { name: string }
  stage: string
  estimated_value?: number
  created_at: string
}

interface UpcomingTask {
  id: string
  title: string
  due_date: string
  priority: string
  related_type?: string
  related_id?: string
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([])
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        // Fetch stats
        const [
          { count: totalLeads },
          { count: activeOpportunities },
          { count: pendingQuotes },
          { count: activeOrders },
          { count: overdueInvoices },
          leadsWithValues,
          recentLeadsData,
          upcomingTasksData,
        ] = await Promise.all([
          supabaseAdmin.from('leads').select('*', { count: 'exact', head: true }),
          supabaseAdmin.from('opportunities').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress', 'on_hold']),
          supabaseAdmin.from('quotations').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
          supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress', 'on_hold']),
          supabaseAdmin.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'overdue'),
          supabaseAdmin.from('leads').select('estimated_value').not('estimated_value', 'is', null),
          supabaseAdmin.from('leads').select('id, source, accounts(name), stage, estimated_value, created_at').order('created_at', { ascending: false }).limit(5),
          supabaseAdmin.from('tasks').select('id, title, due_date, priority, related_type, related_id').gte('due_date', new Date().toISOString()).lte('due_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()).order('due_date').limit(10),
        ])

        const totalValue = leadsWithValues.reduce((sum, lead) => sum + Number(lead.estimated_value), 0)

        setStats({
          total_leads: totalLeads || 0,
          active_leads: leadsData?.filter(l => ['new', 'contacted', 'qualified'].includes(l.status)).length || 0,
          leads_this_month: 0, // Would calculate based on date filtering
          active_opportunities_value: totalValue || 0,
          pending_quotes: pendingQuotes || 0,
          pending_quotes_value: 0,
          active_orders_count: activeOrders || 0,
          active_orders_value: 0,
          overdue_invoices_count: overdueInvoices || 0,
          overdue_invoices_amount: 0,
        })

        setRecentLeads(recentLeadsData || [])
        setUpcomingTasks(upcomingTasksData || [])
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-64 bg-muted rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.first_name || 'there'}!
        </h1>
        <p className="text-muted-foreground">
          Here's your sales dashboard at a glance
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow card-hover">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                Active
              </span>
            </div>
            <h3 className="text-2xl font-bold">{stats.active_leads}</h3>
            <p className="text-muted-foreground">Active Leads</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow card-hover">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                In Pipeline
              </span>
            </div>
            <h3 className="text-2xl font-bold">{formatCurrency(stats.active_opportunities_value)}</h3>
            <p className="text-muted-foreground">Pipeline Value</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow card-hover">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                Pending
              </span>
            </div>
            <h3 className="text-2xl font-bold">{stats.pending_quotes}</h3>
            <p className="text-muted-foreground">Pending Quotes</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow card-hover">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                <Calendar className="h-6 w-6 text-red-600" />
              </div>
              <span className="text-xs text-danger bg-danger/10 px-2 py-1 rounded-full">
                Overdue
              </span>
            </div>
            <h3 className="text-2xl font-bold">{stats.overdue_invoices_count}</h3>
            <p className="text-muted-foreground">Overdue Invoices</p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Leads */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Leads</h2>
            <Link 
              to="/leads" 
              className="text-sm text-primary hover:underline"
            >
              View all →
            </Link>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {recentLeads.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No recent leads
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{lead.accounts?.name || 'Unknown Account'}</p>
                          <p className="text-sm text-muted-foreground">
                            {lead.source} • {formatDate(lead.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {lead.estimated_value && (
                          <p className="font-medium">{formatCurrency(lead.estimated_value)}</p>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          lead.stage === 'New' ? 'bg-slate-100 text-slate-800' :
                          lead.stage === 'Contacted' ? 'bg-blue-100 text-blue-800' :
                          lead.stage === 'Qualified' ? 'bg-green-100 text-green-800' :
                          lead.stage === 'Proposal Sent' ? 'bg-amber-100 text-amber-800' :
                          lead.stage === 'Negotiation' ? 'bg-orange-100 text-orange-800' :
                          lead.stage === 'Won' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {lead.stage}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Tasks */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Upcoming Tasks</h2>
              <Link 
                to="/tasks" 
                className="text-sm text-primary hover:underline"
              >
                View all →
              </Link>
            </div>

            <div className="bg-card border border-border rounded-xl">
              {upcomingTasks.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No upcoming tasks
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {upcomingTasks.map((task) => (
                    <div key={task.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Due: {formatDate(task.due_date)}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Pipeline */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Pipeline by Stage</h2>
            <div className="space-y-3">
              {[
                { stage: 'New', count: 0, value: 0, color: 'bg-slate-400' },
                { stage: 'Contacted', count: 0, value: 0, color: 'bg-blue-400' },
                { stage: 'Qualified', count: 0, value: 0, color: 'bg-green-400' },
                { stage: 'Proposal Sent', count: 0, value: 0, color: 'bg-amber-400' },
                { stage: 'Negotiation', count: 0, value: 0, color: 'bg-orange-400' },
                { stage: 'Won', count: 0, value: 0, color: 'bg-green-500' },
                { stage: 'Lost', count: 0, value: 0, color: 'bg-red-500' },
              ].map((item) => (
                <div key={item.stage} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-sm">{item.stage}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{item.count}</span>
                    {item.value > 0 && (
                      <span className="text-xs text-muted-foreground block">
                        {formatCurrency(item.value)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                to="/leads/create"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <Target className="h-5 w-5 text-primary" />
                <span>New Lead</span>
              </Link>
              <Link
                to="/quotes/create"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <FileText className="h-5 w-5 text-primary" />
                <span>Create Quote</span>
              </Link>
              <Link
                to="/tasks/create"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <Clock className="h-5 w-5 text-primary" />
                <span>New Task</span>
              </Link>
              <Link
                to="/calendar"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <Calendar className="h-5 w-5 text-primary" />
                <span>Schedule Meeting</span>
              </Link>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Team Activity</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <User className="h-3 w-3 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Sarah updated lead "Tech Solutions"</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-3 w-3 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Mike created quote Q-2026-045</p>
                  <p className="text-xs text-muted-foreground">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="h-3 w-3 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">New order created from quote</p>
                  <p className="text-xs text-muted-foreground">Yesterday</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
