import { MessageSquare, Hash, Highlighter, FileUp, Bookmark, ArrowRight, Sparkles, CheckCircle2, Paperclip, Send, MessageSquareText, ChevronRight } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

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
                Become one of first 300 to join to earn the &apos;Early Bird&apos; badge
              </p>
            </div>

            {/* Visual Mockup - Shows actual app features */}
            <div className="mt-20 relative max-w-5xl mx-auto">
              <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden aspect-video flex">
                {/* Left Sidebar - Chat History */}
                <div className="w-48 border-r border-border bg-muted/30 p-3 hidden md:block text-left">
                  <div className="text-xs font-semibold text-muted-foreground mb-3">Chat History</div>
                  <div className="space-y-2">
                    {/* Active chat item */}
                    <div className="p-2 rounded-lg bg-muted/50 border border-border/50">
                      <div className="h-2.5 w-24 bg-foreground/20 rounded mb-1.5" />
                      <div className="h-2 w-16 bg-muted-foreground/20 rounded" />
                    </div>
                    {/* Other chat items */}
                    <div className="p-2 rounded-lg hover:bg-muted/30">
                      <div className="h-2.5 w-20 bg-border/60 rounded mb-1.5" />
                      <div className="h-2 w-14 bg-border/40 rounded" />
                    </div>
                    <div className="p-2 rounded-lg hover:bg-muted/30">
                      <div className="h-2.5 w-28 bg-border/60 rounded mb-1.5" />
                      <div className="h-2 w-12 bg-border/40 rounded" />
                    </div>
                  </div>
                </div>

                {/* Main Chat Area */}
                <div className="grow flex flex-col min-w-0">
                  {/* Header */}
                  <div className="p-3 border-b border-border flex items-center gap-2">
                    <div className="h-2.5 w-32 bg-foreground/15 rounded" />
                    <div className="h-2 w-16 bg-muted-foreground/15 rounded" />
                  </div>
                  {/* Chat Messages */}
                  <div className="grow p-4 space-y-3 overflow-hidden text-left">
                    {/* User Message */}
                    <div className="flex gap-2 justify-end">
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 py-2 text-xs max-w-[200px]">
                        Explain Bayesian updating simply
                      </div>
                    </div>

                    {/* AI Message with "Ask Lucinova" feature */}
                    <div className="flex gap-2 relative">
                      <div className="size-6 shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
                        <Sparkles className="size-3 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-3 py-2 text-xs max-w-[280px] relative">
                          <p className="mb-1.5">Bayesian updating is a method of revising beliefs based on new evidence.</p>
                          <p>
                            The key idea is that you start with a{" "}
                            <span className="bg-purple-200/80 dark:bg-purple-500/50 px-0.5 relative">
                              prior probability
                              {/* Wire and Ask Lucinova button - originating from above the text */}
                              <span className="absolute left-full -top-5 ml-1 hidden lg:flex items-center">
                                <svg width="60" height="28" className="shrink-0">
                                  <circle cx="7" cy="22" r="2" className="fill-purple-400" />
                                  <path d="M 7 22 Q 30 6 58 14" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-purple-400" />
                                </svg>
                                <button className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-medium shadow-sm whitespace-nowrap">
                                  <MessageSquareText className="size-2.5" />
                                  <span>Ask Lucinova</span>
                                </button>
                              </span>
                            </span>
                            {" "}and update it.
                          </p>
                        </div>
                        {/* Reply and Replies buttons */}
                        <div className="flex items-center gap-1 mt-1">
                          <button className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground rounded">
                            <MessageSquare className="size-2.5" />
                            Reply
                          </button>
                          <button className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground rounded">
                            <ChevronRight className="size-2.5" />
                            2 messages
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Input Area */}
                  <div className="p-3 border-t border-border">
                    <div className="bg-card border border-border rounded-xl shadow-sm p-2">
                      <div className="flex items-center gap-2">
                        <button className="size-6 shrink-0 flex items-center justify-center text-muted-foreground rounded">
                          <Paperclip className="size-3" />
                        </button>
                        <div className="flex-1 text-xs text-muted-foreground">
                          Type a message...
                        </div>
                        <button className="size-6 shrink-0 flex items-center justify-center bg-primary text-primary-foreground rounded">
                          <Send className="size-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side Thread Panel */}
                <div className="w-56 border-l border-border bg-muted/20 hidden lg:flex flex-col text-left">
                  {/* Thread Header */}
                  <div className="p-3 border-b border-border flex items-center gap-1.5">
                    <MessageSquareText className="size-3.5 text-purple-600" />
                    <span className="text-xs font-semibold">Ask Lucinova</span>
                  </div>
                  {/* Selected Text */}
                  <div className="p-3 border-b border-border">
                    <div className="text-[10px] text-muted-foreground mb-1.5">About selected text</div>
                    <div className="bg-purple-200/60 dark:bg-purple-500/30 rounded px-2 py-1.5 text-[10px]">
                      &quot;prior probability&quot;
                    </div>
                  </div>
                  {/* Thread Messages */}
                  <div className="grow p-3 space-y-2 overflow-hidden">
                    <div className="text-[10px] text-muted-foreground">Thread Messages</div>
                    {/* User message in thread */}
                    <div className="flex justify-end">
                      <div className="bg-primary text-primary-foreground rounded-lg px-2 py-1 text-[10px] max-w-[140px]">
                        What does this mean?
                      </div>
                    </div>
                    {/* AI message in thread */}
                    <div className="bg-muted/50 rounded-lg px-2 py-1.5 text-[10px]">
                      Prior probability represents your initial belief before seeing evidence...
                    </div>
                  </div>
                  {/* Thread Input */}
                  <div className="p-2 border-t border-border">
                    <div className="px-2 py-1.5 bg-background border border-border/50 rounded text-[10px] text-muted-foreground">
                      Ask a follow-up...
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

        {/* Pricing / Beta */}
        <section
          id="pricing"
          className="py-24 bg-primary text-primary-foreground rounded-[3rem] mx-4 mb-24 overflow-hidden relative"
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
            <div className="bg-background/10 backdrop-blur-sm border border-white/10 rounded-3xl p-8 max-w-sm mx-auto mb-10">
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
              <Link href="/contact" className="hover:text-primary">
                Contact
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              You're using the{" "}
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
