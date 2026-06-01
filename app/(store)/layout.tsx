import { Header } from '@/components/store/Header';
import { Footer } from '@/components/store/Footer';
import { CartDrawer } from '@/components/store/CartDrawer';
import { SearchModal } from '@/components/store/SearchModal';
import { ToastContainer } from '@/components/store/ToastContainer';
import { NotificationToast } from '@/components/store/NotificationToast';
import { GlobalTracker } from '@/components/store/GlobalTracker';
import { MobileBottomNav } from '@/components/store/MobileBottomNav';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen">
        {children}
      </main>
      <Footer />

      {/* Global portals & tracking */}
      <CartDrawer />
      <SearchModal />
      <ToastContainer />
      <NotificationToast />
      <GlobalTracker />
      <MobileBottomNav />
    </>
  );
}
