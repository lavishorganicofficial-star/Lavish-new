import Link from 'next/link';
import Image from 'next/image';
import { Leaf, MessageCircle, Mail, Phone } from 'lucide-react';


const STORE_LINKS = [
  { label: 'Shop All', href: '/shop' },
  { label: 'Face Care', href: '/category/face-care' },
  { label: 'Body Care', href: '/category/body-care' },
  { label: 'Hair Care', href: '/category/hair-care' },
  { label: 'Wellness', href: '/category/wellness' },
  { label: 'Combo Sets', href: '/category/combo-sets' },
  { label: 'New Arrivals', href: '/shop?sort=newest' },
  { label: 'Offers', href: '/offers' },
];

const ACCOUNT_LINKS = [
  { label: 'My Account', href: '/account' },
  { label: 'My Orders', href: '/account/orders' },
  { label: 'Wishlist', href: '/wishlist' },
  { label: 'Addresses', href: '/account/addresses' },
  { label: 'Become an Influencer', href: '/influencer' },
  { label: 'Track Order', href: '/track-order' },
];

const HELP_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'FAQs', href: '/faqs' },
  { label: 'Shipping Policy', href: '/shipping-policy' },
  { label: 'Return Policy', href: '/return-policy' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms of Service', href: '/terms' },
];

export function Footer() {
  return (
    <footer className="bg-charcoal text-white">
      {/* Main Footer */}
      <div className="container py-8 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 group w-fit">
              <Image
                src="https://res.cloudinary.com/dtrin6lwv/image/upload/v1780070716/a2ecfeef-39b1-4dbd-9245-f43f8529fb41_nsnzp6.png"
                alt="LavishOrganic Logo"
                width={200}
                height={102}
                className="w-32 h-auto object-contain brightness-0 invert"
                priority
              />
            </Link>

            <p className="text-sm text-white/60 leading-relaxed mb-6">
              Premium certified organic skincare crafted with love and the purest
              botanical ingredients. 100% cruelty-free, made in India.
            </p>

            {/* Certifications */}
            <div className="flex items-center gap-3 flex-wrap mb-6">
              {['ECOCERT', 'Cruelty Free', 'Made in India', 'Vegan'].map((cert) => (
                <span
                  key={cert}
                  className="text-xs px-2.5 py-1 border border-white/20 rounded-full text-white/70"
                >
                  {cert}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {[
                { href: 'https://www.instagram.com/lavishorganic_official/', label: 'Instagram', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg> },
                { href: 'https://facebook.com/lavishorganic', label: 'Facebook', svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> },
                { href: 'https://youtube.com/@lavishorganic', label: 'YouTube', svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg> },
              ].map(({ href, label, svg }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-sage-dark transition-colors"
                >
                  {svg}
                </a>
              ))}
            </div>

          </div>

          {/* Link Columns */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-6 lg:gap-10">
            {/* Shop Links */}
            <div>
              <h3 className="font-body text-sm font-semibold text-white tracking-wider uppercase mb-3 md:mb-5">
                Shop
              </h3>
              <ul className="space-y-2 md:space-y-3">
                {STORE_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account Links */}
            <div>
              <h3 className="font-body text-sm font-semibold text-white tracking-wider uppercase mb-3 md:mb-5">
                Account
              </h3>
              <ul className="space-y-2 md:space-y-3">
                {ACCOUNT_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact & Help */}
            <div className="col-span-2 md:col-span-1">
              <h3 className="font-body text-sm font-semibold text-white tracking-wider uppercase mb-3 md:mb-5">
                Help
              </h3>
              <ul className="space-y-2 md:space-y-3 mb-6">
                {HELP_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Contact Info */}
              <div className="space-y-3">
                <a
                  href="mailto:hello@lavishorganic.in"
                  className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  hello@lavishorganic.in
                </a>
                <a
                  href="tel:+919876543210"
                  className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  +91 98765 43210
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} LavishOrganic. All rights reserved.
          </p>

          {/* Payment Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-white/40 mr-2">Secure payments via</span>
            
            {/* Razorpay */}
            <div className="bg-white px-2 py-1 rounded shadow-sm flex items-center justify-center h-7" title="Razorpay">
              <span className="text-[#3395FF] font-bold tracking-tight text-[11px] flex items-center">
                Razorpay
              </span>
            </div>

            {/* UPI */}
            <div className="bg-white px-2 py-1 rounded shadow-sm flex items-center justify-center h-7" title="UPI">
              <span className="text-[#F37A20] font-bold text-[11px] italic tracking-wider">UPI</span>
            </div>

            {/* Visa */}
            <div className="bg-white px-2 py-1 rounded shadow-sm flex items-center justify-center h-7" title="Visa">
              <span className="text-[#1434CB] font-bold text-[12px] italic tracking-widest">VISA</span>
            </div>

            {/* Mastercard */}
            <div className="bg-white px-2 py-1 rounded shadow-sm flex items-center justify-center h-7 gap-[1px]" title="Mastercard">
              <div className="w-3.5 h-3.5 bg-[#EB001B] rounded-full mix-blend-multiply opacity-90"></div>
              <div className="w-3.5 h-3.5 bg-[#F79E1B] rounded-full mix-blend-multiply opacity-90 -ml-1.5"></div>
            </div>

            {/* RuPay */}
            <div className="bg-white px-2 py-1 rounded shadow-sm flex items-center justify-center h-7" title="RuPay">
              <span className="font-bold text-[11px] tracking-wide">
                <span className="text-[#F37A20]">Ru</span>
                <span className="text-[#032B5B]">Pay</span>
              </span>
            </div>
            
          </div>
        </div>
      </div>

      {/* WhatsApp Chat Button (Fixed) */}
      <a
        href="https://wa.me/919876543210?text=Hi%20LavishOrganic!%20I%20have%20a%20question."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-warm-lg hover:scale-110 transition-transform z-40 no-print"
        aria-label="Chat on WhatsApp"
        id="whatsapp-chat-btn"
      >
        <MessageCircle className="w-7 h-7 text-white fill-white" />
      </a>
    </footer>
  );
}
