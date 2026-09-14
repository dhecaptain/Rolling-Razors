import React, { Suspense, lazy, useEffect } from 'react';
import { AppProvider, useApp, canAccessAdmin, STAFF_VIEWS } from './context/AppContext';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { Navbar } from './components/website/Navbar';
import { InspectionBayLanding } from './components/website/InspectionBayLanding';
const BookingWizard = lazy(() => import('./components/booking/BookingWizard').then(m => ({ default: m.BookingWizard })));
const CustomerDashboard = lazy(() => import('./components/customer/CustomerDashboard').then(m => ({ default: m.CustomerDashboard })));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AuthView = lazy(() => import('./components/auth/AuthView').then(m => ({ default: m.AuthView })));
import { WhatsAppFloat } from './components/common/WhatsAppFloat';
import { MpesaModal } from './components/common/MpesaModal';
import { PaystackModal } from './components/common/PaystackModal';
import { ToastContainer } from './components/common/ToastContainer';
import { LegalModal } from './components/common/LegalModal';
import { CookieConsentBanner } from './components/common/CookieConsentBanner';
import { trackPageView } from './lib/analytics';
const AdminAuthView = lazy(() => import('./components/auth/AdminAuthView').then(m => ({ default: m.AdminAuthView })));

/** Rendered when a non-staff user attempts to access a staff-only view. */
const AccessDenied: React.FC = () => {
  const { setView, currentUser } = useApp();
  const target = currentUser ? 'customer_dashboard' : 'website';
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#0B4035] border-2 border-rose-500/40 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500 text-rose-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-white">Access Restricted</h2>
        <p className="text-xs text-white/70 leading-relaxed">
          You are not authorized to access the Workshop Hub. This area is restricted to authorized Rolling Razors workshop staff only.
        </p>
        <button
          onClick={() => setView(target as any)}
          className="w-full py-3 rounded-xl bg-[#D6A62E] text-[#073B32] font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Return to {currentUser ? 'Driver Portal' : 'Website'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const MainContent: React.FC = () => {
  const { view, currentUser, authVerifying, isLoggedIn, setView, legalModal, closeLegalModal, setLegalModalType } = useApp();

  // While Clerk (or legacy boot re-verification) resolves the authenticated
  // identity server-side, do not render any dashboard. This prevents a flash of
  // admin content before the server-verified role is known.
  const userRole = currentUser?.role || 'customer';
  const isViewStaffOnly = STAFF_VIEWS.includes(view);

  // Authorization boundary: staff-only views require server-verified admin role.
  const denied = isViewStaffOnly && !canAccessAdmin(userRole);

  // For admin_auth: if already logged in as customer, redirect away.
  const customerAtAdminAuth = view === 'admin_auth' && isLoggedIn && userRole === 'customer';

  useEffect(() => {
    const titles: Record<string, string> = {
      website: 'Rolling Razors Customs | Automotive Upholstery Nairobi',
      booking: 'Book a Custom Interior Service | Rolling Razors Customs',
      customer_dashboard: 'Driver Portal | Rolling Razors Customs',
      admin_dashboard: 'Workshop Hub | Rolling Razors Customs',
      auth: 'Sign in | Rolling Razors Customs',
      admin_auth: 'Workshop Staff Sign in | Rolling Razors Customs',
    };
    const title = titles[view] || titles.website;
    document.title = title;
    trackPageView(window.location.pathname, title);
  }, [view]);

  // While auth is resolving, show a minimal loading screen instead of any dashboard.
  if (authVerifying) {
    return (
      <div className="min-h-screen bg-[#073B32] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#D6A62E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#D6A62E] font-bold uppercase tracking-wider">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rr-app-shell min-h-screen bg-[#073B32] text-[#F5F1E8] flex flex-col font-sans selection:bg-[#D6A62E] selection:text-[#073B32]">
      {/* Top Navigation */}
      <Navbar />

      {/* Dynamic Main View */}
      <main className="flex-1">
        {view === 'website' && <InspectionBayLanding />}

        <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-[#D6A62E]">Loading...</div>}>
          {view === 'booking' && <BookingWizard />}
          {view === 'customer_dashboard' && <CustomerDashboard />}
          {view === 'admin_dashboard' && !denied && <AdminDashboard />}
          {view === 'admin_dashboard' && denied && <AccessDenied />}
          {view === 'auth' && <AuthView />}
          {view === 'admin_auth' && !customerAtAdminAuth && <AdminAuthView />}
          {view === 'admin_auth' && customerAtAdminAuth && <AccessDenied />}
        </Suspense>
      </main>

      {/* Modals, Overlays and Floating Tools */}
      <WhatsAppFloat />
      <MpesaModal />
      <PaystackModal />
      <ToastContainer />
      <LegalModal
        isOpen={legalModal.isOpen}
        type={legalModal.type}
        onClose={closeLegalModal}
        onSwitchType={setLegalModalType}
      />
      <CookieConsentBanner />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
