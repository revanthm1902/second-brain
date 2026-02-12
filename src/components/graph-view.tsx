"use client";

import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType,
} from "reactflow";
import { fetchRelatedItems } from "@/app/actions";
import type { BrainItem } from "@/app/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Network, FileText, Link2, Lightbulb } from "lucide-react";

const typeColors: Record<string, string> = {
  note: "#3b82f6",
  link: "#22c55e",
  insight: "#eab308",
};

const categoryColors: Record<string, string> = {
  Technology: "#3b82f6",
  Business: "#22c55e",
  Personal: "#a855f7",
  Creative: "#ec4899",
  Learning: "#f97316",
  Work: "#06b6d4",
};

interface GraphViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewItem?: (item: BrainItem) => void;
}

export function GraphView({ open, onOpenChange, onViewItem }: GraphViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);
  const [itemMap, setItemMap] = useState<Record<string, BrainItem>>({});

  // Trigger graph load when dialog opens (prop-derived state pattern)
  const [prevOpen, setPrevOpen] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open && !loading) {
      setLoading(true);
    }
  }

  useEffect(() => {
    if (!loading || nodes.length > 0) return;
    let cancelled = false;

    fetchRelatedItems().then(({ items, edges: relEdges }) => {
      if (cancelled) return;

      const map: Record<string, BrainItem> = {};
      items.forEach((item) => (map[item.id] = item));

      const angleStep = (2 * Math.PI) / Math.max(items.length, 1);
      const radius = Math.min(300, 80 + items.length * 15);

      const newNodes: Node[] = items.map((item, i) => {
        const angle = i * angleStep;
        const categoryColor = categoryColors[item.ai_category || ""] || "#666";
        const typeColor = typeColors[item.type] || "#666";

        return {
          id: item.id,
          position: {
            x: 400 + radius * Math.cos(angle),
            y: 300 + radius * Math.sin(angle),
          },
          data: {
            label: (
              <div
                className="px-3 py-2 max-w-40 cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`View note: ${item.title}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onViewItem?.(item);
                  }
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {item.type === "note" && <FileText className="w-3 h-3" style={{ color: typeColor }} />}
                  {item.type === "link" && <Link2 className="w-3 h-3" style={{ color: typeColor }} />}
                  {item.type === "insight" && <Lightbulb className="w-3 h-3" style={{ color: typeColor }} />}
                  <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: categoryColor }}>
                    {item.ai_category || item.type}
                  </span>
                </div>
                <p className="text-xs font-bold text-[#1a1a1a] leading-tight line-clamp-2">
                  {item.title}
                </p>
              </div>
            ),
          },
          style: {
            border: `2.5px solid #1a1a1a`,
            borderRadius: "12px",
            background: "#ffffff",
            boxShadow: "3px 3px 0 #1a1a1a",
            padding: 0,
          },
        };
      });

      const newEdges: Edge[] = relEdges.map((edge, i) => ({
        id: `e-${i}`,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        labelStyle: { fontSize: 9, fontWeight: 700, fill: "#5a5a5a" },
        style: { stroke: "#1a1a1a", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: "#1a1a1a" },
        animated: false,
      }));

      setItemMap(map);
      setNodes(newNodes);
      setEdges(newEdges);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [loading, nodes.length, setNodes, setEdges, onViewItem]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const item = itemMap[node.id];
      if (item && onViewItem) onViewItem(item);
    },
    [itemMap, onViewItem]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] h-[80vh] p-0 overflow-hidden" aria-label="Knowledge graph visualization">
        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neo-cyan neo-border rounded-xl shadow-[3px_3px_0_#1a1a1a] flex items-center justify-center">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="block">Knowledge Graph</span>
              <span className="block text-[10px] font-bold text-(--fg-muted) uppercase tracking-widest">
                {nodes.length} nodes · {edges.length} connections
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 h-full" role="img" aria-label="Interactive graph showing relationships between your notes">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-3" />
                <p className="text-sm font-bold text-(--fg-muted)">Building knowledge graph...</p>
              </div>
            </div>
          ) : nodes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Network className="w-12 h-12 text-(--fg-muted) mx-auto mb-3 opacity-40" />
                <p className="text-sm font-bold text-(--fg-muted)">Add more notes to see connections</p>
              </div>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              connectionMode={ConnectionMode.Loose}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              minZoom={0.3}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#d4cfc4" gap={20} />
              <Controls
                showInteractive={false}
                style={{
                  border: "2.5px solid #1a1a1a",
                  borderRadius: "12px",
                  boxShadow: "3px 3px 0 #1a1a1a",
                  overflow: "hidden",
                }}
              />
            </ReactFlow>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
