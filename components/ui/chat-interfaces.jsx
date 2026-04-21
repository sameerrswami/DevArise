'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Send, Paperclip, Mic } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

/**
 * AITutorChat - Professional AI Tutor chat interface
 * Structured, minimal, educational focus
 */
export function AITutorChat({
  messages = [],
  onSendMessage,
  isLoading = false,
  className = '',
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full rounded-2xl glass glass-card overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <h2 className="text-lg font-bold gradient-text">AI Tutor</h2>
        <p className="text-xs text-foreground/60 mt-1">
          Your personal learning assistant
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div
              className="flex flex-col items-center justify-center h-full text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                <span className="text-3xl">🎓</span>
              </div>
              <p className="text-foreground/60 text-sm">
                Ask me anything about your learning journey
              </p>
            </motion.div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn('flex', msg.role === 'user' && 'justify-end')}
                >
                  <div
                    className={cn(
                      'max-w-xs lg:max-w-md px-4 py-3 rounded-xl',
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white'
                        : 'glass bg-white/5 border border-white/10'
                    )}
                  >
                    <p className="text-sm leading-relaxed">
                      {msg.content}
                    </p>
                    <p
                      className={cn(
                        'text-xs mt-2 font-medium',
                        msg.role === 'user'
                          ? 'text-white/70'
                          : 'text-foreground/50'
                      )}
                    >
                      {msg.timestamp}
                    </p>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2"
                >
                  <div className="glass bg-white/5 px-4 py-3 rounded-xl">
                    <div className="flex gap-2">
                      <motion.div
                        className="w-2 h-2 rounded-full bg-purple-400"
                        animate={{ y: [0, -4, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                        }}
                      />
                      <motion.div
                        className="w-2 h-2 rounded-full bg-blue-400"
                        animate={{ y: [0, -4, 0] }}
                        transition={{
                          duration: 0.6,
                          delay: 0.1,
                          repeat: Infinity,
                        }}
                      />
                      <motion.div
                        className="w-2 h-2 rounded-full bg-cyan-400"
                        animate={{ y: [0, -4, 0] }}
                        transition={{
                          duration: 0.6,
                          delay: 0.2,
                          repeat: Infinity,
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-white/10 bg-white/5">
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Paperclip className="w-5 h-5 text-foreground/60" />
          </motion.button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white/10 transition-all"
          />

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Mic className="w-5 h-5 text-foreground/60" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all"
          >
            <Send className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

/**
 * AIBuddyChat - Casual, playful AI Buddy chat interface
 * More emoji, dynamic, friendly focus
 */
export function AIBuddyChat({
  messages = [],
  onSendMessage,
  isLoading = false,
  className = '',
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full rounded-3xl overflow-hidden bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 shadow-2xl',
        className
      )}
    >
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 border-b border-white/10">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">🤖</span>
          <h2 className="text-lg font-bold gradient-text-warm">
            Your AI Buddy
          </h2>
        </div>
        <p className="text-xs text-foreground/60 ml-11">
          Let's grow together! 🚀
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div
              className="flex flex-col items-center justify-center h-full text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-5xl mb-4"
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              >
                ✨
              </motion.div>
              <p className="text-foreground/70 text-sm font-medium">
                Hey there, friend! 👋
              </p>
              <p className="text-foreground/50 text-xs mt-1">
                Let's chat and celebrate wins together!
              </p>
            </motion.div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, type: 'spring' }}
                  className={cn('flex', msg.role === 'user' && 'justify-end')}
                >
                  <motion.div
                    className={cn(
                      'max-w-xs lg:max-w-md px-5 py-3 rounded-2xl',
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'bg-white/8 border-2 border-white/10 backdrop-blur-xl'
                    )}
                    whileHover={{ scale: 1.02 }}
                  >
                    <p className="text-sm leading-relaxed">
                      {msg.content}
                    </p>
                    <p
                      className={cn(
                        'text-xs mt-2 font-medium',
                        msg.role === 'user'
                          ? 'text-white/60'
                          : 'text-foreground/40'
                      )}
                    >
                      {msg.timestamp}
                    </p>
                  </motion.div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex gap-3"
                >
                  <div className="bg-white/8 border border-white/10 px-5 py-3 rounded-2xl">
                    <motion.div
                      className="text-xl"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    >
                      ⚡
                    </motion.div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Tell me something... 💭"
            className="flex-1 bg-white/10 border-2 border-white/10 rounded-full px-5 py-2 text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white/15 focus:border-pink-500/50 transition-all"
          />

          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.85 }}
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all"
          >
            <Send className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
