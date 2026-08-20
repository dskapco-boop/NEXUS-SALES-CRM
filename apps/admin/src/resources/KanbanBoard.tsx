import React, { useState } from "react";
import { Box, Typography, Paper, useTheme } from "@mui/material";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { StatusField } from "../components/StatusBadge";
import { LeadCard } from "./LeadCard";

interface KanbanBoardProps {
  data: any[];
  stages: { id: string; label: string; color: string }[];
  onEdit: (id: string) => void;
  onStageChange?: (leadId: string, newStage: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ data, stages, onEdit, onStageChange }) => {
  const [leadData, setLeadData] = useState(data || []);

  // Group leads by stage
  const leadsByStage = stages.reduce((acc: Record<string, any[]>, stage) => {
    acc[stage.id] = leadData.filter((lead: any) => lead.status === stage.id);
    return acc;
  }, {});

  // Handle drag end
  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    // Dropped outside a droppable area - ignore
    if (!destination) return;

    const sourceStage = source.droppableId;
    const destStage = destination.droppableId;
    const sourceIndex = source.index;
    const destIndex = destination.index;

    // Same column reorder
    if (sourceStage === destStage) {
      const stageLeads = Array.from(leadsByStage[sourceStage]);
      const [reordered] = stageLeads.splice(sourceIndex, 1);
      stageLeads.splice(destIndex, 0, reordered);
      setLeadData((prev) => {
        const newData = prev.filter((lead: any) => lead.status !== sourceStage);
        return [...newData, ...stageLeads];
      });
      return;
    }

    // Moving between columns
    const sourceLeads = Array.from(leadsByStage[sourceStage] || []);
    const destLeads = Array.from(leadsByStage[destStage] || []);
    const [movedLead] = sourceLeads.splice(sourceIndex, 1);

    // Update the lead's status
    const updatedLead = { ...movedLead, status: destStage };

    destLeads.splice(destIndex, 0, updatedLead);

    // Update local state
    setLeadData((prev: any) => {
      return prev
        .filter((lead: any) => lead.id !== draggableId)
        .concat([updatedLead]);
    });

    // Call the stage change handler if provided
    if (onStageChange) {
      onStageChange(draggableId, destStage);
    }
  };

  return (
    <div style={{ overflowX: "auto", padding: 16 }}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div style={{ display: "flex", gap: 16, minHeight: 500 }}>
          {stages
            .filter((stage) => stage.id !== "converted" && stage.id !== "lost") // Don't show won/lost as drop targets for new drops
            .map((stage) => {
              const stageLeads = leadsByStage[stage.id] || [];
              const isPipelineColumn = ["new", "contacted", "qualified"].includes(stage.id);

              return (
                <div
                  key={stage.id}
                  style={{
                    flex: "1 1 240px",
                    minWidth: 240,
                    maxWidth: 320,
                    backgroundColor: "#f9fafb",
                    borderRadius: 8,
                    padding: 12,
                    borderTop: `3px solid ${stage.color}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: stage.color }}>
                      {stage.label}
                    </Typography>
                    <div
                      style={{
                        backgroundColor: stage.color,
                        color: "white",
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 10,
                      }}
                    >
                      {stageLeads.length}
                    </div>
                  </div>

                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          minHeight: 100,
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

          {/* Won/Lost columns (right side) */}
          {stages
            .filter((stage) => stage.id === "converted" || stage.id === "lost")
            .map((stage) => {
              const stageLeads = leadsByStage[stage.id] || [];

              return (
                <div
                  key={stage.id}
                  style={{
                    flex: "1 1 240px",
                    minWidth: 240,
                    maxWidth: 320,
                    backgroundColor: "#f9fafb",
                    borderRadius: 8,
                    padding: 12,
                    borderTop: `3px solid ${stage.color}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: stage.color }}>
                      {stage.label}
                    </Typography>
                    <div
                      style={{
                        backgroundColor: stage.color,
                        color: "white",
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 10,
                      }}
                    >
                      {stageLeads.length}
                    </div>
                  </div>
                  <div style={{ minHeight: 100 }}>
                    {stageLeads.map((lead: any) => (
                      <div key={lead.id} onClick={() => onEdit(String(lead.id))} style={{ cursor: "pointer", marginBottom: 8 }}>
                        <LeadCard lead={lead} onClick={() => onEdit(String(lead.id))} />
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
