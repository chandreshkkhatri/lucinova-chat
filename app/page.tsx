import { MessageSquare, Hash, Highlighter, FileUp, Bookmark, ArrowRight, Sparkles, CheckCircle2, Paperclip, Send, MessageSquareText, ChevronRight } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TeamSection } from "@/components/team-section"

import type React from "react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">Lucidity</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="#features" className="hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="hover:text-primary transition-colors">
              How it works
            </Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">
              Pricing
            </Link>
            <a
              href="https://discord.gg/ySGBwu9xvk"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              Community
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <Button asChild className="rounded-full px-6">
              <Link href="/beta">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-20 pb-24 md:pt-32 md:pb-40 overflow-hidden">
          <div className="container mx-auto px-4 relative z-10 text-center">
            <Badge
              variant="outline"
              className="mb-6 py-1 px-4 rounded-full border-primary/20 text-primary/80 bg-primary/5"
            >
              Announcing Lucidity 0.1 — Think in threads, learn in layers.
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance mb-6">
              Learn deeper, faster with your <span className="text-primary/60 italic">AI study partner</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10 text-pretty">
              Ask questions, annotate passages, start focused threads, and keep organized study memories — all in a
              single, private workspace.
            </p>
            <div className="flex flex-col items-center justify-center gap-4">
              <Button
                size="lg"
                className="rounded-full px-8 h-14 text-lg shadow-xl shadow-primary/10 transition-all hover:scale-105"
                asChild
              >
                <Link href="/beta">
                  Start learning — it&apos;s free <ArrowRight className="ml-2 size-5" />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Become one of the first 500 to join to earn the &apos;Early Bird&apos; badge
              </p>
            </div>

            {/* Visual Mockup - Shows actual app features */}
            <div className="mt-20 relative max-w-5xl mx-auto">
              <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto relative z-10">
                {/* Mockup 1: Chat Focus */}
                <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden h-[500px] lg:h-auto lg:aspect-[4/3] flex flex-col group hover:border-primary/50 transition-colors">
                  <div className="bg-muted/50 border-b border-border p-3 text-center text-xs font-semibold text-muted-foreground flex justify-between items-center px-4">
                    <span>Contextual AI</span>
                    <div className="flex gap-1.5">
                      <div className="size-2 rounded-full bg-red-400/20 group-hover:bg-red-500/80 transition-colors" />
                      <div className="size-2 rounded-full bg-yellow-400/20 group-hover:bg-yellow-500/80 transition-colors" />
                      <div className="size-2 rounded-full bg-green-400/20 group-hover:bg-green-500/80 transition-colors" />
                    </div>
                  </div>
                  <div className="flex grow min-h-0">
                    {/* Main Chat Area */}
                    <div className="grow flex flex-col min-w-0 bg-background/50">
                      {/* Chat Messages */}
                      <div className="grow p-4 space-y-4 overflow-hidden text-left relative">
                        <div className="flex gap-2 justify-end">
                          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 py-2 text-xs max-w-[200px]">
                            Explain Bayesian updating
                          </div>
                        </div>

                        <div className="flex gap-2 relative">
                          <div className="size-6 shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
                            <Sparkles className="size-3 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-3 py-2 text-xs max-w-[240px] relative">
                              <p className="mb-1.5">Revising beliefs based on new evidence.</p>
                              <p>
                                Start with a{" "}
                                <span className="bg-purple-200/80 dark:bg-purple-500/50 px-0.5 relative inline-block">
                                  prior probability
                                  {/* Floating Ask Lucinova Button */}
                                  <span className="absolute -top-8 left-0 z-10 flex lg:left-full lg:-top-5 lg:ml-1 items-center">
                                    <svg width="60" height="28" className="shrink-0 hidden lg:block">
                                      <circle cx="7" cy="22" r="2" className="fill-purple-400" />
                                      <path d="M 7 22 Q 30 6 58 14" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-purple-400" />
                                    </svg>
                                    <button className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-medium shadow-sm whitespace-nowrap">
                                      <MessageSquareText className="size-2.5" />
                                      <span>Ask Lucinova</span>
                                    </button>
                                  </span>
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Input Area */}
                      <div className="p-3 border-t border-border mt-auto">
                        <div className="bg-card border border-border rounded-xl shadow-sm p-2 flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full bg-muted" />
                          <div className="h-1.5 flex-1 bg-muted rounded-full" />
                          <div className="h-4 w-4 rounded bg-primary" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mockup 2: Thread Focus */}
                <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden h-[500px] lg:h-auto lg:aspect-[4/3] flex flex-col group hover:border-primary/50 transition-colors">
                  <div className="bg-muted/50 border-b border-border p-3 text-center text-xs font-semibold text-muted-foreground flex justify-between items-center px-4">
                    <span>Threaded Knowledge</span>
                    <div className="flex gap-1.5">
                      <div className="size-2 rounded-full bg-red-400/20 group-hover:bg-red-500/80 transition-colors" />
                      <div className="size-2 rounded-full bg-yellow-400/20 group-hover:bg-yellow-500/80 transition-colors" />
                      <div className="size-2 rounded-full bg-green-400/20 group-hover:bg-green-500/80 transition-colors" />
                    </div>
                  </div>
                  <div className="flex grow min-h-0">
                    {/* Sidebar hidden for focus */}

                    {/* Main Chat Area - Hidden on Mobile, Visible on Desktop */}
                    <div className="w-[60%] border-r border-border bg-background/50 hidden md:flex flex-col">
                      <div className="grow p-4 space-y-4 overflow-hidden text-left relative">
                        <div className="flex gap-2 justify-end">
                          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 py-2 text-xs max-w-[200px]">
                            Explain Bayesian updating
                          </div>
                        </div>

                        <div className="flex gap-2 relative">
                          <div className="size-6 shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
                            <Sparkles className="size-3 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-3 py-2 text-xs max-w-[280px] relative">
                              <p className="mb-1.5">Revising beliefs based on new evidence.</p>
                              <p>
                                Start with a{" "}
                                <span className="bg-purple-200/80 dark:bg-purple-500/50 px-0.5 relative inline-block">
                                  prior probability
                                </span>
                                {" "}and update it.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Thread Panel - Full width on mobile */}
                    <div className="grow w-full md:w-[40%] border-l border-border bg-muted/20 flex flex-col text-left">
                      {/* Thread Header */}
                      <div className="p-3 border-b border-border flex items-center gap-1.5 bg-background">
                        <MessageSquareText className="size-3.5 text-purple-600" />
                        <span className="text-xs font-semibold">Ask Lucinova</span>
                        <div className="ml-auto text-[9px] bg-purple-100 dark:bg-purple-900/30 text-purple-600 px-1.5 py-0.5 rounded">Active</div>
                      </div>
                      {/* Selected Text */}
                      <div className="p-3 border-b border-border bg-background/50">
                        <div className="text-[10px] text-muted-foreground mb-1.5">About selected text</div>
                        <div className="bg-purple-200/60 dark:bg-purple-500/30 rounded px-2 py-1.5 text-[10px] font-medium border-l-2 border-purple-500">
                          &quot;prior probability&quot;
                        </div>
                      </div>
                      {/* Thread Messages */}
                      <div className="grow p-3 space-y-3 overflow-hidden bg-background/30">
                        <div className="flex justify-end">
                          <div className="bg-primary text-primary-foreground rounded-lg px-2.5 py-1.5 text-[10px] max-w-[85%]">
                            What does this mean effectively?
                          </div>
                        </div>
                        <div className="bg-card border border-border rounded-lg px-2.5 py-2 text-[10px] shadow-sm">
                          <p className="mb-1">It&apos;s your starting assumption.</p>
                          <p className="text-muted-foreground">e.g., &quot;I&apos;m 50/50 sure.&quot;</p>
                        </div>
                        <div className="flex justify-end">
                          <div className="bg-primary text-primary-foreground rounded-lg px-2.5 py-1.5 text-[10px] max-w-[85%]">
                            And afterward?
                          </div>
                        </div>
                        <div className="bg-card border border-border rounded-lg px-2.5 py-2 text-[10px] shadow-sm">
                          Posterior probability.
                        </div>
                      </div>
                      {/* Thread Input */}
                      <div className="p-2 border-t border-border bg-background">
                        <div className="px-2 py-2 bg-muted/30 border border-border/50 rounded flex items-center gap-2">
                          <div className="text-[10px] text-muted-foreground">Ask a follow-up...</div>
                          <ArrowRight className="size-3 text-muted-foreground ml-auto" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating accents */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-accent/10 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-10" />
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">A learner’s paradise</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Built for deep focus and effortless organization.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={<MessageSquare className="w-6 h-6" />}
                title="Conversational AI"
                description="Natural, multi-turn chat that understands context across messages."
              />
              <FeatureCard
                icon={<Hash className="w-6 h-6" />}
                title="Threaded Study Notes"
                description="Turn any selection into a focused thread for deep dives and follow-ups."
              />
              <FeatureCard
                icon={<Highlighter className="w-6 h-6" />}
                title="Highlight & Annotate"
                description="Select text to create annotations or ask targeted questions instantly."
              />
              <FeatureCard
                icon={<FileUp className="w-6 h-6" />}
                title="Multimodal Input"
                description="Paste text, upload attachments — get structured, clear responses and summaries."
              />
              <FeatureCard
                icon={<Bookmark className="w-6 h-6" />}
                title="Organized Memory"
                description="Keep replies, threads, and past conversations easily discoverable."
              />
              <FeatureCard
                icon={<CheckCircle2 className="w-6 h-6" />}
                title="Privacy First"
                description="Your study workspace is private and secure, built for your personal growth."
              />
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How Lucidity works</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <Step
                number="1"
                title="Start a Conversation"
                description="Type a question or paste course notes and get an immediate, clear answer."
              />
              <Step
                number="2"
                title="Turn Highlights into Threads"
                description="Select any passage to create a thread for deeper exploration or revision."
              />
              <Step
                number="3"
                title="Revisit & Build"
                description="Save helpful threads, export notes, and track your learning progress."
              />
            </div>
          </div>
        </section>

        {/* Team Section */}
        <TeamSection />

        {/* Pricing / Beta */}
        <section
          id="pricing"
          className="py-24 bg-primary text-primary-foreground rounded-[3rem] mx-4 mb-24 overflow-hidden relative scroll-mt-20"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles className="w-64 h-64" />
          </div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 italic">Learning should be accessible.</h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto mb-10 text-lg">
              Lucidity is currently in open beta. Join thousands of students and self-learners building their study
              memory today.
            </p>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-10">
              {/* Free Beta Card */}
              <div className="bg-background/10 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
                <h3 className="text-2xl font-bold mb-2">Free Beta</h3>
                <p className="text-primary-foreground/60 mb-6">Full access to core features</p>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" /> Unlimited threads
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" /> Multimodal file support
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" /> Highlights & Annotations
                  </li>
                </ul>
                <Button
                  size="lg"
                  className="w-full rounded-full bg-background text-primary hover:bg-background/90"
                  asChild
                >
                  <Link href="/beta">Join the Beta</Link>
                </Button>
              </div>

              {/* Pro Card - Coming Soon */}
              <div className="bg-background/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-semibold">
                    Coming Soon
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <p className="text-primary-foreground/60 mb-6">For power users and professionals</p>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" /> Everything in Basic
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" /> 5,000 units/month (5x more)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" /> Access to premium models
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" /> Priority support
                  </li>
                </ul>
                <Button
                  size="lg"
                  disabled
                  className="w-full rounded-full bg-background/50 text-primary-foreground/60 opacity-60 cursor-not-allowed"
                >
                  Coming Soon
                </Button>
                <p className="text-xs text-center text-primary-foreground/40 mt-4">
                  Register to be notified when we launch
                </p>
              </div>
            </div>
            <p className="text-sm text-primary-foreground/40">
              Feedback welcome — help us build the future of learning.
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-background py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold">Lucidity</span>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground font-medium">
              <Link href="/privacy" className="hover:text-primary">
                Privacy
              </Link>
              <Link href="/legal/terms-and-conditions" className="hover:text-primary">
                Terms
              </Link>
              <Link href="/contact-us" className="hover:text-primary">
                Contact
              </Link>
              <a
                href="https://discord.gg/ySGBwu9xvk"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary flex items-center gap-1.5"
              >
                <svg
                  className="size-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Discord
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              You&apos;re using the{" "}
              <Link href="/beta" className="underline underline-offset-4">
                Lucidity beta
              </Link>
            </p>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Lucidity. Built for the curious.
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="border-none bg-card shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardContent className="pt-8 pb-6">
        <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-6">
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  )
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="relative">
      <div className="text-8xl font-black text-muted/20 absolute -top-8 -left-4 select-none">{number}</div>
      <div className="relative z-10">
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
