import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Mic, Heart, Calendar } from 'lucide-react';

export const InteractiveDemoSection = () => {
  const [activeDemo, setActiveDemo] = useState(0);

  const demos = [
    {
      feature: 'voice',
      title: 'AI Voice Assistant',
      description: 'Talk to JoJo naturally—no keywords needed',
      icon: Mic,
      color: 'from-forest to-moss',
    },
    {
      feature: 'health',
      title: 'Health Tracking',
      description: 'Monitor wellness with AI-powered scores',
      icon: Heart,
      color: 'from-moss to-sage',
    },
    {
      feature: 'vet',
      title: 'Vet Booking',
      description: 'Find and book appointments instantly',
      icon: Calendar,
      color: 'from-sage to-olive',
    },
  ];

  // Auto-cycle through demos
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDemo((prev) => (prev + 1) % demos.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [demos.length]);

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-olive/30 to-sage/30">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-forest mb-4">
            See PawPal in Action
          </h2>
          <p className="font-body text-lg md:text-xl text-forest/70 max-w-2xl mx-auto">
            Experience the power of AI-driven pet care
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Demo Preview */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
            style={{ willChange: 'transform' }}
          >
            <div className="bg-cream rounded-section p-8 shadow-2xl border-4 border-sage/30">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeDemo}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                  className="aspect-video bg-gradient-to-br from-forest/10 to-moss/10 rounded-card flex items-center justify-center"
                  style={{ willChange: 'transform, opacity' }}
                >
                  <div className="text-center">
                    {React.createElement(demos[activeDemo].icon, {
                      className: 'w-24 h-24 mx-auto mb-4 text-forest',
                    })}
                    <h3 className="font-display text-3xl text-forest mb-2">
                      {demos[activeDemo].title}
                    </h3>
                    <p className="font-body text-forest/70">
                      {demos[activeDemo].description}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Progress Indicators */}
              <div className="flex justify-center gap-2 mt-6">
                {demos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveDemo(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === activeDemo ? 'w-8 bg-forest' : 'w-2 bg-forest/30'
                    }`}
                    aria-label={`View demo ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Feature List */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
            style={{ willChange: 'transform' }}
          >
            {demos.map((demo, index) => (
              <motion.button
                key={demo.feature}
                onClick={() => setActiveDemo(index)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full text-left p-6 rounded-card transition-all duration-300 ${
                  index === activeDemo
                    ? 'bg-cream shadow-xl border-2 border-moss'
                    : 'bg-cream/50 shadow-lg border-2 border-sage/30'
                }`}
                style={{ willChange: 'transform' }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${demo.color} flex items-center justify-center flex-shrink-0`}
                  >
                    <demo.icon className="w-6 h-6 text-cream" />
                  </div>
                  <div>
                    <h4 className="font-display text-xl text-forest mb-2">
                      {demo.title}
                    </h4>
                    <p className="font-body text-forest/70">
                      {demo.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* Note */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12 font-body text-forest/60 text-sm"
        >
          This is a preview. Sign up to experience the full dashboard!
        </motion.p>
      </div>
    </section>
  );
};
