import React, { useState, useEffect, useMemo } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { LeadCard } from "./LeadCard";
import { getSupabaseClient } from "@nexus-crm/api";

const supabase = getSupabaseClient();

interface KanbanBoardProps {
  data: any[];
  onEdit: (id: string) => void;
  onStageChange?: (leadId: string, newStageCode: string) => void;
}

const DEFAULT_STAGES = [
  { id: "new", label: "New", color: "#6b7280", sort_order: 0, probability: 10, is_won: false, is_lost: false },
  { id: "follow_up", label: "Follow Up", color: "#3b82f1", sort_order: 1, probability: 20, is_won: false, is_lost: false },
  { id: "prospect", label: "Prospect", color: "#8b5cf6", sort_order: 2, probability: 40, is_won: false, is_lost: false },
  { id: "negotiation", label: "Negotiation", color: "#f59e0b", sort_order: 3, probability: 70, is_won: false, is_lost: false },
  { id: "won", label: "Won", color: "#10b981", sort_order: 4, probability: 100, is_won: true, is_lost: false },
  { id: "lost", label: "Lost", color: "#ef4444", sort_order: 5, probability: 0, is_won: false, is_lost: true },
];

const statusToStageMap: Record<string, string> = {
  new: "new", contacted: "follow_up", qualified: "prospect",
  unqualified: "lost", converted: "won", lost: "lost",
  follow_up: "follow_up", prospect: "prospect", negotiation: "negotiation", won: "won",
};

const stageColorMap: Record<string, string> = {
  new: "#6b7280", follow_up: "#3b82f1", prospect: "#8b5cf6",
  negotiation: "#f59e0b", won: "#10b981", lost: "#ef4444",
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ data, onEdit, onStageChange }) => {
  const [leadData, setLeadData] = useState<any[]>([]);
  const [pipelineStages, setPipelineStages] = useState<any[]>([]);
  const [stageIdCodeMap, setStageIdCodeMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Sync data prop to local state when it changes
  useEffect(() => {
    if (data && data.length > 0) {
      setLeadData(data);
    }
  }, [data]);

  // Fetch configurable pipeline stages from Supabase
  useEffect(() => {
    const fetchPipeline = async () => {
      setLoading(true);
      try {
        const { data: pipeline, error: pipeErr } = await supabase
          .from("lead_pipelines")
          .select("*")
          .eq("is_default", true)
          .single();

        if (pipeErr || !pipeline) throw pipeErr || new Error("No default pipeline found");

        const { data: stageLinks, error: stageErr } = await supabase
          .from("pipeline_stages")
          .select("*")
          .eq("pipeline_id", pipeline.id)
          .order("sort_order", { ascending: true });

        if (stageErr) throw stageErr;

        const stageIds = stageLinks.map((ps: any) => ps.stage_id);
        const { data: leadStages, error: lsErr } = await supabase
          .from("lead_stages")
          .select("id,code,name")
          .in("id", stageIds);

        if (lsErr) throw lsErr;

        const stageLookup: Record<string, { code: string; name: string }> = {};
        leadStages.forEach((s: any) => {
          stageLookup[s.id] = { code: s.code, name: s.name };
        });

        const idCodeMap: Record<string, string> = {};
        const formatted = stageLinks.map((ps: any) => {
          const stageInfo = stageLookup[ps.stage_id] || { code: "", name: "" };
          if (ps.stage_id && stageInfo.code) {
            idCodeMap[ps.stage_id] = stageInfo.code;
          }
          return {
            id: stageInfo.code,
            label: stageInfo.name,
            color: stageColorMap[stageInfo.code] || "#6b7280",
            sort_order: ps.sort_order,
            probability: ps.probability,
            is_won: ps.is_won,
            is_lost: ps.is_lost,
          };
        });

        formatted.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

        setPipelineStages(formatted);
        setStageIdCodeMap(idCodeMap);
      } catch (err) {
        console.error("Failed to fetch pipeline:", err);
        setPipelineStages(DEFAULT_STAGES);
      } finally {
        setLoading(false);
      }
    };

    fetchPipeline();
  }, []);

  // Use pipeline stages from DB, or fall back to defaults
  const stages = pipelineStages.length > 0 ? pipelineStages : DEFAULT_STAGES;

  // Enrich lead data and group by stage
  const leadsByStage = useMemo(() => {
    const grouped: Record<string, any[]> = {};

    stages.forEach((stage) => {
      grouped[stage.id] = [];
    });

    if (leadData && leadData.length > 0) {
      leadData.forEach((lead: any) => {
        // Determine the stage code for this lead
        let stageCode: string | undefined;

        // 1. Try pipeline_stage_id → idCodeMap (UUID → code)
        if (lead.pipeline_stage_id && stageIdCodeMap[lead.pipeline_stage_id]) {
          stageCode = stageIdCodeMap[lead.pipeline_stage_id];
        }

        // 2. If status is already a Krayin stage code
        if (!stageCode && lead.status) {
          stageCode = statusToStageMap[lead.status] || lead.status;
        }

        if (stageCode && grouped[stageCode]) {
          grouped[stageCode].push(lead);
        }
      });
    }

    return grouped;
  }, [leadData, stageIdCodeMap, stages]);

  const calculateStageValue = (leads: any[]) => {
    return leads.reduce((sum, lead) => {
      const value = lead.custom_fields?.estimated_value || lead.estimated_value || 0;
      return sum + (parseFloat(value) || 0);
    }, 0);
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    const sourceStage = source.droppableId;
    const destStage = destination.droppableId;
    if (sourceStage === destStage) return;

    const sourceLeads = Array.from(leadsByStage[sourceStage] || []);
    const movedLead = sourceLeads.find((l: any) => String(l.id) === draggableId);
    if (!movedLead) return;

    const destStageCode = destStage;
    const originalStageCode = sourceStage;

    // Optimistic update
    const updatedLead = { ...movedLead, status: destStageCode, pipeline_stage_code: destStageCode };
    setLeadData((prev: any[]) =>
      prev.map((lead) =>
        String(lead.id) === draggableId ? updatedLead : lead
      )
    );

    try {
      const { data: stageData, error: stageErr } = await supabase
        .from("lead_stages")
        .select("id")
        .eq("code", destStageCode)
        .single();

      if (stageErr) throw stageErr;

      const { data: pipelineData, error: pipeErr } = await supabase
        .from("lead_pipelines")
        .select("id")
        .eq("is_default", true)
        .single();

      if (pipeErr) throw pipeErr;

      const { error: updateErr } = await supabase
        .from("leads")
        .update({
          pipeline_id: pipelineData.id,
          pipeline_stage_id: stageData.id,
          status: destStageCode,
        })
        .eq("id", draggableId);

      if (updateErr) throw updateErr;

      if (onStageChange) onStageChange(draggableId, destStageCode);
    } catch (err) {
      console.error("Failed to update lead stage:", err);
      // Revert optimistic update
      setLeadData((prev: any[]) =>
        prev.map((lead) =>
          String(lead.id) === draggableId ? { ...movedLead, status: originalStageCode } : lead
        )
      );
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  const pipelineStagesNonTerminal = stages.filter((s) => !s.is_won && !s.is_lost);
  const terminalStages = stages.filter((s) => s.is_won || s.is_lost);

  return (
    <div style={{ overflowX: "auto", padding: 8 }}>
      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Pipeline stages row */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          {pipelineStagesNonTerminal.map((stage) => {
            const stageLeads = leadsByStage[stage.id] || [];
            const stageValue = calculateStageValue(stageLeads);
            const maxCount = Math.max(...stages.map((s) => (leadsByStage[s.id] || []).length), 1);
            const progressPercent = (stageLeads.length / maxCount) * 100;

            return (
              <div key={stage.id} style={{ flex: "1 1 220px", minWidth: 220, backgroundColor: "#f9fafb", borderRadius: 8, padding: 12, border: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: stage.color }}>{stage.label}</Typography>
                  <Typography variant="caption" color="text.secondary">({stageLeads.length})</Typography>
                </div>
                <Typography variant="body2" sx={{ fontWeight: 600, marginBottom: 4 }}>{stageValue.toLocaleString()} د.إ</Typography>
                <div style={{ height: 4, backgroundColor: "#e5e7eb", borderRadius: 2, overflow: "hidden", marginBottom: 12 }}>
                  <div style={{ width: `${progressPercent}%`, height: "100%", backgroundColor: stage.color, borderRadius: 2 }} />
                </div>
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} style={{ minHeight: 40, backgroundColor: snapshot.isDraggingOver ? "rgba(59, 130, 246, 0.05)" : "transparent", borderRadius: 4 }}>
                      {stageLeads.map((lead: any, index: number) => (
                        <Draggable key={String(lead.id)} draggableId={String(lead.id)} index={index}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={{ ...provided.draggableProps.style, opacity: snapshot.isDragging ? 0.7 : 1, transform: snapshot.isDragging ? "rotate(2deg)" : "none" }}>
                              <LeadCard lead={lead} stage={stage} onClick={() => onEdit(String(lead.id))} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>

        {/* Terminal stages (Won / Lost) */}
        {terminalStages.length > 0 && (
          <div style={{ display: "flex", gap: 16 }}>
            {terminalStages.map((stage: any) => {
              const stageLeads = leadsByStage[stage.id] || [];
              const stageValue = calculateStageValue(stageLeads);
              return (
                <div key={stage.id} style={{ flex: "1 1 220px", minWidth: 220, backgroundColor: "#f9fafb", borderRadius: 8, padding: 12, border: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: stage.color }}>{stage.label}</Typography>
                    <Typography variant="caption" color="text.secondary">({stageLeads.length})</Typography>
                  </div>
                  <Typography variant="body2" sx={{ fontWeight: 600, marginBottom: 12 }}>{stageValue.toLocaleString()} د.إ</Typography>
                  <div style={{ minHeight: 40 }}>
                    {stageLeads.map((lead: any) => (
                      <div key={String(lead.id)} onClick={() => onEdit(String(lead.id))} style={{ cursor: "pointer", marginBottom: 8 }}>
                        <LeadCard lead={lead} stage={stage} onClick={() => onEdit(String(lead.id))} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DragDropContext>
    </div>
  );
};
