import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import InstallPrompt from './components/common/InstallPrompt';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import SignUp from './pages/SignUp';
import ResetPassword from './pages/ResetPassword';
import ForgotPassword from './pages/ForgotPassword';
import AccountDetails from './pages/AccountDetails';
import IntegrationSettings from './pages/IntegrationSettings';
import SiteName from './pages/SiteName';
import WorkType from './pages/WorkType';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectBoard from './pages/ProjectBoard';
import CreateProject from './pages/CreateProject';
import IssueDetail from './pages/IssueDetail';
import FormBuilder from './pages/FormBuilder';
import FormView from './pages/FormView';
import ReportBuilder from './pages/ReportBuilder';
import ReportView from './pages/ReportView';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

const Layout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen relative">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar - Hidden on mobile, shown as drawer */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 w-full lg:w-auto">
        <Navbar 
          onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
        <main className="flex-1 overflow-x-hidden safe-bottom">{children}</main>
      </div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SocketProvider>
            <Router>
            <Toaster position="top-right" />
            <InstallPrompt />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/" element={<Navigate to="/signup" replace />} />
              <Route path="/account-details" element={<AccountDetails />} />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <IntegrationSettings />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route path="/site-name" element={<SiteName />} />
              <Route path="/work-type" element={<WorkType />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Projects />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/create"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <CreateProject />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id/board"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ProjectBoard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/issues/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <IssueDetail />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id/forms/:formId"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <FormBuilder />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/forms/:shareUrl"
                element={<FormView />}
              />
              <Route
                path="/projects/:id/reports/new"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ReportBuilder />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id/reports/:reportId"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ReportBuilder />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id/reports/:reportId/view"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ReportView />
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
            </Router>
          </SocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

