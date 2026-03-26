import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-neutral-200">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-bold text-sm">
              SM
            </div>
            <span className="font-semibold text-lg">Social Market</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-neutral-900 sm:text-6xl">
            Your Social Media
            <br />
            <span className="text-neutral-500">Command Center</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600">
            Manage all your social media accounts from one powerful dashboard.
            Schedule posts, track analytics, and grow your audience across
            X, TikTok, Instagram, Facebook, and Snapchat.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg">Start Free Trial</Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg">Learn More</Button>
            </Link>
          </div>
        </section>

        <section id="features" className="border-t border-neutral-200 bg-neutral-50 py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Everything you need</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: "Unified Publishing", description: "Create once, publish everywhere. Customize content per platform with smart character limits and media validation." },
                { title: "Smart Scheduling", description: "Visual content calendar with drag-and-drop scheduling. Queue posts for optimal engagement times." },
                { title: "Analytics Dashboard", description: "Track performance across all platforms with unified metrics, trend charts, and exportable reports." },
                { title: "Team Collaboration", description: "Role-based access control with approval workflows. Manage your team with ease." },
                { title: "Media Management", description: "Upload, organize, and optimize images and videos. Automatic format conversion for each platform." },
                { title: "Platform Adapters", description: "Native integration with X, TikTok, Instagram, Facebook, and Snapchat APIs." },
              ].map((feature) => (
                <div key={feature.title} className="rounded-xl border border-neutral-200 bg-white p-6">
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-neutral-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-neutral-500">
          &copy; {new Date().getFullYear()} Social Market. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
