import { Chip, Box } from "@mui/material";

interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; color: "success" | "warning" | "default" | "error" | "info" | "primary" | "secondary" }> = {
  new: { label: "New", color: "info" },
  contacted: { label: "Contacted", color: "primary" },
  qualified: { label: "Qualified", color: "success" },
  unqualified: { label: "Unqualified", color: "warning" },
  converted: { label: "Converted", color: "success" },
  lost: { label: "Lost", color: "error" },
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusConfig[status] || { label: status, color: "default" };
  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      sx={{
        backgroundColor: ({ palette }) => {
          switch (config.color) {
            case "success": return palette.success.main;
            case "warning": return palette.warning.main;
            case "error": return palette.error.main;
            case "info": return palette.info.main;
            case "primary": return palette.primary.main;
            case "secondary": return palette.secondary.main;
            default: return palette.grey[500];
          }
        },
        color: "white",
        fontWeight: 600,
        height: 20,
        fontSize: "0.7rem",
      }}
    />
  );
};
