import Link from 'next/link';

export function InfluencerFooter() {
  return (
    <footer className="bg-white border-t border-sage-light/30 mt-auto">
      <div className="container max-w-6xl px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-charcoal-lighter">
          <div>
            <p>© {new Date().getFullYear()} LavishOrganic | Partner Program</p>
          </div>
          
          <div className="flex items-center gap-6">
            <p>Need help? Contact: <a href="mailto:setustack@gmail.com" className="text-sage-dark font-medium hover:underline">setustack@gmail.com</a></p>
            <div className="hidden md:flex items-center gap-4 border-l border-sage-light/30 pl-6">
              <Link href="/privacy" className="hover:text-charcoal transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-charcoal transition-colors">Terms</Link>
            </div>
          </div>
          
          {/* Mobile Links */}
          <div className="flex md:hidden items-center gap-4 mt-2">
            <Link href="/privacy" className="hover:text-charcoal transition-colors">Privacy Policy</Link>
            <span className="text-sage-light/50">•</span>
            <Link href="/terms" className="hover:text-charcoal transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
