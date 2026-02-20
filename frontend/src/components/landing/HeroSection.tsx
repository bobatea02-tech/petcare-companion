import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PetIllustrations } from './PetIllustrations';
import { ArrowRight, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onCTAClick: () => void;
}

export const HeroSection = ({ onCTAClick }: HeroSectionProps) => {
  return (
    <header className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-forest via-moss to-sage px-4 py-20" role="banner">
      {/* Animated Pet Illustrations */}
      <PetIllustrations />

      {/* Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-pill bg-cream/20 backdrop-blur-sm border border-cream/30 mb-6"
          role="status"
          aria-label="India's number 1 pet care app"
        >
          <Sparkles className="w-4 h-4 text-cream" aria-hidden="true" />
          <span className="text-cream text-sm font-medium font-body">India's #1 Pet Care App</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-5xl md:text-7xl lg:text-8xl text-cream mb-6 leading-tight"
        >
          Your Pet's New
          <br />
          <span className="text-sage">Best Friend!</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-body text-lg md:text-xl lg:text-2xl text-cream/90 mb-8 max-w-3xl mx-auto"
        >
          AI-powered voice assistant, smart health tracking, and instant vet booking.
          <br className="hidden md:block" />
          Everything your furry friend needs, all in one place.
        </motion.p>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-10 text-cream/80 text-sm"
          role="list"
          aria-label="Trust indicators"
        >
          <div className="flex items-center gap-2" role="listitem">
            <svg className="w-5 h-5 text-sage" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-body">Free Forever</span>
          </div>
          <div className="flex items-center gap-2" role="listitem">
            <svg className="w-5 h-5 text-sage" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-body">No Credit Card Required</span>
          </div>
          <div className="flex items-center gap-2" role="listitem">
            <svg className="w-5 h-5 text-sage" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-body">10,000+ Happy Pet Parents</span>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ willChange: 'transform' }}
        >
          <Button
            onClick={onCTAClick}
            size="lg"
            className="bg-cream text-forest hover:bg-cream/90 font-bold text-lg px-8 py-6 rounded-card shadow-2xl group focus:outline-none focus:ring-4 focus:ring-sage focus:ring-offset-2"
            tabIndex={0}
            aria-label="Get started with PawPal for free"
          >
            Get Started Free
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Button>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          style={{ willChange: 'transform' }}
          aria-label="Scroll down for more content"
          role="img"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 border-2 border-cream/50 rounded-pill flex items-start justify-center p-2"
            style={{ willChange: 'transform' }}
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-1.5 h-1.5 bg-cream rounded-full"
              style={{ willChange: 'transform' }}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-sage/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-moss/10 rounded-full blur-3xl" />
      </div>
    </header>
  );
};
