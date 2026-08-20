import { useRecordContext } from "react-admin";
import { Chip } from "@mui/material";

// Status configurations with Krayin-style colors
const STATUS_CONFIGS: Record<string, Record<string, { label: string; color: string }>> = {
  lead_status: {
    new: { label: "New", color: "#3b82f1" },
    contacted: { label: "Contacted", color: "#a78bfa" },
    qualified: { label: "Qualified", color: "#22c55e" },
    unqualified: { label: "Unqualified", color: "#f59e0b" },
    converted: { label: "Converted", color: "#22c55e" },
    lost: { label: "Lost", color: "#ef4444" },
  },
  opportunity_stage: {
    prospecting: { label: "Prospecting", color: "#6b7280" },
    qualification: { label: "Qualification", color: "#3b82f1" },
    proposal: { label: "Proposal", color: "#a78bfa" },
    negotiation: { label: "Negotiation", color: "#f59e0b" },
    closed_won: { label: "Closed Won", color: "#22c55e" },
    closed_lost: { label: "Closed Lost", color: "#ef4444" },
  },
  quote_status: {
    draft: { label: "Draft", color: "#6b7280" },
    sent: { label: "Sent", color: "#3b82f1" },
    viewed: { label: "Viewed", color: "#a78bfa" },
    accepted: { label: "Accepted", color: "#22c55e" },
    rejected: { label: "Rejected", color: "#ef4444" },
    expired: { label: "Expired", color: "#f59e0b" },
    revised: { label: "Revised", color: "#6b7280" },
  },
  quote_approval: {
    pending: { label: "Pending", color: "#f59e0b" },
    approved: { label: "Approved", color: "#22c55e" },
    rejected: { label: "Rejected", color: "#ef4444" },
  },
  order_status: {
    draft: { label: "Draft", color: "#6b7280" },
    confirmed: { label: "Confirmed", color: "#3b82f1" },
    processing: { label: "Processing", color: "#a78bfa" },
    shipped: { label: "Shipped", color: "#22c55e" },
    delivered: { label: "Delivered", color: "#22c55e" },
    cancelled: { label: "Cancelled", color: "#ef4444" },
  },
  invoice_status: {
    draft: { label: "Draft", color: "#6b7280" },
    sent: { label: "Sent", color: "#3b82f1" },
    viewed: { label: "Viewed", color: "#a78bfa" },
    partial: { label: "Partial", color: "#f59e0b" },
    paid: { label: "Paid", color: "#22c55e" },
    overdue: { label: "Overdue", color: "#ef4444" },
    void: { label: "Void", color: "#6b7280" },
    cancelled: { label: "Cancelled", color: "#ef4444" },
  },
};

/**
 * StatusField - for use in react-admin Datagrid columns.
 * Renders a colored status badge with dot indicator.
 */
export const StatusField = ({ source, type = "lead_status" }: { source: string; type?: string }) => {
  const record = useRecordContext();
  const value = record?.[source] as string;

  if (!value) return null;

  const config = STATUS_CONFIGS[type]?.[value] || { label: value, color: "#6b7280" };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: config.color,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>
        {config.label}
      </span>
    </div>
  );
};

/**
 * Standalone StatusBadge - for use outside of Datagrid rows
 */
export const StatusBadge = ({ status, type = "lead_status" }: { status: string; type?: string }) => {
  const config = STATUS_CONFIGS[type]?.[status] || { label: status, color: "#6b7280" };

  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        backgroundColor: config.color,
        color: "#ffffff",
        fontWeight: 600,
        height: 20,
        fontSize: "0.7rem",
        borderRadius: 1,
      }}
    />
  );
};
