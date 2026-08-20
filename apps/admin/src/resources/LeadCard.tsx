import React from "react";
import { useRecordContext } from "react-admin";
import { useTheme } from "@mui/material";

// Badge configurations matching Krayin's style
const BADGE_CONFIGS: Record<string, { label: string; color: string; bg: string }> = {
  urgent: { label: "Urgent Sale", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
  super_priority: { label: "Super Priority", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
  immediate_action: { label: "Immediate Action", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
  vip: { label: "VIP Client", color: "#22c55e", bg: "rgba(34, 197, 94, 0.1)" },
  requirement: { label: "Requirement", color: "#3b82f1", bg: "rgba(59, 130, 246, 0.1)" },
  enquiry: { label: "Enquiry", color: "#f59e0b", bg: "rgba(245, 152, 26, 0.1)" },
  quote: { label: "Quote", color: "#f59e0b", bg: "rgba(245, 152, 26, 0.1)" },
};

// Urgency label mappings
const URGENCY_LABELS: Record<string, string> = {
  urgent: "Urgent Sale",
  high: "High Priority",
  medium: "Medium",
  low: "Low",
};

const URGENCY_COLORS: Record<string, string> = {
  urgent: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#22c55e",
};

// Lead card component for Kanban - matches Krayin's card style
export const LeadCard = ({ lead, stage, onClick }: any) => {
  // Generate avatar initials
  const initials = `${lead.first_name?.charAt(0) || ""}${lead.last_name?.charAt(0) || ""}`.toUpperCase() || "??";
  const avatarBg = `hsl(${Math.random() * 360}, 70%, 80%)`;

  const statusColor = stage?.color || "#6b7280";
  const urgency = lead.custom_fields?.urgency;
  const urgencyColor = URGENCY_COLORS[urgency] || "#6b7280";
  const isUrgent = urgency === "urgent";

  // Get tags from lead data
  const tags = lead.custom_fields?.iso_standards
    ? [lead.custom_fields.iso_standards]
    : lead.tags
    ? Array.isArray(lead.tags)
      ? lead.tags
      : lead.tags.split(",")
    : [];

  // Get badge from custom_fields
  const badgeKey = lead.custom_fields?.badge || lead.custom_fields?.urgency;
  const badgeConfig = badgeKey ? BADGE_CONFIGS[badgeKey] : null;

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#fff",
    border: isUrgent ? "2px solid #ef4444" : "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    cursor: "pointer",
    boxShadow: isUrgent ? "0 2px 4px rgba(239, 68, 68, 0.2)" : "0 1px 3px rgba(0,0,0,0.1)",
    transition: "transform 0.1s, box-shadow 0.1s",
  };

  const cardHoverStyle = {
    ...cardStyle,
    transform: "translateY(-1px)",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  };

  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={isHovered ? cardHoverStyle : cardStyle}
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
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              {lead.company || "Unknown Company"}
            </div>
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
            {URGENCY_LABELS[urgency]}
          </div>
        )}
      </div>

      {/* Status section - subject/requirement */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: statusColor }} />
        <span style={{ fontSize: 12, fontWeight: 600 }}>
          {stage?.label || lead.status}
        </span>
      </div>

      {/* Notes/subject line */}
      {lead.notes && (
        <div style={{ fontSize: 12, color: "#374151", marginBottom: 8, fontWeight: 500 }}>
          {lead.notes.length > 60 ? `${lead.notes.substring(0, 60)}...` : lead.notes}
        </div>
      )}

      {/* Metadata */}
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
        {lead.source && <div>📊 {lead.source.replace("_", " ")}</div>}
        {lead.score !== undefined && lead.score !== null && <div>🎯 AI Score: {lead.score}/100</div>}
        {lead.email && <div>✉️ {lead.email}</div>}
      </div>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6, marginBottom: 6 }}>
          {tags.slice(0, 3).map((tag: string, i: number) => (
            <span
              key={i}
              style={{
                fontSize: 10,
                backgroundColor: "#f3f4f6",
                color: "#4b5563",
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              {tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Badge (e.g., VIP Client, Super Priority) */}
      {badgeConfig && !isUrgent && (
        <div style={{ marginTop: 4, marginBottom: 6 }}>
          <span
            style={{
              fontSize: 10,
              backgroundColor: badgeConfig.bg,
              color: badgeConfig.color,
              padding: "2px 6px",
              borderRadius: 4,
              fontWeight: 600,
            }}
          >
            {badgeConfig.label}
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
