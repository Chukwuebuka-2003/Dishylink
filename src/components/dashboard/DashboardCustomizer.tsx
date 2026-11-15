// Dashboard layout customizer.
//
// Lets the user reorder panels via drag-and-drop, hide panels they don't want,
// and toggle compact mode. Opens as a modal from a button on the dashboard.
// Uses native HTML drag events — no extra library needed.

import { useRef, useState, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { GripVerticalIcon, EyeIcon, EyeOffIcon, RotateCcwIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  readDashboardLayout,
  subscribeToDashboardLayout,
  setDashboardOrder,
  togglePanelHidden,
  setCompactMode,
  resetDashboardLayout,
  ALWAYS_VISIBLE,
  type PanelId,
} from "../../lib/dashboardLayout";

/** Human-readable panel names. Kept here (not i18n) since the customizer is a
 *  power-user feature and the names map 1:1 to what's on screen. */
const PANEL_LABEL: Record<PanelId, string> = {
  tiles: "Stat tiles",
  throughput: "Throughput chart",
  obstruction: "Obstruction map",
  latency: "Latency chart",
  power: "Power draw chart",
  outages: "Outage log",
  terminal: "Dish terminal",
};

const PANEL_DESCRIPTION: Record<PanelId, string> = {
  tiles: "Download, upload, latency, power, ping, obstruction",
  throughput: "Live download & upload over time",
  obstruction: "Sky obstruction dome",
  latency: "Pop ping latency over time",
  power: "Power draw over time",
  outages: "Recent outages and thermal events",
  terminal: "Hardware facts, firmware, GPS, alignment",
};

export function DashboardCustomizer({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const layout = useSyncExternalStore(subscribeToDashboardLayout, readDashboardLayout);

  // Local drag state — which item is being dragged and where it is hovering.
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragTarget, setDragTarget] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    dragItem.current = index;
    setDragging(index);
  };

  const handleDragEnter = (index: number) => {
    dragOver.current = index;
    setDragTarget(index);
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOver.current === null) {
      setDragging(null);
      setDragTarget(null);
      return;
    }
    if (dragItem.current === dragOver.current) {
      setDragging(null);
      setDragTarget(null);
      return;
    }
    const next = [...layout.order];
    const [moved] = next.splice(dragItem.current, 1);
    next.splice(dragOver.current, 0, moved);
    setDashboardOrder(next);
    dragItem.current = null;
    dragOver.current = null;
    setDragging(null);
    setDragTarget(null);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-sm bg-card border-border p-0 gap-0"
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-row items-center justify-between px-5 pt-[14px] pb-2 text-left">
          <DialogTitle className="text-[17px] font-semibold tracking-[0.01em]">
            {t("dashboard.customizeLayout")}
          </DialogTitle>
          <button
            className="inline-flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-full border-0 bg-[color-mix(in_srgb,var(--ink)_6%,var(--surface))] text-[13px] leading-none text-ink-secondary transition-colors hover:text-foreground"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            ✕
          </button>
        </DialogHeader>

        <div className="thin-scroll max-h-[70vh] overflow-y-auto px-5 pb-6">
          {/* Compact mode toggle */}
          <div className="flex items-center justify-between py-3 border-b border-hairline mb-3">
            <div>
              <div className="text-[13.5px] font-semibold text-foreground">
                {t("dashboard.compactMode")}
              </div>
              <div className="text-[12px] text-muted-foreground mt-px">
                {t("dashboard.compactModeDesc")}
              </div>
            </div>
            <Switch
              checked={layout.compact}
              onCheckedChange={setCompactMode}
            />
          </div>

          {/* Panel order + visibility */}
          <div className="mb-2 font-mono text-[10px] font-medium tracking-[0.11em] text-muted-foreground uppercase">
            {t("dashboard.panels")}
          </div>

          <div className="flex flex-col gap-1">
            {layout.order.map((id, index) => {
              const hidden = layout.hidden.includes(id);
              const alwaysVisible = ALWAYS_VISIBLE.has(id);
              const isDragging = dragging === index;
              const isTarget = dragTarget === index && dragging !== null && dragging !== index;

              return (
                <div
                  key={id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className={[
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all select-none",
                    "bg-[color-mix(in_srgb,var(--ink)_4%,var(--surface))]",
                    isDragging ? "opacity-40 scale-[0.98]" : "",
                    isTarget
                      ? "ring-2 ring-primary ring-offset-1 ring-offset-card"
                      : "",
                    hidden ? "opacity-50" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {/* Drag handle */}
                  <GripVerticalIcon
                    size={16}
                    className="flex-none text-muted-foreground cursor-grab active:cursor-grabbing"
                  />

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-foreground leading-snug">
                      {PANEL_LABEL[id]}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-snug truncate">
                      {PANEL_DESCRIPTION[id]}
                    </div>
                  </div>

                  {/* Visibility toggle */}
                  {alwaysVisible ? (
                    <span className="text-[11px] text-muted-foreground font-medium font-mono">
                      always
                    </span>
                  ) : (
                    <button
                      onClick={() => togglePanelHidden(id)}
                      className="flex-none text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                      aria-label={
                        hidden
                          ? t("dashboard.showPanel", { panel: PANEL_LABEL[id] })
                          : t("dashboard.hidePanel", { panel: PANEL_LABEL[id] })
                      }
                      title={
                        hidden
                          ? t("dashboard.showPanel", { panel: PANEL_LABEL[id] })
                          : t("dashboard.hidePanel", { panel: PANEL_LABEL[id] })
                      }
                    >
                      {hidden ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Reset */}
          <div className="mt-4 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetDashboardLayout}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <RotateCcwIcon size={13} />
              {t("dashboard.resetLayout")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
