import { Github, Linkedin, Globe } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function TeamSection() {
    return (
        <section id="team" className="py-24 bg-background relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <Badge variant="outline" className="mb-4 py-1 px-4 rounded-full border-primary/20 text-primary/80">
                        Meet the Team
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Built by a passionate founder</h2>
                    <p className="text-muted-foreground max-w-xl mx-auto text-lg">
                        Dedicated to creating tools that empower learning and productivity.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto">
                    <Card className="overflow-hidden border-muted bg-card/50 backdrop-blur-sm shadow-xl">
                        <CardContent className="p-0">
                            <div className="flex flex-col md:flex-row">
                                <div className="md:w-2/5 relative h-80 md:h-auto min-h-[320px]">
                                    <Image
                                        src="/images/Chandresh_Kumar.jpg"
                                        alt="Chandresh Kumar"
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                </div>
                                <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-center">
                                    <div className="mb-6">
                                        <h3 className="text-3xl font-bold mb-2">Chandresh Kumar</h3>
                                        <p className="text-primary font-medium text-lg mb-4">Founder</p>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Software Developer driven by building products that solve real problems. Passionate about AI, trading systems, and web applications.
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-4 mt-auto">
                                        <Button variant="outline" size="sm" asChild className="gap-2">
                                            <Link href="https://www.linkedin.com/in/chandreshkkhatri" target="_blank" rel="noopener noreferrer">
                                                <Linkedin className="w-4 h-4" />
                                                LinkedIn
                                            </Link>
                                        </Button>
                                        <Button variant="outline" size="sm" asChild className="gap-2">
                                            <Link href="https://chandreshkkhatri.github.io/" target="_blank" rel="noopener noreferrer">
                                                <Globe className="w-4 h-4" />
                                                Website
                                            </Link>
                                        </Button>
                                        <Button variant="ghost" size="sm" asChild className="gap-2">
                                            <Link href="https://github.com/chandreshkkhatri" target="_blank" rel="noopener noreferrer">
                                                <Github className="w-4 h-4" />
                                                Github
                                            </Link>
                                        </Button>
                                    </div>

                                    <p className="text-sm text-muted-foreground mt-8 pt-6 border-t border-border">
                                        "Lucidity is listed in my professional experience on LinkedIn for validation."
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Background decorations */}
            <div className="absolute top-1/4 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />
        </section>
    )
}
