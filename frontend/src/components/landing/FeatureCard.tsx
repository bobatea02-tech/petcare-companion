import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index?: number;
}

export const FeatureCard = ({ icon: Icon, title, description, index = 0 }: FeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="h-full"
      style={{ willChange: 'transform' }}
    >
      <Card className="h-full p-8 bg-cream border-2 border-sage/30 rounded-card shadow-lg hover:shadow-2xl transition-shadow duration-300">
        {/* Icon */}
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ duration: 0.3 }}
          className="w-16 h-16 mb-6 rounded-full bg-gradient-to-br from-forest to-moss flex items-center justify-center"
          style={{ willChange: 'transform' }}
          role="img"
          aria-label={`${title} icon`}
        >
          <Icon className="w-8 h-8 text-cream" aria-hidden="true" />
        </motion.div>

        {/* Title */}
        <h3 className="font-display text-2xl text-forest mb-4">
          {title}
        </h3>

        {/* Description */}
        <p className="font-body text-forest/70 leading-relaxed">
          {description}
        </p>
      </Card>
    </motion.div>
  );
};
