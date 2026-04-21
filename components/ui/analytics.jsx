'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import React from 'react';

/**
 * AnalyticsCard - Wrapper for analytics charts
 */
export function AnalyticsCard({
  title,
  description,
  children,
  action,
  className = '',
  loading = false,
}) {
  return (
    <motion.div
      className={cn(
        'rounded-2xl glass glass-card overflow-hidden',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && (
              <h3 className="text-lg font-bold text-foreground">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-foreground/60 mt-1">
                {description}
              </p>
            )}
          </div>
          {action && (
            <div className="mt-1">
              {action}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-80">
            <motion.div
              className="w-12 h-12 border-3 border-white/20 border-t-purple-500 rounded-full"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </div>
        ) : (
          children
        )}
      </div>
    </motion.div>
  );
}

/**
 * LineChartComponent - Beautiful line chart with gradients
 */
export function LineChartComponent({
  data = [],
  lines = [],
  xAxis = 'name',
  colors = ['#a855f7', '#3b82f6', '#06b6d4'],
  height = 300,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
      >
        <defs>
          {colors.map((color, idx) => (
            <linearGradient
              key={idx}
              id={`colorGradient${idx}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor={color}
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor={color}
                stopOpacity={0}
              />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255, 255, 255, 0.1)"
        />
        <XAxis
          dataKey={xAxis}
          stroke="rgba(255, 255, 255, 0.4)"
        />
        <YAxis stroke="rgba(255, 255, 255, 0.4)" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)',
          }}
          cursor={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
        />
        <Legend />
        {lines.map((line, idx) => (
          <Line
            key={idx}
            type="monotone"
            dataKey={line}
            stroke={colors[idx % colors.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * BarChartComponent - Modern bar chart
 */
export function BarChartComponent({
  data = [],
  bars = [],
  xAxis = 'name',
  colors = ['#a855f7', '#3b82f6', '#06b6d4'],
  height = 300,
  layout = 'vertical',
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={layout === 'vertical' ? 'vertical' : 'horizontal'}
        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255, 255, 255, 0.1)"
        />
        <XAxis
          type={layout === 'vertical' ? 'number' : 'category'}
          stroke="rgba(255, 255, 255, 0.4)"
        />
        <YAxis
          type={layout === 'vertical' ? 'category' : 'number'}
          dataKey={xAxis}
          stroke="rgba(255, 255, 255, 0.4)"
          width={layout === 'vertical' ? 90 : 'auto'}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)',
          }}
        />
        <Legend />
        {bars.map((bar, idx) => (
          <Bar
            key={idx}
            dataKey={bar}
            fill={colors[idx % colors.length]}
            radius={[8, 8, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * AreaChartComponent - Gradient area chart
 */
export function AreaChartComponent({
  data = [],
  areas = [],
  xAxis = 'name',
  colors = ['#a855f7', '#3b82f6', '#06b6d4'],
  height = 300,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={data}
        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
      >
        <defs>
          {colors.map((color, idx) => (
            <linearGradient
              key={idx}
              id={`areaGradient${idx}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor={color}
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={color}
                stopOpacity={0}
              />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255, 255, 255, 0.1)"
        />
        <XAxis
          dataKey={xAxis}
          stroke="rgba(255, 255, 255, 0.4)"
        />
        <YAxis stroke="rgba(255, 255, 255, 0.4)" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)',
          }}
        />
        <Legend />
        {areas.map((area, idx) => (
          <Area
            key={idx}
            type="monotone"
            dataKey={area}
            stroke={colors[idx % colors.length]}
            fillOpacity={1}
            fill={`url(#areaGradient${idx})`}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

/**
 * PieChartComponent - Modern pie chart with animations
 */
export function PieChartComponent({
  data = [],
  colors = ['#a855f7', '#3b82f6', '#06b6d4', '#06b6d4', '#ec4899'],
  height = 300,
  innerRadius = 0,
}) {
  const RADIAN = Math.PI / 180;
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius: ir,
    outerRadius: or,
    percent,
  }) => {
    const radius = ir + (or - ir) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={80}
          innerRadius={innerRadius}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/**
 * PerformanceMetrics - Multi-metric performance display
 */
export function PerformanceMetrics({
  metrics = [
    {
      label: 'Accuracy',
      value: 92,
      color: '#10b981',
    },
    {
      label: 'Speed',
      value: 78,
      color: '#3b82f6',
    },
    {
      label: 'Efficiency',
      value: 85,
      color: '#a855f7',
    },
  ],
  className = '',
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-3 gap-4',
        className
      )}
    >
      {metrics.map((metric, idx) => (
        <motion.div
          key={idx}
          className="glass glass-card rounded-xl p-4"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: idx * 0.1 }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground/60">
              {metric.label}
            </span>
            <motion.div
              className="text-2xl font-bold"
              style={{ color: metric.color }}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.6,
                delay: idx * 0.1,
              }}
            >
              {metric.value}%
            </motion.div>
          </div>

          <motion.div
            className="w-full h-2 bg-white/10 rounded-full overflow-hidden"
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: metric.color }}
              initial={{ width: 0 }}
              whileInView={{ width: `${metric.value}%` }}
              transition={{
                duration: 1,
                delay: idx * 0.1,
                ease: 'easeOut',
              }}
            />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

/**
 * ProgressTimeline - Timeline showing progress over time
 */
export function ProgressTimeline({
  milestones = [],
  className = '',
}) {
  return (
    <div className={cn('relative', className)}>
      {milestones.map((milestone, idx) => (
        <motion.div
          key={idx}
          className="relative pl-12 pb-8"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: idx * 0.1 }}
        >
          {/* Timeline dot */}
          <motion.div
            className="absolute left-0 top-1 w-6 h-6 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center"
            whileInView={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
          >
            <div className="w-2 h-2 rounded-full bg-white" />
          </motion.div>

          {/* Timeline line */}
          {idx < milestones.length - 1 && (
            <motion.div
              className="absolute left-2.5 top-6 w-px h-12 bg-gradient-to-b from-white/40 to-transparent"
              initial={{ height: 0 }}
              whileInView={{ height: 48 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            />
          )}

          {/* Content */}
          <div className="glass glass-card rounded-lg p-4">
            <p className="text-sm font-semibold text-foreground">
              {milestone.title}
            </p>
            {milestone.description && (
              <p className="text-xs text-foreground/60 mt-1">
                {milestone.description}
              </p>
            )}
            {milestone.date && (
              <p className="text-xs text-foreground/40 mt-2">
                {milestone.date}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
