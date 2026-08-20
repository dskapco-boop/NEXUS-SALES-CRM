import React from "react";
import { useRecordContext } from "react-admin";
import { useTheme } from "@mui/material";

// Lead card component for Kanban view - matches Krayin's card style
export const LeadCard = ({ lead, onClick }: any) => {
  const { palette } = useTheme();

  // Status dot colors
  const statusColors: Record<string, string> = {
    new: "#3b82f1",
    contacted: "#a78bfa",
    qualified: "#22c55e",
    unqualified: "#f59e0b",
    converted: "#22c55e",
    lost: "#ef4444",
  };

  const urgencyColors: Record<string, string> = {
    urgent: "#ef4444",
    high: "#f97316",
    medium: "#f59e0b",
    low: "#22c55e",
  };

  const urgencyLabels: Record<string, string> = {
    urgent: "Urgent",
    high: "High",
    medium: "Medium",
    low: "Low",
  };

  // Generate avatar initials
  const initials = `${lead.first_name?.charAt(0) || ""}${lead.last_name?.charAt(0) || ""}`.toUpperCase() || "??";
  const avatarBg = `hsl(${Math.random() * 360}, 70%, 80%)`;

  const statusColor = statusColors[lead.status] || "#6b7280";
  const urgency = lead.custom_fields?.urgency;
  const urgencyColor = urgencyColors[urgency] || "#6b7280";
  const isUrgent = urgency === "urgent";

  const statusLabels: Record<string, string> = {
    new: "New",
    contacted: "Contacted",
    qualified: "Qualified",
    unqualified: "Unqualified",
    converted: "Converted",
    lost: "Lost",
  };

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: "#fff",
        border: isUrgent ? "2px solid #ef4444" : "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        cursor: "pointer",
        boxShadow: isUrgent ? "0 2px 4px rgba(239, 68, 68, 0.2)" : "0 1px 3px rgba(0,0,0,0.1)",
        transition: "transform 0.1s, box-shadow 0.1s",
      }}
    >
      {/* Header row: avatar + name + urgency badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: avatarBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 600,
              color: "#374151",
            }}
          >
            {initials}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{lead.company || "Unknown Company"}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              {lead.first_name} {lead.last_name}
              {lead.job_title && ` • ${lead.job_title}`}
            </div>
          </div>
        </div>

        {isUrgent && (
          <div
            style={{
              backgroundColor: urgencyColor,
              color: "white",
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 4,
              whiteSpace: "nowrap",
            }}
          >
            {urgencyLabels[urgency]}
          </div>
        )}
      </div>

      {/* Status section */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: statusColor,
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 600 }}>
          {statusLabels[lead.status] || lead.status}
        </span>
      </div>

      {/* Metadata */}
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
        {lead.source && <div>📊 {lead.source.replace("_", " ")}</div>}
        {lead.score !== undefined && lead.score !== null && <div>🎯 AI Score: {lead.score}/100</div>}
      </div>

      {/* Tags */}
      {lead.custom_fields?.iso_standards && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
          <span
            style={{
              fontSize: 10,
              backgroundColor: "#f3f4f6",
              color: "#4b5563",
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            ISO {lead.custom_fields.iso_standards}
          </span>
        </div>
      )}

      {/* Created date */}
      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6, textAlign: "right" }}>
        {new Date(lead.created_at).toLocaleDateString()}
      </div>
    </div>
  );
};
