# EWCCMS — Complete Frontend UI/UX Requirements

**Project:** Employee WhatsApp Communication System (EWCCMS)  
**Organization context:** MAPIMS / Adhiparasakthi Hospitals  
**Version:** 1.0 — 30 October 2026  
**Purpose:** Screen-by-screen frontend implementation specification for 6 modules / 21 screens.  
**Suggested stack:** React + Vite + TypeScript, Tailwind CSS, shadcn/ui, Lucide icons, React Hook Form + Zod, TanStack Table and Query, Recharts.

> This is a UI/UX specification, not evidence that any WATI API capability is available. Confirm template endpoints, media handling, scheduling behavior, webhook authentication, messaging limits and pricing against the connected WATI account. The frontend must never directly expose API credentials.

---

## A. Global design system and application shell

### A1. Visual language
- **Primary:** white (#FFFFFF); secondary surfaces: #F8FAFC and #F1F5F9.
- **Primary action:** teal (#0F766E), hover #115E59; **administrative accent:** maroon (#7F1D1D), used sparingly for approval/critical operations; **danger:** accessible error red for destructive confirmation; success green; neutral gray for secondary actions. Avoid yellow as a primary brand color.
- Font: Inter or system sans-serif. Headings 20–28 px; body 14–16 px; labels 12–14 px; tables at least 13 px where possible.
- Cards: 10–14 px radius; subtle borders; consistent 8 px spacing grid; minimum touch target ~44 px.
- Desktop-first responsive design; mobile collapses sidebar into drawer; tables scroll horizontally or become stacked cards.
- Accessibility: WCAG AA color contrast, keyboard navigation, visible focus, descriptive labels, semantic alerts, aria-live for asynchronous results, screen-reader-friendly statuses.

### A2. Global page shell
```text
┌─────────────────────────────────────────────────────────────────────────┐
│ EWCCMS   [Sidebar]   Breadcrumb / Page Title    Search   Alerts  User │
├──────────────────┬──────────────────────────────────────────────────────┤
│ Dashboard        │ Page title                       Primary action     │
│ Employee Mgmt    │ Description / status banner                         │
│ WhatsApp Tmpl    │ KPI cards / filters / tabs / content                 │
│ Campaign Mgmt    │ Table / editor / preview / charts                    │
│ Reports          │ Pagination / secondary actions                      │
│ Administration   │                                                      │
└──────────────────┴──────────────────────────────────────────────────────┘
```
- Topbar: breadcrumb, optional global employee/campaign search, notifications, profile menu, logout.
- Sidebar: grouped collapsible modules, current page highlight, role-based visibility, badge for pending approvals and failures when data exists.
- Every data page: skeleton loading, empty state with next action, error state with retry, pagination, filters, reset filters, confirmation for destructive actions, toast for outcomes.
- Form behavior: required-field indicators, inline validation, unsaved-changes warning, disabled submit during processing, prevention of duplicate submissions.
- Dates and timestamps: show local timezone (Asia/Kolkata for hospital operations), retain timezone-aware timestamps in backend.
- Privacy: mask employee phone numbers where role does not need full visibility; never show WATI tokens in browser responses or logs.

### A3. Shared components to build once
`AppSidebar`, `Topbar`, `Breadcrumbs`, `PageHeader`, `StatCard`, `DataTable`, `SearchInput`, `FilterBar`, `CategorySelect`, `DepartmentSelect`, `EmployeeMultiSelect`, `StatusBadge`, `EmptyState`, `ErrorState`, `ConfirmDialog`, `DrawerForm`, `FileDropzone`, `UploadPreviewTable`, `TemplateSelector`, `VariableEditor`, `WhatsAppPhonePreview`, `RecipientCountSummary`, `CampaignStepper`, `ApprovalTimeline`, `DateTimePicker`, `ExportDialog`, `AuditTimeline`, `PermissionGuard`.

### A4. Shared interaction rules
- Employee category → department → recipient filtering is cascading; changing a parent filter clears incompatible selections.
- Recipient selection always shows **matching**, **selected**, **valid**, **opted-out**, **duplicate**, **invalid** and **eligible** counts, derived from actual records.
- WATI template bodies are **not free-form editable for immediate sending**: allow draft edits for submission/approval, while approved-template campaigns only populate approved variables and supported media slots.
- Campaign approval binds to an immutable revision of content, recipient criteria/list snapshot, media, and schedule. Editing after approval requires new approval.
- Campaign sending and retry buttons show idempotency-aware confirmation and accurate server-confirmed results; a request accepted by WATI is not the same as delivered to the employee.
- All records and stats must come from APIs. No fabricated metrics, sample phone numbers, or hard-coded statuses in production.

---

## B. Final navigation tree (21 screens)

```text
Dashboard
└── Dashboard

Employee Management
├── Employee List
├── Import Employees
├── Employee Categories
└── Department Management

WhatsApp Templates
├── Template Library
├── Template Designer
└── Media Library

Campaign Management
├── Create Campaign
├── Draft Campaigns
├── Schedule Campaigns
├── Campaign History
└── Campaign Approval

Reports & Monitoring
├── Delivery Reports
├── Campaign Analytics
├── Failed Messages
└── Export Reports

Administration
├── Users & Roles
├── WATI Integration
├── Audit Logs
└── WhatsApp Consent & Opt-Outs
```

---

## C. Screen-by-screen UI specifications

### 01. Dashboard
**Purpose:** Admin landing page with actionable operational overview.
- **Layout:** page header with date-range selector and `Create Campaign` CTA; row of 4–6 KPI cards; campaign activity chart; recent campaigns table; quick actions panel; pending approval panel.
- **KPIs:** total active employees, consented eligible employees, campaigns created, messages submitted, delivered, failed, pending approvals (each with explicit time period).
- **Charts:** campaign volume by day/week, delivery breakdown with status definitions; category distribution if useful.
- **Table columns:** campaign name, category/department scope, created by, scheduled/sent time, status, recipients, action `View`.
- **Controls:** date range, refresh, `Create Campaign`, `Import Employees`, `Review Approvals`, `View Reports`.
- **States:** no campaigns yet; WATI disconnected; data delayed; loading; API failure.
- **Access:** all authenticated roles, filtered to permitted data.

### 02. Employee List
**Purpose:** Searchable employee master and contact management.
- **Layout:** header + `Add Employee` and `Import Excel` buttons; filter bar; count strip; paginated table; add/edit drawer; profile detail drawer.
- **Filters:** employee ID/name/WhatsApp number search, category, department, employment status, WhatsApp eligibility/consent.
- **Table columns:** checkbox, employee ID, name, category, department, designation (optional), WhatsApp number (masked as appropriate), consent status, active status, last updated, actions.
- **Add/Edit form:** employee ID (unique), name, category, department, designation, WhatsApp number with country code, active/inactive, consent reference/status; validation for required fields and duplicates.
- **Actions:** add, edit, deactivate/reactivate, view profile, filtered export if authorized; bulk actions only after confirmation.
- **Validation:** normalize E.164 numbers; duplicate ID/phone warnings; department/category consistency; never infer consent from phone number alone.
- **States:** empty list, no matching filters, invalid number, duplicate, API error, save success.
- **Access:** Super Admin/Admin edit; Creator/Approver view where allowed.

### 03. Import Employees
**Purpose:** Safe Excel/CSV employee import with preview before commit.
- **Layout:** stepper `Upload → Map Columns → Validate → Review → Import Results`.
- **Upload panel:** drag-and-drop `.xlsx`/`.csv`, file size limit displayed, downloadable sample template, import guidance.
- **Mapping:** source headers to employee ID, name, WhatsApp, category, department, status, designation, consent reference.
- **Preview table:** row number, mapped fields, validation status, issue detail; tabs `All`, `Valid`, `Warnings`, `Rejected`.
- **Controls:** `Download Sample`, `Upload`, `Back`, `Revalidate`, `Download Errors`, `Confirm Import`.
- **Import options:** skip duplicates / update existing by employee ID (explicit choice); never silently overwrite consent.
- **Result view:** inserted, updated, skipped, rejected counts; downloadable error file and import job ID.
- **States:** wrong format, malformed rows, too many rows, duplicate employee ID, missing department, server timeout; support resumable background job status for large files.
- **Access:** Super Admin/Admin.

### 04. Employee Categories
**Purpose:** Manage top-level employee classifications.
- **Layout:** category cards or table; `Add Category` CTA; edit modal/drawer.
- **Fields:** category name, description, active status, optional display order.
- **Table:** name, employee count, department count (if applicable), status, created/updated, actions.
- **Defaults:** Teaching, Non-Teaching, Housekeeping; categories are editable configuration, not fixed hard-coded labels.
- **Controls:** add, edit, deactivate, search, sort; warn before disabling categories referenced by employees.
- **States:** no categories, duplicate name, category in use, permission denied.
- **Access:** Super Admin/Admin edit; other authorized users read-only.

### 05. Department Management
**Purpose:** Maintain hospital departments and mappings.
- **Layout:** searchable table + `Add Department` drawer; optional category tree view.
- **Fields:** department code (unique), department name, linked category/categories as business rules permit, status, optional HOD/contact.
- **Table:** code, department, linked category, employee count, active status, actions.
- **Controls:** add, edit, deactivate, category filter, search, view mapped employees.
- **Validation:** prevent ambiguous duplicate codes; explain impact of disabling a department; preserve historical campaign references.
- **Access:** Super Admin/Admin edit; others read-only if authorized.

### 06. Template Library
**Purpose:** Browse WATI templates and their approval status.
- **Layout:** header with `Sync from WATI`, `Create Draft` actions; tabs `Approved`, `Pending`, `Rejected`, `Drafts`; searchable cards/table.
- **Filters:** template name, language, category, status, media type.
- **Template card/table:** name, WATI identifier, language, template category, header/body preview, variables count, buttons/media support, status, last synced.
- **Actions:** preview, use in campaign (approved only), open in designer, duplicate as local draft, sync, inspect rejection reason.
- **States:** integration disconnected, sync failed, no approved templates, template retired/changed.
- **Access:** Super Admin/Admin manage; Creator use approved templates and draft; others as permitted.

### 07. Template Designer
**Purpose:** Prepare template drafts and populate approved-template parameters with a real-time WhatsApp preview.
- **Layout:** two-column desktop: left editor (55–60%), right sticky phone preview (40–45%); tabs `Draft Template` / `Approved Template Parameters`.
- **Draft editor:** template name, language, category, header type (none/text/image/document/video only if supported), body text, footer, button configuration within supported WATI/Meta rules, named/numbered variables, sample values.
- **Approved mode:** read-only approved body; editable variable values and permitted dynamic media fields only.
- **Preview:** WhatsApp-like phone mockup, sample employee selector, variable substitution, header media, footer, button labels; unresolved variable warning.
- **Controls:** `Save Draft`, `Preview`, `Submit for Approval` (only if integration supports this action), `Use Approved Template`, `Discard Changes`.
- **Validation:** template length/variable constraints from actual provider, required sample values, supported media formats, language compatibility, button schema, no raw HTML injection.
- **States:** unsaved changes, pending approval, rejected with reason, sync mismatch, no sample employee, missing variable.
- **Access:** Super Admin/Admin/Creator draft; approval/submission permissions controlled by backend.

### 08. Media Library
**Purpose:** Store and select approved media assets for messages.
- **Layout:** grid/list toggle, search, type filter, upload button, preview drawer.
- **Asset card:** thumbnail/file icon, filename, type, size, upload date, uploader, usage count, availability status.
- **Controls:** upload, preview, copy internal asset reference, attach to template, rename, archive/delete when unused.
- **Validation:** allowed MIME types and size limits driven by WATI/Meta and server policy; virus scanning; prevent public exposure of sensitive files; retention rules.
- **States:** unsupported file, upload failed, processing, expired remote media reference, referenced asset cannot be deleted.
- **Access:** Super Admin/Admin manage; Creator upload/use as authorized.

### 09. Create Campaign
**Purpose:** Guided creation of a recipient-targeted WhatsApp campaign.
- **Layout:** full-width 5-step wizard with persistent summary sidebar on desktop.
- **Step 1 — Details:** campaign name, description/purpose, optional tags, creator.
- **Step 2 — Recipients:** category, department, search, employee multi-select; show matching/selected/eligible/invalid/opted-out/duplicate counts and exclusion reasons; freeze recipient snapshot on submission.
- **Step 3 — Template:** approved template picker, language, supported media, variable mapping; personal fields (e.g., employee name) and shared fields (date/time/location).
- **Step 4 — Preview:** personalized phone preview with sample recipient switcher; first/last recipient previews; warning list for unresolved placeholders.
- **Step 5 — Review:** campaign details, template ID/revision, recipient snapshot summary, estimated message count and costs if provider data available; `Save Draft` / `Submit for Approval`.
- **Controls:** Back, Next, Save Draft, Preview, Submit for Approval; explicit confirmation before submission.
- **Validation:** no empty eligible audience; no unapproved template; no unresolved variables; consent/opt-out checks again at dispatch; no self-approval.
- **States:** no eligible recipients, template changed since draft, concurrent edits, approval pending, submission failed.
- **Access:** Super Admin/Admin/Creator.

### 10. Draft Campaigns
**Purpose:** Resume and manage unfinished campaign work.
- **Layout:** searchable table with tabs `My Drafts` / `All Drafts` (role permitting).
- **Columns:** campaign name, template, target category/department, selected count, last modified, owner, status, actions.
- **Actions:** continue editing, duplicate, delete with confirmation, submit for approval.
- **States:** empty drafts, stale template, stale recipient data, unsaved conflict.
- **Access:** Creator own drafts; Admin/Super Admin broader visibility.

### 11. Schedule Campaigns
**Purpose:** View and manage future-approved dispatches.
- **Layout:** calendar/list toggle; upcoming campaigns cards and paginated table.
- **Fields:** campaign name, approved revision, schedule date/time/timezone, recipient count, owner, status.
- **Controls:** view, schedule approved campaign, reschedule (may require reapproval), cancel, filter by date/status.
- **Rules:** scheduling cannot bypass approval; disallow dates in past; indicate whether WATI or application queue owns scheduling; recheck consent at send time.
- **States:** scheduled, awaiting approval, queued, running, cancelled, expired, failed; no misleading `sent` before API acceptance.
- **Access:** Admin/Super Admin schedule; Creator may request scheduling but not bypass approval.

### 12. Campaign History
**Purpose:** Immutable record of past and ongoing campaign activity.
- **Layout:** date range + filters + table; click row opens detail page/drawer with timeline.
- **Columns:** campaign ID/name, template, category/department, owner, approved by, created/sent date, target/eligible/submitted counts, current status.
- **Detail sections:** approved snapshot, recipient list with restricted phone display, dispatch timeline, aggregate delivery, failure breakdown, approval trail, audit history.
- **Actions:** view, export authorized data, duplicate as new draft; never edit a sent campaign.
- **States:** draft, awaiting approval, rejected, scheduled, processing, completed, partial failure, cancelled.
- **Access:** role-scoped records.

### 13. Campaign Approval
**Purpose:** Four-eyes review of messages before bulk delivery.
- **Layout:** tabs `Pending`, `Approved`, `Rejected`; queue table; review detail split view.
- **Queue columns:** campaign, requester, submitted at, target group, eligible recipients, template, urgency/priority if defined, status.
- **Review detail:** message preview, all variable values, recipient snapshot/count, exclusions, media, schedule, estimated cost if known, version hash/revision.
- **Actions:** `Approve`, `Reject`, `Request Changes` with required comment for rejection; confirmation modal for approval.
- **Security:** cannot approve own campaign; approver sees exact immutable content; post-approval edits invalidate approval; log who/when/why.
- **States:** pending, rejected, approved, withdrawn, superseded revision, concurrent approval conflict.
- **Access:** Approver, Admin/Super Admin subject to separation-of-duties rule.

### 14. Delivery Reports
**Purpose:** Track provider submission and recipient delivery outcomes.
- **Layout:** date/campaign/category/department filters; KPI cards; status chart; detailed message table.
- **KPIs:** queued, submitted/accepted, sent (when provider confirms), delivered, read (where available), failed, unknown; clarify denominators and status semantics.
- **Columns:** message/campaign ID, employee ID/name, masked number, template, submitted at, last provider status, status timestamp, error code.
- **Actions:** drill into message, refresh, authorized export, link to failure details.
- **States:** webhook lag, read receipts unavailable, partial data, reconciliation needed, no messages.
- **Access:** Super Admin/Admin all; Creator own; Approver assigned; Viewer authorized scope.

### 15. Campaign Analytics
**Purpose:** Analyze communication performance by audience and time.
- **Layout:** date range; category/department/template filters; charts and comparison tables.
- **Visuals:** campaigns by period, delivery/read rates by department, template usage, failure trends, recipient coverage; tooltip definitions.
- **Metrics:** delivery rate = delivered / provider-confirmed submitted messages (state denominator explicitly); read rate = read / delivered where receipt data available; distinguish pending/unknown.
- **Actions:** filter, drill down, export chart data; show empty/insufficient-data states.
- **Access:** role-scoped analytics.

### 16. Failed Messages
**Purpose:** Diagnose and safely handle failed sends.
- **Layout:** status summary, filter bar, paginated failure table, error detail drawer.
- **Filters:** campaign, date, error category, retry eligibility, department, template.
- **Columns:** employee ID, masked number, campaign, provider error code, error description, attempts, last attempted, retry eligibility, action.
- **Actions:** inspect, retry eligible failed message, bulk retry eligible (authorized), export failures; confirmation required.
- **Rules:** idempotency key; do not retry accepted-but-unconfirmed messages blindly; block opt-outs and invalid numbers; respect provider rate limits.
- **States:** retry pending, permanently failed, blocked by consent, unknown delivery status, resolved.
- **Access:** Admin/Super Admin retries; others view scoped failures.

### 17. Export Reports
**Purpose:** Generate auditable downloadable reports.
- **Layout:** report type cards + configuration panel + export jobs history table.
- **Types:** campaign summary, delivery detail, failure detail, category/department analysis, approved campaign audit extract (as permitted).
- **Fields:** report type, date range, category, department, campaign, status, output format CSV/XLSX.
- **Controls:** `Generate Report`, `Download`, `Cancel Job` if supported; large reports generated asynchronously.
- **Validation:** date range limits, permission-based columns, masked personal data when required, secure expiring downloads.
- **States:** queued, generating, ready, expired, failed; empty report.
- **Access:** role-scoped export rights.

### 18. Users & Roles
**Purpose:** Manage admin accounts and least-privilege access.
- **Layout:** tabs `Users` / `Roles & Permissions`; users table; add/edit user drawer; permission matrix.
- **User fields:** name, work email/login, assigned role, department scope (optional), active status, last login.
- **Roles:** Super Admin, Admin, Campaign Creator, Approver, Viewer.
- **Controls:** invite/create, edit role, deactivate, reset access through secure flow, inspect permission matrix.
- **Security:** do not allow privilege escalation, protect final Super Admin, require secure password/MFA policy as configured; backend must enforce all permissions.
- **States:** duplicate email, invite pending, disabled account, insufficient permission.
- **Access:** Super Admin full; Admin limited user administration if explicitly granted.

### 19. WATI Integration
**Purpose:** Monitor and configure the WATI backend connection.
- **Layout:** connection status card, setup checklist, template sync panel, webhook health panel, recent API errors.
- **Fields shown:** connection status, masked account identifier, last successful sync, webhook last received, enabled features, queue health; never show raw token.
- **Controls:** `Test Connection`, `Sync Templates`, `Refresh Status`, `Rotate Credentials` via secure server-side workflow if supported.
- **Warnings:** no connection, invalid token, quota/rate limit, missing webhook events, unsupported template feature.
- **Access:** Super Admin only for secrets/config; authorized Admin may view health status.

### 20. Audit Logs
**Purpose:** Trace critical changes and sending decisions.
- **Layout:** date/user/module/action filters, chronological table, expandable event detail.
- **Columns:** timestamp, actor, role, action, resource type/ID, before/after summary (redacted), source IP if policy permits, result.
- **Tracked events:** employee import/edit, consent update, template changes, campaign submit/approve/reject, scheduling, send/retry, integration config, role changes, report export.
- **Controls:** filter, view details, export if authorized; logs are read-only and append-only to application users.
- **States:** no results, retention boundary, event ingestion delayed.
- **Access:** Super Admin; Admin read-only as permitted.

### 21. WhatsApp Consent & Opt-Outs
**Purpose:** Respect employee communication preferences and suppress ineligible recipients.
- **Layout:** consent status KPIs; employee search/filter table; consent detail drawer; opt-out queue.
- **Columns:** employee ID, name, category, department, masked WhatsApp number, consent status, source, consent timestamp, opt-out timestamp, last update.
- **Actions:** record consent with source/evidence, update preference, record opt-out, inspect history, authorized export.
- **Rules:** phone number possession is not consent; do not auto-opt-in imported contacts; suppress opted-out contacts at audience creation **and** dispatch; record purpose/category and evidence; apply relevant WhatsApp/Meta policies and local law.
- **States:** unknown consent, opted-in, opted-out, pending verification, stale/missing evidence.
- **Access:** Admin/Super Admin manage; Creator/Approver see eligibility only as needed.

---

## D. Role permissions (default baseline)

| Capability | Super Admin | Admin | Creator | Approver | Viewer |
|---|---|---|---|---|---|
| Dashboard | All | All | Scoped | Scoped | Scoped |
| Employees | CRUD | CRUD | View | View | None |
| Categories / Departments | CRUD | CRUD | View | View | None |
| Templates / Media | Manage | Manage | Draft/Use | View | None |
| Create / Edit Campaign | Yes | Yes | Own | No | No |
| Approve Campaign | Other users' | Other users' | No | Assigned | No |
| Schedule / Dispatch | Yes after approval | Yes after approval | Request only | No | No |
| Campaign History | All | All | Own | Assigned | Scoped |
| Reports / Export | All | All | Own | Assigned | Authorized |
| Retry Failures | Yes | Yes | No | No | No |
| Users & Roles | Full | Limited | No | No | No |
| WATI Credentials | Full | No | No | No | No |
| Audit Logs | Full | Read | No | No | No |
| Consent Records | Manage | Manage | Eligibility only | Eligibility only | No |

**Important:** Menu visibility is a UX convenience; the API must enforce permissions independently. Approval and dispatch must be separated so a creator cannot self-approve.

---

## E. High-priority end-to-end UI journeys

### Journey 1 — Employee onboarding by import
`Employee Management → Import Employees → Upload → Map → Validate → Review → Import → Employee List`.

### Journey 2 — Template preparation
`WhatsApp Templates → Template Library → Template Designer → Save Draft / Submit for Provider Approval → Sync Status → Approved Template Available`.

### Journey 3 — Campaign creation and sending
`Create Campaign → Details → Filter Recipients → Choose Approved Template → Fill Variables → Preview → Review → Submit Approval → Approver Reviews → Approve → Send Now / Schedule → Queue → WATI → Delivery Reports`.

### Journey 4 — Rejection and revision
`Campaign Approval → Reject / Request Changes (comment) → Draft Campaigns → Edit → New Revision → Resubmit`.

### Journey 5 — Failure investigation
`Delivery Reports → Failed Messages → Inspect Error → Check Consent / Provider Acceptance → Retry If Safe → Updated Report`.

---

## F. Suggested routes

```text
/dashboard
/employees
/employees/import
/employees/categories
/employees/departments
/templates
/templates/designer
/templates/media
/campaigns/create
/campaigns/drafts
/campaigns/scheduled
/campaigns/history
/campaigns/approvals
/reports/delivery
/reports/analytics
/reports/failed
/reports/export
/admin/users
/admin/wati
/admin/audit
/admin/consent
```

Optional detail routes or drawers: `/employees/:id`, `/campaigns/:id`, `/templates/:id`, `/campaigns/:id/approval`.

---

## G. Implementation phases and acceptance criteria

| Phase | Deliverables | Acceptance checks |
|---|---|---|
| 1. Foundation | App shell, navigation, auth, design system, RBAC | Responsive sidebar; unauthorized pages/API blocked; loading/empty/error states |
| 2. Employee management | Screens 02–05 and 21 | Excel import validation; duplicates handled; consent preserved; category/department filters work |
| 3. Templates and media | Screens 06–08 | Approved templates sync; draft vs approved editing enforced; variable preview accurate |
| 4. Campaign workflows | Screens 09–13 | Recipient eligibility counted; draft saved; approver cannot self-approve; revision lock works |
| 5. Dispatch integration | Queue, schedule, WATI API | No duplicate sends; safe retries; provider response vs delivery distinguished |
| 6. Monitoring | Screens 01 and 14–17 | Webhook status reflected; reports scoped; exports downloadable and auditable |
| 7. Administration and hardening | Screens 18–20, security tests | Integration secrets hidden; audit immutable; keyboard/mobile testing passes |

### Definition of done for every screen
- [ ] Page matches shared design system and breadcrumb hierarchy.
- [ ] Desktop, tablet and mobile responsive layouts verified.
- [ ] All buttons perform real actions or are clearly disabled; no dead controls.
- [ ] API-backed data and permission guards implemented.
- [ ] Form validation, confirmation dialogs and unsaved-changes behavior covered.
- [ ] Loading, empty, success, error and permission-denied states implemented.
- [ ] Keyboard navigation, focus states and accessible labels verified.
- [ ] Automated component/integration tests cover main interactions.
- [ ] Audit events created for sensitive actions where applicable.

---

## H. Frontend build sequence for coding agents

1. Create the application shell, route definitions, theme tokens and 21 sidebar links.
2. Build reusable tables, filters, forms, drawers, badges, dialogs and notification components.
3. Implement employee list, import, categories and departments with mock API interfaces initially.
4. Implement WATI template library and designer with **strict approved-template versus draft behavior**.
5. Implement WhatsApp preview with recipient-specific variable substitution.
6. Implement campaign wizard and persisted drafts.
7. Implement campaign approval queue, immutable revisions and schedule UI.
8. Connect backend queue and WATI integration; keep credentials server-side.
9. Implement reports, failures, exports, audit and consent management.
10. Replace mocks with live APIs, add tests, verify security and perform user acceptance testing.

**Scope guard:** Do not add birthdays, recurring reminders, shared inbox or other unselected modules without a separate change request.
