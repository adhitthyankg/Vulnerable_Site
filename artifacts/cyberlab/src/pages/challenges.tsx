import { useState } from "react";
import { useListChallenges, useGetChallenge, useSubmitFlag, useGetMyProgress } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Trophy,
  Flag,
  Lock,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  Target,
  Star,
  Zap,
  Shield,
  Bug,
  Eye,
  Key,
} from "lucide-react";

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "border-primary/50 bg-primary/10 text-primary",
  medium: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400",
  hard: "border-orange-500/50 bg-orange-500/10 text-orange-400",
  expert: "border-red-500/50 bg-red-500/10 text-red-400",
};

const RANK_COLORS: Record<string, string> = {
  RECRUIT: "text-muted-foreground",
  NOVICE: "text-blue-400",
  INTERMEDIATE: "text-primary",
  ADVANCED: "text-yellow-400",
  EXPERT: "text-orange-400",
  ELITE: "text-red-400",
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "injection": Bug,
  "authentication": Key,
  "access-control": Shield,
  "cryptography": Lock,
  "recon": Eye,
  default: Target,
};

function CategoryIcon({ category }: { category: string }) {
  const Icon = CATEGORY_ICONS[category.toLowerCase()] ?? CATEGORY_ICONS.default;
  return <Icon className="h-4 w-4" />;
}

function ChallengeCard({
  challenge,
  onOpen,
}: {
  challenge: {
    id: number;
    title: string;
    category: string;
    difficulty: string;
    points: number;
    description: string;
    completed: boolean;
    solvedCount: number;
  };
  onOpen: (id: number) => void;
}) {
  return (
    <button
      onClick={() => onOpen(challenge.id)}
      className={`w-full text-left rounded-md border p-4 transition-all hover:bg-muted/10 ${
        challenge.completed
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-card/50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <CategoryIcon category={challenge.category} />
          <span className="font-semibold truncate">{challenge.title}</span>
          {challenge.completed && (
            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
          )}
        </div>
        <Badge
          variant="outline"
          className="font-mono text-[10px] flex-shrink-0 text-yellow-400 border-yellow-500/40 bg-yellow-500/10"
        >
          {challenge.points} pts
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{challenge.description}</p>

      <div className="flex items-center gap-2 mt-3">
        <Badge variant="outline" className={`font-mono text-[10px] ${DIFFICULTY_COLORS[challenge.difficulty] ?? "border-muted text-muted-foreground"}`}>
          {challenge.difficulty.toUpperCase()}
        </Badge>
        <Badge variant="outline" className="font-mono text-[10px] border-muted bg-muted/10 text-muted-foreground">
          {challenge.category}
        </Badge>
        <span className="ml-auto text-[10px] text-muted-foreground">{challenge.solvedCount} solves</span>
      </div>
    </button>
  );
}

function ChallengeModal({
  challengeId,
  onClose,
}: {
  challengeId: number;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [flag, setFlag] = useState("");
  const [revealedHints, setRevealedHints] = useState<number[]>([]);
  const [lastResult, setLastResult] = useState<{ correct: boolean; message: string } | null>(null);
  const submitFlag = useSubmitFlag();

  const { data: challenge, isLoading } = useGetChallenge(challengeId);

  async function handleSubmit() {
    if (!flag.trim()) return;
    try {
      const result = await submitFlag.mutateAsync({ id: challengeId, data: { flag } });
      setLastResult({ correct: result.correct, message: result.message });
      if (result.correct) {
        toast({
          title: "FLAG_ACCEPTED",
          description: result.message,
        });
        queryClient.invalidateQueries({ queryKey: ["/challenges"] });
        queryClient.invalidateQueries({ queryKey: ["/challenges/progress/me"] });
        setFlag("");
      } else {
        toast({ title: "INCORRECT_FLAG", description: "Try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "ERROR", description: "Failed to submit flag.", variant: "destructive" });
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : challenge ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="font-mono text-primary text-xl">{challenge.title}</DialogTitle>
                {challenge.completed && (
                  <Badge className="bg-primary/20 text-primary border-primary/50 font-mono text-[10px]">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    SOLVED
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <Badge variant="outline" className={`font-mono text-[10px] ${DIFFICULTY_COLORS[challenge.difficulty] ?? ""}`}>
                  {challenge.difficulty.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="font-mono text-[10px] border-muted text-muted-foreground">
                  {challenge.category}
                </Badge>
                <Badge variant="outline" className="font-mono text-[10px] text-yellow-400 border-yellow-500/40">
                  {challenge.points} pts
                </Badge>
                <span className="text-xs text-muted-foreground">{challenge.solvedCount} solves</span>
              </div>
            </DialogHeader>

            <div className="space-y-5 mt-2">
              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed">{challenge.description}</p>

              {/* Objectives */}
              {challenge.objectives.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Target className="h-3.5 w-3.5" />
                    OBJECTIVES
                  </div>
                  <ul className="space-y-1.5">
                    {challenge.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <ChevronRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hints */}
              {challenge.hints.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Lightbulb className="h-3.5 w-3.5" />
                    HINTS ({challenge.hints.length} available)
                  </div>
                  <div className="space-y-2">
                    {challenge.hints.map((hint) => (
                      <div key={hint.order} className="rounded border border-border">
                        {revealedHints.includes(hint.order) ? (
                          <div className="p-3 text-sm text-muted-foreground bg-muted/10">
                            <span className="text-yellow-400 font-mono text-[10px] mr-2">HINT_{hint.order}</span>
                            {hint.text}
                          </div>
                        ) : (
                          <button
                            onClick={() => setRevealedHints((h) => [...h, hint.order])}
                            className="w-full p-3 text-xs text-muted-foreground hover:text-primary flex items-center justify-between transition-colors"
                          >
                            <span className="font-mono">HINT_{hint.order} — click to reveal</span>
                            <span className="text-[10px] text-destructive">-{hint.penaltyPoints} pts</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Flag submission */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Flag className="h-3.5 w-3.5" />
                  SUBMIT_FLAG
                </div>
                {challenge.completed ? (
                  <Alert className="border-primary/40 bg-primary/5 text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle className="font-mono">CHALLENGE_COMPLETE</AlertTitle>
                    <AlertDescription className="text-xs opacity-80">
                      You have already solved this challenge.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    {lastResult && !lastResult.correct && (
                      <Alert variant="destructive" className="border-destructive/40 bg-destructive/5">
                        <AlertTitle className="font-mono text-xs">INCORRECT_FLAG</AlertTitle>
                        <AlertDescription className="text-xs">{lastResult.message}</AlertDescription>
                      </Alert>
                    )}
                    <div className="flex gap-2">
                      <Input
                        value={flag}
                        onChange={(e) => setFlag(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        placeholder="FLAG{...}"
                        className="bg-card/50 font-mono text-sm flex-1"
                        autoComplete="off"
                      />
                      <Button
                        onClick={handleSubmit}
                        disabled={!flag.trim() || submitFlag.isPending}
                        className="bg-primary/90 hover:bg-primary text-primary-foreground font-mono"
                      >
                        <Flag className="mr-2 h-4 w-4" />
                        SUBMIT
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Flags are case-insensitive. Format: FLAG&#123;...&#125;</p>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-center py-8">Challenge not found.</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="font-mono">CLOSE</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const CATEGORIES = ["All", "injection", "authentication", "access-control", "cryptography", "recon"];

export default function Challenges() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filterDiff, setFilterDiff] = useState("all");
  const [filterCat, setFilterCat] = useState("All");

  const { data: challenges, isLoading } = useListChallenges();
  const { data: progress } = useGetMyProgress();

  const filtered = challenges?.filter((c) => {
    if (filterDiff !== "all" && c.difficulty !== filterDiff) return false;
    if (filterCat !== "All" && c.category !== filterCat) return false;
    return true;
  });

  const completedCount = challenges?.filter((c) => c.completed).length ?? 0;
  const totalCount = challenges?.length ?? 0;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            CHALLENGE_MODE
          </h2>
          <p className="text-muted-foreground">Exploit lab vulnerabilities and submit flags to earn points.</p>
        </div>
        {progress && (
          <div className="flex items-center gap-3 text-sm font-mono">
            <div className="text-right">
              <div className={`font-bold text-lg ${RANK_COLORS[progress.rank] ?? "text-primary"}`}>
                {progress.rank}
              </div>
              <div className="text-xs text-muted-foreground">{progress.totalPoints} pts</div>
            </div>
            <Zap className={`h-8 w-8 ${RANK_COLORS[progress.rank] ?? "text-primary"}`} />
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="rounded-md border border-border bg-card/50 p-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono">COMPLETION_PROGRESS</span>
          <span className="font-mono font-bold text-primary">{completedCount}/{totalCount} challenges</span>
        </div>
        <Progress value={progressPct} className="h-2" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {[
            { label: "TOTAL_PTS", value: progress?.totalPoints ?? 0, color: "text-yellow-400" },
            { label: "COMPLETED", value: completedCount, color: "text-primary" },
            { label: "REMAINING", value: totalCount - completedCount, color: "text-muted-foreground" },
            { label: "RANK", value: progress?.rank ?? "—", color: RANK_COLORS[progress?.rank ?? ""] ?? "text-muted-foreground" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className={`font-mono font-bold text-xl ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {["all", "easy", "medium", "hard", "expert"].map((d) => (
          <button
            key={d}
            onClick={() => setFilterDiff(d)}
            className={`px-3 py-1 rounded text-xs font-mono border transition-colors ${
              filterDiff === d
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-primary"
            }`}
          >
            {d.toUpperCase()}
          </button>
        ))}
        <div className="h-4 border-l border-border mx-1" />
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1 rounded text-xs font-mono border transition-colors ${
              filterCat === cat
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-primary"
            }`}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Challenge grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-md border border-border p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <div className="text-center text-muted-foreground py-16 border border-border rounded-md bg-card/50">
          NO_CHALLENGES match the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered?.map((c) => (
            <ChallengeCard key={c.id} challenge={c} onOpen={setSelectedId} />
          ))}
        </div>
      )}

      {/* Challenge detail modal */}
      {selectedId != null && (
        <ChallengeModal challengeId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
