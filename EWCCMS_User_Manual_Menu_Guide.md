# 🏥 APH Connect — Employee Communication Platform
### *One Platform. Every Employee. Connected.*
## Comprehensive User Manual & Menu Reference Guide
**Organization:** MAPIMS / Adhiparasakthi Hospitals  
**Version:** 1.0 (Hospital Enterprise Edition)  
**System Base URL:** `http://localhost:5173`

---

## 📑 Table of Contents

1. [System Architecture & Role-Based Access Control](#-system-architecture--role-based-access-control)
2. [Module 1: Dashboard](#1-dashboard)
   - [01. Dashboard (`/dashboard`)](#01-dashboard)
3. [Module 2: Employee Management](#2-employee-management)
   - [02. Employee List (`/employees`)](#02-employee-list)
   - [03. Import Employees (`/employees/import`)](#03-import-employees)
   - [04. Employee Categories (`/employees/categories`)](#04-employee-categories)
   - [05. Department Management (`/employees/departments`)](#05-department-management)
4. [Module 3: WhatsApp Templates](#3-whatsapp-templates)
   - [06. Template Library (`/templates`)](#06-template-library)
   - [07. Template Designer (`/templates/designer`)](#07-template-designer)
   - [08. Media Library (`/templates/media`)](#08-media-library)
5. [Module 4: Campaign Management (Message Broadcasts)](#4-campaign-management)
   - [09. Create Campaign (`/campaigns/create`)](#09-create-campaign)
   - [10. Draft Campaigns (`/campaigns/drafts`)](#10-draft-campaigns)
   - [11. Schedule Campaigns (`/campaigns/scheduled`)](#11-schedule-campaigns)
   - [12. Campaign History (`/campaigns/history`)](#12-campaign-history)
   - [13. Campaign Approval (`/campaigns/approvals`)](#13-campaign-approval)
6. [Module 5: Reports & Monitoring](#5-reports--monitoring)
   - [14. Delivery Reports (`/reports/delivery`)](#14-delivery-reports)
   - [15. Campaign Analytics (`/reports/analytics`)](#15-campaign-analytics)
   - [16. Failed Messages (`/reports/failed`)](#16-failed-messages)
   - [17. Export Reports (`/reports/export`)](#17-export-reports)
7. [Module 6: Administration & Governance](#6-administration--governance)
   - [18. Users & Roles (`/admin/users`)](#18-users--roles)
   - [19. WATI Integration (`/admin/wati`)](#19-wati-integration)
   - [20. Audit Logs (`/admin/audit`)](#20-audit-logs)
   - [21. WhatsApp Consent & Opt-Outs (`/admin/consent`)](#21-whatsapp-consent--opt-outs)
8. [Hospital Governance Safeguards](#-hospital-governance-safeguards)

---

## 🔐 System Architecture & Role-Based Access Control

The EWCCMS enforces strict least-privilege access across 5 standard user roles:

| Role | Responsibilities | Key Capabilities |
| :--- | :--- | :--- |
| **Super Admin** | IT Management & System Administration | Full access, system configuration, WATI API tokens, user provisioning, audit inspection. |
| **Admin** | Hospital Operations & HR Department Heads | Employee management, roster imports, template management, retry management. |
| **Campaign Creator** | Duty In-Charges, HR Coordinators, Nursing Superintendents | Draft campaigns, select target audiences, configure dynamic variables, submit broadcasts. |
| **Approver** | Medical Director, Dean, Hospital Superintendent | Review immutable campaign snapshots, approve or reject broadcasts with formal commentary. |
| **Viewer** | Clinical Auditors, NABH Inspectors, Management Observers | Read-only access to campaign analytics, delivery logs, and audit trails. |

> **Authentication & Login Portal (`/login`):**
> Users authenticate using their official MAPIMS hospital email address. The login portal features interactive **1-Click Demo Accounts** to switch seamlessly between all five clinical and administrative roles for demonstration and testing.

> **Role Switcher in UI:** For testing and demonstration, users can switch between roles dynamically using the dropdown menu located at the top-right corner of the application navigation bar, or sign out to return to `/login`.

---

## 1. Dashboard

### 01. Dashboard
- **Route URL:** `/dashboard`
- **Permitted Roles:** Super Admin, Admin, Campaign Creator, Approver, Viewer

#### Purpose
The primary executive command center for hospital administrators. Provides real-time visibility into broadcast operations, delivery success metrics, upcoming scheduled alerts, and pending clinical reviews.

#### Key Features
- **Key Performance Indicator (KPI) Strip:**
  - Total Active Hospital Staff
  - Consented Eligible Numbers (with verified opt-in percentage)
  - Active Broadcast Campaigns
  - 24-Hour Message Delivery Rate
  - Pending Approval Action Banner (prominently alerts approvers when clinical broadcasts await review)
- **Interactive Visualizations:**
  - Weekly Campaign Broadcast Volume (stacked bar chart: Sent vs. Delivered vs. Failed)
  - Delivery Status Breakdown (pie chart: Delivered & Read, Delivered Unread, Failed/Bounced, Opted-Out Suppressed)
- **Recent Broadcasts Table:** Quick status tracking for the most recent campaigns.
- **Quick Action Buttons:** Direct shortcuts to create campaigns, import staff rosters, or review pending broadcasts.

#### How to Use It
1. Review the top KPI cards to confirm overall platform health and WhatsApp delivery rates.
2. Select the date filter dropdown (*Today*, *Last 7 Days*, *Last 30 Days*, or *This Quarter*) to update metrics and charts.
3. If the amber **Pending Approvals Banner** is visible, click **Review Campaigns** to jump directly to the approval queue.
4. Click **Create Campaign** in the header to launch a new staff alert wizard.

---

## 2. Employee Management

### 02. Employee List
- **Route URL:** `/employees`
- **Permitted Roles:** Super Admin, Admin (Full Edit); Creator, Approver, Viewer (View-Only)

#### Purpose
Master directory of hospital personnel across clinical, nursing, administrative, and paramedical cadres. Manages individual contact records, department associations, and WhatsApp consent eligibility.

#### Key Features
- **Multi-Factor Filter Bar:** Search by Employee ID, Doctor/Staff Name, Category (*Medical/Clinical*, *Nursing Staff*, *Allied Health*, *Administrative*), Department (*Emergency*, *ICU*, *Cardiology*, etc.), and Consent Status (*Opted-In*, *Opted-Out*, *Pending*).
- **Masked Phone Protection:** Employee WhatsApp numbers are masked (e.g., `+91 98401 ••••••`) to comply with healthcare privacy regulations.
- **Add / Edit Drawer:** Slide-over modal to register new personnel or modify existing designations, contact details, and department allocations.
- **Direct Status Toggle:** Instantly activate or deactivate staff records.

#### How to Use It
1. **Search & Filter:** Type an employee ID (e.g., `MAP-1021`) or name into the search box to locate a specific staff member.
2. **Add Single Employee:**
   - Click the **+ Add Employee** button in the header.
   - Fill in Employee ID, Full Name, Category, Department, Designation, and WhatsApp Phone Number (E.164 format with country code `+91`).
   - Specify the verified consent status and initial consent source document.
   - Click **Save Employee**.
3. **Edit Staff Information:** Click the **Edit (Pencil)** icon in the row of any employee to open the update drawer.

---

### 03. Import Employees
- **Route URL:** `/employees/import`
- **Permitted Roles:** Super Admin, Admin

#### Purpose
Safe, bulk onboarding of hospital staff rosters using Excel (`.xlsx`) or CSV files with pre-validation and preview before committing records to the database.

#### Key Features
- **5-Step Guided Importer:**
  1. *Upload Roster File* (Drag-and-drop `.xlsx` or `.csv` with sample template download)
  2. *Map Column Headers* (Smart auto-mapping of hospital spreadsheet columns to system attributes)
  3. *Validate & Error Check* (Automatic syntax checking of WhatsApp numbers, duplicate ID detection, and mandatory field checks)
  4. *Review Clean vs. Flagged Rows* (Filter rows by *Valid*, *Warnings*, or *Rejected*)
  5. *Commit Import* (Atomic batch write with duplicate handling strategy)
- **Sample Template Download:** Download an official formatted spreadsheet template containing valid sample columns.

#### How to Use It
1. Click **Download Sample Template** to review the expected column schema (`Employee ID`, `Name`, `WhatsApp Number`, `Category`, `Department`, `Designation`, `Consent Status`).
2. Drop your hospital staff Excel file into the upload zone.
3. Review the **Column Mapping** step to ensure column headers correspond accurately.
4. On the **Validation Preview** step, inspect any flagged rows (e.g., numbers missing country code or duplicate IDs).
5. Choose your conflict strategy: *Skip Duplicates* or *Update Existing Records*.
6. Click **Confirm & Import Staff Records**.

---

### 04. Employee Categories
- **Route URL:** `/employees/categories`
- **Permitted Roles:** Super Admin, Admin

#### Purpose
Configure the high-level professional classifications of hospital personnel. Used in the campaign audience selector to target broad staff groups (e.g., all *Nursing Staff* hospital-wide).

#### Key Features
- Default Hospital Classifications:
  - *Medical / Clinical* (Doctors, Consultants, Registrars)
  - *Nursing Staff* (Head Nurses, Staff Nurses, Trainees)
  - *Allied Health Sciences* (Radiology, Lab Technicians, Pharmacists)
  - *Administrative & Support* (Billing, Front Office, IT, HR)
  - *Facilities & Maintenance* (Biomedical Engineers, Electricians, Housekeeping)
- Real-time employee headcount count per category.
- Safeguard warnings preventing deletion of categories with active mapped staff.

#### How to Use It
1. Click **+ Add Category** to create a new professional classification.
2. Enter the Category Name, Description, and Display Order.
3. To modify or retire a category, click **Edit** or toggle the category active state.

---

### 05. Department Management
- **Route URL:** `/employees/departments`
- **Permitted Roles:** Super Admin, Admin

#### Purpose
Organize hospital clinical specialties, wards, and administrative units. Allows emergency broadcast targeting by operational work unit (e.g., *Emergency & Trauma Care*, *ICU & CCU*, *Cath Lab*).

#### Key Features
- Unique Department Code assignment (e.g., `EMERG-01`, `ICU-02`, `CARD-03`).
- Category linkages (e.g., linking *Trauma Care* to *Medical / Clinical* and *Nursing Staff*).
- Head of Department (HOD) contact designation.
- Active employee count per department.

#### How to Use It
1. Click **+ Add Department**.
2. Input Department Code, Department Name, Primary Clinical Category, and HOD Name.
3. Click **Save Department**.
4. Use the search bar to locate specific departments and verify total mapped staff.

---

## 3. WhatsApp Templates

### 06. Template Library
- **Route URL:** `/templates`
- **Permitted Roles:** Super Admin, Admin, Campaign Creator, Approver

#### Purpose
Central repository of Meta-approved and WATI-registered WhatsApp message templates. Enforces WhatsApp Business compliance by restricting broadcasts solely to approved message schemas.

#### Key Features
- **Approval Status Tabs:**
  - *Approved* (Ready for immediate use in broadcasts)
  - *Pending Meta Review* (Submitted to Meta; pending verification)
  - *Drafts* (Local templates undergoing internal preparation)
  - *Rejected* (Denied by Meta with documented rejection reasons)
- **Template Metadata Cards:** Displays WATI template ID, language (`en_US`, `ta_IN`), message category (*Alert / Notification*, *Utility*), header type (Text, Image, PDF Document), variable placeholders count, and interactive quick-reply buttons.
- **Sync with WATI Button:** Triggers real-time synchronization with the WATI gateway to refresh approval statuses.
- **"Use in Campaign" Action:** Directly opens the Campaign Wizard pre-loaded with the chosen template.

#### How to Use It
1. Click **Sync from WATI** to ensure local templates match the latest Meta status.
2. Filter templates by Category or Language.
3. Click on any template card to inspect the full body text and parameter mapping placeholders.
4. Click **Use in Campaign** on any *Approved* template to immediately start composing a broadcast.

---

### 07. Template Designer
- **Route URL:** `/templates/designer`
- **Permitted Roles:** Super Admin, Admin, Campaign Creator

#### Purpose
Author new WhatsApp message structures, configure interactive buttons (e.g., "Acknowledge Shift", "Call Nursing Station"), and preview exact smartphone rendering before submitting to WATI/Meta for approval.

#### Key Features
- **Split-Screen Design Canvas:**
  - *Left Panel:* Form inputs for Template Name, Category, Header Format (None / Text / Image / PDF), Body Content with `{{1}}`, `{{2}}` placeholders, Footer text, and CTA buttons.
  - *Right Panel:* Sticky, interactive **WhatsApp Smartphone Preview Mockup** demonstrating live variable replacement.
- **Syntax Validator:** Checks character limits, placeholder sequences, and variable definitions.

#### How to Use It
1. Enter a snake_case Template Name (e.g., `mapims_nabh_audit_alert_v1`).
2. Select Template Category (*Utility* or *Alert Update*).
3. Choose Header Type (e.g., Document/PDF for circulars or None for text alerts).
4. Compose the Body Text using numbered placeholders:
   ```text
   Adhiparasakthi Hospitals Urgent Alert:
   Dear {{1}}, you have been assigned to duty in {{2}} on {{3}}.
   Please report to {{4}}.
   ```
5. Enter sample values in the test inputs to verify the live smartphone mockup.
6. Click **Save Draft** or **Submit to Meta via WATI**.

---

### 08. Media Library
- **Route URL:** `/templates/media`
- **Permitted Roles:** Super Admin, Admin, Campaign Creator

#### Purpose
Secure cloud storage for multimedia broadcast assets (duty rosters in PDF format, clinical protocols, training videos, hospital circular graphics).

#### Key Features
- Media categorization: *Documents (PDF)*, *Images (JPEG/PNG)*, *Videos (MP4)*.
- File size validation compliant with Meta/WATI upload limits (PDF up to 100MB, Images up to 5MB).
- Asset preview modal with copyable media reference IDs for template embedding.
- Usage tracking showing which templates or broadcasts currently utilize each asset.

#### How to Use It
1. Click **Upload Media**.
2. Select an approved hospital file (e.g., `Duty_Roster_Nov2026.pdf`).
3. Add a descriptive label and internal reference tag.
4. Once uploaded, copy the Asset ID or click **Attach to Template** to include it in message headers.

---

## 4. Campaign Management

### 09. Create Campaign
- **Route URL:** `/campaigns/create`
- **Permitted Roles:** Super Admin, Admin, Campaign Creator

#### Purpose
The central dispatch wizard of the hospital communication platform. Allows users to configure emergency broadcasts, target specific clinical cadres, populate personalized variables, and submit broadcasts for clinical governance approval.

#### Key Features
- **5-Step Broadcast Wizard:**
  1. **Details:** Campaign Title, Operational Urgency (*Normal*, *Urgent*, *Emergency*), Internal Operational Description.
  2. **Recipients:** Cascading audience selection:
     - Filter by Employee Category (*Medical / Clinical*, *Nursing Staff*, etc.)
     - Filter by Department (*Emergency & Trauma*, *ICU*, *Cardiology*, etc.)
     - Filter by Designation / Role (*Senior Consultant*, *Trauma Staff Nurse*, *Lead Radiographer*, etc.)
     - Live Recipient Exclusion Engine: Automatically identifies and suppresses Opted-Out staff and invalid numbers.
  3. **Template & Variables:** Choose any Meta-Approved template; map dynamic variables (`{{employee.name}}`, Shift Date, Room Number, Extension Number).
  4. **Preview:** Interactive smartphone preview with recipient selector dropdown to review how the message appears to individual doctors or nurses.
  5. **Review & Submit:** Select dispatch mode (*Immediate Upon Approval* vs. *Schedule for Future Date/Time*), review audience summary, and submit for clinical sign-off.
- **Persistent Recipient Breakdown Sidebar:** Real-time visibility into Total Filtered, Selected, Suppressed Opt-Outs, Invalid Numbers, and **Net Eligible Broadcasts**.

#### How to Use It
1. Fill in the **Campaign Title** (e.g., *Emergency Night Shift Roster Announcement*).
2. Set priority to **Urgent** or **Emergency** if immediate clinical attendance is required.
3. Click **Continue** to Step 2 (Recipients). Select target Category, Department, and Designation. Notice the right sidebar automatically calculates the eligible count.
4. Click **Continue** to Step 3 (Template). Select an approved template and fill in the required variable values.
5. In Step 4 (Preview), switch sample staff members from the dropdown to ensure personalized names and designations render cleanly.
6. In Step 5, select **Immediate Dispatch** or pick a scheduled future time.
7. Click **Submit for Clinical Approval**. The campaign is now locked and queued for independent approver review.

---

### 10. Draft Campaigns
- **Route URL:** `/campaigns/drafts`
- **Permitted Roles:** Super Admin, Admin, Campaign Creator

#### Purpose
Repository of in-progress broadcast drafts that have not yet been finalized or submitted for clinical review.

#### Key Features
- View saved drafts with last-edited timestamps and author details.
- Resume campaign creation directly at the last completed wizard step.
- Clone existing drafts as starting points for recurring announcements.
- Delete obsolete or superseded broadcast drafts.

#### How to Use It
1. Open the Drafts table to review pending work.
2. Click **Resume (Pencil)** to return directly into the 5-step wizard.
3. Click **Delete (Trash)** to purge outdated drafts.

---

### 11. Schedule Campaigns
- **Route URL:** `/campaigns/scheduled`
- **Permitted Roles:** Super Admin, Admin, Campaign Creator, Approver

#### Purpose
Monitor automated future broadcasts queued in the Redis/BullMQ processing queue. Enforces real-time re-verification of employee opt-out status immediately before dispatch.

#### Key Features
- List of all approved future broadcasts with scheduled date, time, and target counts.
- **Automated Pre-Dispatch Integrity Check:** Notifies operators that recipient consent is re-evaluated immediately before transmission; any employee opting out between scheduling and send-time is dynamically excluded.
- **Reschedule Modal:** Modify scheduled release dates or times.
- **Cancel Dispatch Dialog:** Abort scheduled broadcasts before queue transmission.

#### How to Use It
1. Locate the scheduled broadcast using the search bar.
2. To alter delivery timing, click **Reschedule (Clock)**, select the updated date/time (IST), and click **Update Schedule**.
3. To cancel an upcoming broadcast, click **Cancel Dispatch** and confirm.

---

### 12. Campaign History
- **Route URL:** `/campaigns/history`
- **Permitted Roles:** Super Admin, Admin, Campaign Creator, Approver, Viewer

#### Purpose
Comprehensive, immutable ledger of all historical broadcast campaigns conducted across MAPIMS hospital departments.

#### Key Features
- Search and filter by campaign title, department scope, creator, approver, or completion status (*Completed*, *Scheduled*, *Rejected*, *Failed*).
- **Campaign Detail Drawer:**
  - Full metadata snapshot (Template used, Creator, Approver, Exact dispatch timestamp).
  - Target vs. Submitted vs. Delivered vs. Read vs. Failed breakdown.
  - Immutable message content and media preview.
- **Re-broadcast / Clone Action:** Duplicate an old broadcast into a new draft with one click.

#### How to Use It
1. Filter the history table by date range or department.
2. Click the **View (Eye)** icon on any row to open the full campaign audit drawer.
3. Review recipient delivery percentages and approver sign-offs.
4. Click **Duplicate as New** if you wish to run a similar announcement with updated rosters.

---

### 13. Campaign Approval
- **Route URL:** `/campaigns/approvals`
- **Permitted Roles:** Approver, Super Admin

#### Purpose
Enforces the hospital's mandatory **Four-Eyes Principle (Separation of Duties)**. Clinical broadcasts cannot be self-approved by the creator. An authorized approver (e.g., Medical Director, Hospital Superintendent) must review the immutable message snapshot and approve before messages reach staff phones.

#### Key Features
- **Approval Queue Tabs:**
  - *Pending Approval* (Broadcasts awaiting review)
  - *Approved* (Campaigns signed off and cleared for dispatch)
  - *Rejected* (Denied broadcasts with explanatory feedback)
- **Self-Approval Blocker:** Prevents campaign creators from signing off on their own broadcasts. A notification prompts the user to switch to an authorized approver account.
- **Split-Screen Clinical Review Window:**
  - Target audience breakdown and suppression count.
  - Exact WATI template and filled variable values.
  - Interactive WhatsApp preview mockup.
- **Mandatory Rejection Comment:** Requires approvers to state specific reasons if rejecting a broadcast so creators can make corrections.

#### How to Use It
1. Switch your active role in the topbar to **Approver** or **Super Admin**.
2. Navigate to **Campaign Approval** (`/campaigns/approvals`).
3. Select any campaign under the **Pending Approval** tab and click **Review**.
4. Inspect the recipient count, variables, and phone mockup.
5. **To Approve:** Click **Approve Campaign** and confirm in the dialog. The campaign will immediately be dispatched or scheduled in Redis/BullMQ.
6. **To Reject:** Click **Reject Campaign**, enter the mandatory rejection rationale (e.g., *Incorrect shift timing specified for ICU station*), and click **Confirm Rejection**. The creator will be notified to revise their draft.

---

## 5. Reports & Monitoring

### 14. Delivery Reports
- **Route URL:** `/reports/delivery`
- **Permitted Roles:** Super Admin, Admin, Campaign Creator, Approver, Viewer

#### Purpose
Granular, message-level delivery telemetry tracking the real-time status of every WhatsApp message transmitted through WATI.

#### Key Features
- **Real-Time Delivery KPIs:**
  - Total Submitted Messages
  - Delivered Rate (`Delivered / Submitted`)
  - Read Rate (`Read / Delivered`)
  - Delivery Failure Rate
- **Message Telemetry Table:**
  - Employee ID & Name
  - Masked Phone Number
  - Campaign Identifier
  - Delivery Status (*Queued*, *Sent*, *Delivered*, *Read*, *Failed*)
  - Status Timestamps (Exact seconds of delivery and WhatsApp read-receipt ticks)
  - Error diagnostic codes for failed dispatches
- Filter by campaign, delivery status, or staff category.

#### How to Use It
1. Select a specific campaign from the filter dropdown to isolate its message log.
2. Use the status filter to isolate *Failed* or *Unread* messages.
3. Click the **Refresh** button to pull the latest WATI webhook delivery receipts.

---

### 15. Campaign Analytics
- **Route URL:** `/reports/analytics`
- **Permitted Roles:** Super Admin, Admin, Approver, Viewer

#### Purpose
Visual business intelligence and performance trends analyzing staff engagement, departmental read rates, and template effectiveness over time.

#### Key Features
- **Delivery Trends by Day/Week:** Interactive line and area charts illustrating delivery speed and volume peaks.
- **Departmental Engagement Breakdown:** Bar charts comparing read rates across hospital departments (e.g., comparing response times of ER vs. OPD staff).
- **Failure Root-Cause Analysis:** Categorizes failed deliveries into *Invalid WhatsApp Number*, *Network Timeout*, *Blocked / Opted-Out*, or *WATI Gateway Error*.

#### How to Use It
1. Adjust the date selector (*Last 7 Days*, *Last 30 Days*, *Custom Range*).
2. Hover over chart bars to view precise numerical breakdowns of delivered vs. read messages.
3. Review underperforming departments to identify staff rosters requiring phone number updates.

---

### 16. Failed Messages
- **Route URL:** `/reports/failed`
- **Permitted Roles:** Super Admin, Admin (Retry & Manage); Others (View)

#### Purpose
Dedicated triage workstation for diagnosing, correcting, and safely retrying WhatsApp messages that failed during transmission.

#### Key Features
- **Categorized Error Classification:**
  - `E-101`: Invalid WhatsApp Number / Non-existent account
  - `E-102`: Meta 24-Hour Policy Window restriction
  - `E-103`: Network Timeout / Device Switched Off
  - `E-104`: Blocked / Suppressed by User
- **Retry Eligibility Engine:** Intelligently tags errors as *Eligible for Retry* (e.g., network timeouts) vs. *Permanent Failure* (e.g., invalid numbers).
- **Single & Bulk Retry Buttons:** Retransmit eligible messages with idempotent safety headers preventing duplicate messages.

#### How to Use It
1. Review the list of failed transmissions.
2. For messages flagged with transient network issues, click the **Retry (RotateCcw)** icon in that employee's row.
3. To retry all transient failures at once, click **Retry All Eligible**.
4. For messages failing due to invalid numbers, click on the employee ID to navigate to their profile and update their contact record.

---

### 17. Export Reports
- **Route URL:** `/reports/export`
- **Permitted Roles:** Super Admin, Admin, Viewer

#### Purpose
Generate official, downloadable audit dossiers and delivery spreadsheets for hospital management, clinical governance meetings, and NABH accreditation compliance.

#### Key Features
- **Pre-Configured Report Archetypes:**
  - *Comprehensive Campaign Summary* (High-level broadcast stats and approvals)
  - *Detailed Recipient Delivery Log* (Line-by-line delivery timestamps)
  - *Failure Diagnostic Extract* (All delivery errors for IT/HR resolution)
  - *Staff Consent & Opt-Out Register* (Legal compliance record)
- Format support: Export to **Excel (`.xlsx`)** or **CSV**.
- Date range picker and department filtering.
- Download History log displaying previously generated reports.

#### How to Use It
1. Select the desired **Report Type** card.
2. Choose your Date Range and Department Scope.
3. Select the preferred file format (**Excel** or **CSV**).
4. Click **Generate & Download Report**. The file will automatically compile and download to your local machine.

---

## 6. Administration & Governance

### 18. Users & Roles
- **Route URL:** `/admin/users`
- **Permitted Roles:** Super Admin

#### Purpose
Manage administrative staff accounts, assign granular permissions, and inspect the platform's Role-Based Access Control (RBAC) security matrix.

#### Key Features
- **Users Table:** Displays system users, work emails, assigned role, department affiliation, account status (*Active* / *Suspended*), and last login time.
- **Add / Edit User Drawer:** Provision new hospital administrative users with assigned system roles.
- **Interactive RBAC Permission Matrix:** Visual reference tab demonstrating permissions across all 5 roles for:
  - Employee roster modifications
  - Template authoring and submission
  - Campaign creation and draft editing
  - Broadcast approval (Separation of Duties)
  - Gateway credential configuration
  - Audit log inspection

#### How to Use It
1. Click **+ Add User** to provision a new staff login.
2. Enter Full Name, Official Hospital Email, Department, and assign their **System Role** (*Admin*, *Campaign Creator*, *Approver*, etc.).
3. Click **Create User**.
4. Switch to the **Roles & Permissions Matrix** tab to audit system security privileges.

---

### 19. WATI Integration
- **Route URL:** `/admin/wati`
- **Permitted Roles:** Super Admin (Full Config); Admin (View Health)

#### Purpose
Technical gateway management interface monitoring the live connection between EWCCMS and the official Meta WhatsApp Business Solution Provider (WATI).

#### Key Features
- **Live Gateway Health Dashboard:**
  - Connection status indicator (🟢 *Connected / Active*)
  - Server latency and API endpoint (`https://live-server-1082.wati.io/api/v1`)
  - Webhook listener status (`https://ewccms.mapims.org/api/v1/wati/webhook`)
  - WhatsApp Business Account (WABA) Tier & 24-hour messaging limits
- **Secret Isolation Guarantee:** Sensitive API access tokens and secret bearer keys are securely stored on the backend and are never exposed in browser network payloads.
- **Template Status Synchronization:** Pulls approved templates directly from Meta servers into the local hospital database.
- **Connection Test Button:** Sends an authenticated ping to verify gateway responsiveness.

#### How to Use It
1. Inspect the connection status card to verify that WATI is green and responding.
2. Click **Test Gateway Connection** to run a diagnostic ping.
3. Click **Sync Templates Now** to update local records after approving a new template in the Meta Business Manager.

---

### 20. Audit Logs
- **Route URL:** `/admin/audit`
- **Permitted Roles:** Super Admin, Admin (Read-Only)

#### Purpose
Immutable, append-only security log recording every administrative action, broadcast dispatch, roster alteration, and approval decision for forensic auditability and NABH compliance.

#### Key Features
- Chronological event timeline recording:
  - Exact Timestamp (IST)
  - Actor Name and Assigned Role
  - Event Category (*Campaign*, *Employee*, *Approval*, *System*, *Consent*)
  - Specific Action Taken (e.g., `CAMPAIGN_APPROVED`, `STAFF_OPT_OUT_RECORDED`)
  - Resource ID and Target Details
  - Source IP Address and Execution Outcome (*Success* / *Blocked*)
- Multi-parameter filter bar by Actor, Action Type, or Date Range.

#### How to Use It
1. Use the search bar to locate events involving a specific campaign ID or user name.
2. Filter by Category (e.g., select *Approval* to verify who approved specific clinical alerts).
3. Click on any log row to inspect detailed before-and-after change payloads.

---

### 21. WhatsApp Consent & Opt-Outs
- **Route URL:** `/admin/consent`
- **Permitted Roles:** Super Admin, Admin

#### Purpose
Healthcare compliance and privacy management portal. Manages employee communication preferences, records explicit consent documentation, and enforces automated suppression of staff who have opted out.

#### Key Features
- **Consent Overview Metrics:**
  - Total Consented Staff (Opted-In)
  - Total Opted-Out Personnel
  - Pending Verification Roster
  - Compliance Adherence Percentage
- **Consent Ledger Table:**
  - Employee ID & Name
  - Department
  - Consent Status (*Opted-In*, *Opted-Out*, *Pending*)
  - Consent Source (e.g., *Employee Induction Form E-Sign*, *Annual HR Portal Verification*, *WhatsApp STOP Keyword*)
  - Verified Date and Expiry
- **Manual Consent / Opt-Out Action Drawer:** Formally record an employee's request to opt out or re-opt in with attached reference documentation.

#### How to Use It
1. Search for an employee by name or ID.
2. If an employee submits an opt-out form or requests suppression:
   - Click **Update Consent**.
   - Select Status: **Opted-Out**.
   - Specify Source (e.g., *Written Request to HR*).
   - Click **Save Preference**.
3. Once marked as *Opted-Out*, the system's **Dual-Gate Suppression Engine** will automatically block this employee from receiving any non-emergency broadcasts across all campaign wizards.

---

## 🛡️ Hospital Governance Safeguards

### 1. The Four-Eyes Principle (Separation of Duties)
- **Rule:** A user who drafts or creates a WhatsApp broadcast is strictly blocked from approving their own campaign.
- **Workflow:**
  1. Campaign Creator composes the broadcast in **Create Campaign** (`/campaigns/create`).
  2. Campaign is submitted to the **Campaign Approval** queue (`/campaigns/approvals`).
  3. An independent clinical approver (e.g., Medical Director, Dean) must log in, inspect the immutable preview, and grant formal approval before dispatch.

### 2. Dual-Gate Opt-Out Suppression
- **Gate 1 (Audience Filtering):** Opted-out personnel are automatically subtracted and displayed under the *Opted-Out (Suppressed)* line in the Campaign Creation Wizard sidebar.
- **Gate 2 (Pre-Dispatch Verification):** When a scheduled broadcast triggers in Redis/BullMQ, the queue worker re-verifies each recipient's consent status in real-time. If an employee opted out between the time of scheduling and dispatch, their message is immediately suppressed.

### 3. WATI Secret Isolation
- WATI API access tokens and Meta webhook signing secrets are stored exclusively in backend environment configuration. They are never transmitted to client browsers, rendered in UI components, or logged in client-side monitoring tools.

---
*Document maintained by MAPIMS Hospital Health Informatics & Information Technology Department.*

