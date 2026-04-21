"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Check, 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  Rocket, 
  Cpu, 
  BrainCircuit, 
  Layers,
  ArrowRight,
  Shield,
  Loader2
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const PLANS = [
  {
    id: "free",
    name: "Foundation",
    price: "0",
    description: "Essential tools to start your coding journey.",
    features: [
      "Access to basic DSA problems",
      "AI Code Assistant (Limited)",
      "Public Roadmaps",
      "Standard Community Access",
      "5 Mock Interviews / Month"
    ],
    cta: "Current Plan",
    premium: false,
    color: "from-slate-700 to-slate-900"
  },
  {
    id: "premium",
    name: "Pro Elite",
    price: "19",
    description: "Advanced AI tools and priority personalized learning.",
    features: [
      "Unlimited AI Code Assistant",
      "Full AI Career Roadmap",
      "Personalized Resume Analysis",
      "Unlimited Advanced Problems",
      "Priority Interview Prep (AI)",
      "Ad-free Experience",
      "Exclusive Coding Battles"
    ],
    cta: "Upgrade to Pro",
    premium: true,
    recommended: true,
    color: "from-violet-600 to-indigo-600",
    shadow: "shadow-violet-900/40"
  },
  {
    id: "lifetime",
    name: "Legacy",
    price: "149",
    description: "One-time investment for a lifetime of growth.",
    features: [
      "Everything in Pro Elite",
      "Lifetime Updates",
      "Exclusive Beta Features",
      "Premium Discord Access",
      "Placement Support Priority",
      "One-on-One Mentorship (1 Session)"
    ],
    cta: "Get Lifetime",
    premium: true,
    color: "from-amber-500 to-orange-600",
    shadow: "shadow-amber-900/40"
  }
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [loading, setLoading] = useState(null);
  const { data: session } = useSession();
  const router = useRouter();

  const handleUpgrade = async (planId) => {
    if (planId === 'free') return;
    if (!session) {
      router.push("/auth/signin?callbackUrl=/pricing");
      return;
    }

    setLoading(planId);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingCycle }),
      });

      const data = await response.json();
      
      // Initialize Razorpay
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: "DevArise AI",
          description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} ${billingCycle} Plan`,
          order_id: data.orderId,
          prefill: {
            email: data.userEmail,
            name: data.userName,
          },
          theme: {
            color: "#7c3aed",
          },
          handler: async (response) => {
            // Verify payment on backend
            const verifyResponse = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: data.orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                userId: data.userId,
                planId,
                billingCycle,
              }),
            });

            if (verifyResponse.ok) {
              router.push("/pricing/success");
            } else {
              alert("Payment verification failed. Please contact support.");
            }
          },
          modal: {
            ondismiss: () => {
              setLoading(null);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      };
      document.body.appendChild(script);
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment initiation failed. Please try again.");
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white py-20 px-4 relative overflow-hidden">
      {/* Mesh Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="h-4 w-4" />
            Pricing Plans
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Accelerate your career with <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">Premium AI</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Choose the plan that fits your ambition. From foundational learning to elite placement preparation.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4 mt-10">
             <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-500'}`}>Monthly</span>
             <button 
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="w-14 h-8 rounded-full bg-slate-800 p-1 transition-all relative border border-slate-700"
             >
                <div className={`h-6 w-6 rounded-full bg-violet-600 transition-all ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`} />
             </button>
             <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-white' : 'text-slate-500'}`}>
               Yearly <span className="text-emerald-400 font-bold ml-1">(-20%)</span>
             </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 px-4">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-[32px] p-8 border border-slate-700/50 bg-slate-900/40 backdrop-blur-xl flex flex-col text-left transition-all hover:border-slate-600/80 group ${plan.recommended ? 'ring-2 ring-violet-500/50' : ''}`}
            >
              {plan.recommended && (
                <div className="absolute top-0 right-8 -translate-y-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-violet-900/40">
                   Recommended
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{plan.description}</p>
                
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">${billingCycle === 'yearly' && plan.id === 'premium' ? '15' : plan.price}</span>
                  <span className="text-slate-500 text-sm font-medium">{plan.price === '0' ? "" : plan.id === 'lifetime' ? "/lifetime" : "/mo"}</span>
                </div>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                {plan.features.map(feature => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-emerald-400" />
                    </div>
                    <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={loading === plan.id || (plan.id === 'free' && session?.user?.isPremium === false)}
                className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 relative overflow-hidden group/btn ${
                  plan.premium 
                    ? `bg-gradient-to-r ${plan.color} text-white shadow-lg ${plan.shadow} hover:scale-[1.02]`
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                } disabled:opacity-50`}
              >
                {loading === plan.id ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {plan.cta}
                    {plan.premium && <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />}
                  </>
                )}
                {/* Glow effect on hover */}
                {plan.premium && (
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                )}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="py-20 border-t border-slate-900">
           <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-40">
              <div className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
                 <Shield className="h-10 w-10 text-emerald-500" />
                 Secure Checkout
              </div>
              <div className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
                 <Zap className="h-10 w-10 text-amber-500" />
                 Instant Activation
              </div>
              <div className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
                 <Rocket className="h-10 w-10 text-blue-500" />
                 Career Growth
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
