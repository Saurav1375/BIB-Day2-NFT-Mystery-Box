"use client";

import { useState, useCallback } from "react";
import {
  createBox,
  openBox,
  viewBox,
  viewPlatformStats,
  CONTRACT_ADDRESS,
  scValToNative,
  type MysteryBox,
  type PlatformStats,
} from "@/hooks/contract";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Spotlight } from "@/components/ui/spotlight";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Icons ────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function UnlockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function GiftIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
    </svg>
  );
}

// ── Styled Input ─────────────────────────────────────────────

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">
        {label}
      </label>
      <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#7c6cf0]/30 focus-within:shadow-[0_0_20px_rgba(124,108,240,0.08)]">
        <input
          {...props}
          className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/15 outline-none"
        />
      </div>
    </div>
  );
}

// ── Method Signature ─────────────────────────────────────────

function MethodSignature({
  name,
  params,
  returns,
  color,
}: {
  name: string;
  params: string;
  returns?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 font-mono text-sm">
      <span style={{ color }} className="font-semibold">fn</span>
      <span className="text-white/70">{name}</span>
      <span className="text-white/20 text-xs">{params}</span>
      {returns && (
        <span className="ml-auto text-white/15 text-[10px]">{returns}</span>
      )}
    </div>
  );
}

// ── Rarity Config ────────────────────────────────────────────

const RARITY_CONFIG: Record<string, {
  label: string;
  color: string;
  bg: string;
  border: string;
  shadow: string;
  emoji: string;
  variant: "default" | "success" | "warning" | "info";
}> = {
  Common: {
    label: "Common",
    color: "text-[#94a3b8]",
    bg: "bg-[#94a3b8]/10",
    border: "border-[#94a3b8]/20",
    shadow: "shadow-[0_0_20px_rgba(148,163,184,0.1)]",
    emoji: "⚪",
    variant: "default",
  },
  Rare: {
    label: "Rare",
    color: "text-[#4fc3f7]",
    bg: "bg-[#4fc3f7]/10",
    border: "border-[#4fc3f7]/20",
    shadow: "shadow-[0_0_20px_rgba(79,195,247,0.15)]",
    emoji: "🔵",
    variant: "info",
  },
  Epic: {
    label: "Epic",
    color: "text-[#a855f7]",
    bg: "bg-[#a855f7]/10",
    border: "border-[#a855f7]/20",
    shadow: "shadow-[0_0_20px_rgba(168,85,247,0.15)]",
    emoji: "🟣",
    variant: "warning",
  },
  Legendary: {
    label: "Legendary",
    color: "text-[#fbbf24]",
    bg: "bg-[#fbbf24]/10",
    border: "border-[#fbbf24]/20",
    shadow: "shadow-[0_0_25px_rgba(251,191,36,0.2)]",
    emoji: "🌟",
    variant: "warning",
  },
};

function getRarityConfig(rarity: string) {
  return RARITY_CONFIG[rarity] ?? RARITY_CONFIG.Common;
}

// ── Mystery Box Card ─────────────────────────────────────────

function MysteryBoxCard({ box, revealed }: { box: MysteryBox; revealed?: boolean }) {
  const cfg = getRarityConfig(box.rarity);
  const createdDate = box.created_at
    ? new Date(box.created_at * 1000).toLocaleDateString()
    : "—";
  const openedDate = box.opened_at
    ? new Date(box.opened_at * 1000).toLocaleDateString()
    : "—";

  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden transition-all duration-500",
        revealed ? `${cfg.border} ${cfg.shadow} animate-box-reveal` : "border-white/[0.06]",
        cfg.bg
      )}
    >
      <div className="border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-white/25">
          Mystery Box #{box.box_id}
        </span>
        <div className="flex items-center gap-2">
          {box.is_opened ? (
            <Badge variant={cfg.variant}>
              {cfg.emoji} {cfg.label}
            </Badge>
          ) : (
            <Badge>
              🔒 Sealed
            </Badge>
          )}
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/35">Owner</span>
          <span className="font-mono text-xs text-white/60 truncate max-w-[180px]">
            {box.owner}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/35">Rarity</span>
          <span className={cn("font-mono text-sm font-semibold", cfg.color)}>
            {box.is_opened ? `${cfg.emoji} ${cfg.label}` : "???"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/35">Status</span>
          <span className={cn("font-mono text-xs", box.is_opened ? "text-[#34d399]" : "text-[#fbbf24]")}>
            {box.is_opened ? "Opened" : "Sealed"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/35">Created</span>
          <span className="font-mono text-xs text-white/40">{createdDate}</span>
        </div>
        {box.is_opened && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/35">Opened</span>
            <span className="font-mono text-xs text-white/40">{openedDate}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stats Card ──────────────────────────────────────────────

function StatsDisplay({ stats }: { stats: PlatformStats }) {
  const items = [
    { label: "Total Boxes", value: stats.total_boxes, color: "text-[#7c6cf0]", emoji: "📦" },
    { label: "Opened", value: stats.opened_boxes, color: "text-[#34d399]", emoji: "🔓" },
    { label: "Sealed", value: stats.unopened_boxes, color: "text-[#fbbf24]", emoji: "🔒" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 animate-fade-in-up">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center transition-all hover:border-white/[0.1] hover:bg-white/[0.04]"
        >
          <p className="text-2xl mb-1">{item.emoji}</p>
          <p className={cn("text-2xl font-bold font-mono", item.color)}>
            {item.value}
          </p>
          <p className="text-[10px] text-white/30 mt-1">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────

type Tab = "create" | "open" | "view" | "stats";

interface ContractUIProps {
  walletAddress: string | null;
  onConnect: () => void;
  isConnecting: boolean;
}

export default function ContractUI({ walletAddress, onConnect, isConnecting }: ContractUIProps) {
  const [activeTab, setActiveTab] = useState<Tab>("create");
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Create Box
  const [isCreating, setIsCreating] = useState(false);
  const [createdBoxId, setCreatedBoxId] = useState<number | null>(null);

  // Open Box
  const [openBoxId, setOpenBoxId] = useState("");
  const [isOpening, setIsOpening] = useState(false);
  const [revealedBox, setRevealedBox] = useState<MysteryBox | null>(null);

  // View Box
  const [viewBoxId, setViewBoxId] = useState("");
  const [isViewing, setIsViewing] = useState(false);
  const [viewedBox, setViewedBox] = useState<MysteryBox | null>(null);

  // Stats
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [stats, setStats] = useState<PlatformStats | null>(null);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // ── Handlers ────────────────────────────────────────────────

  const handleCreateBox = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    setError(null);
    setIsCreating(true);
    setCreatedBoxId(null);
    setTxStatus("Awaiting signature...");
    try {
      const result = await createBox(walletAddress, walletAddress);
      // Try to extract box ID from the return value
      let boxId: number | null = null;
      try {
        if (result && result.returnValue) {
          boxId = Number(scValToNative(result.returnValue));
        }
      } catch {
        // Return value parsing failed, that's okay
      }

      if (boxId && boxId > 0) {
        setCreatedBoxId(boxId);
        setTxStatus(`Mystery Box #${boxId} created!`);
      } else {
        setTxStatus("Mystery Box created successfully!");
      }
      setTimeout(() => setTxStatus(null), 6000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsCreating(false);
    }
  }, [walletAddress]);

  const handleOpenBox = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    const id = parseInt(openBoxId, 10);
    if (isNaN(id) || id <= 0) return setError("Enter a valid box ID");
    setError(null);
    setIsOpening(true);
    setRevealedBox(null);
    setTxStatus("Awaiting signature...");
    try {
      await openBox(walletAddress, id);
      // After opening, fetch the box details to show the reveal
      try {
        const boxData = await viewBox(id, walletAddress);
        if (boxData) {
          setRevealedBox(boxData);
          setTxStatus(`Box #${id} revealed — ${getRarityConfig(boxData.rarity).emoji} ${boxData.rarity}!`);
        } else {
          setTxStatus(`Box #${id} opened successfully!`);
        }
      } catch {
        setTxStatus(`Box #${id} opened successfully!`);
      }
      setTimeout(() => setTxStatus(null), 8000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsOpening(false);
    }
  }, [walletAddress, openBoxId]);

  const handleViewBox = useCallback(async () => {
    const id = parseInt(viewBoxId, 10);
    if (isNaN(id) || id <= 0) return setError("Enter a valid box ID");
    setError(null);
    setIsViewing(true);
    setViewedBox(null);
    try {
      const boxData = await viewBox(id, walletAddress || undefined);
      if (boxData && boxData.box_id !== 0) {
        setViewedBox(boxData);
      } else {
        setError("Box not found");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setIsViewing(false);
    }
  }, [viewBoxId, walletAddress]);

  const handleLoadStats = useCallback(async () => {
    setError(null);
    setIsLoadingStats(true);
    try {
      const data = await viewPlatformStats(walletAddress || undefined);
      if (data) {
        setStats(data);
      } else {
        setError("Could not load stats");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setIsLoadingStats(false);
    }
  }, [walletAddress]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "create", label: "Create", icon: <GiftIcon size={14} />, color: "#7c6cf0" },
    { key: "open", label: "Reveal", icon: <UnlockIcon />, color: "#fbbf24" },
    { key: "view", label: "View", icon: <SearchIcon />, color: "#4fc3f7" },
    { key: "stats", label: "Stats", icon: <BarChartIcon />, color: "#34d399" },
  ];

  return (
    <div className="w-full max-w-2xl animate-fade-in-up-delayed">
      {/* Toasts */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#f87171]/15 bg-[#f87171]/[0.05] px-4 py-3 backdrop-blur-sm animate-slide-down">
          <span className="mt-0.5 text-[#f87171]"><AlertIcon /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#f87171]/90">Error</p>
            <p className="text-xs text-[#f87171]/50 mt-0.5 break-all">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="shrink-0 text-[#f87171]/30 hover:text-[#f87171]/70 text-lg leading-none">&times;</button>
        </div>
      )}

      {txStatus && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#34d399]/15 bg-[#34d399]/[0.05] px-4 py-3 backdrop-blur-sm shadow-[0_0_30px_rgba(52,211,153,0.05)] animate-slide-down">
          <span className="text-[#34d399]">
            {txStatus.includes("created") || txStatus.includes("revealed") || txStatus.includes("opened") ? <CheckIcon /> : <SpinnerIcon />}
          </span>
          <span className="text-sm text-[#34d399]/90">{txStatus}</span>
        </div>
      )}

      {/* Main Card */}
      <Spotlight className="rounded-2xl">
        <AnimatedCard className="p-0" containerClassName="rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c6cf0]/20 to-[#fbbf24]/20 border border-white/[0.06]">
                <span className="text-base">🎁</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/90">NFT Mystery Box</h3>
                <p className="text-[10px] text-white/25 font-mono mt-0.5">{truncate(CONTRACT_ADDRESS)}</p>
              </div>
            </div>
            <Badge variant="info" className="text-[10px]">Soroban</Badge>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] px-2 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setError(null); setViewedBox(null); setRevealedBox(null); }}
                className={cn(
                  "relative flex items-center gap-2 px-4 sm:px-5 py-3.5 text-sm font-medium transition-all whitespace-nowrap",
                  activeTab === t.key ? "text-white/90" : "text-white/35 hover:text-white/55"
                )}
              >
                <span style={activeTab === t.key ? { color: t.color } : undefined}>{t.icon}</span>
                {t.label}
                {activeTab === t.key && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full transition-all"
                    style={{ background: `linear-gradient(to right, ${t.color}, ${t.color}66)` }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* CREATE */}
            {activeTab === "create" && (
              <div className="space-y-5">
                <MethodSignature name="create_box" params="(owner: String)" returns="→ u64" color="#7c6cf0" />

                <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                  <p className="text-sm text-white/50 leading-relaxed">
                    Create a new sealed mystery box. A random NFT rarity tier
                    (<span className="text-[#94a3b8]">Common</span>,{" "}
                    <span className="text-[#4fc3f7]">Rare</span>,{" "}
                    <span className="text-[#a855f7]">Epic</span>, or{" "}
                    <span className="text-[#fbbf24]">Legendary</span>) will be assigned on-chain.
                    The rarity remains hidden until you reveal it!
                  </p>
                </div>

                {/* Rarity distribution */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">
                    Rarity Distribution
                  </label>
                  <div className="flex gap-2">
                    {[
                      { name: "Common", pct: "50%", color: "#94a3b8" },
                      { name: "Rare", pct: "30%", color: "#4fc3f7" },
                      { name: "Epic", pct: "15%", color: "#a855f7" },
                      { name: "Legendary", pct: "5%", color: "#fbbf24" },
                    ].map((r) => (
                      <div
                        key={r.name}
                        className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-center"
                      >
                        <p className="font-mono text-sm font-bold" style={{ color: r.color }}>
                          {r.pct}
                        </p>
                        <p className="text-[9px] text-white/30 mt-0.5">{r.name}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {walletAddress ? (
                  <ShimmerButton onClick={handleCreateBox} disabled={isCreating} shimmerColor="#7c6cf0" className="w-full">
                    {isCreating ? <><SpinnerIcon /> Creating...</> : <><GiftIcon size={14} /> Create Mystery Box</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#7c6cf0]/20 bg-[#7c6cf0]/[0.03] py-4 text-sm text-[#7c6cf0]/60 hover:border-[#7c6cf0]/30 hover:text-[#7c6cf0]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to create boxes
                  </button>
                )}

                {createdBoxId !== null && (
                  <div className="rounded-xl border border-[#34d399]/20 bg-[#34d399]/[0.05] p-4 text-center animate-fade-in-up">
                    <p className="text-3xl mb-2">🎁</p>
                    <p className="text-sm text-[#34d399]/90 font-medium">
                      Mystery Box #{createdBoxId} Created!
                    </p>
                    <p className="text-xs text-white/30 mt-1">Use the &quot;Reveal&quot; tab to open it</p>
                  </div>
                )}
              </div>
            )}

            {/* OPEN/REVEAL */}
            {activeTab === "open" && (
              <div className="space-y-5">
                <MethodSignature name="open_box" params="(box_id: u64)" returns="→ MysteryBox" color="#fbbf24" />

                <Input
                  label="Box ID"
                  type="number"
                  value={openBoxId}
                  onChange={(e) => setOpenBoxId(e.target.value)}
                  placeholder="e.g. 1"
                />

                {walletAddress ? (
                  <ShimmerButton onClick={handleOpenBox} disabled={isOpening} shimmerColor="#fbbf24" className="w-full">
                    {isOpening ? <><SpinnerIcon /> Revealing...</> : <><UnlockIcon /> Reveal Mystery Box</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#fbbf24]/20 bg-[#fbbf24]/[0.03] py-4 text-sm text-[#fbbf24]/60 hover:border-[#fbbf24]/30 hover:text-[#fbbf24]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to reveal boxes
                  </button>
                )}

                {revealedBox && (
                  <MysteryBoxCard box={revealedBox} revealed />
                )}
              </div>
            )}

            {/* VIEW */}
            {activeTab === "view" && (
              <div className="space-y-5">
                <MethodSignature name="view_box" params="(box_id: u64)" returns="→ MysteryBox" color="#4fc3f7" />
                <Input
                  label="Box ID"
                  type="number"
                  value={viewBoxId}
                  onChange={(e) => setViewBoxId(e.target.value)}
                  placeholder="e.g. 1"
                />
                <ShimmerButton onClick={handleViewBox} disabled={isViewing} shimmerColor="#4fc3f7" className="w-full">
                  {isViewing ? <><SpinnerIcon /> Querying...</> : <><SearchIcon /> View Box Details</>}
                </ShimmerButton>

                {viewedBox && (
                  <MysteryBoxCard box={viewedBox} />
                )}
              </div>
            )}

            {/* STATS */}
            {activeTab === "stats" && (
              <div className="space-y-5">
                <MethodSignature name="view_platform_stats" params="()" returns="→ PlatformStats" color="#34d399" />

                <ShimmerButton onClick={handleLoadStats} disabled={isLoadingStats} shimmerColor="#34d399" className="w-full">
                  {isLoadingStats ? <><SpinnerIcon /> Loading...</> : <><BarChartIcon /> Load Platform Statistics</>}
                </ShimmerButton>

                {stats && <StatsDisplay stats={stats} />}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.04] px-6 py-3 flex items-center justify-between">
            <p className="text-[10px] text-white/15">NFT Mystery Box &middot; Soroban</p>
            <div className="flex items-center gap-2">
              {["Common", "Rare", "Epic", "Legendary"].map((r, i) => {
                const cfg = getRarityConfig(r);
                return (
                  <span key={r} className="flex items-center gap-1">
                    <span className={cn("h-1 w-1 rounded-full", `bg-current ${cfg.color}`)} style={{ color: cfg.color.replace("text-[", "").replace("]", "") }} />
                    <span className="font-mono text-[9px] text-white/15">{r}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </AnimatedCard>
      </Spotlight>
    </div>
  );
}
