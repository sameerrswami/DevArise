'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Menu,
  X,
  Home,
  Code,
  MessageSquare,
  BookOpen,
  FileText,
  Briefcase,
  Users,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import React, { useState } from 'react';

/**
 * Sidebar - Premium navigation sidebar
 */
export function Sidebar({
  items = [],
  activeItem = null,
  onItemClick = () => {},
  user = null,
  collapsed = false,
  onToggle = () => {},
  className = '',
}) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'glass glass-card border-r border-white/10 flex flex-col h-screen overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between">
        <motion.div
          animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
          className="flex items-center gap-2 overflow-hidden"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <span className="text-white font-bold">D</span>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              DevArise
            </p>
            <p className="text-xs text-foreground/50">AI</p>
          </div>
        </motion.div>

        <motion.button
          onClick={onToggle}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-foreground/70" />
          ) : (
            <Menu className="w-5 h-5 text-foreground/70" />
          )}
        </motion.button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-2">
        {items.map((item, idx) => (
          <motion.button
            key={idx}
            onClick={() => onItemClick(item)}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'w-full px-3 py-3 rounded-lg flex items-center gap-3 transition-all duration-300',
              activeItem === item.id
                ? 'bg-gradient-to-r from-purple-600/40 to-blue-600/40 text-white border border-purple-500/30'
                : 'text-foreground/70 hover:bg-white/10'
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <motion.span
              animate={{
                opacity: collapsed ? 0 : 1,
                width: collapsed ? 0 : 'auto',
              }}
              className="text-sm font-medium whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
            {item.badge && (
              <motion.span
                animate={{ opacity: collapsed ? 0 : 1 }}
                className="ml-auto text-xs bg-purple-500 text-white rounded-full px-2 py-0.5"
              >
                {item.badge}
              </motion.span>
            )}
          </motion.button>
        ))}
      </nav>

      {/* User Profile */}
      {user && (
        <div className="px-3 py-4 border-t border-white/10 space-y-2">
          <div className="px-3 py-3 rounded-lg bg-white/5 flex items-center gap-3">
            {user.avatar && (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full"
              />
            )}
            <motion.div
              animate={{
                opacity: collapsed ? 0 : 1,
                width: collapsed ? 0 : 'auto',
              }}
              className="min-w-0 flex-1 overflow-hidden"
            >
              <p className="text-sm font-semibold text-foreground truncate">
                {user.name}
              </p>
              <p className="text-xs text-foreground/50 truncate">
                {user.email}
              </p>
            </motion.div>
          </div>

          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 p-2.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4 text-foreground/70 mx-auto" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 p-2.5 rounded-lg hover:bg-red-500/20 transition-colors text-red-400"
              title="Logout"
            >
              <LogOut className="w-4 h-4 mx-auto" />
            </motion.button>
          </div>
        </div>
      )}
    </motion.aside>
  );
}

/**
 * TopNavigation - Modern top navigation bar
 */
export function TopNavigation({
  title = '',
  actions = [],
  user = null,
  onMenuClick = () => {},
  className = '',
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <motion.div
      className={cn(
        'glass glass-card border-b border-white/10 sticky top-0 z-40 px-6 py-4',
        className
      )}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left */}
        <div className="flex items-center gap-4">
          <motion.button
            onClick={onMenuClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5 text-foreground/70" />
          </motion.button>

          {title && (
            <h1 className="text-xl font-bold gradient-text">
              {title}
            </h1>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          {/* Actions */}
          <div className="flex items-center gap-2">
            {actions.map((action, idx) => (
              <motion.button
                key={idx}
                onClick={action.onClick}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  action.active
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'hover:bg-white/10 text-foreground/70'
                )}
              >
                <action.icon className="w-5 h-5" />
              </motion.button>
            ))}
          </div>

          {/* User Profile */}
          {user && (
            <div className="relative">
              <motion.button
                onClick={() => setShowUserMenu(!showUserMenu)}
                whileHover={{ scale: 1.05 }}
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                {user.avatar && (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border border-white/20"
                  />
                )}
              </motion.button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-56 glass glass-card rounded-xl overflow-hidden shadow-xl"
                  >
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="font-semibold text-foreground">
                        {user.name}
                      </p>
                      <p className="text-sm text-foreground/60">
                        {user.email}
                      </p>
                    </div>
                    <button className="w-full px-4 py-2 text-left text-sm text-foreground/70 hover:bg-white/10 transition-colors flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 border-t border-white/10">
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * MainLayout - Combined sidebar and content layout
 */
export function MainLayout({
  children,
  sidebarItems = [],
  activeSidebarItem = null,
  onSidebarItemClick = () => {},
  user = null,
  title = '',
  topActions = [],
  className = '',
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <Sidebar
          items={sidebarItems}
          activeItem={activeSidebarItem}
          onItemClick={onSidebarItemClick}
          user={user}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Sidebar - Mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="w-64 h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar
                items={sidebarItems}
                activeItem={activeSidebarItem}
                onItemClick={(item) => {
                  onSidebarItemClick(item);
                  setMobileMenuOpen(false);
                }}
                user={user}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavigation
          title={title}
          actions={topActions}
          user={user}
          onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* Content Area */}
        <div className={cn('flex-1 overflow-auto', className)}>
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * TabNavigation - Modern tab-based navigation
 */
export function TabNavigation({
  tabs = [],
  activeTab = null,
  onTabChange = () => {},
  className = '',
}) {
  return (
    <div
      className={cn(
        'flex gap-2 border-b border-white/10 overflow-x-auto',
        className
      )}
    >
      {tabs.map((tab, idx) => (
        <motion.button
          key={idx}
          onClick={() => onTabChange(tab.id)}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'px-4 py-3 border-b-2 transition-all duration-300 flex items-center gap-2 whitespace-nowrap',
            activeTab === tab.id
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-foreground/60 hover:text-foreground/80'
          )}
        >
          {tab.icon && <tab.icon className="w-4 h-4" />}
          {tab.label}
        </motion.button>
      ))}
    </div>
  );
}
