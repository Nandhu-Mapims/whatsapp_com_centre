import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';

// 21 Screen Pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { EmployeeListPage } from './pages/employees/EmployeeListPage';
import { ImportEmployeesPage } from './pages/employees/ImportEmployeesPage';
import { EmployeeCategoriesPage } from './pages/employees/EmployeeCategoriesPage';
import { DepartmentManagementPage } from './pages/employees/DepartmentManagementPage';
import { TemplateLibraryPage } from './pages/templates/TemplateLibraryPage';
import { TemplateDesignerPage } from './pages/templates/TemplateDesignerPage';
import { MediaLibraryPage } from './pages/templates/MediaLibraryPage';
import { CreateCampaignPage } from './pages/campaigns/CreateCampaignPage';
import { DraftCampaignsPage } from './pages/campaigns/DraftCampaignsPage';
import { ScheduleCampaignsPage } from './pages/campaigns/ScheduleCampaignsPage';
import { CampaignHistoryPage } from './pages/campaigns/CampaignHistoryPage';
import { CampaignApprovalPage } from './pages/campaigns/CampaignApprovalPage';
import { DeliveryReportsPage } from './pages/reports/DeliveryReportsPage';
import { CampaignAnalyticsPage } from './pages/reports/CampaignAnalyticsPage';
import { FailedMessagesPage } from './pages/reports/FailedMessagesPage';
import { ExportReportsPage } from './pages/reports/ExportReportsPage';
import { UsersRolesPage } from './pages/admin/UsersRolesPage';
import { WatiIntegrationPage } from './pages/admin/WatiIntegrationPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { ConsentOptOutPage } from './pages/admin/ConsentOptOutPage';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Main Application Shell */}
              <Route path="/" element={<AppLayout />}>
                {/* Default redirect to Dashboard */}
                <Route index element={<Navigate to="/dashboard" replace />} />

                {/* Module 1: Dashboard */}
                <Route path="dashboard" element={<DashboardPage />} />

                {/* Module 2: Employee Management */}
                <Route path="employees" element={<EmployeeListPage />} />
                <Route path="employees/import" element={<ImportEmployeesPage />} />
                <Route path="employees/categories" element={<EmployeeCategoriesPage />} />
                <Route path="employees/departments" element={<DepartmentManagementPage />} />

                {/* Module 3: WhatsApp Templates */}
                <Route path="templates" element={<TemplateLibraryPage />} />
                <Route path="templates/designer" element={<TemplateDesignerPage />} />
                <Route path="templates/media" element={<MediaLibraryPage />} />

                {/* Module 4: Campaign Management */}
                <Route path="campaigns/create" element={<CreateCampaignPage />} />
                <Route path="campaigns/drafts" element={<DraftCampaignsPage />} />
                <Route path="campaigns/scheduled" element={<ScheduleCampaignsPage />} />
                <Route path="campaigns/history" element={<CampaignHistoryPage />} />
                <Route path="campaigns/approvals" element={<CampaignApprovalPage />} />

                {/* Module 5: Reports & Monitoring */}
                <Route path="reports/delivery" element={<DeliveryReportsPage />} />
                <Route path="reports/analytics" element={<CampaignAnalyticsPage />} />
                <Route path="reports/failed" element={<FailedMessagesPage />} />
                <Route path="reports/export" element={<ExportReportsPage />} />

                {/* Module 6: Administration */}
                <Route path="admin/users" element={<UsersRolesPage />} />
                <Route path="admin/wati" element={<WatiIntegrationPage />} />
                <Route path="admin/audit" element={<AuditLogsPage />} />
                <Route path="admin/consent" element={<ConsentOptOutPage />} />

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
