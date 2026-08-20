import React, { useState } from "react";
import { Box, Typography, Paper, useTheme } from "@mui/material";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { LeadCard } from "./LeadCard";

interface KanbanBoardProps {
  data: any[];
  stages: { id: string; label: string; color: string }[];
  onEdit: (id: string) => void;
  onStageChange?: (leadId: string, newStage: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ data, stages, onEdit, onStageChange }) => {
  const [leadData, setLeadData] = useState(data || []);
  const theme = useTheme();

  // Group leads by stage
  const leadsByStage = stages.reduce((acc: Record<string, any[]>, stage) => {
    acc[stage.id] = leadData.filter((lead: any) => lead.status === stage.id);
    return acc;
  }, {});

  // Calculate total value for a stage
  const calculateStageValue = (leads: any[]) => {
    return leads.reduce((sum, lead) => {
      const value = lead.custom_fields?.estimated_value || lead.estimated_value || 0;
      return sum + (parseFloat(value) || 0);
    }, 0);
  };

  // Handle drag end
  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    const sourceStage = source.droppableId;
    const destStage = destination.droppableId;
    const sourceIndex = source.index;
    const destIndex = destination.index;

    // Same column reorder
    if (sourceStage === destStage) {
      const stageLeads = Array.from(leadsByStage[sourceStage] || []);
      const [reordered] = stageLeads.splice(sourceIndex, 1);
      stageLeads.splice(destIndex, 0, reordered);
      return;
    }

    // Moving between columns
    const sourceLeads = Array.from(leadsByStage[sourceStage] || []);
    const destLeads = Array.from(leadsByStage[destStage] || []);
    const [movedLead] = sourceLeads.splice(sourceIndex, 1);

    // Update the lead's status
    const updatedLead = { ...movedLead, status: destStage };

    // Update local state
    setLeadData((prev: any[]) => {
      return prev
        .filter((lead: any) => lead.id !== draggableId)
        .concat([updatedLead]);
    });

    // Call the stage change handler if provided
    if (onStageChange) {
      onStageChange(draggableId, destStage);
    }
  };

  // Split stages into pipeline stages and terminal stages (Won/Lost)
  const pipelineStages = stages.slice(0, 4); // New, Follow Up, Prospect, Negotiation
  const wonStage = stages.find((s) => s.id === "won") || stages.find((s) => s.id === "converted");
  const lostStage = stages.find((s) => s.id === "lost");
  const terminalStages = [wonStage, lostStage].filter(Boolean);

  return (
    <div style={{ overflowX: "auto", padding: 8 }}>
      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Pipeline stages row */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          {pipelineStages.map((stage) => {
            const stageLeads = leadsByStage[stage.id] || [];
            const stageValue = calculateStageValue(stageLeads);
            const maxCount = Math.max(...stages.map((s) => (leadsByStage[s.id] || []).length));
            const progressPercent = maxCount > 0 ? (stageLeads.length / maxCount) * 100 : 0;

            return (
              <div
                key={stage.id}
                style={{
                  flex: "1 1 200px",
                  minWidth: 200,
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
                  ${stageValue.toLocaleString()}
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
                  flex: "1 1 200px",
                  minWidth: 200,
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
                  ${stageValue.toLocaleString()}
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
