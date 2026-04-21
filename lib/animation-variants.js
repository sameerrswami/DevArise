/**
 * Animation variants and utilities for Framer Motion
 * Reusable animation presets across the application
 */

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.4 },
};

export const slideInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.4, ease: 'easeOut' },
};

export const slideInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: 'easeOut' },
};

export const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.4, ease: 'easeOut' },
};

export const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.4, ease: 'easeOut' },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: 0.4, type: 'spring', stiffness: 100 },
};

export const rotateIn = {
  initial: { opacity: 0, rotate: -10 },
  animate: { opacity: 1, rotate: 0 },
  exit: { opacity: 0, rotate: -10 },
  transition: { duration: 0.4 },
};

export const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

export const hoverScale = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.98 },
  transition: { type: 'spring', stiffness: 400, damping: 10 },
};

export const pulseVariant = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

export const shimmerVariant = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'linear',
  },
};

export const floatVariant = {
  animate: {
    y: [0, -8, 0],
  },
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

export const glowVariant = {
  animate: {
    boxShadow: [
      '0 0 20px rgba(168, 85, 247, 0.4)',
      '0 0 40px rgba(168, 85, 247, 0.6)',
      '0 0 20px rgba(168, 85, 247, 0.4)',
    ],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

export const flipVariant = {
  initial: { rotateY: -90, opacity: 0 },
  animate: { rotateY: 0, opacity: 1 },
  exit: { rotateY: 90, opacity: 0 },
  transition: { duration: 0.4 },
};

/**
 * Stagger animation helper
 */
export const staggerContainer = (staggerChildren = 0.1, delayChildren = 0) => ({
  initial: 'hidden',
  animate: 'visible',
  variants: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren,
        delayChildren,
      },
    },
  },
});

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

/**
 * Page transition variants
 */
export const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3 },
};

/**
 * Modal variants
 */
export const modalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', damping: 15, stiffness: 200 },
  },
  exit: { opacity: 0, scale: 0.9 },
};

export const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Micro-interactions
 */
export const buttonHover = {
  scale: 1.02,
  boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
};

export const buttonTap = {
  scale: 0.98,
};

/**
 * Text animation
 */
export const textAppear = {
  hidden: { opacity: 0, y: 5 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
    },
  }),
};

/**
 * Number counter animation
 */
export const counter = (from = 0, to = 100) => ({
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
});

/**
 * List animation
 */
export const listContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const listItem = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
};

/**
 * Carousel variants
 */
export const carouselVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
  }),
};

export const swipeConfidenceThreshold = 10000;
export const swipePower = (offset, velocity) => {
  return Math.abs(offset) * velocity;
};
