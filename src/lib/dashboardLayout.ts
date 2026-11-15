// Dashboard layout preferences: panel order, hidden panels, and compact mode.
//
// Same external-store pattern as toolbarStyle.ts — persisted to localStorage,
// subscribed across the tree via useSyncExternalStore so the customizer and the
// dashboard stay in step without threading props.

export type PanelId =
  | "tiles"
  | "throughput"
  | "obstruction"
  | "latency"
  | "power"
  | "outages"
  | "terminal";

export const ALL_PANELS: PanelId[] = [
  "tiles",
  "throughput",
  "obstruction",
  "latency",
  "power",
  "outages",
  "terminal",
];

/** Panels that cannot be hidden — hiding the stat tiles makes the dashboard
 *  useless, and the obstruction map only appears in its fixed grid slot. */
export const ALWAYS_VISIBLE: ReadonlySet<PanelId> = new Set(["tiles"]);

export interface DashboardLayout {
  /** Panel IDs in render order. Must contain every panel; unknown IDs are dropped,
   *  missing ones are appended in their default position on read. */
  order: PanelId[];
  /** Panels the user has hidden. ALWAYS_VISIBLE entries are silently ignored. */
  hidden: PanelId[];
  /** Compact mode: smaller tile text + reduced chart heights + no sparklines. */
  compact: boolean;
}

const STORAGE_KEY = "dishylink-dashboard-layout";

const DEFAULT_LAYOUT: DashboardLayout = {
  order: [...ALL_PANELS],
  hidden: [],
  compact: false,
};

function normalize(raw: Partial<DashboardLayout>): DashboardLayout {
  // Build a valid order: keep known panel IDs in the stored order, then append
  // any that were missing (new panels added in a future release).
  const stored = (raw.order ?? []).filter((id): id is PanelId =>
    ALL_PANELS.includes(id as PanelId),
  );
  const missing = ALL_PANELS.filter((id) => !stored.includes(id));
  const order: PanelId[] = [...stored, ...missing];

  const hidden = (raw.hidden ?? []).filter(
    (id): id is PanelId => ALL_PANELS.includes(id as PanelId) && !ALWAYS_VISIBLE.has(id),
  );

  return { order, hidden, compact: raw.compact === true };
}

function load(): DashboardLayout {
  try {
    if (typeof localStorage === "undefined") return { ...DEFAULT_LAYOUT };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_LAYOUT };
    return normalize(JSON.parse(raw) as Partial<DashboardLayout>);
  } catch {
    return { ...DEFAULT_LAYOUT };
  }
}

let cached: DashboardLayout = load();
const listeners = new Set<() => void>();

function publish(): void {
  for (const listener of listeners) listener();
}

function save(next: DashboardLayout): void {
  cached = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Non-fatal — the layout holds for the session and reverts on next load.
  }
  publish();
}

export function readDashboardLayout(): DashboardLayout {
  return cached;
}

export function subscribeToDashboardLayout(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setDashboardOrder(order: PanelId[]): void {
  save(normalize({ ...cached, order }));
}

export function setDashboardHidden(hidden: PanelId[]): void {
  save(normalize({ ...cached, hidden }));
}

export function togglePanelHidden(id: PanelId): void {
  if (ALWAYS_VISIBLE.has(id)) return;
  const next = cached.hidden.includes(id)
    ? cached.hidden.filter((h) => h !== id)
    : [...cached.hidden, id];
  save(normalize({ ...cached, hidden: next }));
}

export function setCompactMode(compact: boolean): void {
  save({ ...cached, compact });
}

export function resetDashboardLayout(): void {
  save({ ...DEFAULT_LAYOUT });
}
