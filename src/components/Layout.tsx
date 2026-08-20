import { useState, Fragment } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Target,
  FileText,
  ShoppingCart,
  Package,
  Calendar,
  CheckSquare,
  BarChart3,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Moon,
  Sun,
  LogOut,
  Building,
  FileSignature,
  ShieldCheck,
  Megaphone,
  BookOpen,
  Activity,
  MessageSquare,
} from 'lucide-react'

interface NavItem {
  name: string
  path: string
  icon: React.ElementType
  permission?: string
}

const navigation: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', path: '/leads', icon: Target, permission: 'leads.view' },
  { name: 'Inquiries', path: '/inquiries', icon: FileText, permission: 'inquiries.view' },
  { name: 'Quotations', path: '/quotes', icon: FileSignature, permission: 'quotes.view' },
  { 
    name: 'Orders', 
    path: '/orders', 
    icon: ShoppingCart, 
    permission: 'orders.view' 
  },
  { 
    name: 'Invoices', 
    path: '/invoices', 
    icon: FileText, 
    permission: 'invoices.view' 
  },
  { name: 'Accounts', path: '/accounts', icon: Building, permission: 'accounts.view' },
  { name: 'Contacts', path: '/contacts', icon: UserCheck, permission: 'contacts.view' },
  { name: 'Activities', path: '/activities', icon: Activity, permission: 'activities.view' },
  { name: 'Calendar', path: '/calendar', icon: Calendar, permission: 'activities.view' },
  { name: 'Tasks', path: '/tasks', icon: CheckSquare, permission: 'tasks.view' },
  { name: 'Products', path: '/products', icon: Package, permission: 'products.view' },
  { name: 'Services', path: '/services', icon: BookOpen, permission: 'services.view' },
  { name: 'Campaigns', path: '/campaigns', icon: Megaphone, permission: 'campaigns.view' },
  { name: 'ISO Clients', path: '/iso/clients', icon: ShieldCheck, permission: 'iso.view' },
  { name: 'ISO Audits', path: '/iso/audits', icon: ShieldCheck, permission: 'iso.view' },
  { 
    name: 'Reports', 
    path: '/reports', 
    icon: BarChart3, 
    permission: 'reports.view' 
  },
  { name: 'Settings', path: '/settings', icon: Settings, permission: 'admin.settings' },
]

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const hasPermission = (permission?: string) => {
    if (!permission) return true
    if (!user?.role?.permissions) return false
    return user.role.permissions[permission] === 'allowed'
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col overflow-y-auto">
          <div className="flex h-16 items-center justify-between px-4 border-b border-border">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-sm font-bold">🧠</span>
              </div>
              <span className="text-xl font-bold">Nexus CRM</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation
              .filter(item => hasPermission(item.permission))
              .map((item) => {
                const isActive = location.pathname.startsWith(item.path)
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </NavLink>
                )
              })}
          </nav>
          
          <div className="p-4 border-t border-border">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-card border-b border-border">
          <div className="flex h-16 items-center justify-between px-4">
            {/* Left: Mobile menu button + page title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md hover:bg-muted"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <h1 className="text-xl font-semibold">
                {navigation.find(nav => location.pathname.startsWith(nav.path))?.name || 'Dashboard'}
              </h1>
            </div>

            {/* Right: Top bar actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-md hover:bg-muted transition-colors"
                title="Search"
              >
                <Search className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 rounded-md hover:bg-muted transition-colors relative"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-xs text-white">
                    3
                  </span>
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-popover border border-border rounded-lg shadow-lg py-1">
                    <div className="px-4 py-2 border-b border-border">
                      <h3 className="font-medium">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <div className="px-4 py-3 hover:bg-muted cursor-pointer border-l-2 border-transparent hover:border-primary">
                        <p className="text-sm font-medium">Quote approval request</p>
                        <p className="text-xs text-muted-foreground">Q-2026-0045 exceeds approval threshold</p>
                        <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                      </div>
                      <div className="px-4 py-3 hover:bg-muted cursor-pointer border-l-2 border-transparent hover:border-primary">
                        <p className="text-sm font-medium">Lead assigned to you</p>
                        <p className="text-xs text-muted-foreground">New lead from Dubai Industry Expo</p>
                        <p className="text-xs text-muted-foreground mt-1">4 hours ago</p>
                      </div>
                      <div className="px-4 py-3 hover:bg-muted cursor-pointer border-l-2 border-transparent hover:border-primary">
                        <p className="text-sm font-medium">Invoice overdue reminder</p>
                        <p className="text-xs text-muted-foreground">INV-2026-0123 is now overdue</p>
                        <p className="text-xs text-muted-foreground mt-1">1 day ago</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors"
                >
                  {user?.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.first_name || 'User'} 
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                      {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                    </div>
                  )}
                  <span className="hidden md:block text-sm font-medium">
                    {user?.first_name || user?.email?.split('@')[0]}
                  </span>
                </button>
                
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-lg shadow-lg py-1">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="font-medium">{user?.first_name} {user?.last_name}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                      {user?.role?.display_name && (
                        <p className="text-xs text-muted-foreground">{user.role.display_name}</p>
                      )}
                    </div>
                    <button className="w-full px-4 py-2 text-left text-sm hover:bg-muted">
                      Profile
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm hover:bg-muted">
                      Settings
                    </button>
                    <hr className="my-1 border-border" />
                    <button 
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-muted text-danger"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
