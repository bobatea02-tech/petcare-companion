import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Check, Sparkles, Crown } from 'lucide-react';

export const PricingSection = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-forest via-moss to-sage">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-pill bg-cream/20 backdrop-blur-sm border border-cream/30 mb-6"
          >
            <Sparkles className="w-4 h-4 text-cream" />
            <span className="text-cream text-sm font-medium">Simple, Transparent Pricing</span>
          </motion.div>

          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-cream mb-4">
            Free Forever. Really.
          </h2>
          <p className="font-body text-lg md:text-xl text-cream/90 max-w-2xl mx-auto">
            All features, unlimited pets, zero cost. Because every pet deserves the best care.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-8 bg-cream border-2 border-sage/30 rounded-card shadow-2xl h-full">
              <div className="mb-6">
                <h3 className="font-display text-3xl text-forest mb-2">Free Plan</h3>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-5xl text-forest">₹0</span>
                  <span className="font-body text-forest/60">/forever</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  'AI Voice Assistant (JoJo)',
                  'Unlimited Pets',
                  'Health Tracking & Scores',
                  'Medication Reminders',
                  'Vet Search & Booking',
                  'Feeding & Activity Logs',
                  'Emergency SOS Feature',
                  'Pet Milestones',
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-moss flex-shrink-0 mt-0.5" />
                    <span className="font-body text-forest/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full px-6 py-4 bg-gradient-to-r from-forest to-moss text-cream font-bold text-lg rounded-card shadow-lg hover:shadow-2xl transition-shadow"
              >
                Get Started Free
              </motion.button>
            </Card>
          </motion.div>

          {/* Premium Plan (Coming Soon) */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-8 bg-gradient-to-br from-moss to-sage border-2 border-cream/30 rounded-card shadow-2xl h-full relative overflow-hidden">
              {/* Coming Soon Badge */}
              <div className="absolute top-4 right-4">
                <div className="px-3 py-1 bg-cream/20 backdrop-blur-sm rounded-pill border border-cream/30">
                  <span className="text-cream text-xs font-bold">COMING SOON</span>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-6 h-6 text-cream" />
                  <h3 className="font-display text-3xl text-cream">Premium</h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-5xl text-cream">₹99</span>
                  <span className="font-body text-cream/80">/month</span>
                </div>
              </div>

              <p className="font-body text-cream/90 mb-6">
                Everything in Free, plus:
              </p>

              <ul className="space-y-4 mb-8">
                {[
                  'Priority Vet Booking',
                  'Advanced Health Analytics',
                  'Personalized Care Plans',
                  'Video Consultations',
                  'Pet Insurance Integration',
                  'Expense Tracking & Reports',
                  'Multi-Pet Comparison',
                  'Premium Support',
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-cream flex-shrink-0 mt-0.5" />
                    <span className="font-body text-cream/90">{feature}</span>
                  </li>
                ))}
              </ul>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full px-6 py-4 bg-cream text-forest font-bold text-lg rounded-card shadow-lg hover:shadow-2xl transition-shadow"
                disabled
              >
                Notify Me When Available
              </motion.button>
            </Card>
          </motion.div>
        </div>

        {/* Trust Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="font-body text-cream/80 text-sm">
            No credit card required • Cancel anytime • 10,000+ happy pet parents
          </p>
        </motion.div>
      </div>
    </section>
  );
};
