import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle, Layers, Highlighter, Upload, History, Menu, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export const metadata: Metadata = {
  title: "Lucidity - Learn deeper, faster with your AI study partner",
  description: "Lucidity is a learner’s paradise: an AI study partner that helps you ask better questions, create focused threads, and keep organized study notes. Try free at beta.lucidity.chat.",
  keywords: ["AI study partner", "threaded learning", "annotate text", "study assistant", "learning workspace"],
  openGraph: {
    title: "Lucidity - Learn deeper, faster with your AI study partner",
    description: "Lucidity is a learner’s paradise: an AI study partner that helps you ask better questions, create focused threads, and keep organized study notes.",
  }
};

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center" href="#">
          <span className="font-bold text-xl flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Layers className="w-5 h-5" />
            </div>
            Lucidity
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-4 sm:gap-6">
          <div className="hidden sm:flex gap-6 items-center">
            <Link className="text-sm font-medium hover:underline underline-offset-4" href="#features">
              Features
            </Link>
            <Link className="text-sm font-medium hover:underline underline-offset-4" href="#how-it-works">
              How it Works
            </Link>
            <Link className="text-sm font-medium hover:underline underline-offset-4" href="#pricing">
              Pricing
            </Link>
          </div>

          <div className="hidden sm:flex items-center gap-4">
            <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/chat">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Start Learning
                </Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="sm:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-6 py-6">
                <Link className="text-sm font-medium hover:underline underline-offset-4" href="#features">
                  Features
                </Link>
                <Link className="text-sm font-medium hover:underline underline-offset-4" href="#how-it-works">
                  How it Works
                </Link>
                <Link className="text-sm font-medium hover:underline underline-offset-4" href="#pricing">
                  Pricing
                </Link>
                <div className="flex flex-col gap-4 mt-4">
                  <Link href="/login">
                      <Button variant="outline" className="w-full">Log in</Button>
                  </Link>
                  <Link href="/chat">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      Start Learning
                      </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-white">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                    <div className="inline-block rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-800 mb-4">
                        Beta — feedback welcome
                    </div>
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Learn deeper, faster with your AI study partner
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    Ask questions, annotate passages, start focused threads, and keep organized study memories — all in a single, private workspace.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/chat">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8">
                        Start learning — it’s free
                    </Button>
                  </Link>
                  <Link href="#demo">
                    <Button variant="outline" size="lg" className="h-12 px-8">
                        Try sample demo
                    </Button>
                  </Link>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Free while in beta. No credit card required.
                </p>
              </div>
              <div id="demo" className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last">
                  <div className="bg-slate-100 w-full h-full rounded-xl border shadow-xl flex items-center justify-center relative overflow-hidden">
                      {/* Abstract representation of the app */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50" />
                      <div className="relative z-10 w-3/4 h-3/4 bg-white rounded-lg shadow-2xl p-4 flex flex-col gap-4">
                          <div className="w-full h-8 border-b flex items-center gap-2 px-2">
                              <div className="w-3 h-3 rounded-full bg-red-400" />
                              <div className="w-3 h-3 rounded-full bg-yellow-400" />
                              <div className="w-3 h-3 rounded-full bg-green-400" />
                          </div>
                          <div className="flex-1 flex gap-4">
                              <div className="w-1/4 bg-slate-50 rounded hidden sm:block" />
                              <div className="flex-1 bg-slate-50 rounded p-4 space-y-3">
                                  <div className="flex gap-2 items-start">
                                      <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0" />
                                      <div className="bg-blue-50 p-3 rounded-lg text-sm text-slate-700">
                                          Explain Bayesian updating in simple terms.
                                      </div>
                                  </div>
                                  <div className="flex gap-2 items-start">
                                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0" />
                                      <div className="bg-white border p-3 rounded-lg text-sm text-slate-700 shadow-sm">
                                          Imagine you have a belief about something...
                                          <div className="mt-2 text-blue-600 text-xs font-medium cursor-pointer hover:underline">
                                              Highlight to start thread
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-slate-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-white px-3 py-1 text-sm shadow-sm">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  A complete workspace for curious minds
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Lucidity gives you the tools to break down complex topics and build a personal knowledge base.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Conversational AI</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Natural, multi-turn chat that understands context across messages.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Threaded Study Notes</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Turn any selection into a focused thread for deep dives and follow-ups.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                  <Highlighter className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Highlight & Annotate</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Select text to create annotations or ask targeted questions instantly.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow lg:col-span-1 lg:col-start-1">
                <div className="p-3 bg-amber-100 rounded-full text-amber-600">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Multimodal Input</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Paste text, upload attachments, or type — get structured, clear responses.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow lg:col-span-1 lg:col-start-2">
                <div className="p-3 bg-teal-100 rounded-full text-teal-600">
                  <History className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Organized Memory</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Keep replies, threads, and past conversations easily discoverable.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">How It Works</h2>
              <p className="text-gray-500 md:text-xl">Three simple steps to smarter learning.</p>
            </div>
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-xl">1</div>
                <h3 className="text-xl font-bold">Start a Conversation</h3>
                <p className="text-gray-500">
                  Type a question or paste course notes and get an immediate, clear answer.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-xl">2</div>
                <h3 className="text-xl font-bold">Turn Highlights into Threads</h3>
                <p className="text-gray-500">
                  Select any passage to create a thread for deeper exploration or revision.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-xl">3</div>
                <h3 className="text-xl font-bold">Revisit & Build</h3>
                <p className="text-gray-500">
                  Save helpful threads, export notes, and track your learning progress.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing / CTA */}
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-blue-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Start learning today
              </h2>
              <p className="max-w-[600px] text-gray-500 md:text-xl">
                Lucidity is currently in public beta. All features are free to use.
              </p>
              <div className="flex flex-col gap-2 min-[400px]:flex-row pt-4">
                <Link href="/chat">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 w-full sm:w-auto">
                    Get started for free
                    </Button>
                </Link>
              </div>
              <p className="text-xs text-gray-500">
                Optional Pro features coming soon.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white">
        <p className="text-xs text-gray-500">
          &copy; 2024 Lucidity. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4 text-gray-500" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4 text-gray-500" href="#">
            Privacy
          </Link>
          <Link className="text-xs hover:underline underline-offset-4 text-gray-500" href="#">
            Contact
          </Link>
          <Link className="text-xs hover:underline underline-offset-4 text-gray-500" href="/chat">
            Go to App
          </Link>
        </nav>
      </footer>
    </div>
  );
}
