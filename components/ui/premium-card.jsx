'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import React from 'react';

/**
 * PremiumCard - Modern glassmorphism card component
 * Features: Glass effect, gradient borders, glow effects, animations
 */
export function PremiumCard({
  children,
  className,
  variant = 'glass',
  hover = true,
  glow = false,
  gradient = false,
  animated = true,
  ...props
}) {
  const variants = {
    glass:
      'glass glass-card border border-white/10 shadow-xl',
    neumorphic:
      'neumorphic bg-card border border-white/5 shadow-2xl',
    gradient:
      'bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-cyan-500/10 border border-purple-500/20 backdrop-blur-xl',
    dark: 'bg-card/40 backdrop-blur-2xl border border-white/5 shadow-2xl',
    elevated:
      'bg-card shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-white/10 backdrop-blur-xl',
  };

  const glowClasses = glow ? 'glow-primary shadow-lg' : '';

  const motionProps = animated
    ? {
        initial: { opacity: 0, y: 8 },
        whileInView: { opacity: 1, y: 0 },
        transition: { duration: 0.5 },
        viewport: { once: true },
      }
    : {};

  const hoverProps = hover
    ? {
        whileHover: { y: -4, transition: { duration: 0.2 } },
        whileTap: { scale: 0.98 },
      }
    : {};

  return (
    <motion.div
      className={cn(
        'rounded-2xl p-6 transition-all duration-300',
        variants[variant],
        glowClasses,
        className
      )}
      {...motionProps}
      {...hoverProps}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * GlassCard - Ultra-modern glass effect card
 */
export function GlassCard({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * GradientCard - Card with animated gradient background
 */
export function GradientCard({ children, className, ...props }) {
  return (
    <motion.div
      className={cn(
        'rounded-xl overflow-hidden bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-cyan-600/20 border border-purple-500/30 backdrop-blur-lg shadow-2xl',
        className
      )}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      <div className="relative z-10 p-6">{children}</div>
      <div className="absolute inset-0 opacity-20 animate-gradient-shift" />
    </motion.div>
  );
}

/**
 * NeumorphicCard - Soft UI neumorphism card
 */
export function NeumorphicCard({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'neumorphic rounded-3xl p-6 shadow-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * AnimatedCard - Card with built-in hover animation
 */
export function AnimatedCard({
  children,
  className,
  delay = 0,
  ...props
}) {
  return (
    <motion.div
      className={cn('rounded-xl', className)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{
        duration: 0.4,
        delay: delay * 0.1,
        type: 'spring',
        stiffness: 100,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * CardGrid - Responsive grid container for cards
 */
export function CardGrid({ children, className, columns = 3, ...props }) {
  const gridClasses = `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6`;
  return (
    <div className={cn(gridClasses, className)} {...props}>
      {children}
    </div>
  );
}
