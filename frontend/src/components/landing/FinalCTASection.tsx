import { motion } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FinalCTASectionProps {
  onCTAClick: () => void;
}

export const FinalCTASection = ({ onCTAClick }: FinalCTASectionProps) => {
  return (
    <section className="py-20 px-4 bg-cream relative overflow-hidden" aria-labelledby="final-cta-heading">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-10 left-10 w-64 h-64 bg-sage/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-moss/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, type: "spring" }}
          className="w-20 h-20 mx-auto mb-8 rounded-full bg-gradient-to-br from-forest to-moss flex items-center justify-center"
          role="img"
          aria-label="Heart icon"
        >
          <Heart className="w-10 h-10 text-cream fill-cream" aria-hidden="true" />
        </motion.div>

        {/* Headline */}
        <motion.h2
          id="final-cta-heading"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-4xl md:text-5xl lg:text-6xl text-forest mb-6"
        >
          Join 10,000+ Happy
          <br />
          Pet Parents Today
        </motion.h2>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-body text-lg md:text-xl text-forest/70 mb-10 max-w-2xl mx-auto"
        >
          Give your furry friend the care they deserve. Start your journey with PawPal—it's free, forever.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={onCTAClick}
            size="lg"
            className="bg-gradient-to-r from-forest to-moss text-cream hover:from-moss hover:to-forest font-bold text-lg px-10 py-7 rounded-card shadow-2xl group focus:outline-none focus:ring-4 focus:ring-sage focus:ring-offset-2"
            tabIndex={0}
            aria-label="Get started with PawPal for free"
          >
            Get Started Free
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Button>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-6 text-forest/60 text-sm"
          role="list"
          aria-label="Trust indicators"
        >
          <div className="flex items-center gap-2" role="listitem">
            <svg className="w-5 h-5 text-moss" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>No Credit Card Required</span>
          </div>
          <div className="flex items-center gap-2" role="listitem">
            <svg className="w-5 h-5 text-moss" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Setup in 2 Minutes</span>
          </div>
          <div className="flex items-center gap-2" role="listitem">
            <svg className="w-5 h-5 text-moss" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Free Forever</span>
          </div>
        </motion.div>

        {/* Pet Emojis */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 text-5xl"
          role="img"
          aria-label="Pet emojis: dog, cat, bird, and fish"
        >
          <motion.span
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0 }}
            className="inline-block mx-2"
          >
            🐕
          </motion.span>
          <motion.span
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
            className="inline-block mx-2"
          >
            🐈
          </motion.span>
          <motion.span
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
            className="inline-block mx-2"
          >
            🐦
          </motion.span>
          <motion.span
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
            className="inline-block mx-2"
          >
            🐟
          </motion.span>
        </motion.div>
      </div>
    </section>
  );
};
