import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, useTheme, CircularProgress } from "@mui/material";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { LeadCard } from "./LeadCard";
import { getSupabaseClient } from "@nexus-crm/api";

const supabase = getSupabaseClient();

interface KanbanBoardProps {
  data: any[];
  onEdit: (id: string) => void;
  onStageChange?: (leadId: string, newStageCode: string) => void;
}

// Default Krayin-style stages (fallback if DB has no pipeline configured)
const DEFAULT_STAGES = [
  { id: "new", label: "New", color: "#6b7280" },
  { id: "follow_up", label: "Follow Up", color: "#3b82f1" },
  { id: "prospect", label: "Prospect", color: "#8b5cf6" },
  { id: "negotiation", label: "Negotiation", color: "#f59e0b" },
  { id: "won", label: "Won", color: "#10b981" },
  { id: "lost", label: "Lost", color: "#ef4444" },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ data, onEdit, onStageChange }) => {
  const [leadData, setLeadData] = useState(data || []);
  const [pipelineStages, setPipelineStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageIdCodeMap, setStageIdCodeMap] = useState<Record<string, string>>({});
  const theme = useTheme();

  // Fetch configurable pipeline stages from Supabase
  useEffect(() => {
    const fetchPipeline = async () => {
      setLoading(true);
      try {
        // Get default pipeline
        const { data: pipeline, error: pipeErr } = await supabase
          .from("lead_pipelines")
          .select("*")
          .eq("is_default", true)
          .single();

        if (pipeErr || !pipeline) throw pipeErr || new Error("No default pipeline found");

        // Get stage links ordered by sort_order (with stage code/name via separate query)
        const { data: stageLinks, error: stageErr } = await supabase
          .from("pipeline_stages")
          .select("*")
          .eq("pipeline_id", pipeline.id)
          .order("sort_order", { ascending: true });

        if (stageErr) throw stageErr;

        // Get lead_stages separately (avoids PostgREST nested select 406 issue)
        const stageIds = stageLinks.map((ps: any) => ps.stage_id);
        const { data: leadStages, error: lsErr } = await supabase
          .from("lead_stages")
          .select("id,code,name")
          .in("id", stageIds);

        if (lsErr) throw lsErr;

        // Build stage lookup: stageId → { code, name }
        const stageLookup: Record<string, { code: string; name: string }> = {};
        leadStages.forEach((s: any) => {
          stageLookup[s.id] = { code: s.code, name: s.name };
        });

        // Build stage code lookup: stageId → stageCode
        const idCodeMap: Record<string, string> = {};
        const stageColorMap: Record<string, string> = {
          new: "#6b7280",      // gray
          follow_up: "#3b82f1",  // blue
          prospect: "#8b5cf6",  // purple
          negotiation: "#f59e0b", // amber
          won: "#10b981",       // green
          lost: "#ef4444",      // red
        };
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

        setPipelineStages(formatted);
        setStageIdCodeMap(idCodeMap);

        // Also enrich the incoming lead data with stage codes
        if (data && data.length > 0) {
          const enrichedData = data.map((lead: any) => {
            const stageCode = idCodeMap[lead.pipeline_stage_id];
            return {
              ...lead,
              pipeline_stage: {
                code: stageCode || undefined,
              },
            };
          });
          setLeadData(enrichedData);
        }
      } catch (err) {
        console.error("Failed to fetch pipeline:", err);
        setPipelineStages(DEFAULT_STAGES);
        // Even on error, try to enrich with status mapping
        const statusToStageMap: Record<string, string> = {
          new: "new",
          contacted: "follow_up",
          qualified: "prospect",
          unqualified: "lost",
          converted: "won",
          lost: "lost",
        };
        if (data && data.length > 0) {
          setLeadData(data.map((lead: any) => ({
            ...lead,
            _mapped_stage: statusToStageMap[lead.status],
          })));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPipeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Use pipeline stages from DB, or fall back to defaults
  const stages = pipelineStages.length > 0 ? pipelineStages : DEFAULT_STAGES;

  // Map old ENUM status values to Krayin pipeline stage codes
  const statusToStageMap: Record<string, string> = {
    new: "new",
    contacted: "follow_up",
    qualified: "prospect",
    unqualified: "lost",
    converted: "won",
    lost: "lost",
  };

  // Group leads by stage code
  // Checks: pipeline_stage.code → _mapped_stage → status → mapped status
  const leadsByStage = stages.reduce((acc: Record<string, any[]>, stage) => {
    acc[stage.id] = leadData.filter((lead: any) => {
      // First try pipeline_stage code (enriched from DB lookup)
      if (lead.pipeline_stage?.code) {
        return lead.pipeline_stage.code === stage.id;
      }
      // Next try _mapped_stage (status → Krayin stage code)
      if (lead._mapped_stage) {
        return lead._mapped_stage === stage.id;
      }
      // Next try direct status value match
      if (lead.status === stage.id) {
        return true;
      }
      // Finally try mapped status values
      const mapped = statusToStageMap[lead.status];
      return mapped === stage.id;
    });
    return acc;
  }, {});

  // Calculate total value for a stage
  const calculateStageValue = (leads: any[]) => {
    return leads.reduce((sum, lead) => {
      const value = lead.custom_fields?.estimated_value || lead.estimated_value || 0;
      return sum + (parseFloat(value) || 0);
    }, 0);
  };

  // Handle drag end — updates the database
  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    const sourceStage = source.droppableId;
    const destStage = destination.droppableId;

    if (sourceStage === destStage) return;

    // Get the moved lead
    const sourceLeads = Array.from(leadsByStage[sourceStage] || []);
    const [movedLead] = sourceLeads.filter((l: any) => String(l.id) === draggableId);

    if (!movedLead) return;

    // Find the stage code from destStage (which is the stage.id = code)
    const destStageCode = destStage;

    // Update local state immediately (optimistic update)
    // Note: pipeline_stage_id stays as-is locally, we just track status for display
    const updatedLead = { ...movedLead, status: destStageCode };
    setLeadData((prev: any[]) => {
      return prev.map((lead) =>
        String(lead.id) === draggableId ? updatedLead : lead
      );
    });

    // Update the database
    try {
      // Get the stage UUID from the stage code
      const { data: stageData, error: stageErr } = await supabase
        .from("lead_stages")
        .select("id")
        .eq("code", destStageCode)
        .single();

      if (stageErr) throw stageErr;

      // Get default pipeline ID
      const { data: pipelineData, error: pipeErr } = await supabase
        .from("lead_pipelines")
        .select("id")
        .eq("is_default", true)
        .single();

      if (pipeErr) throw pipeErr;

      // Update the lead with the correct UUID
      const { error: updateErr } = await supabase
        .from("leads")
        .update({
          pipeline_id: pipelineData.id,
          pipeline_stage_id: stageData.id,
          status: destStageCode,
        })
        .eq("id", draggableId);

      if (updateErr) throw updateErr;

      // Update local state with the correct UUID
      setLeadData((prev: any[]) => {
        return prev.map((lead) =>
          String(lead.id) === draggableId
            ? { ...updatedLead, pipeline_stage_id: stageData.id }
            : lead
        );
      });

      if (onStageChange) {
        onStageChange(draggableId, destStageCode);
      }
    } catch (err) {
      console.error("Failed to update lead stage:", err);
      // Revert optimistic update
      setLeadData((prev: any[]) => {
        return prev.map((lead) =>
          String(lead.id) === draggableId ? { ...movedLead } : lead
        );
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  // Split stages into pipeline stages and terminal stages (Won/Lost)
  const pipelineStagesNonTerminal = stages.slice(0, 4); // New, Follow Up, Prospect, Negotiation
  const wonStage = stages.find((s) => s.is_won || s.id === "won" || s.id === "converted");
  const lostStage = stages.find((s) => s.is_lost || s.id === "lost");
  const terminalStages = [wonStage, lostStage].filter(Boolean);

  return (
    <div style={{ overflowX: "auto", padding: 8 }}>
      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Pipeline stages row */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          {pipelineStagesNonTerminal.map((stage) => {
            const stageLeads = leadsByStage[stage.id] || [];
            const stageValue = calculateStageValue(stageLeads);
            const maxCount = Math.max(...stages.map((s) => (leadsByStage[s.id] || []).length));
            const progressPercent = maxCount > 0 ? (stageLeads.length / maxCount) * 100 : 0;

            return (
              <div
                key={stage.id}
                style={{
                  flex: "1 1 220px",
                  minWidth: 220,
                  backgroundColor: "#f9fafb",
                  borderRadius: 8,
                  padding: 12,
                  border: "1px solid #e5e7eb",
                }}
              >
                {/* Column header: stage name + count + total value */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: stage.color }}>
                    {stage.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({stageLeads.length})
                  </Typography>
                </div>

                {/* Total value */}
                <Typography variant="body2" sx={{ fontWeight: 600, marginBottom: 4 }}>
                  {stageValue.toLocaleString()} د.إ
                </Typography>

                {/* Progress bar */}
                <div
                  style={{
                    height: 4,
                    backgroundColor: "#e5e7eb",
                    borderRadius: 2,
                    overflow: "hidden",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: `${progressPercent}%`,
                      height: "100%",
                      backgroundColor: stage.color,
                      borderRadius: 2,
                    }}
                  />
                </div>

                {/* Add lead button */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    color: "#6b7280",
                    fontSize: 12,
                    cursor: "pointer",
                    padding: 4,
                  }}
                  onClick={() => {
                    window.location.hash = `#/leads/create?status=${stage.id}`;
                  }}
                >
                  <span>+</span> <span>Add lead</span>
                </div>

                {/* Droppable area */}
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        minHeight: 40,
                        backgroundColor: snapshot.isDraggingOver ? "rgba(59, 130, 246, 0.05)" : "transparent",
                        borderRadius: 4,
                      }}
                    >
                      {stageLeads.map((lead: any, index: number) => (
                        <Draggable
                          key={lead.id}
                          draggableId={String(lead.id)}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.7 : 1,
                                transform: snapshot.isDragging ? "rotate(2deg)" : "none",
                              }}
                            >
                              <LeadCard
                                lead={lead}
                                stage={stage}
                                onClick={() => onEdit(String(lead.id))}
                              />
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
        <div style={{ display: "flex", gap: 16 }}>
          {terminalStages.map((stage: any) => {
            if (!stage) return null;
            const stageLeads = leadsByStage[stage.id] || [];
            const stageValue = calculateStageValue(stageLeads);

            return (
              <div
                key={stage.id}
                style={{
                  flex: "1 1 220px",
                  minWidth: 220,
                  backgroundColor: "#f9fafb",
                  borderRadius: 8,
                  padding: 12,
                  border: "1px solid #e5e7eb",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: stage.color }}>
                    {stage.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({stageLeads.length})
                  </Typography>
                </div>

                <Typography variant="body2" sx={{ fontWeight: 600, marginBottom: 12 }}>
                  {stageValue.toLocaleString()} د.إ
                </Typography>

                {/* No droppable for terminal stages */}
                <div style={{ minHeight: 40 }}>
                  {stageLeads.map((lead: any) => (
                    <div key={lead.id} onClick={() => onEdit(String(lead.id))} style={{ cursor: "pointer", marginBottom: 8 }}>
                      <LeadCard
                        lead={lead}
                        stage={stage}
                        onClick={() => onEdit(String(lead.id))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};