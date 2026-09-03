import React, { Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/website/Navbar';
import { HeroSection } from './components/website/HeroSection';
import { ServicesSection } from './components/website/ServicesSection';
import { FeaturedServiceSection } from './components/website/FeaturedServiceSection';
import { HowBookingWorks } from './components/website/HowBookingWorks';
import { PortfolioGallery } from './components/website/PortfolioGallery';
import { WhyChooseUs } from './components/website/WhyChooseUs';
import { CustomerReviews } from './components/website/CustomerReviews';
import { LocationContact } from './components/website/LocationContact';
import { Footer } from './components/website/Footer';
const BookingWizard = lazy(() => import('./components/booking/BookingWizard').then(m => ({ default: m.BookingWizard })));
const CustomerDashboard = lazy(() => import('./components/customer/CustomerDashboard').then(m => ({ default: m.CustomerDashboard })));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AuthView = lazy(() => import('./components/auth/AuthView').then(m => ({ default: m.AuthView })));
import { WhatsAppFloat } from './components/common/WhatsAppFloat';
import { MpesaModal } from './components/common/MpesaModal';
import { ToastContainer } from './components/common/ToastContainer';
import { LegalModal } from './components/common/LegalModal';

const MainContent: React.FC = () => {
  const { view, legalModal, closeLegalModal, setLegalModalType } = useApp();

  return (
    <div className="min-h-screen bg-[#073B32] text-[#F5F1E8] flex flex-col font-sans selection:bg-[#D6A62E] selection:text-[#073B32]">
      {/* Top Navigation */}
      <Navbar />

      {/* Dynamic Main View */}
      <main className="flex-1">
        {view === 'website' && (
          <>
            <HeroSection />
            <ServicesSection />
            <FeaturedServiceSection />
            <HowBookingWorks />
            <PortfolioGallery />
            <WhyChooseUs />
            <CustomerReviews />
            <LocationContact />
            <Footer />
          </>
        )}

        <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-[#D6A62E]">Loading...</div>}>
          {view === 'booking' && <BookingWizard />}
          {view === 'customer_dashboard' && <CustomerDashboard />}
          {view === 'admin_dashboard' && <AdminDashboard />}
          {view === 'auth' && <AuthView />}
        </Suspense>
      </main>

      {/* Modals, Overlays and Floating Tools */}
      <WhatsAppFloat />
      <MpesaModal />
      <ToastContainer />
      <LegalModal
        isOpen={legalModal.isOpen}
        type={legalModal.type}
        onClose={closeLegalModal}
        onSwitchType={setLegalModalType}
      />
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
