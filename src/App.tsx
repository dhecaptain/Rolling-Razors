import React from 'react';
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
import { BookingWizard } from './components/booking/BookingWizard';
import { CustomerDashboard } from './components/customer/CustomerDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AuthView } from './components/auth/AuthView';
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

        {view === 'booking' && <BookingWizard />}
        {view === 'customer_dashboard' && <CustomerDashboard />}
        {view === 'admin_dashboard' && <AdminDashboard />}
        {view === 'auth' && <AuthView />}
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
