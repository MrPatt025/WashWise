"use client";

import * as React from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Quote, Star } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TESTIMONIAL CARD
// ============================================================================

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
  rating: number;
  highlight?: string;
  videoUrl?: string;
}

interface TestimonialCardProps {
  testimonial: Testimonial;
  index: number;
  variant?: "default" | "featured" | "compact";
}

function TestimonialCard({ testimonial, index, variant = "default" }: TestimonialCardProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  if (variant === "featured") {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 p-8 text-white shadow-2xl shadow-violet-500/25 lg:p-12"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative">
          <Quote className="h-12 w-12 text-white/30" />

          <p className="mt-6 text-xl font-medium leading-relaxed lg:text-2xl">
            &ldquo;{testimonial.content}&rdquo;
          </p>

          {testimonial.highlight && (
            <div className="mt-6 inline-flex rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
              {testimonial.highlight}
            </div>
          )}

          <div className="mt-8 flex items-center gap-4">
            <div className="h-14 w-14 overflow-hidden rounded-full bg-white/20">
              <div className="flex h-full w-full items-center justify-center text-xl font-bold">
                {testimonial.name.charAt(0)}
              </div>
            </div>
            <div>
              <p className="font-semibold">{testimonial.name}</p>
              <p className="text-sm text-white/70">
                {testimonial.role}, {testimonial.company}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === "compact") {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "h-4 w-4",
                i < testimonial.rating
                  ? "fill-amber-400 text-amber-400"
                  : "fill-slate-200 text-slate-200"
              )}
            />
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          &ldquo;{testimonial.content}&rdquo;
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white">
            {testimonial.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {testimonial.name}
            </p>
            <p className="text-xs text-slate-500">{testimonial.company}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800"
    >
      {/* Decorative gradient */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-br from-violet-500/10 to-indigo-500/10 blur-2xl transition-all duration-500 group-hover:scale-150" />

      {/* Rating */}
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-5 w-5",
              i < testimonial.rating
                ? "fill-amber-400 text-amber-400"
                : "fill-slate-200 text-slate-200"
            )}
          />
        ))}
      </div>

      {/* Content */}
      <p className="relative mt-6 text-slate-600 dark:text-slate-400">
        &ldquo;{testimonial.content}&rdquo;
      </p>

      {/* Video button */}
      {testimonial.videoUrl && (
        <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-400">
          <Play className="h-4 w-4" />
          Watch video testimonial
        </button>
      )}

      {/* Author */}
      <div className="mt-6 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 font-bold text-white shadow-lg shadow-violet-500/30">
          {testimonial.name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{testimonial.name}</p>
          <p className="text-sm text-slate-500">
            {testimonial.role}, {testimonial.company}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// TESTIMONIAL CAROUSEL
// ============================================================================

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
}

function TestimonialCarousel({ testimonials }: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [direction, setDirection] = React.useState(0);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => (prev + newDirection + testimonials.length) % testimonials.length);
  };

  React.useEffect(() => {
    const timer = setInterval(() => paginate(1), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden">
      <div className="relative h-[400px]">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <TestimonialCard
              testimonial={testimonials[currentIndex]}
              index={0}
              variant="featured"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          onClick={() => paginate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-violet-600"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > currentIndex ? 1 : -1);
                setCurrentIndex(i);
              }}
              className={cn(
                "h-2 w-2 rounded-full transition-all",
                i === currentIndex
                  ? "w-8 bg-violet-600"
                  : "bg-slate-300 hover:bg-slate-400 dark:bg-slate-600"
              )}
            />
          ))}
        </div>
        <button
          onClick={() => paginate(1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-violet-600"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN TESTIMONIALS SECTION
// ============================================================================

interface TestimonialsSectionProps {
  title?: string;
  subtitle?: string;
  description?: string;
  testimonials?: Testimonial[];
  variant?: "grid" | "carousel" | "mixed";
}

const defaultTestimonials: Testimonial[] = [
  {
    id: "1",
    name: "Somchai Laundry",
    role: "Owner",
    company: "CleanSpin Bangkok",
    avatar: "",
    content:
      "WashWise transformed how I run my laundromat. I used to drive to my shop 3 times a day just to check on things. Now I manage everything from my phone while having breakfast.",
    rating: 5,
    highlight: "Revenue up 35%",
  },
  {
    id: "2",
    name: "Napat Srisuk",
    role: "Operations Manager",
    company: "FreshWash Chain",
    avatar: "",
    content:
      "The AI predictions saved us from 3 major breakdowns last month alone. That's easily ฿50,000 in repair costs and lost revenue we didn't have to deal with.",
    rating: 5,
  },
  {
    id: "3",
    name: "Kanya Thongchai",
    role: "Franchise Owner",
    company: "LaundryHub",
    avatar: "",
    content:
      "Managing 5 locations used to be a nightmare. Now it's all in one dashboard. The real-time alerts mean I catch problems before customers even notice.",
    rating: 5,
    highlight: "5 locations managed",
  },
  {
    id: "4",
    name: "Prawit Meesuk",
    role: "Business Owner",
    company: "QuickClean",
    avatar: "",
    content:
      "The analytics dashboard is incredible. I finally understand which machines are most profitable and when my peak hours are. Game changer for scheduling staff.",
    rating: 5,
  },
  {
    id: "5",
    name: "Araya Wongsawan",
    role: "CEO",
    company: "SparkleWash Group",
    avatar: "",
    content:
      "We evaluated 4 different platforms. WashWise was the only one that could handle our enterprise needs while still being easy for our staff to use.",
    rating: 5,
    highlight: "Enterprise choice",
  },
  {
    id: "6",
    name: "Thanawat Chaiyasit",
    role: "Technical Director",
    company: "WashPro",
    avatar: "",
    content:
      "The API integration was smooth and the technical support team really knows their stuff. We had custom integrations running within a week.",
    rating: 5,
  },
];

export function TestimonialsSection({
  title = "Loved by laundromat owners everywhere",
  subtitle = "Testimonials",
  description = "Don't just take our word for it. Here's what our customers have to say.",
  testimonials = defaultTestimonials,
  variant = "mixed",
}: TestimonialsSectionProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      id="testimonials"
      className="relative scroll-mt-20 overflow-hidden py-20 lg:py-28"
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950" />

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
            <Star className="h-4 w-4 fill-current" />
            {subtitle}
          </motion.span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            {title}
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">{description}</p>
        </motion.div>

        {/* Testimonials */}
        <div className="mt-16">
          {variant === "carousel" ? (
            <TestimonialCarousel testimonials={testimonials} />
          ) : variant === "mixed" ? (
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <TestimonialCarousel testimonials={testimonials.slice(0, 3)} />
              </div>
              <div className="space-y-6">
                {testimonials.slice(3, 5).map((testimonial, i) => (
                  <TestimonialCard
                    key={testimonial.id}
                    testimonial={testimonial}
                    index={i}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial, i) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-16 grid grid-cols-2 gap-8 rounded-2xl bg-slate-50 p-8 dark:bg-slate-800/50 md:grid-cols-4"
        >
          {[
            { value: "500+", label: "Active Laundromats" },
            { value: "10,000+", label: "Machines Monitored" },
            { value: "99.9%", label: "Uptime SLA" },
            { value: "4.9/5", label: "Customer Rating" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
