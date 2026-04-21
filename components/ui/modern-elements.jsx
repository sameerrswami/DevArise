'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import React from 'react';

/**
 * ModernButton - Premium button component with multiple variants
 */
export function ModernButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  fullWidth = false,
  ...props
}) {
  const variants = {
    primary:
      'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/40',
    secondary:
      'bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md',
    outline:
      'border-2 border-purple-500 text-purple-500 hover:bg-purple-500/10',
    ghost:
      'text-foreground hover:bg-white/5 hover:backdrop-blur-md',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-7 py-3.5 text-lg',
  };

  return (
    <motion.button
      className={cn(
        'rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        loading && 'opacity-60 cursor-not-allowed'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <motion.div
          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4" />}
          {children}
        </>
      )}
    </motion.button>
  );
}

/**
 * ModernInput - Premium input component with animations
 */
export function ModernInput({
  className,
  icon: Icon,
  error,
  label,
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-2 text-foreground/80">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50 pointer-events-none" />
        )}
        <motion.input
          className={cn(
            'w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-foreground placeholder-foreground/40 backdrop-blur-md transition-all duration-300',
            Icon && 'pl-10',
            error && 'border-red-500/50 bg-red-500/5',
            'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white/10',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Badge - Modern badge component with variants
 */
export function Badge({
  children,
  variant = 'default',
  glow = false,
  size = 'md',
  ...props
}) {
  const variants = {
    default:
      'bg-purple-500/20 text-purple-200 border border-purple-500/30',
    success:
      'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30',
    warning:
      'bg-amber-500/20 text-amber-200 border border-amber-500/30',
    danger: 'bg-red-500/20 text-red-200 border border-red-500/30',
    info: 'bg-blue-500/20 text-blue-200 border border-blue-500/30',
    rank: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-100 border border-yellow-500/30',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <motion.span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium backdrop-blur-sm transition-all duration-300',
        variants[variant],
        sizes[size],
        glow && 'shadow-lg',
      )}
      whileHover={{ scale: 1.05 }}
      {...props}
    >
      {children}
    </motion.span>
  );
}

/**
 * StatCard - Modern stat display card
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  change,
  positive = true,
  ...props
}) {
  return (
    <motion.div
      className="glass glass-card rounded-xl p-6 hover:bg-white/10 transition-all duration-300"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      <div className="flex items-start justify-between mb-4">
        {Icon && (
          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
            <Icon className="w-6 h-6" />
          </div>
        )}
        {change && (
          <Badge
            variant={positive ? 'success' : 'danger'}
            size="sm"
          >
            {positive ? '↑' : '↓'} {change}%
          </Badge>
        )}
      </div>
      <p className="text-foreground/60 text-sm font-medium mb-1">
        {label}
      </p>
      <p className="text-3xl font-bold gradient-text">{value}</p>
    </motion.div>
  );
}

/**
 * SkeletonLoader - Animated loading skeleton
 */
export function SkeletonLoader({ count = 1, className = '' }) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="h-12 rounded-lg bg-white/5 backdrop-blur-sm animate-shimmer"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
      ))}
    </div>
  );
}

/**
 * LoadingSpinner - Modern loading spinner
 */
export function LoadingSpinner({ size = 'md' }) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className={cn('flex items-center justify-center', sizes[size])}>
      <motion.div
        className={cn(
          'rounded-full border-2 border-white/20 border-t-purple-500',
          sizes[size]
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}

/**
 * Tooltip - Modern tooltip component
 */
export function Tooltip({ children, content }) {
  return (
    <motion.div className="relative group cursor-help">
      {children}
      <motion.div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/80 text-white text-sm rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md"
        initial={{ opacity: 0, y: 4 }}
        whileHover={{ opacity: 1, y: 0 }}
      >
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-black/80 rotate-45 -mt-1" />
      </motion.div>
    </motion.div>
  );
}

/**
 * Divider - Modern divider with optional text
 */
export function Divider({ text, className = '' }) {
  if (text) {
    return (
      <div className={cn('flex items-center gap-4 my-6', className)}>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <span className="text-sm text-foreground/50 font-medium">
          {text}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'h-px bg-gradient-to-r from-transparent via-white/20 to-transparent',
        className
      )}
    />
  );
}
