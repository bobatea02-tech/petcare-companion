import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  animated?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { svg: 32, text: 'text-xl' },
  md: { svg: 40, text: 'text-2xl' },
  lg: { svg: 80, text: 'text-6xl' },
  xl: { svg: 120, text: 'text-8xl' },
};

export const Logo = ({ 
  size = 'md', 
  showText = true, 
  animated = false,
  className = '' 
}: LogoProps) => {
  const { svg: svgSize, text: textSize } = sizeMap[size];
  const gradientId = `pawGradient-${size}-${Math.random().toString(36).substr(2, 9)}`;

  const logoSvg = (
    <svg 
      width={svgSize} 
      height={svgSize} 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className="drop-shadow-lg"
    >
      <circle cx="20" cy="20" r="18" fill={`url(#${gradientId})`} />
      <g transform="translate(10, 12)">
        <ellipse cx="10" cy="12" rx="4" ry="5" fill="white" opacity="0.95" />
        <ellipse cx="4" cy="6" rx="2.5" ry="3" fill="white" opacity="0.95" transform="rotate(-20 4 6)" />
        <ellipse cx="16" cy="6" rx="2.5" ry="3" fill="white" opacity="0.95" transform="rotate(20 16 6)" />
        <ellipse cx="7" cy="3" rx="2" ry="2.5" fill="white" opacity="0.95" transform="rotate(-10 7 3)" />
        <ellipse cx="13" cy="3" rx="2" ry="2.5" fill="white" opacity="0.95" transform="rotate(10 13 3)" />
      </g>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
    </svg>
  );

  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      {animated ? (
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.15, rotate: 10 }}
        >
          {logoSvg}
        </motion.div>
      ) : (
        logoSvg
      )}
      {showText && (
        <span className={`font-display ${textSize} bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 bg-clip-text text-transparent font-bold tracking-tight`}>
          PawPal
        </span>
      )}
    </div>
  );

  return content;
};
