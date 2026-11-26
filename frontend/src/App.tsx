import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { RoleRoute } from './components/common/RoleRoute';
import { LoginPage } from './pages/auth/LoginPage';

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
import { ShortlinksPage } from './pages/admin/ShortlinksPage';
import { ShortlinkAnalyticsPage } from './pages/admin/ShortlinkAnalyticsPage';
import { VaatiTemplatesPage } from './pages/vaati/VaatiTemplatesPage';
import { CreateVaatiTemplatePage } from './pages/vaati/CreateVaatiTemplatePage';
import { VaatiGatewayPage } from './pages/vaati/VaatiGatewayPage';
import { VaatiRepliesPage } from './pages/vaati/VaatiRepliesPage';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Authentication Route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Hospital Enterprise Shell */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                {/* Default redirect to Dashboard */}
                <Route index element={<Navigate to="/dashboard" replace />} />

                {/* Module 1: Dashboard (All Authenticated Staff) */}
                <Route path="dashboard" element={<DashboardPage />} />

                {/* Module 2: Employee Management */}
                <Route
                  path="employees"
                  element={
                    <RoleRoute
                      allowedRoles={['Super Admin', 'HR', 'MS', 'MD']}
                      moduleName="Employee Directory"
                    >
                      <EmployeeListPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="employees/import"
                  element={<Navigate to="/employees" replace />}
                />
                <Route
                  path="employees/designations"
                  element={
                    <RoleRoute
                      allowedRoles={['Super Admin', 'HR', 'MD']}
                      moduleName="Hospital Staff Designations"
                    >
                      <EmployeeCategoriesPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="employees/categories"
                  element={
                    <RoleRoute
                      allowedRoles={['Super Admin', 'HR', 'MD']}
                      moduleName="Hospital Staff Designations"
                    >
                      <EmployeeCategoriesPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="employees/departments"
                  element={
                    <RoleRoute
                      allowedRoles={['Super Admin', 'HR', 'MD']}
                      moduleName="Department Management"
                    >
                      <DepartmentManagementPage />
                    </RoleRoute>
                  }
                />

                {/* Module 3: WhatsApp Templates (WATI) */}
                <Route
                  path="templates"
                  element={
                    <RoleRoute
                      allowedRoles={['Super Admin', 'HR', 'MS', 'MD']}
                      moduleName="Template Library"
                    >
                      <TemplateLibraryPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="templates/designer"
                  element={
                    <RoleRoute
                      allowedRoles={['Super Admin', 'MS', 'MD']}
                      moduleName="Template Designer"
                    >
                      <TemplateDesignerPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="templates/media"
                  element={
                    <RoleRoute
                      allowedRoles={['Super Admin', 'HR', 'MS', 'MD']}
                      moduleName="Media Library"
                    >
                      <MediaLibraryPage />
                    </RoleRoute>
                  }
                />

                {/* Module 3B: VAATI Self-Hosted WhatsApp Templates & Gateway */}
                <Route
                  path="vaati/templates"
                  element={
                    <RoleRoute
                      allowedRoles={['Super Admin', 'HR', 'MS', 'MD']}
                      moduleName="VAATI Templates Studio"
                    >
                      <VaatiTemplatesPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="vaati/templates/create"
                  element={
                    <RoleRoute
                      allowedRoles={['Super Admin', 'HR', 'MS', 'MD']}
                      moduleName="Create VAATI Template"
                    >
                      <CreateVaatiTemplatePage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="vaati/gateway"
                  element={
                    <RoleRoute
                      allowedRoles={['Super Admin']}
                      moduleName="VAATI Gateway & Node Status"
                    >
                      <VaatiGatewayPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="vaati/replies"
                  element={
                    <RoleRoute
                      allowedRoles={['Super Admin', 'HR', 'MS', 'MD']}
                      moduleName="VAATI Template Replies"
                    >
                      <VaatiRepliesPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="vaati"
                  element={<Navigate to="/vaati/templates" replace />}
                />

                {/* Module 4: Campaign Management */}
                <Route
                  path="campaigns/create"
                  element={
                    <RoleRoute
                      allowedRoles={['Super Admin', 'HR', 'MS', 'MD']}
                      moduleName="Campaign Creator Wizard"
                    >
                      <CreateCampaignPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="campaigns/drafts"
                  element={<Navigate to="/campaigns/history" replace />}
                />
                <Route
                  path="campaigns/scheduled"
                  element={<Navigate to="/campaigns/history" replace />}
                />
                <Route path="campaigns/history" element={<CampaignHistoryPage />} />
                <Route
                  path="campaigns/approvals"
                  element={<Navigate to="/campaigns/history" replace />}
                />

                {/* Module 5: Reports & Monitoring - Unified into Delivery Reports */}
                <Route path="reports/delivery" element={<DeliveryReportsPage />} />
                <Route
                  path="reports/analytics"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route
                  path="reports/failed"
                  element={<Navigate to="/reports/delivery" replace />}
                />
                <Route
                  path="reports/export"
                  element={<Navigate to="/reports/delivery" replace />}
                />

                {/* Module 6: Administration - Strictly Super Admin Alone */}
                <Route
                  path="admin"
                  element={
                    <RoleRoute
                      allowedRoles={['Super Admin']}
                      moduleName="Administration"
                    >
                      <Navigate to="/admin/users" replace />
                    </RoleRoute>
                  }
                />
                <Route
                  path="admin/users"
                  element={
                    <RoleRoute
                      allowedRoles={['Super Admin']}
                      moduleName="User & Role Management"
                    >
                      <UsersRolesPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="admin/wati"
                  element={
                    <RoleRoute
                      allowedRoles={['Super Admin']}
                      moduleName="WATI Gateway Integration"
                    >
                      <WatiIntegrationPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="admin/audit"
                  element={
                    <RoleRoute
                      allowedRoles={['Super Admin']}
                      moduleName="System Audit Trail"
                    >
                      <AuditLogsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="admin/shortlinks"
                  element={
                    <RoleRoute
                      allowedRoles={['Super Admin']}
                      moduleName="Shortlink Creation"
                    >
                      <ShortlinksPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="admin/shortlinks/:id/analytics"
                  element={
                    <RoleRoute
                      allowedRoles={['Super Admin']}
                      moduleName="Shortlink Analytics"
                    >
                      <ShortlinkAnalyticsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="admin/consent"
                  element={
                    <RoleRoute
                      allowedRoles={['Super Admin']}
                      moduleName="Consent & Opt-Out Registry"
                    >
                      <ConsentOptOutPage />
                    </RoleRoute>
                  }
                />

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
