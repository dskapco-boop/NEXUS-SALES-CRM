import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/auth/Login'
import Dashboard from './pages/Dashboard'
import Leads from './pages/leads/Leads'
import LeadDetail from './pages/leads/LeadDetail'
import LeadCreate from './pages/leads/LeadCreate'
import Inquiries from './pages/inquiries/Inquiries'
import InquiryDetail from './pages/inquiries/InquiryDetail'
import Quotations from './pages/quotations/Quotations'
import QuoteCreate from './pages/quotations/QuoteCreate'
import Orders from './pages/orders/Orders'
import OrderDetail from './pages/orders/OrderDetail'
import Invoices from './pages/invoices/Invoices'
import InvoiceCreate from './pages/invoices/InvoiceCreate'
import Accounts from './pages/accounts/Accounts'
import AccountDetail from './pages/accounts/AccountDetail'
import Contacts from './pages/contacts/Contacts'
import Activities from './pages/activities/Activities'
import Calendar from './pages/Calendar'
import Tasks from './pages/Tasks'
import Products from './pages/products/Products'
import Services from './pages/services/Services'
import Campaigns from './pages/campaigns/Campaigns'
import IsoClients from './pages/iso/IsoClients'
import IsoAudits from './pages/iso/IsoAudits'
import Settings from './pages/settings/Settings'
import { useAuth } from './hooks/useAuth'

// Route guard component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Lead Management */}
        <Route path="leads" element={<Leads />} />
        <Route path="leads/create" element={<LeadCreate />} />
        <Route path="leads/:id" element={<LeadDetail />} />
        
        {/* Inquiry Management */}
        <Route path="inquiries" element={<Inquiries />} />
        <Route path="inquiries/:id" element={<InquiryDetail />} />
        
        {/* Quotation Management */}
        <Route path="quotes" element={<Quotations />} />
        <Route path="quotes/create" element={<QuoteCreate />} />
        
        {/* Order Management */}
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        
        {/* Invoice Management */}
        <Route path="invoices" element={<Invoices />} />
        <Route path="invoices/create" element={<InvoiceCreate />} />
        
        {/* Contact & Account Management */}
        <Route path="accounts" element={<Accounts />} />
        <Route path="accounts/:id" element={<AccountDetail />} />
        <Route path="contacts" element={<Contacts />} />
        
        {/* Activity & Task Management */}
        <Route path="activities" element={<Activities />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="tasks" element={<Tasks />} />
        
        {/* Product & Service Catalogs */}
        <Route path="products" element={<Products />} />
        <Route path="services" element={<Services />} />
        
        {/* Campaign Management */}
        <Route path="campaigns" element={<Campaigns />} />
        
        {/* ISO Consultancy */}
        <Route path="iso/clients" element={<IsoClients />} />
        <Route path="iso/audits" element={<IsoAudits />} />
        
        {/* Settings */}
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
