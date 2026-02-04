"use client";

import * as React from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { ArrowRight, HelpCircle, MessageCircle, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// ============================================================================
// FAQ ITEM COMPONENT
// ============================================================================

interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

interface FAQItemProps {
  item: FAQItem;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItemComponent({ item, index, isOpen, onToggle }: FAQItemProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={cn(
        "group overflow-hidden rounded-2xl border transition-all duration-300",
        isOpen
          ? "border-violet-200 bg-violet-50/50 shadow-lg shadow-violet-500/5 dark:border-violet-800 dark:bg-violet-950/20"
          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600"
      )}
    >
      <button onClick={onToggle} className="flex w-full items-center justify-between p-6 text-left">
        <span
          className={cn(
            "text-base font-semibold transition-colors sm:text-lg",
            isOpen ? "text-violet-700 dark:text-violet-300" : "text-slate-900 dark:text-white"
          )}
        >
          {item.question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
            isOpen
              ? "bg-violet-600 text-white"
              : "bg-slate-100 text-slate-600 group-hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400"
          )}
        >
          {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 pb-6">
              <div className="border-t border-violet-200/50 pt-4 dark:border-violet-800/50">
                <p className="text-slate-600 dark:text-slate-400">{item.answer}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// FAQ CATEGORY FILTER
// ============================================================================

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

function CategoryFilter({ categories, activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-all",
            activeCategory === category
              ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          )}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN FAQ SECTION
// ============================================================================

interface FAQSectionProps {
  title?: string;
  subtitle?: string;
  description?: string;
  faqs?: FAQItem[];
  showCategories?: boolean;
  showContactCTA?: boolean;
}

const defaultFAQs: FAQItem[] = [
  {
    question: "How long does it take to set up WashWise?",
    answer:
      "Most customers are up and running within 5-10 minutes. Simply create an account, add your machines, and you'll immediately see your dashboard come to life. If you have IoT sensors, we provide step-by-step instructions for installation, or our team can help remotely.",
    category: "Getting Started",
  },
  {
    question: "Do I need special hardware or IoT sensors?",
    answer:
      "No special hardware is required to start. You can manually update machine statuses or use our mobile app. For real-time automated monitoring, we offer optional IoT sensors that connect to any machine type. These are plug-and-play and don't require technical expertise.",
    category: "Getting Started",
  },
  {
    question: "What happens after my free trial ends?",
    answer:
      "After your 14-day trial, you can choose a plan that fits your needs. We'll send reminders before the trial ends. If you decide not to continue, your account will be paused—we never delete your data. You can reactivate anytime.",
    category: "Billing",
  },
  {
    question: "Can I change my plan later?",
    answer:
      "Absolutely! You can upgrade or downgrade your plan at any time from your account settings. When upgrading, you'll get immediate access to new features. When downgrading, the change takes effect at your next billing cycle.",
    category: "Billing",
  },
  {
    question: "Is my data secure?",
    answer:
      "Security is our top priority. We use bank-grade 256-bit SSL encryption for all data transfers. Your data is stored in secure, SOC 2 compliant data centers with daily backups. We're also GDPR compliant and never sell your data to third parties.",
    category: "Security",
  },
  {
    question: "How does the AI prediction feature work?",
    answer:
      "Our AI analyzes patterns from your machines—including cycle times, error frequencies, and usage patterns—to predict potential issues before they occur. When the AI detects an anomaly, you'll receive an alert with recommended actions, often preventing costly breakdowns.",
    category: "Features",
  },
  {
    question: "Can I manage multiple locations?",
    answer:
      "Yes! Professional and Enterprise plans support multiple locations. You can view all locations on a single dashboard, compare performance, and receive consolidated reports. Each location can have its own team members with custom permissions.",
    category: "Features",
  },
  {
    question: "What kind of support do you offer?",
    answer:
      "All plans include email support with 24-hour response time. Professional plans get priority support via chat with 4-hour response. Enterprise customers have access to 24/7 phone support and a dedicated account manager. We also offer Thai language support.",
    category: "Support",
  },
  {
    question: "Can I integrate WashWise with my existing systems?",
    answer:
      "Enterprise plans include API access for custom integrations. We also offer pre-built integrations with popular accounting software, payment processors, and POS systems. Our team can help with custom integration requirements.",
    category: "Features",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, American Express), bank transfers, and PromptPay for Thai customers. Enterprise customers can also pay via invoice with net-30 terms.",
    category: "Billing",
  },
];

export function FAQSection({
  title = "Frequently asked questions",
  subtitle = "FAQ",
  description = "Got questions? We've got answers. If you can't find what you're looking for, our support team is always happy to help.",
  faqs = defaultFAQs,
  showCategories = true,
  showContactCTA = true,
}: FAQSectionProps) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);
  const [activeCategory, setActiveCategory] = React.useState("All");

  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const categories = React.useMemo(() => {
    const cats = ["All", ...new Set(faqs.map((faq) => faq.category).filter(Boolean))];
    return cats as string[];
  }, [faqs]);

  const filteredFAQs = React.useMemo(() => {
    if (activeCategory === "All") {
      return faqs;
    }
    return faqs.filter((faq) => faq.category === activeCategory);
  }, [faqs, activeCategory]);

  return (
    <section ref={ref} id="faq" className="relative scroll-mt-20 overflow-hidden py-20 lg:py-28">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900" />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-sm font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
          >
            <HelpCircle className="h-4 w-4" />
            {subtitle}
          </motion.span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            {description}
          </p>
        </motion.div>

        {/* Category Filter */}
        {showCategories && categories.length > 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-10"
          >
            <CategoryFilter
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </motion.div>
        )}

        {/* FAQ List */}
        <div className="mt-10 space-y-4">
          <AnimatePresence mode="wait">
            {filteredFAQs.map((faq, i) => (
              <FAQItemComponent
                key={`${activeCategory}-${i}`}
                item={faq}
                index={i}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Contact CTA */}
        {showContactCTA && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-12 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 p-8 text-center dark:from-violet-950/30 dark:to-indigo-950/30"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/30">
              <MessageCircle className="h-7 w-7 text-white" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
              Still have questions?
            </h3>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Can&apos;t find the answer you&apos;re looking for? Our friendly team is here to help.
            </p>
            <Link href="/contact" className="mt-6 inline-block">
              <Button className="group bg-gradient-to-r from-violet-600 to-indigo-600">
                Contact Support
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default FAQSection;
