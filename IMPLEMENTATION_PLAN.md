# Nexus Sales CRM — Krayin-Style UI Redesign Plan

## Current State
- Admin panel uses **React Admin** (different look/feel from Krayin)
- Data model is built and working
- Dev server runs at http://localhost:5174/
- All browser console errors fixed

## UX Design Analysis (From Krayin CRM Screenshots)

### Reference: Krayin UI Patterns

| Component | Krayin Pattern | Our Implementation |
|-----------|----------------|-------------------|
| **Layout** | Holy Grail: left sidebar + top header + main content | React Admin: sidebar + top toolbar + content |
| **Colors** | Blue header, blue active sidebar item, green/red for metrics | React Admin: blue theme, dark sidebar |
| **Sidebar** | Icons + labels, active item highlighted in blue | React Admin: Material UI icons |
| **Top Bar** | "Mega Search" center, "+" button, dark mode toggle, user avatar | React Admin: search, user menu |
| **Dashboard** | Metric cards (revenue, leads, quotes), bar charts, donut charts | React Admin: List views |
| **Tables** | Checkbox column, text left-aligned, currency right-aligned, action icons | React Admin: Datagrid with rowClick |
| **Forms** | Sectioned with headers + subtext, tabs, side-by-side fields, required * | React Admin: SimpleForm |
| **Buttons** | Solid blue primary, light secondary, rounded corners | React Admin: blue primary, white secondary |
| **Cards** | White background, light gray borders, subtle shadow | Material UI Paper cards |

### Key Differences
1. **Dashboard**: Krayin has metric cards + charts; ours is just a default React Admin dashboard
2. **Leads View**: Krayin uses Kanban board with pipeline stages; ours uses Datagrid table
3. **Forms**: Krayin uses tabbed sections with descriptive subtext; ours uses single-page forms
4. **Table Actions**: Krayin uses icon buttons (eye/pencil/trash); ours uses rowClick="edit"
5. **Color badges**: Krayin uses colored status tags; ours uses plain text

## Redesign Plan

### Phase 1: Theme & Layout (Quick Wins — 1-2 hours)
1. **Customize React Admin theme** to match Krayin's blue (#3b82f1) primary color
2. **Replace default sidebar icons** with matching icons
3. **Add Krayin-style top header** with "Mega Search" + dark mode toggle
4. **Fix favicon** — change from default to Nexus logo

### Phase 2: Dashboard Redesign (2-3 hours)
1. **Custom Dashboard page** replacing default RA dashboard:
   - Metric cards: Won Revenue, Lost Revenue, Total Leads, Total Quotes
   - Bar chart: Leads over time (matching Krayin's chart)
   - Donut chart: Revenue by type
   - Tables: Top Products, Top Persons (or Agents)

### Phase 3: Leads View — Kanban Pipeline (3-4 hours)
1. **Custom Kanban board** instead of Datagrid:
   - Vertical columns for each pipeline stage (New, Follow Up, Prospect, etc.)
   - Color-coded cards with avatar initials, company name, subject
   - Status badges (Urgent, VIP, etc.)
   - Progress bars showing value per stage

### Phase 4: Table Redesign (2-3 hours)
1. Replace `rowClick="edit"` with action column showing eye/edit/delete icons
2. Add status badge columns with colored labels
3. Add currency formatting to financial columns
4. Add pagination controls matching Krayin style

### Phase 5: Form Redesign (4-5 hours)
1. Use tabbed layout for Create/Edit forms (matching Krayin's 3-tab pattern)
2. Add section headers with descriptive subtext
3. Side-by-side field layout for related fields
4. Required field indicators (*)
5. Conditional fields (shipping = billing toggle)

## Implementation Priority
1. **Phase 1** (Layout/Theme) — most visible, immediate impact
2. **Phase 3** (Leads Kanban) — core Krayin feature
3. **Phase 2** (Dashboard) — second most important
4. **Phase 4** (Tables) — polish
5. **Phase 5** (Forms) — most complex

## Dependencies
- `recharts` — already included in React Admin (for charts)
- `lucide-react` — already installed (for icons)
- No additional packages needed
