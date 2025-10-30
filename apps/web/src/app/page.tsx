import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-6 text-center">
      <div className="max-w-2xl space-y-4">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          AI Workflows Playground
        </p>
        <h1 className="text-4xl font-semibold sm:text-5xl">Build interactive AI-powered flows</h1>
        <p className="text-muted-foreground text-lg">
          Explore the workflow example to see how AI Elements and React Flow work together to visualize multi-step AI processes with rich nodes, animated edges, and custom controls.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/workflow"
          className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow transition hover:bg-primary/90"
        >
          View Workflow Example
        </Link>
        <a
          href="https://v6.ai-sdk.dev/elements"
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:bg-secondary"
        >
          Read AI Elements Docs
        </a>
      </div>
    </main>
  );
}
