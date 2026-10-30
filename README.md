# Employee WhatsApp Communication System (EWCCMS)
### Organization: MAPIMS / Adhiparasakthi Hospitals
**Version:** 1.0 (Hospital Enterprise Architecture)

EWCCMS is a mission-critical, enterprise-grade WhatsApp broadcast and staff duty alert management application built for MAPIMS / Adhiparasakthi Hospitals. It enforces four-eyes approval workflows, strict least-privilege Role-Based Access Control (RBAC), and dual-gate WhatsApp consent and opt-out suppression.

---

## 🏥 Hospital Enterprise Design System

The application strictly implements the required enterprise theme:
- **Primary:** Navy Blue (`#243B67`)
- **Secondary:** Maroon (`#7B2846`)
- **Background:** White (`#FFFFFF`)
- **Page Background:** Light Gray (`#F5F7FB`)
- **Text:** Dark Slate (`#1F2937`)
- **Border:** `#E2E8F0`

*(Teal/green are deliberately omitted as primary branding colors).*

---

## 📦 Architecture & Tech Stack

### Frontend (`/frontend`)
- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4 with custom Hospital Enterprise design tokens
- **Icons:** Lucide React
- **Routing:** React Router v7
- **Data & State:** TanStack React Query + React Context (`AuthContext` with role switcher, `ToastContext`)
- **Forms & Validation:** React Hook Form + Zod
- **Analytics & Visuals:** Recharts

### Backend (`/backend`)
- **Server:** Node.js + Express.js + TypeScript
- **Database:** MongoDB with Mongoose schemas
- **Authentication & RBAC:** JWT with secure token handling and separation-of-duties enforcement
- **Queues & Scheduling:** Redis + BullMQ for asynchronous broadcasts and exponential backoff
- **Gateway Integration:** WATI / Meta WhatsApp Business API integration module
- **File Processing:** ExcelJS for bulk staff roster import and downloadable reports

---

## 🧭 Implemented Modules & 21 Screens

```text
Dashboard
└── 01. Dashboard (/dashboard)

Employee Management
├── 02. Employee List (/employees)
├── 03. Import Employees (/employees/import)
├── 04. Employee Categories (/employees/categories)
└── 05. Department Management (/employees/departments)

WhatsApp Templates
├── 06. Template Library (/templates)
├── 07. Template Designer (/templates/designer)
└── 08. Media Library (/templates/media)

Campaign Management
├── 09. Create Campaign (/campaigns/create)
├── 10. Draft Campaigns (/campaigns/drafts)
├── 11. Schedule Campaigns (/campaigns/scheduled)
├── 12. Campaign History (/campaigns/history)
└── 13. Campaign Approval (/campaigns/approvals)

Reports & Monitoring
├── 14. Delivery Reports (/reports/delivery)
├── 15. Campaign Analytics (/reports/analytics)
├── 16. Failed Messages (/reports/failed)
└── 17. Export Reports (/reports/export)

Administration
├── 18. Users & Roles (/admin/users)
├── 19. WATI Integration (/admin/wati)
├── 20. Audit Logs (/admin/audit)
└── 21. WhatsApp Consent & Opt-Outs (/admin/consent)
```

---

## 🔒 Security & Hospital Governance Highlights

1. **Separation of Duties (Four-Eyes Principle)**:
   - Campaign creators are strictly prohibited from approving their own campaigns.
   - An independent authorized approver (e.g., Medical Director, Dean) must sign off on the immutable snapshot.

2. **WATI Secret Isolation**:
   - Access tokens and API secrets are never exposed in browser state or network payloads.
   - All Meta API calls and webhook validations occur strictly on the backend.

3. **Dual-Gate Opt-Out Suppression**:
   - Employees who opt out (or reply with WhatsApp `STOP` keyword) are blocked at:
     1. Audience selection in the Campaign Wizard.
     2. Real-time pre-dispatch immediately prior to WATI transmission.

4. **Live WhatsApp Phone Preview**:
   - High-fidelity WhatsApp mobile device mockup showing dynamic variable substitution, header media (Images, PDFs, Videos), interactive action pills, and unmapped placeholder warnings.

---

## 🚀 Running the Application Locally

### Frontend (React 19 + Vite)
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

### Backend (Node.js + Express + TypeScript)
```bash
cd backend
npm install
npm run start
# Running on http://localhost:5000 (Health check: http://localhost:5000/api/health)
```
