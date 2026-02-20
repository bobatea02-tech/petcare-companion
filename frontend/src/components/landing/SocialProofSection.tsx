import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Star, Users, Shield, Heart } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

export const SocialProofSection = () => {
  const testimonials = [
    {
      name: 'Priya Sharma',
      location: 'Mumbai',
      pet: 'Golden Retriever',
      rating: 5,
      text: 'JoJo is amazing! I can track my dog\'s health, book vet appointments, and even get reminders—all by just talking. It\'s like having a pet care assistant in my pocket!',
      avatar: '🐕',
    },
    {
      name: 'Rahul Patel',
      location: 'Delhi',
      pet: 'Persian Cat',
      rating: 5,
      text: 'The voice assistant is a game-changer. I used to forget medication times, but now JoJo reminds me. My cat has never been healthier!',
      avatar: '🐈',
    },
    {
      name: 'Ananya Reddy',
      location: 'Bangalore',
      pet: 'Labrador',
      rating: 5,
      text: 'Finding vets near me was always a hassle. With PawPal, I found a great clinic in minutes and booked an appointment instantly. Highly recommend!',
      avatar: '🐕',
    },
  ];

  const stats = [
    { icon: Users, value: '10,000+', label: 'Happy Pet Parents' },
    { icon: Heart, value: '25,000+', label: 'Pets Cared For' },
    { icon: Shield, value: '100%', label: 'Free Forever' },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-sage/20 to-olive/20">
      <div className="max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="p-8 text-center bg-cream border-2 border-moss/30 rounded-card shadow-lg">
                <stat.icon className="w-12 h-12 mx-auto mb-4 text-forest" />
                <div className="font-display text-4xl text-forest mb-2">{stat.value}</div>
                <div className="font-body text-forest/70">{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-forest mb-4">
            Loved by Pet Parents
          </h2>
          <p className="font-body text-lg md:text-xl text-forest/70 max-w-2xl mx-auto">
            Join thousands of happy pet owners across India
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="max-w-4xl mx-auto">
          <Carousel
            opts={{
              align: 'start',
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/2">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="p-2"
                  >
                    <Card className="p-8 bg-cream border-2 border-sage/30 rounded-card shadow-lg h-full">
                      {/* Rating */}
                      <div className="flex gap-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-moss text-moss" />
                        ))}
                      </div>

                      {/* Testimonial Text */}
                      <p className="font-body text-forest/80 mb-6 leading-relaxed">
                        "{testimonial.text}"
                      </p>

                      {/* Author */}
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-forest to-moss flex items-center justify-center text-2xl">
                          {testimonial.avatar}
                        </div>
                        <div>
                          <div className="font-body font-semibold text-forest">
                            {testimonial.name}
                          </div>
                          <div className="font-body text-sm text-forest/60">
                            {testimonial.location} • {testimonial.pet}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 text-forest/60"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="font-body text-sm">Free Forever</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-body text-sm">No Credit Card Required</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            <span className="font-body text-sm">India's #1 Pet Care App</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
