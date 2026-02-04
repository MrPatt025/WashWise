"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Check, MessageCircle, Shield, Sparkles, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ============================================================================
// PRICING CARD COMPONENT
// ============================================================================

interface PricingFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface PricingPlan {
  name: string;
  description: string;
  price: number | "Custom";
  currency?: string;
  period?: string;
  popular?: boolean;
  features: PricingFeature[];
  cta: {
    text: string;
    href: string;
  };
  gradient?: string;
}

interface PricingCardProps {
  plan: PricingPlan;
  index: number;
  billing: "monthly" | "yearly";
}

function PricingCard({ plan, index, billing }: PricingCardProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const yearlyDiscount = 0.8; // 20% off
  const displayPrice =
    billing === "yearly" && typeof plan.price === "number"
      ? Math.floor(plan.price * yearlyDiscount)
      : plan.price;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-3xl border transition-all duration-500",
        plan.popular
          ? "border-violet-300 bg-gradient-to-b from-violet-50 to-white shadow-xl shadow-violet-500/10 dark:border-violet-700 dark:from-violet-950/50 dark:to-slate-900"
          : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/80"
      )}
    >
      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute -right-12 top-6 rotate-45">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-12 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
            Most Popular
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-8 pb-0">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl",
              plan.popular
                ? "bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/30"
                : "bg-slate-100 dark:bg-slate-700"
            )}
          >
            {plan.popular ? (
              <Sparkles className="h-6 w-6 text-white" />
            ) : plan.name === "Enterprise" ? (
              <Shield className="h-6 w-6 text-slate-600 dark:text-slate-300" />
            ) : (
              <Zap className="h-6 w-6 text-slate-600 dark:text-slate-300" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{plan.description}</p>
          </div>
        </div>

        {/* Price */}
        <div className="mt-6 flex items-baseline gap-1">
          {typeof displayPrice === "number" ? (
            <>
              <span className="text-sm font-medium text-slate-500">{plan.currency ?? "฿"}</span>
              <motion.span
                key={displayPrice}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white"
              >
                {displayPrice.toLocaleString()}
              </motion.span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                /{plan.period ?? "month"}
              </span>
            </>
          ) : (
            <span className="text-4xl font-bold text-slate-900 dark:text-white">
              {displayPrice}
            </span>
          )}
        </div>

        {billing === "yearly" &&
          typeof plan.price === "number" &&
          typeof displayPrice === "number" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-sm text-emerald-600 dark:text-emerald-400"
            >
              Save ฿{((plan.price - displayPrice) * 12).toLocaleString()}/year
            </motion.p>
          )}
      </div>

      {/* Features */}
      <div className="flex-1 p-8">
        <ul className="space-y-4">
          {plan.features.map((feature, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="flex items-start gap-3"
            >
              {feature.included ? (
                <div
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                    feature.highlight
                      ? "bg-violet-100 dark:bg-violet-900/30"
                      : "bg-emerald-100 dark:bg-emerald-900/30"
                  )}
                >
                  <Check
                    className={cn(
                      "h-3 w-3",
                      feature.highlight
                        ? "text-violet-600 dark:text-violet-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    )}
                  />
                </div>
              ) : (
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                  <X className="h-3 w-3 text-slate-400" />
                </div>
              )}
              <span
                className={cn(
                  "text-sm",
                  feature.included
                    ? "text-slate-700 dark:text-slate-300"
                    : "text-slate-400 dark:text-slate-500"
                )}
              >
                {feature.text}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="p-8 pt-0">
        <Link href={plan.cta.href}>
          <Button
            className={cn(
              "group w-full text-base font-semibold",
              plan.popular
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30"
                : ""
            )}
            variant={plan.popular ? "default" : "outline"}
            size="lg"
          >
            {plan.cta.text}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

// ============================================================================
// BILLING TOGGLE
// ============================================================================

interface BillingToggleProps {
  billing: "monthly" | "yearly";
  onBillingChange: (billing: "monthly" | "yearly") => void;
}

function BillingToggle({ billing, onBillingChange }: BillingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => onBillingChange("monthly")}
        className={cn(
          "text-sm font-medium transition-colors",
          billing === "monthly"
            ? "text-slate-900 dark:text-white"
            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
        )}
      >
        Monthly
      </button>
      <button
        onClick={() => onBillingChange(billing === "monthly" ? "yearly" : "monthly")}
        className="relative h-7 w-14 rounded-full bg-slate-200 transition-colors dark:bg-slate-700"
      >
        <motion.div
          layout
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md",
            billing === "yearly" ? "left-8" : "left-1"
          )}
        />
      </button>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onBillingChange("yearly")}
          className={cn(
            "text-sm font-medium transition-colors",
            billing === "yearly"
              ? "text-slate-900 dark:text-white"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          )}
        >
          Yearly
        </button>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          Save 20%
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PRICING SECTION
// ============================================================================

interface PricingSectionProps {
  title?: string;
  subtitle?: string;
  description?: string;
  plans?: PricingPlan[];
}

const defaultPlans: PricingPlan[] = [
  {
    name: "Starter",
    description: "Perfect for small laundromats",
    price: 1500,
    currency: "฿",
    period: "month",
    features: [
      { text: "Up to 10 machines", included: true },
      { text: "Real-time monitoring", included: true },
      { text: "Basic analytics", included: true },
      { text: "Email alerts", included: true },
      { text: "Mobile app access", included: true },
      { text: "7-day data retention", included: true },
      { text: "AI predictions", included: false },
      { text: "Multi-location support", included: false },
      { text: "Priority support", included: false },
      { text: "Custom integrations", included: false },
    ],
    cta: { text: "Start Free Trial", href: "/register" },
  },
  {
    name: "Professional",
    description: "For growing businesses",
    price: 4500,
    currency: "฿",
    period: "month",
    popular: true,
    features: [
      { text: "Up to 50 machines", included: true },
      { text: "Real-time monitoring", included: true },
      { text: "Advanced analytics", included: true, highlight: true },
      { text: "Push, SMS & LINE alerts", included: true, highlight: true },
      { text: "Mobile app access", included: true },
      { text: "90-day data retention", included: true },
      { text: "AI predictions", included: true, highlight: true },
      { text: "Up to 3 locations", included: true },
      { text: "Priority support", included: true },
      { text: "Custom integrations", included: false },
    ],
    cta: { text: "Start Free Trial", href: "/register" },
  },
  {
    name: "Enterprise",
    description: "For large operations",
    price: "Custom",
    features: [
      { text: "Unlimited machines", included: true },
      { text: "Real-time monitoring", included: true },
      { text: "Enterprise analytics", included: true, highlight: true },
      { text: "All notification channels", included: true },
      { text: "Mobile app access", included: true },
      { text: "Unlimited data retention", included: true },
      { text: "Advanced AI predictions", included: true, highlight: true },
      { text: "Unlimited locations", included: true, highlight: true },
      { text: "24/7 dedicated support", included: true, highlight: true },
      { text: "Custom integrations & API", included: true, highlight: true },
    ],
    cta: { text: "Contact Sales", href: "#contact" },
  },
];

export function PricingSection({
  title = "Simple, transparent pricing",
  subtitle = "Pricing",
  description = "Choose the plan that fits your business. All plans include a 14-day free trial.",
  plans = defaultPlans,
}: PricingSectionProps) {
  const [billing, setBilling] = React.useState<"monthly" | "yearly">("monthly");
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      id="pricing"
      className="relative scroll-mt-20 overflow-hidden py-20 lg:py-28"
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-violet-50/30 to-white dark:from-slate-950 dark:via-violet-950/10 dark:to-slate-950" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-sm font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
          >
            <Sparkles className="h-4 w-4" />
            {subtitle}
          </motion.span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            {title}
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">{description}</p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-10"
        >
          <BillingToggle billing={billing} onBillingChange={setBilling} />
        </motion.div>

        {/* Pricing Cards */}
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <PricingCard key={plan.name} plan={plan} index={i} billing={billing} />
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500"
        >
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-500" />
            <span>14-day free trial</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-emerald-500" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-emerald-500" />
            <span>Cancel anytime</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default PricingSection;
