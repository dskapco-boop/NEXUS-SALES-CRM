# Nexus Sales CRM - B2B Sales CRM for General Trading & ISO Consultancy

A zero-cost, open-source CRM platform designed for **general trading companies** that also provide **ISO 9001:2015 management system consultancy services**. Built with enterprise-grade architecture using completely free tools.

## 🚀 Features

### Core Business Modules
- **Lead Management**: Capture, score, and track leads through a sales pipeline
- **Inquiry Management**: Formalize customer requirements with detailed specifications
- **Quotation Management**: Generate professional quotes with multi-currency support
- **Sales Orders**: Track supply chain orders with shipment and delivery tracking
- **Service Orders**: Manage ISO consultancy engagements with milestone tracking
- **Projects**: Handle hybrid engagements combining supply + service components
- **Completion Reports**: Standardized delivery confirmation with digital sign-off
- **Invoicing**: Automated invoice generation with multi-currency and tax support

### Specialized ISO Consultancy Features
- **ISO Client Management**: Track certification lifecycle (gap analysis → audit → certification)
- **Gap Analysis**: Structured assessment against ISO standard clauses
- **Audit Management**: Schedule and track internal/certification audits
- **Evidence Documentation**: Document control system with version tracking
- **Compliance Status**: ISO 9001:2015 compliance tracking for all documents

### Team Collaboration
- **Activity Timeline**: Email, call, and meeting tracking per customer
- **Task Management**: Follow-up tasks with reminders and due dates
- **Calendar Integration**: Google Calendar sync for appointments
- **Notification System**: In-app, email, and push notifications

### Intelligence & Automation
- **AI-Powered Lead Scoring**: Uses OmniRoute AI gateway for intelligent lead qualification
- **Smart Document Processing**: Extract data from PDFs and documents via AI
- **Workflow Automation**: Auto-generate tasks, reminders, and notifications
- **Sales Forecasting**: AI-powered revenue predictions

### Free Integrations
- **Supabase**: Backend-as-a-Service (free tier)
- **Google Drive**: Document storage with ISO 9001 folder structure (15GB free)
- **SendGrid**: Email delivery (100/day free)
- **OmniRoute**: Local AI gateway (no external API costs)
- **GitHub Pages**: Zero-cost hosting

## 🏗️ Architecture

```
nexus-crm/
├── apps/
│   ├── admin/           # Web admin panel (React Admin)
│   └── mobile/          # Mobile app (React Native)
├── packages/
│   ├── api/             # API client and utilities
│   ├── config/          # Environment configuration
│   ├── crm-core/        # Core business logic hooks
│   ├── database/        # Type definitions and schema
│   └── ui/              # Shared UI components
├── supabase/
│   ├── migrations/      # Database schema
│   ├── functions/       # Edge functions
│   │   ├── nexus-business-logic/  # Auto-numbering, calculations
│   │   ├── google-drive-upload/   # ISO QMS document storage
│   │   ├── omniroute-ai/          # AI integration via OmniRoute
│   │   └── iso-module/            # ISO-specific workflows
│   └── config.toml
├── public/              # Static assets and PWA manifest
└── docs/               # Documentation
```

## 📋 Quick Start

### Prerequisites
- Node.js 20+
- npm or pnpm
- Supabase CLI (optional, for local development)
- Google Cloud service account (for Drive integration)
- OmniRoute AI gateway running locally (localhost:20128)

### 1. Setup Supabase Project

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project (or create a new one)
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push

# Seed initial data
supabase db reset --linked
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your credentials:
# - Supabase URL and keys
# - OmniRoute API key
# - Google service account credentials
# - SendGrid API key
```

### 3. Start Development Server

```bash
# Install all dependencies
npm install

# Start admin panel (http://localhost:5173)
cd apps/admin
npm run dev

# Start Supabase locally (optional)
supabase start

# Start OmniRoute gateway (if not already running)
# Navigate to your OmniRoute directory and start the server
```

### 4. Access the Application

- **Web Admin**: http://localhost:5173
- **Supabase Studio**: http://localhost:54323 (if running locally)
- **Default Admin Login**: admin@nexus.com (set password in Supabase Auth)

## 🛠️ Technology Stack

### Backend
- **Supabase**: PostgreSQL database, authentication, and storage
- **Edge Functions**: Business logic, AI integration, document processing
- **Row Level Security**: Fine-grained access control per role

### Frontend
- **React Admin**: Declarative admin interface framework
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling

### Mobile
- **React Native**: Cross-platform mobile app
- **Capacitor**: PWA + native app compilation

### AI & Integrations
- **OmniRoute**: Local AI gateway (localhost:20128) - routes all LLM calls
- **Google Drive API**: Document storage with ISO 9001 folder structure
- **SendGrid**: Email delivery (free tier)
- **Google Calendar API**: Appointment scheduling

## 📊 Data Model

### Core Entities
| Entity | Description |
|--------|-------------|
| `accounts` | Companies (clients, prospects, competitors) |
| `contacts` | People at accounts |
| `leads` | Potential opportunities |
| `inquiries` | Formal customer requirement requests |
| `opportunities` | Active deals with pipeline stages |
| `quotes` | Formal proposals with line items |
| `sales_orders` | Executed supply orders with tracking |
| `service_orders` | ISO consultancy engagements |
| `projects` | Hybrid supply + service engagements |
| `invoices` | Billing documents with payment tracking |
| `activities` | Calls, meetings, tasks, notes |
| `tasks` | Follow-up actions with reminders |
| `products` | Trading catalog items |
| `services` | ISO consultancy services |
| `iso_clients` | ISO certification lifecycle tracking |
| `iso_audits` | Audit scheduling and findings |

### ISO 9001:2015 Compliance
All documents are automatically uploaded to Google Drive in a structured folder hierarchy:
```
Google Drive > Nexus CRM QMS >
├── 1. Quality Manual/
├── 2. Procedures/
├── 3. Records/
│   ├── 3.1 Customer Related Records/
│   ├── 3.2 Supplier Records/
│   ├── 3.3 Audit Reports/
│   ├── 3.4 Monitoring & Measurement/
├── 4. Audit Reports/
├── 5. Invoices/
├── 6. Quotations/
├── 7. Sales Orders/
└── 8. Completion Reports/
```

## 📱 Mobile App

The mobile app is built with React Native and compiles to both APK and iOS IPA:

### Features
- **Offline Mode**: View and create records without internet
- **PWA Support**: Installable on any device via PWA
- **Push Notifications**: Task reminders and workflow alerts
- **GPS Check-in**: Location-stamped activities
- **Camera Integration**: Photo capture for inspections and evidence

### Build Commands
```bash
# Android APK
cd apps/mobile
npm run build-apk

# iOS Archive
cd apps/mobile
npm run build-ios

# PWA
cd apps/admin
npm run build
```

## 🎯 Key Workflows

### B2B Sales Workflow
1. **Lead Capture** → Lead scoring via OmniRoute AI
2. **Inquiry Creation** → Convert qualified leads to inquiries
3. **Quotation** → Generate professional quotes with multi-currency
4. **Order Placement** → Convert accepted quotes to orders
5. **Order Fulfillment** → Track supply orders with shipment updates
6. **Invoice Generation** → Auto-create invoices from completion reports
7. **Payment Tracking** → Monitor payment status and send reminders

### ISO Consultancy Workflow
1. **Client Onboarding** → Register as ISO client
2. **Gap Analysis** → Assess compliance against standard
3. **Implementation Planning** → Create action plan with milestones
4. **Internal Audits** → Schedule and conduct internal audits
5. **Evidence Collection** → Upload documents to QMS folders
6. **Certification Audit** → Prepare for external certification
7. **Surveillance** → Schedule periodic surveillance audits
8. **Recertification** → Track renewal timelines

### OmniRoute AI Integration
All AI operations route through the local OmniRoute gateway:
- Lead scoring and qualification
- Sales forecasting and pipeline analysis
- Quote optimization suggestions
- Email drafting for follow-ups
- Document data extraction from PDFs
- ISO gap analysis automation

## 📊 Dashboard & Reporting

### Admin Dashboard
- Pipeline value by stage
- Revenue forecast (weighted pipeline)
- Recent activities and lead updates
- Team performance metrics
- ISO compliance status

### Sales Executive Dashboard
- Personal pipeline overview
- Upcoming meetings and tasks
- Quotes pending approval
- Recent activities and notes

### ISO Consultant Dashboard
- Client certification status
- Upcoming audit schedules
- Evidence documentation gaps
- Gap analysis progress

## 🔐 Security & Compliance

- **RBAC**: Role-based access control (Admin, Sales Manager, Sales Rep, ISO Consultant, Operations, Finance)
- **Data Scoping**: Global/team/individual view permissions
- **Audit Trails**: All actions logged with timestamps and user identification
- **ISO 9001:2015 Compliant**: Document control with version history
- **TLS Encryption**: All data in transit encrypted
- **RLS Policies**: Row-level security on all database tables

## 🎨 Customization

### Role-Based Access Control
| Role | Permissions |
|------|-------------|
| Admin | Full system access |
| Sales Manager | Team pipeline oversight, quote approvals |
| Sales Executive | Own leads/inquiries, create/edit quotes |
| ISO Consultant | ISO client management, audit scheduling |
| Operations | Order fulfillment, shipment tracking |
| Finance | Invoicing, payment tracking, financial reports |

### Configurable Fields
- Custom fields via JSONB columns on all entities
- Custom workflow states
- Configurable quote/invoice templates
- Brand colors and logo

## 📦 Deployment

### GitHub Actions (Free)
- Automatic deployment to GitHub Pages on `main` branch
- Supabase migrations on push
- Edge function deployment
- APK/iOS build generation

### Environment Variables
All sensitive values stored in `.env.local`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key
OMNIROUTE_API_KEY=your-key
OMNIROUTE_BASE_URL=http://localhost:20128
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
SENDGRIZ_API_KEY=SG.xxx
```

## 🆘 Support & Community

- **Documentation**: Full docs at `/docs/`
- **Issues**: Report bugs on GitHub Issues
- **Contributing**: See `CONTRIBUTING.md`
- **License**: MIT

## 💰 Zero-Cost Guarantee

| Service | Cost | Free Tier |
|---------|------|-----------|
| Supabase | $0 | ✅ 500MB DB, 1GB storage |
| GitHub Pages | $0 | ✅ Unlimited public repos |
| GitHub Actions | $0 | ✅ 2000 minutes/month |
| Google Drive | $0 | ✅ 15GB shared with Gmail |
| OmniRoute AI | $0 | ✅ Local gateway |
| SendGrid | $0 | ✅ 100 emails/day |

**Total Monthly Cost: $0.00**

---

*Made with ❤️ by the Nexus CRM team. Built for B2B general trading companies with ISO consultancy services.*
