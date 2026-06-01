'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Package, ShoppingCart, Users, Settings, Tag, TrendingUp } from 'lucide-react';

type CommandItem = {
  id: string;
  name: string;
  icon: any;
  href: string;
  category: string;
};

const COMMANDS: CommandItem[] = [
  { id: 'orders', name: 'Go to Orders', icon: ShoppingCart, href: '/admin/orders', category: 'Pages' },
  { id: 'products', name: 'Go to Products', icon: Package, href: '/admin/products', category: 'Pages' },
  { id: 'add-product', name: 'Add New Product', icon: Package, href: '/admin/products/new', category: 'Actions' },
  { id: 'customers', name: 'Go to Customers', icon: Users, href: '/admin/customers', category: 'Pages' },
  { id: 'analytics', name: 'Go to Analytics', icon: TrendingUp, href: '/admin/analytics', category: 'Pages' },
  { id: 'settings', name: 'Store Settings', icon: Settings, href: '/admin/settings', category: 'Pages' },
  { id: 'coupons', name: 'Manage Coupons', icon: Tag, href: '/admin/coupons', category: 'Pages' },
];

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredCommands = query
    ? COMMANDS.filter((cmd) => cmd.name.toLowerCase().includes(query.toLowerCase()))
    : COMMANDS;

  const handleSelect = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter' && filteredCommands[activeIndex]) {
      e.preventDefault();
      handleSelect(filteredCommands[activeIndex].href);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4">
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-3 border-b border-gray-100">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent outline-none placeholder:text-gray-400 text-charcoal"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
            onKeyDown={handleKeyDown}
          />
          <kbd className="hidden sm:inline-block text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
            ESC
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <p className="p-4 text-sm text-center text-gray-500">No results found.</p>
          ) : (
            filteredCommands.map((cmd, index) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={() => handleSelect(cmd.href)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    index === activeIndex ? 'bg-sage-50 text-sage-dark' : 'text-charcoal hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-3 opacity-70" />
                  {cmd.name}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
