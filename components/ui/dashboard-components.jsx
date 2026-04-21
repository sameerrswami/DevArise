'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import React from 'react';

/**
 * ModernDashboard - Premium dashboard layout component
 */
export function ModernDashboard({
  title,
  subtitle,
  children,
  headerAction,
  className = '',
}) {
  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-bg',
        className
      )}
    >
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, 40, 0],
            y: [0, -40, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-20 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <motion.div
          className="px-6 sm:px-8 lg:px-12 py-8 sm:py-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold gradient-text mb-2">
                {title}
              </h1>
              {subtitle && (
                <p className="text-foreground/60 text-lg">
                  {subtitle}
                </p>
              )}
            </div>
            {headerAction && (
              <div className="mt-2">
                {headerAction}
              </div>
            )}
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="px-6 sm:px-8 lg:px-12 pb-12">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * DashboardGrid - Responsive grid layout for dashboard cards
 */
export function DashboardGrid({
  children,
  columns = { default: 1, sm: 2, lg: 3 },
  gap = 6,
  className = '',
}) {
  const colClasses = {
    default: `grid-cols-${columns.default}`,
    sm: `sm:grid-cols-${columns.sm}`,
    lg: `lg:grid-cols-${columns.lg}`,
  };

  return (
    <div
      className={cn(
        `grid gap-${gap} ${colClasses.default} ${colClasses.sm} ${colClasses.lg}`,
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * DashboardSection - Section with title and optional action
 */
export function DashboardSection({
  title,
  description,
  action,
  children,
  className = '',
}) {
  return (
    <motion.section
      className={cn('', className)}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      {(title || description || action) && (
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            {title && (
              <h2 className="text-2xl font-bold text-foreground mb-1">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-foreground/60 text-sm">
                {description}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}

      {children}
    </motion.section>
  );
}

/**
 * QuickActionsGrid - Grid of quick action buttons/cards
 */
export function QuickActionsGrid({ actions = [], className = '' }) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4',
        className
      )}
    >
      {actions.map((action, idx) => (
        <motion.button
          key={idx}
          onClick={action.onClick}
          className="flex flex-col items-center gap-3 p-4 rounded-xl glass glass-card hover:bg-white/20 transition-all"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
        >
          {action.icon && (
            <div className="text-3xl">{action.icon}</div>
          )}
          <span className="text-xs font-semibold text-center text-foreground">
            {action.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

/**
 * MetricsSummary - Summary metrics display
 */
export function MetricsSummary({ metrics = [], className = '' }) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 sm:grid-cols-4 gap-4',
        className
      )}
    >
      {metrics.map((metric, idx) => (
        <motion.div
          key={idx}
          className="glass glass-card rounded-xl p-4 text-center"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: idx * 0.05 }}
        >
          <p className="text-foreground/60 text-xs sm:text-sm font-medium mb-2">
            {metric.label}
          </p>
          <motion.p
            className="text-2xl sm:text-3xl font-bold gradient-text"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
          >
            {metric.value}
          </motion.p>
          {metric.change && (
            <p
              className={cn(
                'text-xs mt-2 font-medium',
                metric.positive
                  ? 'text-emerald-400'
                  : 'text-red-400'
              )}
            >
              {metric.positive ? '↑' : '↓'} {metric.change}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}

/**
 * EmptyState - Beautiful empty state component
 */
export function EmptyState({
  icon = '📭',
  title = 'Nothing here yet',
  description = 'Get started by exploring the platform',
  action,
}) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-6 rounded-2xl glass glass-card"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="text-6xl mb-4"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {icon}
      </motion.div>
      <h3 className="text-2xl font-bold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-foreground/60 text-center max-w-sm mb-6">
        {description}
      </p>
      {action}
    </motion.div>
  );
}
