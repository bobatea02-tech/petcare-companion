import { motion } from 'framer-motion';
import { UserPlus, PawPrint, Sparkles } from 'lucide-react';

export const HowItWorksSection = () => {
  const steps = [
    {
      icon: UserPlus,
      number: '1',
      title: 'Sign Up Free',
      description: 'Create your account in seconds. No credit card required, no hidden fees—just pure pet care goodness.',
    },
    {
      icon: PawPrint,
      number: '2',
      title: 'Add Your Pet',
      description: 'Tell us about your furry friend. Name, type, breed, age—we\'ll create a personalized profile in under a minute.',
    },
    {
      icon: Sparkles,
      number: '3',
      title: 'Start Caring',
      description: 'Talk to JoJo, track health, book vets, and give your pet the care they deserve. It\'s that simple!',
    },
  ];

  return (
    <section className="py-20 px-4 bg-cream">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-forest mb-4">
            Get Started in 3 Easy Steps
          </h2>
          <p className="font-body text-lg md:text-xl text-forest/70 max-w-2xl mx-auto">
            From sign-up to caring for your pet in under 2 minutes
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connection Lines (Desktop) */}
          <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-sage via-moss to-sage opacity-30" />

          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="relative text-center"
            >
              {/* Step Number Circle */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-forest to-moss flex items-center justify-center relative z-10 shadow-lg"
              >
                <span className="font-display text-3xl text-cream">{step.number}</span>
              </motion.div>

              {/* Icon */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-sage/30 flex items-center justify-center"
              >
                <step.icon className="w-8 h-8 text-forest" />
              </motion.div>

              {/* Title */}
              <h3 className="font-display text-2xl text-forest mb-4">
                {step.title}
              </h3>

              {/* Description */}
              <p className="font-body text-forest/70 leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-16"
        >
          <p className="font-body text-lg text-forest/80 mb-4">
            Ready to give your pet the best care?
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button className="px-8 py-4 bg-gradient-to-r from-forest to-moss text-cream font-bold text-lg rounded-card shadow-lg hover:shadow-2xl transition-shadow">
              Get Started Free →
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
