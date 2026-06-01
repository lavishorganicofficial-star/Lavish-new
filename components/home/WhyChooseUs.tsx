'use client';

import { motion } from 'framer-motion';
import { Leaf, ShieldCheck, HeartPulse, Sparkles } from 'lucide-react';
import Image from 'next/image';

const FEATURES = [
  {
    icon: Leaf,
    title: '100% Organic',
    description:
      'Every ingredient is certified organic. We never use synthetic chemicals, parabens, or harsh preservatives.',
    gradient: 'from-emerald-400/20 to-teal-500/5',
    iconColor: 'text-emerald-700',
    borderColor: 'group-hover:border-emerald-200',
  },
  {
    icon: HeartPulse,
    title: 'Cruelty-Free',
    description:
      'We love animals as much as we love your skin. No animal testing — ever. Proudly certified cruelty-free.',
    gradient: 'from-rose-400/20 to-pink-500/5',
    iconColor: 'text-rose-700',
    borderColor: 'group-hover:border-rose-200',
  },
  {
    icon: Sparkles,
    title: 'Made in India',
    description:
      'Crafted in India with locally sourced botanical ingredients, supporting sustainable farming communities.',
    gradient: 'from-amber-400/20 to-orange-500/5',
    iconColor: 'text-amber-700',
    borderColor: 'group-hover:border-amber-200',
  },
  {
    icon: ShieldCheck,
    title: 'Dermatologist Tested',
    description:
      'All formulations are clinically tested and approved by certified dermatologists for safety and efficacy.',
    gradient: 'from-blue-400/20 to-indigo-500/5',
    iconColor: 'text-blue-700',
    borderColor: 'group-hover:border-blue-200',
  },
];

export function WhyChooseUs() {
  return (
    <section
      className="section relative overflow-hidden bg-cream py-24"
      aria-labelledby="why-choose-heading"
    >
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-sage-light/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-40 -left-20 w-72 h-72 bg-amber-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
      </div>

      <div className="container relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <span className="inline-block py-1 px-3 rounded-full bg-sage-50 border border-sage-light/30 text-sage-dark text-xs font-semibold tracking-widest uppercase mb-4 shadow-sm">
            Our Promise
          </span>
          <h2 id="why-choose-heading" className="font-display text-4xl md:text-5xl font-medium text-charcoal mb-4">
            The Lavish Standard
          </h2>
          <p className="text-charcoal-lighter max-w-2xl mx-auto text-lg leading-relaxed">
            We believe in transparency, sustainability, and the raw power of nature. Experience skincare without compromises.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`group relative bg-white/60 backdrop-blur-md border border-white/40 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 ${feature.borderColor}`}
            >
              {/* Soft Gradient Overlay on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`} />
              
              <div className="relative z-10 flex flex-col h-full">
                {/* Icon Circle */}
                <div className={`w-16 h-16 rounded-2xl bg-white shadow-sm border border-black/5 flex items-center justify-center mb-6 transform group-hover:-translate-y-2 group-hover:scale-110 transition-all duration-500`}>
                  <feature.icon className={`w-8 h-8 ${feature.iconColor}`} strokeWidth={1.5} />
                </div>

                <h3 className="font-display text-2xl font-medium text-charcoal mb-3">
                  {feature.title}
                </h3>
                <p className="text-charcoal-lighter leading-relaxed text-sm flex-grow">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-20 relative bg-charcoal text-warm-white rounded-3xl p-10 md:p-14 overflow-hidden shadow-2xl"
        >
          {/* Subtle overlay texture inside the black card */}
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-sage-dark/20 to-transparent pointer-events-none" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10 divide-x divide-white/10">
            {[
              { value: '50k+', label: 'Happy Customers' },
              { value: '100%', label: 'Natural Actives' },
              { value: '4.9', label: 'Average Star Rating' },
              { value: '2018', label: 'Founded In India' },
            ].map((stat, i) => (
              <div key={stat.label} className={`text-center ${i === 0 ? 'border-none' : ''} ${i % 2 === 0 ? 'border-none md:border-solid' : ''}`}>
                <div className="font-display text-4xl md:text-5xl font-medium text-white mb-2 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm font-body text-warm-white/70 uppercase tracking-widest">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
