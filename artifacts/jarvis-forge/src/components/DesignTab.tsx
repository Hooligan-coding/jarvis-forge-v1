import { useState } from "react";
import { useGetProject } from "@workspace/api-client-react";
import { Loader2, Zap, Layout, Info, Layers } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

type PartName = "battery" | "pole" | "arm" | "led" | "panel" | null;

const PART_INFO: Record<string, { label: string; spec: string; color: string }> = {
  battery: {
    label: "LiFePO4 Battery Module",
    spec: "100Ah, 48V, 4.8kWh — Integrated BMS, 6000+ cycles, 10-year design life",
    color: "#38bdf8",
  },
  pole: {
    label: "Galvanized Steel Pole",
    spec: "6m height, 76mm OD, 3mm wall thickness, hot-dip galvanized, 200kg wind load",
    color: "#94a3b8",
  },
  arm: {
    label: "Adjustable Mounting Arm",
    spec: "300mm reach, 5mm structural steel, adjustable tilt 0-30°, rated 15kg",
    color: "#94a3b8",
  },
  led: {
    label: "High-Power LED Module",
    spec: "50W, 5000K, 6500lm, CRI >80, IP66, 50000hr lifespan, 120°x60° beam",
    color: "#fef08a",
  },
  panel: {
    label: "Monocrystalline Solar Panel",
    spec: "200W, 21.5% efficiency, 1640x992mm, VOC 45.2V, IP67 junction box",
    color: "#0ea5e9",
  },
};

function SolarStreetLightDiagram({
  selected,
  onSelect,
}: {
  selected: PartName;
  onSelect: (p: PartName) => void;
}) {
  const [hovered, setHovered] = useState<PartName>(null);

  const isHighlighted = (p: string) => selected === p || hovered === p;

  const partProps = (p: PartName) => ({
    onClick: () => onSelect(selected === p ? null : p),
    onMouseEnter: () => setHovered(p),
    onMouseLeave: () => setHovered(null),
    style: { cursor: "pointer" },
  });

  return (
    <div className="relative flex items-center justify-center w-full h-full select-none">
      {/* Grid background */}
      <svg
        className="absolute inset-0 w-full h-full opacity-10"
        style={{ pointerEvents: "none" }}
      >
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#00ffff" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Corner brackets */}
      {[
        "top-4 left-4",
        "top-4 right-4",
        "bottom-4 left-4",
        "bottom-4 right-4",
      ].map((pos, i) => (
        <div
          key={i}
          className={`absolute ${pos} w-6 h-6 border-primary/40`}
          style={{
            borderTop: i < 2 ? "1px solid" : "none",
            borderBottom: i >= 2 ? "1px solid" : "none",
            borderLeft: i % 2 === 0 ? "1px solid" : "none",
            borderRight: i % 2 === 1 ? "1px solid" : "none",
            pointerEvents: "none",
          }}
        />
      ))}

      <svg viewBox="0 0 300 500" className="h-full max-h-[460px]" style={{ maxWidth: "260px" }}>
        {/* Ground */}
        <line x1="50" y1="460" x2="250" y2="460" stroke="#1e3a4a" strokeWidth="2" />
        <line x1="100" y1="462" x2="200" y2="462" stroke="#0f2a3a" strokeWidth="1.5" />

        {/* Battery box */}
        <motion.g
          {...partProps("battery")}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.02 }}
        >
          <rect
            x="110"
            y="415"
            width="80"
            height="45"
            rx="3"
            fill={isHighlighted("battery") ? "#0c1f2f" : "#060f1a"}
            stroke={isHighlighted("battery") ? "#38bdf8" : "#1e3a4a"}
            strokeWidth={isHighlighted("battery") ? 1.5 : 1}
          />
          {isHighlighted("battery") && (
            <rect x="110" y="415" width="80" height="45" rx="3" fill="#38bdf8" fillOpacity="0.08" />
          )}
          <text x="150" y="433" textAnchor="middle" fill={isHighlighted("battery") ? "#38bdf8" : "#4a6a7a"} fontSize="7" fontFamily="monospace">BATTERY</text>
          <text x="150" y="444" textAnchor="middle" fill={isHighlighted("battery") ? "#38bdf8" : "#2a4a5a"} fontSize="6" fontFamily="monospace">LiFePO4 48V</text>
          <text x="150" y="454" textAnchor="middle" fill={isHighlighted("battery") ? "#38bdf8" : "#2a4a5a"} fontSize="6" fontFamily="monospace">100Ah</text>
          {/* Terminal lines */}
          <line x1="130" y1="415" x2="130" y2="410" stroke="#1e3a4a" strokeWidth="1" />
          <line x1="170" y1="415" x2="170" y2="410" stroke="#1e3a4a" strokeWidth="1" />
        </motion.g>

        {/* Pole */}
        <motion.g {...partProps("pole")} whileHover={{ scale: 1.01, originX: "50%" }}>
          <rect
            x="143"
            y="85"
            width="14"
            height="330"
            rx="2"
            fill={isHighlighted("pole") ? "#1a2436" : "#0d1520"}
            stroke={isHighlighted("pole") ? "#94a3b8" : "#1e2a3a"}
            strokeWidth={isHighlighted("pole") ? 1.5 : 1}
          />
          {isHighlighted("pole") && (
            <rect x="143" y="85" width="14" height="330" rx="2" fill="#94a3b8" fillOpacity="0.1" />
          )}
          {/* Pole segments */}
          {[130, 190, 250, 310, 370].map((y) => (
            <line key={y} x1="143" y1={y} x2="157" y2={y} stroke="#1e2a3a" strokeWidth="0.5" />
          ))}
          {/* Pole label */}
          <text x="167" y="265" fill={isHighlighted("pole") ? "#94a3b8" : "#2a4a5a"} fontSize="6" fontFamily="monospace" transform="rotate(90, 167, 265)">STEEL POLE — 6m</text>
        </motion.g>

        {/* Arm */}
        <motion.g {...partProps("arm")} whileHover={{ scale: 1.03 }}>
          <line
            x1="157"
            y1="90"
            x2="215"
            y2="68"
            stroke={isHighlighted("arm") ? "#94a3b8" : "#1e2a3a"}
            strokeWidth={isHighlighted("arm") ? 4 : 3}
            strokeLinecap="round"
          />
          {isHighlighted("arm") && (
            <line x1="157" y1="90" x2="215" y2="68" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" strokeOpacity="0.15" />
          )}
          <circle cx="157" cy="90" r="4" fill={isHighlighted("arm") ? "#94a3b8" : "#1e2a3a"} />
        </motion.g>

        {/* LED module */}
        <motion.g {...partProps("led")} whileHover={{ scale: 1.05 }}>
          <rect
            x="198"
            y="58"
            width="40"
            height="16"
            rx="3"
            fill={isHighlighted("led") ? "#1a1500" : "#0d1008"}
            stroke={isHighlighted("led") ? "#fef08a" : "#3a3000"}
            strokeWidth={isHighlighted("led") ? 1.5 : 1}
          />
          {isHighlighted("led") && (
            <rect x="198" y="58" width="40" height="16" rx="3" fill="#fef08a" fillOpacity="0.1" />
          )}
          {/* LED dots */}
          {[208, 218, 228].map((x) => (
            <circle key={x} cx={x} cy="66" r="2.5" fill="#fef08a" fillOpacity={isHighlighted("led") ? 0.9 : 0.4} />
          ))}
          <text x="218" y="82" textAnchor="middle" fill={isHighlighted("led") ? "#fef08a" : "#3a3000"} fontSize="6" fontFamily="monospace">LED 50W</text>
          {/* Light beam */}
          {isHighlighted("led") && (
            <path d="M 200 74 L 170 130 L 260 130 L 250 74" fill="#fef08a" fillOpacity="0.05" />
          )}
          {/* Always-on light cone */}
          <path d="M 205 74 L 185 120 L 255 120 L 245 74" fill="#fef08a" fillOpacity="0.03" />
        </motion.g>

        {/* Solar Panel */}
        <motion.g {...partProps("panel")} whileHover={{ scale: 1.02 }}>
          <rect
            x="90"
            y="18"
            width="110"
            height="55"
            rx="3"
            fill={isHighlighted("panel") ? "#03111d" : "#020b14"}
            stroke={isHighlighted("panel") ? "#0ea5e9" : "#0c2a3a"}
            strokeWidth={isHighlighted("panel") ? 1.5 : 1}
            transform="rotate(-12, 145, 45)"
          />
          {/* Panel grid lines */}
          {[107, 124, 141, 158, 175].map((x) => (
            <line
              key={x}
              x1={x}
              y1="16"
              x2={x - 14}
              y2="72"
              stroke={isHighlighted("panel") ? "#0ea5e9" : "#0c2a3a"}
              strokeWidth="0.5"
              transform="rotate(-12, 145, 45)"
              strokeOpacity={isHighlighted("panel") ? 0.6 : 0.4}
            />
          ))}
          {[28, 43, 58].map((y) => (
            <line
              key={y}
              x1="90"
              y1={y}
              x2="200"
              y2={y}
              stroke={isHighlighted("panel") ? "#0ea5e9" : "#0c2a3a"}
              strokeWidth="0.5"
              transform="rotate(-12, 145, 45)"
              strokeOpacity={isHighlighted("panel") ? 0.6 : 0.4}
            />
          ))}
          {isHighlighted("panel") && (
            <rect
              x="90"
              y="18"
              width="110"
              height="55"
              rx="3"
              fill="#0ea5e9"
              fillOpacity="0.07"
              transform="rotate(-12, 145, 45)"
            />
          )}
          <text x="145" y="52" textAnchor="middle" fill={isHighlighted("panel") ? "#38bdf8" : "#0c3a50"} fontSize="7" fontFamily="monospace" transform="rotate(-12, 145, 45)">SOLAR PANEL</text>
          <text x="145" y="62" textAnchor="middle" fill={isHighlighted("panel") ? "#0ea5e9" : "#0a2a40"} fontSize="6" fontFamily="monospace" transform="rotate(-12, 145, 45)">200W MONO</text>
        </motion.g>

        {/* Cable from panel to pole */}
        <path
          d="M 150 68 Q 148 78 150 85"
          fill="none"
          stroke="#1e3a4a"
          strokeWidth="1"
          strokeDasharray="2,2"
        />

        {/* Dimension lines */}
        <line x1="30" y1="85" x2="30" y2="415" stroke="#0c2233" strokeWidth="0.5" strokeDasharray="3,3" />
        <line x1="27" y1="85" x2="33" y2="85" stroke="#0c2233" strokeWidth="0.5" />
        <line x1="27" y1="415" x2="33" y2="415" stroke="#0c2233" strokeWidth="0.5" />
        <text x="25" y="255" textAnchor="middle" fill="#0c3050" fontSize="6" fontFamily="monospace" transform="rotate(-90, 25, 255)">6.0 m</text>

        {/* JARVIS status indicators */}
        <circle cx="270" cy="30" r="3" fill="#00ff88" fillOpacity="0.8">
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
        <text x="278" y="34" fill="#00ff88" fontSize="6" fontFamily="monospace" fillOpacity="0.6">ONLINE</text>

        <text x="10" y="14" fill="#0c3050" fontSize="6" fontFamily="monospace">JARVIS FORGE — SCHEMATIC VIEW v1.0</text>
      </svg>
    </div>
  );
}

export function DesignTab({ projectId }: { projectId: string | null }) {
  const [selectedPart, setSelectedPart] = useState<PartName>(null);

  const { data: project, isLoading } = useGetProject(projectId || "", {
    query: { enabled: !!projectId },
  });

  if (!projectId || isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const jarvisArchMsg = project?.chatHistory?.find(
    (m) => m.role === "jarvis" && m.content.length > 60 && !m.content.includes("online"),
  );

  return (
    <div className="h-full flex gap-0">
      {/* 3D Viewer area */}
      <div className="flex-1 relative border-r border-border/50 bg-[#020813] overflow-hidden">
        <div className="absolute top-4 left-4 z-10 glass-panel p-3 rounded-md pointer-events-none">
          <h3 className="font-display font-bold text-sm tracking-wider text-primary mb-1 flex items-center gap-2">
            <Layout className="w-4 h-4" />
            SCHEMATIC VIEW
          </h3>
          <p className="text-xs text-muted-foreground font-mono">
            {selectedPart ? `SELECTED: ${selectedPart.toUpperCase()}` : "CLICK COMPONENT TO INSPECT"}
          </p>
        </div>

        <SolarStreetLightDiagram selected={selectedPart} onSelect={setSelectedPart} />

        {/* Component info overlay */}
        <AnimatePresence>
          {selectedPart && PART_INFO[selectedPart] && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-4 right-4 glass-panel p-4 rounded-md border"
              style={{ borderColor: PART_INFO[selectedPart].color + "44" }}
            >
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: PART_INFO[selectedPart].color }} />
                <div>
                  <div className="font-display font-bold text-sm mb-1" style={{ color: PART_INFO[selectedPart].color }}>
                    {PART_INFO[selectedPart].label}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {PART_INFO[selectedPart].spec}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Architecture panel */}
      <div className="w-72 bg-background/80 backdrop-blur p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-primary">
          <Zap className="w-4 h-4" />
          <h3 className="font-display font-bold text-sm tracking-wider">SYSTEM OVERVIEW</h3>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {Object.entries(PART_INFO).map(([key, info]) => (
            <motion.button
              key={key}
              onClick={() => setSelectedPart(selectedPart === key as PartName ? null : key as PartName)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-2 rounded border text-left transition-all"
              style={{
                borderColor: selectedPart === key ? info.color + "66" : "#1e2a3a",
                backgroundColor: selectedPart === key ? info.color + "0f" : "#060f1a",
              }}
            >
              <div className="text-xs font-mono font-bold mb-0.5" style={{ color: info.color }}>
                {key.toUpperCase()}
              </div>
              <div className="text-[9px] text-muted-foreground font-mono leading-tight">
                {info.label}
              </div>
            </motion.button>
          ))}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Layers className="w-4 h-4" />
            <span className="font-display text-xs tracking-wider font-bold">ARCHITECTURE</span>
          </div>
          <ScrollArea className="h-40">
            {jarvisArchMsg ? (
              <div className="text-xs text-muted-foreground leading-relaxed font-mono whitespace-pre-wrap">
                {jarvisArchMsg.content}
              </div>
            ) : (
              <div className="p-3 border border-dashed border-border/50 rounded bg-card/30">
                <p className="text-xs text-muted-foreground font-mono text-center">
                  Ask JARVIS to design a system to generate architecture notes.
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
