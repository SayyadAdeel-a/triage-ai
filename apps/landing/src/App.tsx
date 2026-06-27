import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform, type Variants } from 'framer-motion'
import {
    Zap,
    Clock,
    Puzzle,
    AlertTriangle,
    Database,
    Code2,
    Package,
    Check,
    ArrowRight,
    Play,
    Menu,
    X,
    ChevronRight
} from 'lucide-react'
import BorderGlow from './BorderGlow'


/* ------------------------------------------------------------------
   Types
   ------------------------------------------------------------------ */
interface FeatureCardProps {
    icon: React.ReactNode
    title: string
    description: string
    stat?: string
    statLabel?: string
    visual?: React.ReactNode
    delay?: number
}

interface PricingTierProps {
    name: string
    price: string
    description: string
    features: string[]
    highlighted?: boolean
    delay?: number
}

interface TeamMemberProps {
    name: string
    role: string
    image: string
    delay?: number
}

/* ------------------------------------------------------------------
   Animation variants
   ------------------------------------------------------------------ */
const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: (delay = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, delay, ease: "easeOut" }
    })
}

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
}

const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: (delay = 0) => ({
        opacity: 1,
        scale: 1,
        transition: { duration: 0.7, delay, ease: "easeOut" }
    })
}

/* ------------------------------------------------------------------
   Components
   ------------------------------------------------------------------ */
function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    const links = [
        { label: 'Security', href: '#security' },
        { label: 'Process', href: '#process' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Team', href: '#team' }
    ]

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                    ? 'bg-black/80 backdrop-blur-xl border-b border-[#1a1a1a]'
                    : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-5 md:px-8">
                <div className="flex items-center justify-between h-16 md:h-20">
                    <a
                        href="#"
                        className="text-[#eeeded] font-semibold tracking-[0.12em] text-sm uppercase hover:text-white transition-colors"
                    >
                        TriageAI
                    </a>

                    <div className="hidden md:flex items-center gap-8">
                        {links.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="text-sm text-[#eeeded]/70 hover:text-white transition-colors duration-200"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    <div className="hidden md:block">
                        <a
                            href="#cta"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00ffab] text-[#0a0a0a] text-sm font-semibold hover:bg-[#00e69d] transition-colors duration-200 btn-primary-shadow"
                        >
                            Start for free
                            <ArrowRight size={14} strokeWidth={2.5} />
                        </a>
                    </div>

                    <button
                        className="md:hidden text-[#eeeded] p-2 rounded-lg hover:bg-white/5 transition-colors"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={mobileOpen}
                    >
                        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {mobileOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="md:hidden bg-black/95 backdrop-blur-xl border-b border-[#1a1a1a]"
                >
                    <div className="px-5 py-5 flex flex-col gap-4">
                        {links.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                className="text-base text-[#eeeded]/80 hover:text-white py-2"
                            >
                                {link.label}
                            </a>
                        ))}
                        <a
                            href="#cta"
                            onClick={() => setMobileOpen(false)}
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#00ffab] text-[#0a0a0a] text-sm font-semibold mt-2"
                        >
                            Start for free
                            <ArrowRight size={14} strokeWidth={2.5} />
                        </a>
                    </div>
                </motion.div>
            )}
        </nav>
    )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-block text-xs font-medium tracking-[0.15em] uppercase text-[#00ffab]/80 mb-4">
            {children}
        </span>
    )
}

function SectionHeading({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <h2
            className={`text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-[1.15] ${className}`}
        >
            {children}
        </h2>
    )
}

function FeatureCard({ icon, title, description, stat, statLabel, visual, delay = 0 }: FeatureCardProps) {
    return (
        <motion.div
            variants={fadeUp}
            custom={delay}
            className="group relative"
        >
            <BorderGlow
                className="w-full h-full"
                edgeSensitivity={30}
                glowColor="40 80 80"
                backgroundColor="#120F17"
                borderRadius={24}
                glowRadius={40}
                glowIntensity={1.0}
                coneSpread={25}
                animated={false}
                colors={['#c084fc', '#f472b6', '#38bdf8']}
            >
                <div className="overflow-hidden card-surface w-full h-full rounded-[24px] relative z-10 p-6 md:p-7 hover:border-[#333] transition-colors duration-300">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#00ffab]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                        <div className="mb-5">
                            <div className="w-11 h-11 rounded-xl bg-[#00ffab]/10 border border-[#00ffab]/20 flex items-center justify-center text-[#00ffab]">
                                {icon}
                            </div>
                        </div>

                        {visual && <div className="mb-5">{visual}</div>}

                        {stat && (
                            <div className="mb-3">
                                <span className="text-2xl font-semibold text-white">{stat}</span>
                                {statLabel && (
                                    <span className="ml-2 text-xs text-[#eeeded]/50 uppercase tracking-wider">
                                        {statLabel}
                                    </span>
                                )}
                            </div>
                        )}

                        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                        <p className="text-sm leading-relaxed text-[#eeeded]/60">{description}</p>
                    </div>
                </div>
            </BorderGlow>
        </motion.div>
    )
}

function PricingTier({ name, price, description, features, highlighted, delay = 0 }: PricingTierProps) {
    return (
        <motion.div
            variants={fadeUp}
            custom={delay}
            className={`relative rounded-[28px] p-7 flex flex-col h-full transition-all duration-300 ${highlighted
                    ? 'bg-gradient-to-b from-[#00ffab]/10 to-[#0a0a0a] border border-[#00ffab]/30 glow-mint'
                    : 'card-surface hover:border-[#333]'
                }`}
        >
            <div className="mb-6">
                <span className="text-xs font-medium tracking-[0.12em] uppercase text-[#eeeded]/50">
                    {name}
                </span>
                <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl md:text-5xl font-semibold text-white">{price}</span>
                </div>
                <p className="mt-2 text-sm text-[#eeeded]/60 leading-relaxed">{description}</p>
            </div>

            <a
                href="#cta"
                className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-all duration-200 mb-6 ${highlighted
                        ? 'bg-[#00ffab] text-[#0a0a0a] hover:bg-[#00e69d] btn-primary-shadow'
                        : 'bg-white/5 text-white border border-[#333] hover:bg-white/10'
                    }`}
            >
                Get Started
                <ArrowRight size={14} strokeWidth={2.5} />
            </a>

            <ul className="space-y-3 mt-auto">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[#eeeded]/70">
                        <div className="mt-0.5 w-5 h-5 rounded-full bg-[#00ffab]/10 flex items-center justify-center flex-shrink-0">
                            <Check size={12} className="text-[#00ffab]" />
                        </div>
                        {feature}
                    </li>
                ))}
            </ul>
        </motion.div>
    )
}

function TeamMember({ name, role, image, delay = 0 }: TeamMemberProps) {
    return (
        <motion.div
            variants={fadeUp}
            custom={delay}
            className="group relative"
        >
            <BorderGlow
                className="w-full h-full"
                edgeSensitivity={30}
                glowColor="40 80 80"
                backgroundColor="#120F17"
                borderRadius={28}
                glowRadius={40}
                glowIntensity={1.0}
                coneSpread={25}
                animated={false}
                colors={['#c084fc', '#f472b6', '#38bdf8']}
            >
                <div className="overflow-hidden card-surface w-full h-full rounded-[28px] relative z-10">
                    <div className="aspect-[3/4] overflow-hidden">
                        <img
                            src={image}
                            alt={`${name}, ${role}`}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                        />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                        <div className="flex items-end justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-white">{name}</h3>
                                <p className="text-sm text-[#eeeded]/60">{role}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-[#00ffab] flex items-center justify-center text-[#0a0a0a]">
                                <ArrowRight size={14} strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>
                </div>
            </BorderGlow>
        </motion.div>
    )
}

function FAQ() {
    const items = [
        {
            q: 'How does TriageAI protect my data?',
            a: 'TriageAI processes emails locally and uses secure API connections to LLMs. You own your data and it never touches our servers.'
        },
        {
            q: 'Does it work with my existing email provider?',
            a: 'Yes, TriageAI connects to any email provider using standard IMAP/SMTP, including Gmail, Outlook, and custom domains.'
        },
        {
            q: 'Can it reply to emails automatically?',
            a: 'You can configure Autopilot mode to either pre-draft replies for your review or automatically send them based on strict confidence thresholds you define.'
        },
        {
            q: 'Do you charge a monthly subscription?',
            a: 'No. You purchase a lifetime license for the desktop app. You just pay your own API costs directly to the AI provider (usually pennies a day).'
        }
    ]

    const [openIndex, setOpenIndex] = useState<number | null>(0)

    return (
        <section className="py-24 md:py-32 bg-black">
            <div className="max-w-3xl mx-auto px-5 md:px-8">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    variants={fadeUp}
                    className="text-center mb-14"
                >
                    <SectionLabel>FAQ</SectionLabel>
                    <SectionHeading>Questions? Answers.</SectionHeading>
                </motion.div>

                <div className="space-y-4">
                    {items.map((item, i) => {
                        const isOpen = openIndex === i
                        return (
                            <motion.div
                                key={i}
                                variants={fadeUp}
                                custom={i * 0.1}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden"
                            >
                                <button
                                    onClick={() => setOpenIndex(isOpen ? null : i)}
                                    className="w-full flex items-center justify-between p-5 md:p-6 text-left hover:bg-white/[0.02] transition-colors"
                                    aria-expanded={isOpen}
                                >
                                    <span className="text-base md:text-lg font-medium text-white pr-4">
                                        {item.q}
                                    </span>
                                    <span
                                        className={`flex-shrink-0 w-8 h-8 rounded-full border border-[#333] flex items-center justify-center text-[#eeeded] transition-transform duration-200 ${isOpen ? 'rotate-45 bg-[#00ffab]/10 border-[#00ffab]/30 text-[#00ffab]' : ''
                                            }`}
                                    >
                                        <PlusIcon />
                                    </span>
                                </button>
                                <div
                                    className={`grid transition-all duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                                        }`}
                                >
                                    <div className="overflow-hidden">
                                        <p className="px-5 md:px-6 pb-5 md:pb-6 text-[#eeeded]/60 leading-relaxed">
                                            {item.a}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

function PlusIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}

/* ------------------------------------------------------------------
   Sections
   ------------------------------------------------------------------ */
function Hero() {
    const { scrollY } = useScroll()
    const y1 = useTransform(scrollY, [0, 500], [0, 80])

    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-5 md:px-8 overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#00ffab]/8 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-[#00ffab]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 max-w-5xl mx-auto text-center">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                >
                    <motion.div variants={fadeUp}>
                        <span className="inline-block text-xs font-medium tracking-[0.2em] uppercase text-[#00ffab]/80 mb-6">
                            The Ultimate AI Assistant
                        </span>
                    </motion.div>

                    <motion.h1
                        variants={fadeUp}
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-white leading-[1.05] mb-6"
                    >
                        Take back control.<br /><span className="gradient-text">Your AI executive assistant.</span>
                    </motion.h1>

                    <motion.p
                        variants={fadeUp}
                        className="max-w-2xl mx-auto text-base md:text-lg text-[#eeeded]/60 leading-relaxed mb-10"
                    >
                        TriageAI automatically categorizes emails, drafts contextual replies, and learns from your behavior to save you hours every week.
                    </motion.p>

                    <motion.div
                        variants={fadeUp}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <a
                            href="#cta"
                            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#00ffab] text-[#0a0a0a] text-sm font-semibold hover:bg-[#00e69d] transition-all duration-200 btn-primary-shadow"
                        >
                            Start for free
                            <ArrowRight size={16} strokeWidth={2.5} />
                        </a>
                        <a
                            href="#process"
                            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-[#333] text-white text-sm font-medium hover:bg-white/5 transition-all duration-200"
                        >
                            Learn More
                            <ChevronRight size={16} />
                        </a>
                    </motion.div>
                </motion.div>

                {/* Hero visual */}
                <motion.div
                    style={{ y: y1 }}
                    initial="hidden"
                    animate="visible"
                    variants={scaleIn}
                    custom={0.3}
                    className="mt-14 md:mt-20 relative"
                >
                    <div className="relative mx-auto max-w-4xl rounded-[32px] overflow-hidden border border-[#1a1a1a] bg-[#0a0a0a] glow-mint">
                        <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-center border-b border-[#1a1a1a] bg-black/40 backdrop-blur-sm z-10">
                            <div className="flex items-center gap-2 text-[#00ffab]">
                                <div className="w-6 h-6 rounded-md bg-[#00ffab]/10 flex items-center justify-center">
                                    <Zap size={14} fill="currentColor" />
                                </div>
                                <span className="text-xs font-semibold tracking-[0.15em] uppercase">
                                    View Demo
                                </span>
                            </div>
                        </div>
                        <div className="aspect-[16/10] mt-14">
                            <img
                                src="/uploads/hero-speaker.png"
                                alt="Product walkthrough presenter"
                                className="w-full h-full object-cover object-top"
                            />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#00ffab]/90 flex items-center justify-center text-[#0a0a0a] shadow-2xl">
                                <Play size={28} fill="currentColor" className="ml-1" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

function IntroStatement() {
    return (
        <section id="process" className="py-24 md:py-32 px-5 md:px-8 bg-black">
            <div className="max-w-4xl mx-auto text-center">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    variants={staggerContainer}
                >
                    <motion.h2
                        variants={fadeUp}
                        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-[1.15] mb-8"
                    >
                        Seamlessly integrates with Gmail, Outlook, LinkedIn, Slack, and Notion to unify your workflow.
                    </motion.h2>

                    <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a
                            href="#cta"
                            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#00ffab] text-[#0a0a0a] text-sm font-semibold hover:bg-[#00e69d] transition-all duration-200 btn-primary-shadow"
                        >
                            Start for free
                            <ArrowRight size={16} strokeWidth={2.5} />
                        </a>
                        <a
                            href="#security"
                            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-[#333] text-white text-sm font-medium hover:bg-white/5 transition-all duration-200"
                        >
                            Learn More
                            <ChevronRight size={16} />
                        </a>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    )
}

function ProblemSection() {
    return (
        <section id="features" className="py-24 md:py-32 px-5 md:px-8 bg-[#0a0a0a]">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    variants={staggerContainer}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <motion.div variants={fadeUp}>
                        <SectionLabel>Core Features</SectionLabel>
                    </motion.div>
                    <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-[1.15] mb-5">
                        Your inbox, <span className="text-[#00ffab]">fully automated.</span>
                    </motion.h2>
                </motion.div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={staggerContainer}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6"
                >
                    <FeatureCard
                        icon={<Database size={20} />}
                        title="Smart Categorization"
                        description="Instantly routes incoming emails into actionable, high-priority folders."
                        delay={0}
                    />
                    <FeatureCard
                        icon={<Code2 size={20} />}
                        title="Autonomous Drafting"
                        description="Pre-writes highly accurate replies based on your past email history."
                        delay={0.1}
                    />
                    <FeatureCard
                        icon={<Package size={20} />}
                        title="Custom Knowledge Base"
                        description="Upload documents to train the AI on how to answer specific business questions."
                        delay={0.2}
                    />
                    <FeatureCard
                        icon={<Zap size={20} />}
                        title="Autopilot Mode"
                        description="Runs 24/7 in the background so you wake up to a perfectly clean inbox."
                        delay={0.3}
                    />
                    <FeatureCard
                        icon={<AlertTriangle size={20} />}
                        title="Bulk Actions"
                        description="Archive or delete entire categories of useless emails with a single click."
                        delay={0.4}
                    />
                    <FeatureCard
                        icon={<Check size={20} />}
                        title="Local Processing"
                        description="Uses local models and secure APIs to keep your private data entirely on your machine."
                        delay={0.5}
                    />
                </motion.div>
            </div>
        </section>
    )
}

function OutcomesSection() {
    return (
        <section className="py-24 md:py-32 px-5 md:px-8 bg-black">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    variants={staggerContainer}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <motion.div variants={fadeUp}>
                        <SectionLabel>Outcomes</SectionLabel>
                    </motion.div>
                    <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-[1.15]">
                        Real outcomes from
                        <br />
                        <span className="gradient-text">secure AI operations</span>
                    </motion.h2>
                </motion.div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={staggerContainer}
                    className="grid grid-cols-1 md:grid-cols-3 gap-5"
                >
                    <FeatureCard
                        icon={<Clock size={20} />}
                        title="10 Hours Saved"
                        description="Per team, per department. Automated workflows."
                        stat="10"
                        statLabel="Hours"
                        delay={0}
                    />
                    <FeatureCard
                        icon={<Zap size={20} />}
                        title="24/7 Operations"
                        description="AI agents working around the clock."
                        stat="24/7"
                        delay={0.1}
                    />
                    <FeatureCard
                        icon={<Puzzle size={20} />}
                        title="50+ Integrations"
                        description="Connect across all your platforms."
                        stat="50+"
                        delay={0.2}
                    />
                </motion.div>
            </div>
        </section>
    )
}

function PricingSection() {
    return (
        <section id="pricing" className="py-24 md:py-32 px-5 md:px-8 bg-[#0a0a0a]">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    variants={staggerContainer}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <motion.div variants={fadeUp}>
                        <SectionLabel>Pricing</SectionLabel>
                    </motion.div>
                    <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-[1.15] mb-5">
                        One-time deployment.
                        <br />
                        <span className="text-[#eeeded]/60">No subscriptions.</span>
                    </motion.h2>
                    <motion.p variants={fadeUp} className="text-base md:text-lg text-[#eeeded]/60 leading-relaxed">
                        You pay once. You own the infrastructure. No recurring fees, no vendor lock-in.
                    </motion.p>
                </motion.div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={staggerContainer}
                    className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6"
                >
                    <PricingTier
                        name="Single Department"
                        price="$5,000"
                        description="AI automation for one department."
                        features={[
                            'Multiple OpenClaw instances',
                            'Docker containerization',
                            'Management dashboard',
                            '14-day support'
                        ]}
                        delay={0}
                    />
                    <PricingTier
                        name="Multi-Department"
                        price="$12,000"
                        description="AI operations across multiple teams."
                        features={[
                            'Everything in Tier 1',
                            'Cross-department orchestration',
                            'Role-based permissions',
                            '30-day support'
                        ]}
                        highlighted
                        delay={0.1}
                    />
                    <PricingTier
                        name="On-Site"
                        price="$25,000"
                        description="Zero cloud dependency. Air-gapped."
                        features={[
                            'Everything in Tier 2',
                            'Physical hardware install',
                            'In-person training',
                            '60-day support'
                        ]}
                        delay={0.2}
                    />
                </motion.div>
            </div>
        </section>
    )
}

function TeamSection() {
    return (
        <section id="team" className="py-24 md:py-32 px-5 md:px-8 bg-black">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    variants={staggerContainer}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <motion.div variants={fadeUp}>
                        <SectionLabel>Team</SectionLabel>
                    </motion.div>
                    <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-[1.15]">
                        Built by engineers who&apos;ve
                        <br />
                        <span className="gradient-text">deployed AI at scale</span>
                    </motion.h2>
                </motion.div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={staggerContainer}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                >
                    <TeamMember
                        name="Brody Glanville"
                        role="CEO"
                        image="/uploads/team-brody.png"
                        delay={0}
                    />
                    <TeamMember
                        name="Bennett Spooner"
                        role="COO"
                        image="/uploads/team-bennett.png"
                        delay={0.1}
                    />
                    <TeamMember
                        name="Jesse Rutka"
                        role="CTO"
                        image="/uploads/team-jesse.png"
                        delay={0.2}
                    />
                </motion.div>
            </div>
        </section>
    )
}

function CTASection() {
    const [email, setEmail] = useState('')

    return (
        <section id="cta" className="py-24 md:py-32 px-5 md:px-8 bg-black">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    variants={scaleIn}
                    className="relative"
                >
                    <BorderGlow
                        className="w-full h-full"
                        edgeSensitivity={30}
                        glowColor="40 80 80"
                        backgroundColor="#120F17"
                        borderRadius={40}
                        glowRadius={40}
                        glowIntensity={1.0}
                        coneSpread={25}
                        animated={false}
                        colors={['#c084fc', '#f472b6', '#38bdf8']}
                    >
                        <div className="overflow-hidden card-surface p-10 md:p-16 text-center w-full h-full rounded-[40px] relative z-10">
                            <div className="absolute inset-0 bg-gradient-to-b from-[#00ffab]/5 to-transparent pointer-events-none" />
                            <div className="relative z-10">
                                <SectionLabel>Get Started</SectionLabel>
                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-[1.15] mb-5">
                                    Ready to take back control of your inbox?
                                </h2>
                                <p className="text-base md:text-lg text-[#eeeded]/60 leading-relaxed mb-10 max-w-xl mx-auto">
                                    Join thousands of executives saving 10+ hours a week.
                                </p>

                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault()
                                        alert(`Thanks! We'll reach out at ${email}`)
                                    }}
                                    className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto"
                                >
                                    <label htmlFor="cta-email" className="sr-only">
                                        Email address
                                    </label>
                                    <input
                                        id="cta-email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="w-full sm:flex-1 px-5 py-3.5 rounded-full bg-[#0a0a0a] border border-[#333] text-white text-sm placeholder:text-[#eeeded]/40 focus:border-[#00ffab]/50 focus:outline-none transition-colors"
                                    />
                                    <button
                                        type="submit"
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#00ffab] text-[#0a0a0a] text-sm font-semibold hover:bg-[#00e69d] transition-all duration-200 btn-primary-shadow"
                                    >
                                        Start for free
                                        <ArrowRight size={16} strokeWidth={2.5} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </BorderGlow>
                </motion.div>
            </div>
        </section>
    )
}

function Footer() {
    const footerLinks = {
        Product: ['Security', 'Process', 'Pricing'],
        Company: ['Team', 'Contact', 'Book a Call'],
        Legal: ['Terms of Service', 'Privacy Policy']
    }

    return (
        <footer className="bg-[#00ffab] text-[#0a0a0a]">
            <div className="max-w-7xl mx-auto px-5 md:px-8 py-14 md:py-20">
                <div className="flex flex-col lg:flex-row justify-between gap-12">
                    <div>
                        <a
                            href="#"
                            className="text-xl font-bold tracking-[0.12em] uppercase text-[#0a0a0a]"
                        >
                            TriageAI
                        </a>
                        <p className="mt-4 text-sm text-[#0a0a0a]/70 max-w-xs leading-relaxed">
                            Secure, self-hosted AI infrastructure for teams that refuse to compromise on control.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-10">
                        {Object.entries(footerLinks).map(([group, links]) => (
                            <div key={group}>
                                <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0a0a0a]/50 mb-4">
                                    {group}
                                </h4>
                                <ul className="space-y-3">
                                    {links.map((link) => (
                                        <li key={link}>
                                            <a
                                                href="#"
                                                className="text-sm font-medium text-[#0a0a0a]/80 hover:text-[#0a0a0a] transition-colors"
                                            >
                                                {link}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-14 pt-8 border-t border-[#0a0a0a]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-[#0a0a0a]/60">
                        © 2024 TriageAI. All rights reserved.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[#0a0a0a]/60">
                        <span>Made with</span>
                        <span className="font-semibold">Webild</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}

/* ------------------------------------------------------------------
   Main App
   ------------------------------------------------------------------ */
function App() {
    return (
        <div className="min-h-screen bg-black">
            <Navbar />
            <main>
                <Hero />
                <IntroStatement />
                <ProblemSection />
                <OutcomesSection />
                <PricingSection />
                <TeamSection />
                <FAQ />
                <CTASection />
            </main>
            <Footer />
        </div>
    )
}

export default App


