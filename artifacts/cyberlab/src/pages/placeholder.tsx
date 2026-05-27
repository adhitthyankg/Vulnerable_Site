export default function SimplePage({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-primary">{title}</h2>
        <p className="text-muted-foreground">Module under construction.</p>
      </div>
      <div className="h-[400px] border border-border bg-card/50 backdrop-blur rounded-lg flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-pulse w-16 h-16 bg-primary/20 mx-auto rounded-sm border border-primary/50 flex items-center justify-center text-primary font-bold">_</div>
          <p className="text-muted-foreground font-mono text-sm">AWAITING_IMPLEMENTATION</p>
        </div>
      </div>
    </div>
  );
}
