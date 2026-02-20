import { Mic, Heart, Calendar } from 'lucide-react';
import { FeatureCard } from './FeatureCard';

export const FeaturesSection = () => {
  const features = [
    {
      icon: Mic,
      title: 'AI Voice Assistant',
      description: 'Talk to JoJo, your friendly AI companion. Just say "Hey JoJo" and manage your pet\'s care hands-free. No typing, no clicking—just natural conversation.',
    },
    {
      icon: Heart,
      title: 'Smart Health Tracking',
      description: 'Monitor your pet\'s wellness with AI-powered health scores. Track medications, symptoms, weight, and get personalized recommendations to keep your furry friend healthy.',
    },
    {
      icon: Calendar,
      title: 'Instant Vet Booking',
      description: 'Find nearby veterinary clinics and book appointments in seconds. Get real-time availability, clinic ratings, and directions—all in one place.',
    },
  ];

  return (
    <section className="py-20 px-4 bg-cream" aria-labelledby="features-heading">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 id="features-heading" className="font-display text-4xl md:text-5xl lg:text-6xl text-forest mb-4">
            Everything Your Pet Needs
          </h2>
          <p className="font-body text-lg md:text-xl text-forest/70 max-w-2xl mx-auto">
            Powerful features designed to make pet care simple, smart, and stress-free
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8" role="list">
          {features.map((feature, index) => (
            <div key={feature.title} role="listitem">
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                index={index}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
