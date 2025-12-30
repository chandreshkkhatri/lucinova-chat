import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Hash, Highlighter, FileUp, Bookmark, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react"
import Link from "next/link"

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
            <Badge variant="secondary" className="ml-2 font-medium bg-accent/20 text-accent-foreground border-none">
              Beta
            </Badge>
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
            <Link
              href="/beta"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Log in
            </Link>
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
              Announcing Lucidity 2.5 — Think in threads, learn in layers.
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance mb-6">
              Learn deeper, faster with your <span className="text-primary/60 italic">AI study partner</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10 text-pretty">
              Ask questions, annotate passages, start focused threads, and keep organized study memories — all in a
              single, private workspace.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="rounded-full px-8 h-14 text-lg shadow-xl shadow-primary/10 transition-all hover:scale-105"
                asChild
              >
                <Link href="/beta">
                  Start learning — it’s free <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 h-14 text-lg border-primary/20 hover:bg-primary/5 bg-transparent"
                asChild
              >
                <Link href="#demo">Try sample demo</Link>
              </Button>
            </div>

            {/* Visual Mockup - Inspired by "Moment" and "AI SDK" layouts */}
            <div className="mt-20 relative max-w-5xl mx-auto">
              <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden aspect-video flex">
                {/* Sidebar Mock */}
                <div className="w-64 border-r border-border bg-muted/30 p-4 hidden md:block text-left">
                  <div className="h-4 w-24 bg-border/40 rounded mb-6" />
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-border/30" />
                        <div className="h-3 flex-grow bg-border/20 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Main Content Mock */}
                <div className="flex-grow p-8 flex flex-col">
                  <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-semibold">Welcome to Lucidity</h3>
                    <p className="text-muted-foreground text-sm max-w-xs">
                      Ask anything — e.g., 'Explain Bayesian updating in simple terms'
                    </p>
                    <div className="w-full max-w-md space-y-2 mt-4">
                      <div className="h-12 w-full rounded-xl border border-border bg-background flex items-center px-4 text-muted-foreground text-sm">
                        Type a message...
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
              Hosted at{" "}
              <Link href="/beta" className="underline underline-offset-4">
                beta.lucidity.chat
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
