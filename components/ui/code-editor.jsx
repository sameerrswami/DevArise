'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Copy,
  Download,
  Maximize2,
  ChevronRight,
  Play,
} from 'lucide-react';
import React, { useState } from 'react';

/**
 * ModernCodeEditor - Professional code editor component
 * Shows code with syntax highlighting support
 */
export function ModernCodeEditor({
  code = '',
  language = 'javascript',
  fileName = 'code.js',
  readOnly = true,
  onCodeChange = () => {},
  showLineNumbers = true,
  showActions = true,
  fullScreen = false,
  className = '',
}) {
  const [copied, setCopied] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      className={cn(
        'flex flex-col rounded-2xl glass glass-card overflow-hidden',
        isMaximized && 'fixed inset-4 z-50',
        className
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="px-6 py-3 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-500/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-3 h-3 rounded-full bg-red-500/70"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <motion.div className="w-3 h-3 rounded-full bg-emerald-500/70" />
          <span className="text-xs font-medium text-foreground/70 ml-2">
            {fileName}
          </span>
        </div>

        {showActions && (
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleCopy}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-foreground/70 hover:text-foreground"
              title="Copy code"
            >
              {copied ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-emerald-400"
                >
                  ✓
                </motion.div>
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-foreground/70 hover:text-foreground"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-foreground/70 hover:text-foreground"
              title="Maximize"
            >
              <Maximize2 className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </div>

      {/* Code Content */}
      <div className="flex-1 overflow-auto bg-gradient-to-br from-black/20 to-black/40 p-6">
        <div className="font-mono text-sm text-foreground/80 leading-relaxed">
          {showLineNumbers && (
            <div className="inline-block mr-6 text-foreground/30 select-none">
              {code
                .split('\n')
                .map((_, idx) => (
                  <div key={idx}>{idx + 1}</div>
                ))}
            </div>
          )}
          <motion.pre
            className="inline-block whitespace-pre-wrap break-words"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <code>{code}</code>
          </motion.pre>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-white/10 bg-white/5 flex items-center justify-between text-xs text-foreground/60">
        <div>
          {language && (
            <span className="px-2 py-1 rounded bg-white/10">
              {language.toUpperCase()}
            </span>
          )}
        </div>
        <div>
          {code.split('\n').length} lines
        </div>
      </div>
    </motion.div>
  );
}

/**
 * CodeComparisonView - Side-by-side code comparison
 */
export function CodeComparisonView({
  leftCode = '',
  rightCode = '',
  leftLabel = 'Before',
  rightLabel = 'After',
  language = 'javascript',
  className = '',
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 lg:grid-cols-2 gap-6',
        className
      )}
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-sm font-semibold text-foreground/60 mb-3">
          {leftLabel}
        </p>
        <ModernCodeEditor
          code={leftCode}
          language={language}
          fileName={`${leftLabel.toLowerCase()}.${language}`}
          showActions={false}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <p className="text-sm font-semibold text-foreground/60 mb-3">
          {rightLabel}
        </p>
        <ModernCodeEditor
          code={rightCode}
          language={language}
          fileName={`${rightLabel.toLowerCase()}.${language}`}
          showActions={false}
        />
      </motion.div>
    </div>
  );
}

/**
 * ProblemEditorLayout - Split-screen layout for coding problems
 */
export function ProblemEditorLayout({
  problemContent,
  codeEditor,
  output,
  className = '',
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 lg:grid-cols-5 gap-6 h-full',
        className
      )}
    >
      {/* Problem Description - Left Panel */}
      <motion.div
        className="lg:col-span-2 rounded-2xl glass glass-card overflow-hidden flex flex-col"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <h2 className="text-lg font-bold gradient-text">
            Problem
          </h2>
        </div>
        <div className="flex-1 overflow-auto p-6">
          {problemContent}
        </div>
      </motion.div>

      {/* Code Editor & Output - Right Panel */}
      <motion.div
        className="lg:col-span-3 flex flex-col gap-6"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Editor */}
        <div className="flex-1 min-h-0">
          {codeEditor}
        </div>

        {/* Output/Test Results */}
        {output && (
          <div className="lg:h-40 rounded-2xl glass glass-card overflow-hidden flex flex-col">
            <div className="px-6 py-3 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
              <h3 className="text-sm font-bold gradient-text">
                Output
              </h3>
            </div>
            <div className="flex-1 overflow-auto p-4 font-mono text-sm text-foreground/70">
              {output}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/**
 * CodeSnippet - Simple code snippet display
 */
export function CodeSnippet({
  code,
  language = 'javascript',
  highlightLines = [],
  className = '',
}) {
  return (
    <motion.div
      className={cn(
        'p-4 rounded-lg bg-black/40 border border-white/10 overflow-x-auto',
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <pre className="font-mono text-sm text-foreground/80">
        <code>{code}</code>
      </pre>
    </motion.div>
  );
}

/**
 * ExecuteButton - Button to execute/run code
 */
export function ExecuteButton({
  onClick = () => {},
  loading = false,
  className = '',
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={loading}
      className={cn(
        'flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold transition-all disabled:opacity-50',
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {loading ? (
        <motion.div
          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ) : (
        <Play className="w-4 h-4" />
      )}
      {loading ? 'Running...' : 'Run Code'}
    </motion.button>
  );
}
