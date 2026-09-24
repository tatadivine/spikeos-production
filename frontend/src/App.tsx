import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { type ReactNode } from "react";

import { SessionProvider, useSession } from "./lib/SessionContext";

import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { CommunicationPage } from "./pages/Communication";
import { CommunicationDetail } from "./pages/CommunicationDetail";
import { Commitments } from "./pages/Commitments";
import { FollowUps } from "./pages/FollowUps";
import { Alerts } from "./pages/Alerts";
import { Coaching } from "./pages/Coaching";
import { Evidence } from "./pages/Evidence";
import { MyPerformance } from "./pages/MyPerformance";
import { Customers } from "./pages/Customers";
import { CustomerDetail } from "./pages/CustomerDetail";
import { TeamOverview } from "./pages/TeamOverview";
import { EmployeeDetail } from "./pages/EmployeeDetail";
import { Reviews } from "./pages/Reviews";
import { TeamTrends } from "./pages/TeamTrends";
import { Organization } from "./pages/Organization";
import { Departments } from "./pages/Departments";
import { OrganizationTrends } from "./pages/OrganizationTrends";
import { Analytics } from "./pages/Analytics";
import { Reports } from "./pages/Reports";
import { OutlookCoachPage } from "./pages/OutlookCoachPage";
import { Help } from "./pages/Help";

import { SettingsGeneral } from "./pages/settings/SettingsGeneral";
import { SettingsScoring } from "./pages/settings/SettingsScoring";
import { SettingsExclusions } from "./pages/settings/SettingsExclusions";
import { SettingsPermissions } from "./pages/settings/SettingsPermissions";
import { SettingsIntegrations } from "./pages/settings/SettingsIntegrations";
import { SettingsAudit } from "./pages/settings/SettingsAudit";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { ready, isAuthenticated } = useSession();

  if (!ready) return <div className="flex h-screen items-center justify-center bg-[var(--color-navy-950)] text-white/60">Checking Microsoft session…</div>;
  if (!isAuthenticated) return <Navigate to="/" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

export default function App() {
  return (
    <SessionProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          <Route path="/communication" element={<ProtectedRoute><CommunicationPage /></ProtectedRoute>} />
          <Route path="/communication/:id" element={<ProtectedRoute><CommunicationDetail /></ProtectedRoute>} />
          <Route path="/commitments" element={<ProtectedRoute><Commitments /></ProtectedRoute>} />
          <Route path="/followups" element={<ProtectedRoute><FollowUps /></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />

          <Route path="/performance" element={<ProtectedRoute><MyPerformance /></ProtectedRoute>} />
          <Route path="/coaching" element={<ProtectedRoute><Coaching /></ProtectedRoute>} />
          <Route path="/evidence" element={<ProtectedRoute><Evidence /></ProtectedRoute>} />

          <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />

          <Route path="/team" element={<ProtectedRoute><TeamOverview /></ProtectedRoute>} />
          <Route path="/team/trends" element={<ProtectedRoute><TeamTrends /></ProtectedRoute>} />
          <Route path="/team/:employeeId" element={<ProtectedRoute><EmployeeDetail /></ProtectedRoute>} />
          <Route path="/reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />

          <Route path="/organization" element={<ProtectedRoute><Organization /></ProtectedRoute>} />
          <Route path="/organization/departments" element={<ProtectedRoute><Departments /></ProtectedRoute>} />
          <Route path="/organization/trends" element={<ProtectedRoute><OrganizationTrends /></ProtectedRoute>} />

          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/outlook-coach" element={<ProtectedRoute><OutlookCoachPage /></ProtectedRoute>} />

          <Route path="/settings" element={<ProtectedRoute><SettingsGeneral /></ProtectedRoute>} />
          <Route path="/settings/scoring" element={<ProtectedRoute><SettingsScoring /></ProtectedRoute>} />
          <Route path="/settings/exclusions" element={<ProtectedRoute><SettingsExclusions /></ProtectedRoute>} />
          <Route path="/settings/permissions" element={<ProtectedRoute><SettingsPermissions /></ProtectedRoute>} />
          <Route path="/settings/integrations" element={<ProtectedRoute><SettingsIntegrations /></ProtectedRoute>} />
          <Route path="/settings/audit" element={<ProtectedRoute><SettingsAudit /></ProtectedRoute>} />

          <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />

          <Route path="*" element={<Login />} />
        </Routes>
      </HashRouter>
    </SessionProvider>
  );
}
