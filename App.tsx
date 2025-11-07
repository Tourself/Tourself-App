
import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { LanguageProvider, AuthProvider, useAuth } from './contexts';
import { LanguageSelectorPage, HomePage, CheckoutPage, QuestCompletionPage } from './pages/PublicPages';
import { ForGuidesPage, HowItWorksPage, FAQPage, ContactPage } from './pages/InfoPages';
import { LoginPage } from './pages/AuthPages';
import { QuestListPage, QuestDetailPage, QuestPlayPage } from './pages/QuestPages';
import { GuideListPage, GuideDetailPage } from './pages/GuidePages';
import { AdminLayout, GuideLayout } from './pages/AdminPages';

const AdminProtectedRoute: React.FC = () => {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

const GuideProtectedRoute: React.FC = () => {
    const { user } = useAuth();
    if (!user || user.role !== 'guide') {
      return <Navigate to="/login" replace />;
    }
    return <Outlet />;
  };

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<LanguageSelectorPage />} />
            <Route path="/home" element={<HomePage />} />
            
            <Route path="/guide" element={<GuideListPage />} />
            <Route path="/guide/:id" element={<GuideDetailPage />} />

            <Route path="/quests" element={<QuestListPage />} />
            <Route path="/quests/:id" element={<QuestDetailPage />} />
            <Route path="/quest/play/:id/:stepIndex" element={<QuestPlayPage />} />
            <Route path="/quest/complete/:id" element={<QuestCompletionPage />} />

            <Route path="/checkout/:id" element={<CheckoutPage />} />
            
            <Route path="/login" element={<LoginPage />} />
            <Route path="/for-guides" element={<ForGuidesPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/contact" element={<ContactPage />} />
            
            <Route element={<AdminProtectedRoute />}>
              <Route path="/admin/*" element={<AdminLayout />} />
            </Route>

            <Route element={<GuideProtectedRoute />}>
                <Route path="/dashboard/*" element={<GuideLayout />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
