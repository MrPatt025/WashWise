# WashWise Landing Page Strategy & Implementation Blueprint

> **Version**: 4.0 | **Target**: 2025-2026 Ultra-Premium Standards | **Last Updated**: January 2026

---

## 🎨 Ultra-Premium World-Class Design (v4.0)

### Design Philosophy

The WashWise landing page has been redesigned with an **ultra-premium, world-class UX/UI approach** featuring:

1. **Immersive Scroll-Based Animations**: Advanced Framer Motion scroll-triggered effects
2. **Premium Background Effects**: Aurora backgrounds, gradient meshes, particle fields
3. **Cursor-Following Effects**: Real-time cursor glow and magnetic interactions
4. **3D Tilt Cards**: Mouse-position-aware tilt effects with depth perception
5. **Advanced Typewriter Effects**: Multi-word rotating text with smooth transitions
6. **Scroll Progress Indicator**: Visual scroll position feedback
7. **Staggered Child Animations**: Orchestrated reveal sequences
8. **Glass Morphism 2.0**: Enhanced frosted glass with gradient borders
9. **Micro-interactions**: Magnetic buttons, ripple effects, reveal text

### New Premium Component Library (v4.0)

#### Animated Background Components (`animated-background.tsx`)

| Component            | Description                                              |
| -------------------- | -------------------------------------------------------- |
| **AuroraBackground** | Animated northern lights effect with customizable colors |
| **GradientMesh**     | Fluid gradient blob animations with multi-color support  |
| **Spotlight**        | Cursor-following spotlight effect with glow              |
| **ParticleField**    | Floating particle animation with configurable density    |
| **GridPattern**      | Subtle animated grid background pattern                  |
| **GlowEffect**       | Ambient glow effect with color customization             |
| **NoiseTexture**     | Film grain overlay for premium aesthetic                 |
| **CursorGlow**       | Mouse-following gradient glow effect                     |
| **BeamEffect**       | Animated light beam sweeping effect                      |
| **MorphingBlob**     | Organic shape-shifting blob animation                    |
| **Shimmer**          | Loading shimmer effect for skeletons                     |
| **GradientText**     | Animated gradient text with color cycling                |

#### Micro-Interaction Components (`micro-interactions.tsx`)

| Component                   | Description                                                  |
| --------------------------- | ------------------------------------------------------------ |
| **TiltCard**                | 3D tilt effect based on mouse position with depth perception |
| **MagneticButton**          | Button that attracts to cursor within proximity              |
| **RevealText**              | Text that reveals character by character on scroll           |
| **AnimatedCounterAdvanced** | Smooth number counting with easing and formatting            |
| **FloatingElement**         | Parallax floating effect on scroll                           |
| **ParallaxScroll**          | Element parallax based on scroll position                    |
| **StaggerChildren**         | Orchestrated staggered reveal for child elements             |
| **GlassCard**               | Enhanced glass morphism with gradient border                 |
| **HoverScale**              | Smooth scale animation on hover                              |
| **RippleEffect**            | Material Design ripple on click                              |
| **BorderGradient**          | Animated gradient border effect                              |
| **Typewriter**              | Multi-word typewriter effect with cursor                     |

#### Scroll Animation Components (`scroll-animations.tsx`)

| Component              | Description                                      |
| ---------------------- | ------------------------------------------------ |
| **ScrollProgress**     | Fixed progress bar showing scroll position       |
| **ScrollReveal**       | Reveal animation triggered by scroll into view   |
| **ParallaxSection**    | Section with parallax background effect          |
| **StickyScroll**       | Sticky positioning with scroll-linked animations |
| **ScrollFade**         | Fade in/out based on scroll position             |
| **ScaleOnScroll**      | Scale transformation linked to scroll progress   |
| **HorizontalScroll**   | Horizontal scroll section within vertical page   |
| **TextRevealOnScroll** | Text that reveals line by line on scroll         |
| **PerspectiveScroll**  | 3D perspective effect on scroll                  |
| **BlurOnScroll**       | Progressive blur effect based on scroll          |
| **ColorShiftOnScroll** | Background color transition on scroll            |
| **ZoomParallax**       | Zoom effect combined with parallax               |

### Current Implementation Features

| Component            | Features                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| **Hero Section**     | Animated gradient orbs, typewriter effect, floating notification badges, interactive dashboard preview |
| **Scroll Progress**  | Fixed top progress bar showing page scroll position                                                    |
| **Cursor Effects**   | Smooth cursor-following glow effect throughout page                                                    |
| **Logo Cloud**       | Animated trust badges with hover effects                                                               |
| **Problem/Solution** | Side-by-side comparison with staggered animations                                                      |
| **Features Grid**    | 3D hover cards with gradient icons                                                                     |
| **How It Works**     | Connected step indicators with animated numbers                                                        |
| **Stats Section**    | Animated counters with gradient background                                                             |
| **Testimonials**     | Auto-advancing carousel with quote animations                                                          |
| **Pricing**          | Monthly/yearly toggle with savings calculation                                                         |
| **FAQ**              | Animated accordion with smooth transitions                                                             |
| **CTA Section**      | Full-width gradient with floating particles                                                            |
| **Footer**           | Newsletter signup and social links                                                                     |

### Animation System (v4.0)

```typescript
// Scroll Progress Indicator
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return <motion.div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r origin-left" style={{ scaleX }} />;
}

// Cursor Glow Effect
function CursorGlow() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  // Smooth cursor-following gradient glow with spring physics
}

// Advanced Stagger Children
function StaggerChildren({ children, staggerDelay = 0.1 }) {
  return (
    <motion.div initial="hidden" whileInView="visible"
      variants={{ visible: { transition: { staggerChildren: staggerDelay } } }}>
      {children}
    </motion.div>
  );
}

// 3D Tilt Card
function TiltCard({ children }) {
  const rotateX = useTransform(mouseY, [0, 1], [15, -15]);
  const rotateY = useTransform(mouseX, [0, 1], [-15, 15]);
  // Smooth 3D tilt based on mouse position within card bounds
}
```

---

## 1. Landing Page Strategy

### Ideal Customer Profile (ICP)

| Attribute          | Description                                                                    |
| ------------------ | ------------------------------------------------------------------------------ |
| **Industry**       | Laundromat owners/operators, coin laundry franchises, multi-location operators |
| **Business Size**  | 1-50 locations, 10-500 machines                                                |
| **Decision Maker** | Owner, Operations Manager, Franchise Director                                  |
| **Tech Savviness** | Low to Medium (prefer simple solutions)                                        |
| **Pain Tolerance** | High - dealing with manual processes, machine downtime, revenue leakage        |
| **Geography**      | Thailand (primary), Southeast Asia (expansion)                                 |
| **Budget**         | $50-500/month for management software                                          |

### Main Pain Points (Ranked by Severity)

1. **Machine Downtime** - Lost revenue when machines break without warning
2. **Manual Monitoring** - Physical visits required to check machine status
3. **Revenue Tracking** - No real-time visibility into daily/weekly earnings
4. **Maintenance Scheduling** - Reactive instead of predictive maintenance
5. **Multi-location Management** - Can't monitor multiple sites efficiently
6. **Customer Experience** - No visibility into wait times or availability

### Value Proposition

**Primary**: "Know exactly what's happening at your laundromat—without being there."

**Supporting Messages**:

- Reduce machine downtime by up to 60% with AI predictions
- Real-time revenue tracking and machine monitoring
- Mobile alerts before problems become costly repairs
- Pay only for what you need, scale as you grow

### Primary CTA Decision

**✅ CHOSEN: Option A - Start Free Trial**

**Justification**:

1. **Lower Barrier**: B2B buyers in this segment (SMB laundromat owners) prefer self-service
   evaluation
2. **Thai Market**: Credit card penetration is high; free trials with email work well
3. **Product-Led Growth**: Dashboard-based SaaS benefits from hands-on exploration
4. **Competitor Analysis**: Industry leaders (Cents, SpyderWash) use trial-first approach
5. **Qualification**: Trial users self-qualify; serious buyers convert within 7 days

**Secondary CTA**: "Watch Demo" (for research-stage visitors)

### Trust Strategy (Credibility Fast-Track)

| Trust Element          | Implementation                                      |
| ---------------------- | --------------------------------------------------- |
| **Social Proof**       | Customer logos, testimonials with real names/photos |
| **Numbers**            | "500+ laundromats trust WashWise" with live counter |
| **Security Badges**    | SOC 2, SSL, GDPR compliance icons                   |
| **Risk Reversal**      | "14-day free trial, no credit card required"        |
| **Case Study Snippet** | "CleanSpin reduced downtime by 60% in 6 months"     |
| **Demo Video**         | 60-second product walkthrough in hero               |
| **Real Dashboard**     | Actual screenshots, not mockups                     |

---

## 2. Page Architecture (Section-by-Section)

### Section 1: Navigation (Sticky)

**Goal**: Enable quick navigation + persistent CTA visibility

| Element             | Specification                                     |
| ------------------- | ------------------------------------------------- |
| **Logo**            | Left-aligned, clickable to home                   |
| **Links**           | Features, Pricing, Testimonials (smooth scroll)   |
| **CTA**             | "Start Free Trial" button (right, always visible) |
| **Mobile**          | Hamburger menu with slide-out drawer              |
| **Scroll Behavior** | Becomes opaque on scroll with subtle shadow       |

---

### Section 2: Hero (Above the Fold)

**Goal**: Answer "What is this? Who is it for? Why should I care?" in <5 seconds

**Copywriting**:

- **Headline**: "Monitor Your Laundromat From Anywhere"
- **Subheadline**: "Real-time machine status, revenue tracking, and AI-powered alerts—so you can run
  your business without being there."
- **Primary CTA**: "Start Free Trial" (gradient button)
- **Secondary CTA**: "Watch Demo" (ghost button with play icon)
- **Trust Line**: ✓ No credit card required · ✓ 14-day free trial · ✓ Setup in 5 minutes

**Visual**:

- Hero image: Real dashboard screenshot with slight 3D perspective tilt
- Floating notification mockup showing "Machine #5 needs maintenance soon"
- Subtle gradient background (violet → indigo)
- Minimal animation: fade-in on load only

---

### Section 3: Social Proof Bar (Logos)

**Goal**: Instant credibility through association

**Copywriting**:

- **Text**: "Trusted by 500+ laundromats across Thailand"

**Visual**:

- 5-6 customer logos in grayscale (hover to color)
- Horizontal scrolling on mobile
- Clean, minimal spacing

---

### Section 4: Problem → Solution

**Goal**: Agitate pain, then present WashWise as the solution

**Copywriting**:

- **Section Label**: "THE PROBLEM"
- **Headline**: "Running a laundromat shouldn't mean being chained to it"
- **Pain Points**:
  1. "You find out machines are broken only after customers complain"
  2. "Revenue tracking means counting coins at the end of the day"
  3. "You drive to each location just to check if everything's working"

- **Section Label**: "THE SOLUTION"
- **Headline**: "WashWise gives you eyes everywhere"
- **Subheadline**: "One dashboard to monitor all your machines, track revenue, and prevent problems
  before they happen."

**Visual**:

- Before/After comparison (split screen)
- Left: Frustrated owner with question marks, coins
- Right: Calm owner with phone showing WashWise dashboard

---

### Section 5: Features (Benefits-First)

**Goal**: Show what WashWise does and why it matters

**Copywriting**:

- **Section Label**: "FEATURES"
- **Headline**: "Everything you need to run smarter"

**Feature Cards (6 total)**:

| #   | Icon       | Title                | Benefit Copy                                                                      |
| --- | ---------- | -------------------- | --------------------------------------------------------------------------------- |
| 1   | Activity   | Real-time Monitoring | See which machines are running, available, or need attention—updated every second |
| 2   | Bell       | Instant Alerts       | Get notified on your phone the moment something goes wrong                        |
| 3   | TrendingUp | Revenue Analytics    | Track daily, weekly, and monthly earnings with visual reports                     |
| 4   | Cpu        | AI Predictions       | Our AI warns you about potential failures before they happen                      |
| 5   | Smartphone | Mobile Dashboard     | Full control from your pocket—works on any device                                 |
| 6   | Shield     | Enterprise Security  | Bank-grade encryption keeps your data safe                                        |

**Visual**:

- 3-column grid on desktop, 2 on tablet, 1 on mobile
- Each card: Icon, Title, 1-sentence benefit
- Hover: Subtle lift + shadow
- Screenshot callout for "Real-time Monitoring" feature

---

### Section 6: How It Works (3 Steps)

**Goal**: Show simplicity of getting started

**Copywriting**:

- **Section Label**: "HOW IT WORKS"
- **Headline**: "Go live in under 10 minutes"

**Steps**:

| Step | Title               | Description                                            |
| ---- | ------------------- | ------------------------------------------------------ |
| 1    | Create Your Account | Sign up with your email. No credit card needed.        |
| 2    | Add Your Machines   | Enter your machine details or connect our IoT sensors. |
| 3    | Start Monitoring    | Watch your dashboard come to life with real-time data. |

**Visual**:

- Horizontal timeline with numbered circles
- Connecting line between steps
- Small illustration/icon for each step
- Screenshot of empty → populated dashboard transition

---

### Section 7: Social Proof (Testimonials)

**Goal**: Build trust through peer validation

**Copywriting**:

- **Section Label**: "TESTIMONIALS"
- **Headline**: "See why laundromat owners love WashWise"

**Testimonials (3)**:

| Name              | Role               | Company           | Quote                                                                                           |
| ----------------- | ------------------ | ----------------- | ----------------------------------------------------------------------------------------------- |
| Sarah Chen        | Owner              | CleanSpin Laundry | "WashWise cut our machine downtime by 60%. I check my phone instead of driving to the shop."    |
| Michael Rodriguez | Operations Manager | FreshWash Corp    | "The AI predictions are scary accurate. We fixed a machine 2 days before it would have broken." |
| Emily Watson      | Franchise Owner    | LaundryHub        | "Managing 5 locations used to take all day. Now I do it in 10 minutes."                         |

**Visual**:

- Card layout with photo, name, role, company
- Star rating (5 stars)
- Quote in large, readable font
- Optional: Video testimonial thumbnail

---

### Section 8: Pricing Preview

**Goal**: Qualify leads by showing transparent pricing

**Copywriting**:

- **Section Label**: "PRICING"
- **Headline**: "Simple pricing that grows with you"
- **Subheadline**: "Start free. Upgrade when you're ready."

**Tiers**:

| Tier         | Price     | Best For                               | Key Feature                                |
| ------------ | --------- | -------------------------------------- | ------------------------------------------ |
| Starter      | ฿1,500/mo | Small laundromats (up to 10 machines)  | Real-time monitoring, basic alerts         |
| Professional | ฿4,500/mo | Growing businesses (up to 50 machines) | AI predictions, advanced analytics, API    |
| Enterprise   | Custom    | Multi-location operators               | Unlimited machines, dedicated support, SLA |

**CTA**: "Start Free Trial" (under each tier)

**Visual**:

- 3-column card layout
- "Most Popular" badge on Professional
- Checkmark feature list
- Pricing in Thai Baht (primary market)

---

### Section 9: FAQ

**Goal**: Overcome objections and reduce friction

**Copywriting**:

- **Section Label**: "FAQ"
- **Headline**: "Questions? We've got answers."

**FAQ Items (6)**:

| Question                           | Answer                                                                                               |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| How long does setup take?          | Most customers are up and running in under 10 minutes. Just create an account and add your machines. |
| Do I need special hardware?        | No. WashWise works with any machine. For advanced features, we offer optional IoT sensors.           |
| Is my data secure?                 | Yes. We use bank-grade encryption and are SOC 2 compliant. Your data is never shared.                |
| What if I have multiple locations? | WashWise supports unlimited locations. Switch between them with one click.                           |
| Can I cancel anytime?              | Absolutely. No contracts, no cancellation fees. Cancel in 2 clicks.                                  |
| Do you offer support in Thai?      | Yes! Our support team is based in Bangkok and available in Thai and English.                         |

**Visual**:

- Accordion style (one open at a time)
- Plus/minus icons
- Smooth expand animation

---

### Section 10: Final CTA

**Goal**: Last chance conversion with urgency

**Copywriting**:

- **Headline**: "Ready to run your laundromat the smart way?"
- **Subheadline**: "Join 500+ owners who switched to WashWise. Your first 14 days are free."
- **Primary CTA**: "Start Your Free Trial"
- **Secondary CTA**: "Talk to Sales"
- **Trust Line**: "No credit card required • Cancel anytime • Thai support included"

**Visual**:

- Full-width gradient background (violet → indigo → cyan)
- Subtle dot pattern overlay
- Centered text with CTAs
- Optional: Animated confetti on hover (subtle)

---

### Section 11: Footer

**Goal**: Secondary navigation + legal + social

**Columns**:

1. **Logo + Tagline**: "Smart laundromat management"
2. **Product**: Features, Pricing, API, Integrations
3. **Company**: About, Blog, Careers, Contact
4. **Legal**: Privacy, Terms, Cookies

**Bottom Bar**:

- Copyright
- Social icons (Facebook, LINE, Twitter)
- Language selector (TH/EN)

---

## 3. Conversion Copy (Ready to Paste)

### Hero Headlines (5 Options)

1. **Monitor Your Laundromat From Anywhere** ← RECOMMENDED
2. Stop Guessing, Start Knowing—Real-time Laundromat Insights
3. Your Laundromat, Under Control—24/7
4. Never Miss a Machine Problem Again
5. The Dashboard That Runs Your Laundromat For You

### Hero Subheadlines (5 Options)

1. **Real-time machine status, revenue tracking, and AI-powered alerts—so you can run your business
   without being there.** ← RECOMMENDED
2. See every machine, track every baht, and get alerts before problems cost you money.
3. One dashboard for all your machines. One app for complete control.
4. Know what's happening at your laundromat without stepping inside.
5. AI-powered monitoring that pays for itself in the first month.

### CTA Button Texts (10 Options)

| #   | CTA Text              | Use Case                    |
| --- | --------------------- | --------------------------- |
| 1   | Start Free Trial      | Primary CTA (hero, pricing) |
| 2   | Try WashWise Free     | Alternative primary         |
| 3   | Get Started Free      | Softer primary              |
| 4   | Watch Demo            | Secondary CTA               |
| 5   | See It In Action      | Secondary alternative       |
| 6   | Start Monitoring Now  | Action-oriented             |
| 7   | Create Free Account   | Form submission             |
| 8   | Talk to Sales         | Enterprise tier             |
| 9   | Book a Demo           | High-touch sales            |
| 10  | Join 500+ Laundromats | Social proof CTA            |

### Feature Cards (6, Benefit-Style)

```
1. Real-time Monitoring
   See which machines are running, available, or need attention—updated every second.

2. Instant Alerts
   Get notified on your phone the moment something goes wrong, so you can fix it fast.

3. Revenue Analytics
   Track daily, weekly, and monthly earnings with beautiful visual reports you actually understand.

4. AI Predictions
   Our AI analyzes patterns to warn you about potential failures—before they cost you money.

5. Mobile Dashboard
   Full control from your pocket. Check your laundromat while having coffee.

6. Enterprise Security
   Bank-grade encryption and SOC 2 compliance. Your data stays your data.
```

### FAQ Items (6, Objection-Handling)

```
Q: How long does setup take?
A: Most customers are up and running in under 10 minutes. Create an account, add your machines, and you're done. No IT team required.

Q: Do I need to buy special hardware?
A: No. WashWise works with the machines you already have. For advanced features like predictive maintenance, we offer optional IoT sensors starting at ฿500/machine.

Q: Is my business data secure?
A: Absolutely. We use AES-256 encryption, are SOC 2 Type II compliant, and never share your data. Your revenue numbers stay private.

Q: What if I have multiple laundromat locations?
A: WashWise supports unlimited locations on Professional and Enterprise plans. Switch between sites with one click from the same dashboard.

Q: Can I cancel my subscription anytime?
A: Yes. No contracts, no cancellation fees, no guilt trips. Cancel in 2 clicks from your settings page. We'll even help you export your data.

Q: Do you offer customer support in Thai?
A: Yes! Our support team is based in Bangkok. We offer Thai-language support via LINE, email, and phone for Professional and Enterprise customers.
```

### Trust Proof Text Examples

```
• "Trusted by 500+ laundromats across Thailand"
• "10,000+ machines monitored daily"
• "99.9% uptime guaranteed"
• "Average 35% revenue increase for customers"
• "SOC 2 Type II Certified"
• "24/7 monitoring, no holidays"
• "Setup in under 10 minutes"
• "No credit card required to start"
```

---

## 4. UI/UX Design System Spec (2025-2026 Aesthetic)

### Layout Grid

```
Container: max-w-7xl (1280px)
Padding: px-4 sm:px-6 lg:px-8
Columns: 12-column grid
Gutter: 24px (gap-6) desktop, 16px (gap-4) mobile
```

### Spacing Scale (8px Base)

| Token    | Value | Use Case                   |
| -------- | ----- | -------------------------- |
| space-1  | 4px   | Tight inline spacing       |
| space-2  | 8px   | Icon gaps, small padding   |
| space-3  | 12px  | Button padding             |
| space-4  | 16px  | Card padding (mobile)      |
| space-6  | 24px  | Card padding (desktop)     |
| space-8  | 32px  | Section internal spacing   |
| space-12 | 48px  | Between components         |
| space-16 | 64px  | Between sections (mobile)  |
| space-20 | 80px  | Between sections (desktop) |

### Typography Scale

| Element         | Size           | Weight         | Line Height |
| --------------- | -------------- | -------------- | ----------- |
| H1 (Hero)       | 48px/60px/72px | Bold (700)     | 1.1         |
| H2 (Section)    | 30px/36px/48px | Bold (700)     | 1.2         |
| H3 (Card Title) | 20px/24px      | Semibold (600) | 1.3         |
| Body Large      | 18px/20px      | Regular (400)  | 1.6         |
| Body            | 16px           | Regular (400)  | 1.6         |
| Body Small      | 14px           | Regular (400)  | 1.5         |
| Caption         | 12px           | Medium (500)   | 1.4         |

**Font Stack**: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

### Component Style Rules

**Buttons**:

```css
/* Primary */
.btn-primary {
  background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.2s;
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
}

/* Secondary/Ghost */
.btn-secondary {
  background: transparent;
  border: 1px solid rgba(124, 58, 237, 0.3);
  color: #7c3aed;
  padding: 12px 24px;
  border-radius: 12px;
}
.btn-secondary:hover {
  background: rgba(124, 58, 237, 0.05);
  border-color: #7c3aed;
}
```

**Cards**:

```css
.card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}
```

**Badges**:

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 100px;
  font-size: 14px;
  font-weight: 500;
}
.badge-primary {
  background: rgba(124, 58, 237, 0.1);
  color: #7c3aed;
  border: 1px solid rgba(124, 58, 237, 0.2);
}
```

### Color Strategy

**Primary Palette**:

```
violet-600: #7c3aed (Primary brand)
indigo-600: #4f46e5 (Secondary brand)
cyan-500: #06b6d4 (Accent)
```

**Neutral Palette**:

```
slate-50: #f8fafc (Background light)
slate-100: #f1f5f9 (Card background)
slate-500: #64748b (Muted text)
slate-900: #0f172a (Heading text)
slate-950: #020617 (Background dark)
```

**Semantic Colors**:

```
green-500: #22c55e (Success)
amber-500: #f59e0b (Warning)
red-500: #ef4444 (Error)
```

**Gradients**:

```css
/* Hero gradient */
background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #06b6d4 100%);

/* Card accent line */
background: linear-gradient(90deg, #7c3aed 0%, #4f46e5 50%, #06b6d4 100%);

/* Background blur */
background: radial-gradient(circle at 30% 30%, rgba(124, 58, 237, 0.15), transparent 50%);
```

### Micro-interactions (Performance-Safe)

| Interaction  | Animation                 | Duration       |
| ------------ | ------------------------- | -------------- |
| Button hover | translateY(-1px) + shadow | 200ms ease     |
| Card hover   | translateY(-4px) + shadow | 300ms ease     |
| Link hover   | color transition          | 150ms ease     |
| Menu open    | height + opacity          | 300ms ease-out |
| Accordion    | max-height                | 250ms ease     |
| Page load    | fade-in                   | 600ms (once)   |

**Forbidden Animations** (for performance):

- ❌ Continuous spinning/rotating
- ❌ Parallax scrolling
- ❌ Heavy particle effects
- ❌ Auto-playing video backgrounds
- ❌ Scroll-jacking

---

## 5. Performance & SEO Requirements

### Core Web Vitals Targets

| Metric                          | Target  | Measurement        |
| ------------------------------- | ------- | ------------------ |
| LCP (Largest Contentful Paint)  | < 2.5s  | Hero image/heading |
| INP (Interaction to Next Paint) | < 200ms | CTA button clicks  |
| CLS (Cumulative Layout Shift)   | < 0.1   | No layout shifts   |
| TTFB (Time to First Byte)       | < 600ms | Server response    |

### Image Strategy

```tsx
// next/image configuration
<Image
  src="/hero-dashboard.webp"
  alt="WashWise Dashboard showing real-time machine monitoring"
  width={1200}
  height={800}
  priority // Above the fold
  placeholder="blur"
  blurDataURL={shimmerDataUrl}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
/>

// Format priority: AVIF > WebP > PNG
// Max file sizes:
// - Hero: 150KB
// - Feature images: 50KB each
// - Logos: 10KB each (SVG preferred)
```

### Font Strategy

```tsx
// app/layout.tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Prevent FOIT
  preload: true,
  variable: "--font-inter",
});
```

### Metadata & OpenGraph

```tsx
// app/(marketing)/page.tsx
export const metadata: Metadata = {
  title: "WashWise - Smart Laundromat Management Software",
  description:
    "Monitor your laundromat from anywhere with real-time machine status, revenue tracking, and AI-powered alerts. Start free trial today.",
  keywords: ["laundromat software", "laundry management", "machine monitoring", "coin laundry"],
  openGraph: {
    title: "WashWise - Monitor Your Laundromat From Anywhere",
    description: "Real-time machine status, revenue tracking, and AI alerts for laundromat owners.",
    url: "https://washwise.io",
    siteName: "WashWise",
    images: [
      {
        url: "https://washwise.io/og-image.png",
        width: 1200,
        height: 630,
        alt: "WashWise Dashboard Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WashWise - Smart Laundromat Management",
    description: "Monitor your laundromat from anywhere. Start free trial.",
    images: ["https://washwise.io/twitter-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://washwise.io",
    languages: {
      "en-US": "https://washwise.io",
      "th-TH": "https://washwise.io/th",
    },
  },
};
```

### Accessibility Checklist (WCAG AA)

| Requirement         | Implementation                           |
| ------------------- | ---------------------------------------- |
| Color contrast      | 4.5:1 minimum (text), 3:1 (large text)   |
| Focus indicators    | Visible ring on all interactive elements |
| Alt text            | Descriptive alt for all images           |
| Keyboard navigation | Tab order follows visual order           |
| ARIA labels         | Buttons, links, form fields labeled      |
| Skip link           | "Skip to main content" link              |
| Reduced motion      | `prefers-reduced-motion` respected       |
| Form labels         | All inputs have associated labels        |
| Error messages      | Clear, visible error states              |

### Tracking Plan (Conversion Funnel)

```typescript
// Event taxonomy
const EVENTS = {
  // Page views
  PAGE_VIEW: "page_view",

  // Engagement
  CTA_CLICK: "cta_click", // { location, cta_text }
  VIDEO_PLAY: "video_play",
  FAQ_EXPAND: "faq_expand", // { question }
  PRICING_VIEW: "pricing_view", // { tier }

  // Conversion
  SIGNUP_START: "signup_start",
  SIGNUP_COMPLETE: "signup_complete",
  TRIAL_START: "trial_start",

  // Scroll depth
  SCROLL_25: "scroll_25",
  SCROLL_50: "scroll_50",
  SCROLL_75: "scroll_75",
  SCROLL_100: "scroll_100",
};

// Implementation with Mixpanel/GA4
function trackCTA(location: string, ctaText: string) {
  track(EVENTS.CTA_CLICK, {
    location, // 'hero', 'pricing', 'final_cta'
    cta_text: ctaText,
    timestamp: Date.now(),
  });
}
```

---

## 6. Production-Ready Next.js Implementation Blueprint

### Route Structure (App Router)

```
app/
├── (marketing)/          # Marketing pages (no auth)
│   ├── layout.tsx        # Marketing layout (nav + footer)
│   ├── page.tsx          # Landing page
│   ├── pricing/
│   │   └── page.tsx
│   └── about/
│       └── page.tsx
├── (auth)/               # Auth pages
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
├── dashboard/            # Protected app
│   ├── layout.tsx
│   └── page.tsx
├── layout.tsx            # Root layout
└── globals.css
```

### Component Structure

```
components/
├── landing/              # Landing page specific
│   ├── hero-section.tsx
│   ├── features-section.tsx
│   ├── how-it-works-section.tsx
│   ├── testimonials-section.tsx
│   ├── pricing-section.tsx
│   ├── faq-section.tsx
│   ├── cta-section.tsx
│   ├── logo-cloud.tsx
│   └── dashboard-preview.tsx
├── marketing/            # Shared marketing components
│   ├── navigation.tsx
│   ├── footer.tsx
│   └── mobile-menu.tsx
├── ui/                   # shadcn/ui + custom
│   ├── button.tsx
│   ├── card.tsx
│   ├── accordion.tsx
│   └── badge.tsx
└── shared/               # Truly reusable
    ├── section-header.tsx
    └── animated-counter.tsx
```

---

Now let me implement the production-ready components:
