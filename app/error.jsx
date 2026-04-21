"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { logger } from "@/lib/logger";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log the error to our centralized logger
    logger.error("Unhandled application error caught in root error.js", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-2xl space-y-6"
      >
        <div className="h-20 w-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        
        <h2 className="text-3xl font-black tracking-tight">System Glitch</h2>
        
        <p className="text-slate-400 text-sm leading-relaxed">
          We encountered an unexpected error while processing your request. Our engineering team has been notified and is working on a fix.
        </p>

        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-left overflow-auto max-h-32">
          <p className="text-red-400 text-xs font-mono break-all font-bold">
            {error.message || "Unknown Error Occurred"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            onClick={() => reset()}
            className="flex-1 h-12 bg-violet-600 hover:bg-violet-500 font-bold rounded-xl"
          >
            <RefreshCcw className="mr-2 h-4 w-4" /> Try Again
          </Button>
          <Button
            asChild
            variant="outline"
            className="flex-1 h-12 bg-transparent hover:bg-slate-800 border-slate-700 font-bold rounded-xl text-slate-300"
          >
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" /> Go Home
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
