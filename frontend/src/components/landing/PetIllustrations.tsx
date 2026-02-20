import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { COLORS } from '@/lib/design-system';
import { throttle } from '@/lib/performanceUtils';

interface PetIllustrationsProps {
  scrollY?: number;
}

export const PetIllustrations = ({ scrollY: externalScrollY }: PetIllustrationsProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [illustrationErrors, setIllustrationErrors] = useState<Set<string>>(new Set());
  
  // Detect reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // Use external scrollY if provided, otherwise use hook
  const activeScrollY = externalScrollY !== undefined ? externalScrollY : scrollY.get();
  
  // Parallax transforms for each pet (disabled if reduced motion is preferred)
  // Using GPU-accelerated transforms with will-change optimization
  const dogY = useTransform(scrollY, [0, 1000], prefersReducedMotion ? [0, 0] : [0, 300]);
  const dogRotate = useTransform(scrollY, [0, 1000], prefersReducedMotion ? [0, 0] : [0, 15]);
  
  const catY = useTransform(scrollY, [0, 1000], prefersReducedMotion ? [0, 0] : [0, 500]);
  const catRotate = useTransform(scrollY, [0, 1000], prefersReducedMotion ? [0, 0] : [0, -12]);
  
  const birdY = useTransform(scrollY, [0, 1000], prefersReducedMotion ? [0, 0] : [0, 200]);
  const birdRotate = useTransform(scrollY, [0, 1000], prefersReducedMotion ? [0, 0] : [0, 10]);
  
  const fishY = useTransform(scrollY, [0, 1000], prefersReducedMotion ? [0, 0] : [0, 400]);
  const fishRotate = useTransform(scrollY, [0, 1000], prefersReducedMotion ? [0, 0] : [0, -8]);
  
  // Handle illustration rendering errors
  const handleIllustrationError = (petType: string) => {
    console.warn(`[PetIllustrations] Failed to render ${petType} illustration`);
    setIllustrationErrors(prev => new Set(prev).add(petType));
  };

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Dog Illustration - GPU accelerated with will-change */}
      <motion.div
        style={{ 
          y: dogY, 
          rotate: dogRotate,
          willChange: prefersReducedMotion ? 'auto' : 'transform'
        }}
        className="absolute top-20 right-10 w-32 h-32 md:w-48 md:h-48"
      >
        {illustrationErrors.has('dog') ? (
          <PlaceholderShape color={COLORS.sage} />
        ) : (
          <DogIllustration onError={() => handleIllustrationError('dog')} />
        )}
      </motion.div>

      {/* Cat Illustration - GPU accelerated with will-change */}
      <motion.div
        style={{ 
          y: catY, 
          rotate: catRotate,
          willChange: prefersReducedMotion ? 'auto' : 'transform'
        }}
        className="absolute top-40 left-10 w-28 h-28 md:w-40 md:h-40"
      >
        {illustrationErrors.has('cat') ? (
          <PlaceholderShape color={COLORS.olive} />
        ) : (
          <CatIllustration onError={() => handleIllustrationError('cat')} />
        )}
      </motion.div>

      {/* Bird Illustration - GPU accelerated with will-change */}
      <motion.div
        style={{ 
          y: birdY, 
          rotate: birdRotate,
          willChange: prefersReducedMotion ? 'auto' : 'transform'
        }}
        className="absolute bottom-40 right-20 w-24 h-24 md:w-36 md:h-36"
      >
        {illustrationErrors.has('bird') ? (
          <PlaceholderShape color={COLORS.sage} />
        ) : (
          <BirdIllustration onError={() => handleIllustrationError('bird')} />
        )}
      </motion.div>

      {/* Fish Illustration - GPU accelerated with will-change */}
      <motion.div
        style={{ 
          y: fishY, 
          rotate: fishRotate,
          willChange: prefersReducedMotion ? 'auto' : 'transform'
        }}
        className="absolute bottom-20 left-20 w-28 h-28 md:w-40 md:h-40"
      >
        {illustrationErrors.has('fish') ? (
          <PlaceholderShape color={COLORS.moss} />
        ) : (
          <FishIllustration onError={() => handleIllustrationError('fish')} />
        )}
      </motion.div>
    </div>
  );
};

// Placeholder shape for failed illustrations
const PlaceholderShape = ({ color }: { color: string }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="80" fill={color} opacity="0.3" />
  </svg>
);

// Dog SVG Illustration - Optimized for performance
const DogIllustration = ({ onError }: { onError: () => void }) => {
  try {
    return (
      <svg 
        viewBox="0 0 200 200" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Dog illustration"
        role="img"
      >
        <circle cx="100" cy="100" r="80" fill={COLORS.sage} opacity="0.3" />
        <ellipse cx="100" cy="120" rx="50" ry="60" fill={COLORS.forest} />
        <circle cx="85" cy="105" r="8" fill={COLORS.cream} />
        <circle cx="115" cy="105" r="8" fill={COLORS.cream} />
        <circle cx="87" cy="107" r="4" fill={COLORS.forest} />
        <circle cx="117" cy="107" r="4" fill={COLORS.forest} />
        <ellipse cx="100" cy="125" rx="6" ry="8" fill={COLORS.forest} />
        <path d="M100 125Q90 135 85 130" stroke={COLORS.forest} strokeWidth="3" fill="none" />
        <path d="M100 125Q110 135 115 130" stroke={COLORS.forest} strokeWidth="3" fill="none" />
        <ellipse cx="60" cy="90" rx="20" ry="30" fill={COLORS.moss} />
        <ellipse cx="140" cy="90" rx="20" ry="30" fill={COLORS.moss} />
      </svg>
    );
  } catch (error) {
    console.error('[DogIllustration] Render error:', error);
    onError();
    return null;
  }
};

// Cat Illustration - Optimized for performance
const CatIllustration = ({ onError }: { onError: () => void }) => {
  try {
    return (
      <svg 
        viewBox="0 0 200 200" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Cat illustration"
        role="img"
      >
        <circle cx="100" cy="100" r="75" fill={COLORS.olive} opacity="0.3" />
        <ellipse cx="100" cy="115" rx="45" ry="50" fill={COLORS.moss} />
        <circle cx="88" cy="105" r="7" fill={COLORS.cream} />
        <circle cx="112" cy="105" r="7" fill={COLORS.cream} />
        <circle cx="90" cy="107" r="3" fill={COLORS.forest} />
        <circle cx="114" cy="107" r="3" fill={COLORS.forest} />
        <polygon points="70,70 80,50 90,70" fill={COLORS.moss} />
        <polygon points="130,70 120,50 110,70" fill={COLORS.moss} />
        <ellipse cx="100" cy="120" rx="4" ry="6" fill={COLORS.forest} />
        <path d="M100 120L85 125" stroke={COLORS.forest} strokeWidth="2" />
        <path d="M100 120L115 125" stroke={COLORS.forest} strokeWidth="2" />
        <path d="M100 120L100 130" stroke={COLORS.forest} strokeWidth="2" />
      </svg>
    );
  } catch (error) {
    console.error('[CatIllustration] Render error:', error);
    onError();
    return null;
  }
};

// Bird Illustration - Optimized for performance
const BirdIllustration = ({ onError }: { onError: () => void }) => {
  try {
    return (
      <svg 
        viewBox="0 0 200 200" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Bird illustration"
        role="img"
      >
        <circle cx="100" cy="100" r="70" fill={COLORS.sage} opacity="0.2" />
        <ellipse cx="100" cy="100" rx="35" ry="40" fill={COLORS.forest} />
        <circle cx="92" cy="95" r="5" fill={COLORS.cream} />
        <circle cx="108" cy="95" r="5" fill={COLORS.cream} />
        <circle cx="93" cy="96" r="2" fill={COLORS.forest} />
        <circle cx="109" cy="96" r="2" fill={COLORS.forest} />
        <path d="M60 100Q50 90 45 95Q40 100 50 105Q60 110 70 105" fill={COLORS.moss} />
        <path d="M140 100Q150 90 155 95Q160 100 150 105Q140 110 130 105" fill={COLORS.moss} />
        <polygon points="100,110 95,120 105,120" fill={COLORS.olive} />
        <ellipse cx="100" cy="75" rx="15" ry="8" fill={COLORS.moss} />
      </svg>
    );
  } catch (error) {
    console.error('[BirdIllustration] Render error:', error);
    onError();
    return null;
  }
};

// Fish Illustration - Optimized for performance
const FishIllustration = ({ onError }: { onError: () => void }) => {
  try {
    return (
      <svg 
        viewBox="0 0 200 200" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Fish illustration"
        role="img"
      >
        <circle cx="100" cy="100" r="75" fill={COLORS.olive} opacity="0.2" />
        <ellipse cx="110" cy="100" rx="50" ry="30" fill={COLORS.moss} />
        <circle cx="95" cy="95" r="6" fill={COLORS.cream} />
        <circle cx="97" cy="96" r="3" fill={COLORS.forest} />
        <polygon points="160,100 180,85 180,115" fill={COLORS.sage} />
        <ellipse cx="120" cy="85" rx="15" ry="8" fill={COLORS.forest} opacity="0.3" />
        <ellipse cx="125" cy="115" rx="12" ry="6" fill={COLORS.forest} opacity="0.3" />
        <path d="M60 100Q40 90 30 100Q40 110 60 100" fill={COLORS.sage} />
      </svg>
    );
  } catch (error) {
    console.error('[FishIllustration] Render error:', error);
    onError();
    return null;
  }
};
