"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  href,
  className = ""
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center p-12 text-center bg-slate-900/30 backdrop-blur-xl border border-dashed border-slate-800 rounded-[32px] ${className}`}
    >
      <div className="h-16 w-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-6 border border-slate-700/50">
        <Icon className="h-8 w-8 text-slate-500" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8 leading-relaxed">
        {description}
      </p>
      {action && href && (
        <Button asChild className="bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl px-8">
          <Link href={href}>{action}</Link>
        </Button>
      )}
    </motion.div>
  );
}
