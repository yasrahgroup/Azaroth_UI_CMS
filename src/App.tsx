import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Public Pages
import { Home } from './pages/Home';
import { ProductsListing } from './pages/ProductsListing';
import { ProductDetail } from './pages/ProductDetail';
import { Contact } from './pages/Contact';
import { DynamicPage } from './pages/DynamicPage';

// Admin Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { BrandingManager } from './pages/admin/BrandingManager';
import { FooterManager } from './pages/admin/FooterManager';
import { ThemeColorManager } from './pages/admin/ThemeColorManager';
import { TypographyManager } from './pages/admin/TypographyManager';
import { AnimationStudio } from './pages/admin/AnimationStudio';
import { PageBuilder } from './pages/admin/PageBuilder';
import { ProductManager } from './pages/admin/ProductManager';
import { MediaLibrary } from './pages/admin/MediaLibrary';
import { ChatbotFaqManager } from './pages/admin/ChatbotFaqManager';
import { LeadsInbox } from './pages/admin/LeadsInbox';
import { DeploymentGuide } from './pages/admin/DeploymentGuide';
import { CentralSettingsHub } from './pages/admin/CentralSettingsHub';
import { Profile } from './pages/admin/Profile';
import { UserManagement } from './pages/admin/UserManagement';
import { AddonManager } from './pages/admin/AddonManager';
import type { UserRole } from './types';

import { GlobalAnimationLayer } from './components/public/GlobalAnimationLayer';

// Apply the published luxury design system to public routes only.
// Keep the administrator UI independent of decorative public-site styles.
const PublicPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="az-luxury-page">
    <GlobalAnimationLayer />
    {children}
  </div>
);

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F111A]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#35123F] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mt-3">
            Verifying Authentication...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const RoleRoute: React.FC<{ roles: UserRole[]; children: React.ReactNode }> = ({ roles, children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicPage><Home /></PublicPage>} />
            <Route path="/product" element={<PublicPage><ProductsListing /></PublicPage>} />
            <Route path="/products" element={<PublicPage><ProductsListing /></PublicPage>} />
            <Route path="/product/:slug" element={<PublicPage><ProductDetail /></PublicPage>} />
            <Route path="/products/:slug" element={<PublicPage><ProductDetail /></PublicPage>} />
            <Route path="/contact" element={<PublicPage><Contact /></PublicPage>} />

            {/* Admin Authentication */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin CMS Persistent Workspace (AdminLayout stays mounted across route changes) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route
                path="settings"
                element={
                  <RoleRoute roles={['admin', 'editor']}>
                    <CentralSettingsHub />
                  </RoleRoute>
                }
              />
              <Route
                path="branding"
                element={
                  <RoleRoute roles={['admin', 'editor']}>
                    <BrandingManager />
                  </RoleRoute>
                }
              />
              <Route
                path="footer"
                element={
                  <RoleRoute roles={['admin', 'editor']}>
                    <FooterManager />
                  </RoleRoute>
                }
              />
              <Route
                path="theme"
                element={
                  <RoleRoute roles={['admin', 'editor']}>
                    <ThemeColorManager />
                  </RoleRoute>
                }
              />
              <Route
                path="typography"
                element={
                  <RoleRoute roles={['admin', 'editor']}>
                    <TypographyManager />
                  </RoleRoute>
                }
              />
              <Route
                path="animations"
                element={
                  <RoleRoute roles={['admin', 'editor']}>
                    <AnimationStudio />
                  </RoleRoute>
                }
              />
              <Route
                path="pages"
                element={
                  <RoleRoute roles={['admin', 'editor']}>
                    <PageBuilder />
                  </RoleRoute>
                }
              />
              <Route
                path="products"
                element={
                  <RoleRoute roles={['admin', 'editor']}>
                    <ProductManager />
                  </RoleRoute>
                }
              />
              <Route
                path="media"
                element={
                  <RoleRoute roles={['admin', 'editor']}>
                    <MediaLibrary />
                  </RoleRoute>
                }
              />
              <Route
                path="chatbot"
                element={
                  <RoleRoute roles={['admin', 'editor']}>
                    <ChatbotFaqManager />
                  </RoleRoute>
                }
              />
              <Route
                path="inbox"
                element={
                  <RoleRoute roles={['admin', 'editor']}>
                    <LeadsInbox />
                  </RoleRoute>
                }
              />
              <Route path="deployment" element={<DeploymentGuide />} />
              <Route
                path="users"
                element={
                  <RoleRoute roles={['admin']}>
                    <UserManagement />
                  </RoleRoute>
                }
              />
              <Route
                path="addons"
                element={
                  <RoleRoute roles={['admin']}>
                    <AddonManager />
                  </RoleRoute>
                }
              />
            </Route>

            {/* Dynamic CMS Page Routes */}
            <Route path="/:slug" element={<PublicPage><DynamicPage /></PublicPage>} />

            {/* Fallback */}
            <Route path="*" element={<PublicPage><DynamicPage /></PublicPage>} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}
