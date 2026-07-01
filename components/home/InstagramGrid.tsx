'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

// Instagram icon inline SVG (not in lucide-react)
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  );
}

// Instagram oEmbed API (FIX #8) — uses public post data without OAuth.
// For production, fetch real post URLs from Instagram Graph API.
// Static fallback provided for demo.

const INSTAGRAM_POSTS = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=400&q=80',
    url: 'https://www.instagram.com/lavishorganic_official/',
    likes: 324,
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=400&q=80',
    url: 'https://www.instagram.com/lavishorganic_official/',
    likes: 512,
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400&q=80',
    url: 'https://www.instagram.com/lavishorganic_official/',
    likes: 289,
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80',
    url: 'https://www.instagram.com/lavishorganic_official/',
    likes: 445,
  },
  {
    id: '5',
    image: 'https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=400&q=80',
    url: 'https://www.instagram.com/lavishorganic_official/',
    likes: 671,
  },
  {
    id: '6',
    image: 'https://images.unsplash.com/photo-1601612628452-9e99ced43524?w=400&q=80',
    url: 'https://www.instagram.com/lavishorganic_official/',
    likes: 398,
  },
];

export function InstagramGrid() {
  return (
    <section className="section bg-cream" aria-labelledby="instagram-heading">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <p className="text-xs font-body font-medium text-sage-dark uppercase tracking-widest mb-3">
            Follow Us
          </p>
          <h2 id="instagram-heading" className="section-title mb-2">
            @lavishorganic_official
          </h2>
          <p className="text-charcoal-lighter text-sm font-body">
            Tag us in your photos for a chance to be featured ✨
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          {INSTAGRAM_POSTS.map((post, index) => (
            <motion.a
              key={post.id}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
              className="group relative aspect-square rounded-lg overflow-hidden bg-sage-50 block"
              aria-label={`View on Instagram (${post.likes} likes)`}
            >
              <Image
                src={post.image}
                alt="LavishOrganic Instagram post"
                fill
                sizes="(max-width: 640px) 33vw, 16vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-sage-dark/0 group-hover:bg-sage-dark/50 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-1 text-white">
                  <InstagramIcon className="w-6 h-6" />

                  <span className="text-xs font-body font-medium">
                    ❤ {post.likes}
                  </span>
                </div>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Follow CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <a
            href="https://www.instagram.com/lavishorganic_official/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 border border-charcoal text-charcoal font-body text-sm font-medium rounded hover:bg-charcoal hover:text-white transition-colors"
            id="instagram-follow-btn"
          >
            <InstagramIcon className="w-4 h-4" />

            Follow on Instagram
          </a>
        </motion.div>
      </div>
    </section>
  );
}
