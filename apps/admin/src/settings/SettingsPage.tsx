import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  useTheme,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon } from "@mui/icons-material";
import { getSupabaseClient } from "@nexus-crm/api";

const supabase = getSupabaseClient();

interface PipelineStage {
  id: string;
  code: string;
  name: string;
  probability: number;
  is_won: boolean;
  is_lost: boolean;
  sort_order: number;
}

interface Pipeline {
  id: string;
  name: string;
  is_default: boolean;
  is_active: boolean;
  rotten_days: number;
  pipeline_stages?: { stage_id: string; sort_order: number; probability: number }[];
  stages?: PipelineStage[];
}

interface SystemSettings {
  currency: string;
  timezone: string;
  language: string;
  lead_assignment: string;
}

export const SettingsPage: React.FC = () => {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    currency: "AED",
    timezone: "Asia/Dubai",
    language: "en",
    lead_assignment: "round_robin",
  });
  const theme = useTheme();

  const currencies = [
    { code: "AED", name: "UAE Dirham (د.إ)" },
    { code: "SAR", name: "Saudi Riyal (﷼)" },
    { code: "USD", name: "US Dollar ($)" },
    { code: "EUR", name: "Euro (€)" },
    { code: "GBP", name: "British Pound (£)" },
  ];

  const timezones = [
    "Asia/Dubai",
    "Asia/Riyadh",
    "Asia/Sharjah",
    "Asia/Kolkata",
    "Europe/Berlin",
    "Europe/London",
    "America/New_York",
  ];

  // Fetch pipelines
  useEffect(() => {
    const fetchPipelines = async () => {
      const { data: pipelineData, error: pipeErr } = await supabase
        .from("lead_pipelines")
        .select("*")
        .order("name");

      if (pipeErr) {
        console.error("Failed to fetch pipelines:", pipeErr);
        return;
      }

      const pipelinesWithStages = await Promise.all(
        pipelineData.map(async (p: any) => {
          const { data: stageLinks, error: slErr } = await supabase
            .from("pipeline_stages")
            .select("*")
            .eq("pipeline_id", p.id)
            .order("sort_order");

          if (slErr) {
            console.error("Failed to fetch pipeline stages:", slErr);
            return { ...p, stages: [] };
          }

          const stageIds = stageLinks.map((sl: any) => sl.stage_id);
          const { data: leadStages, error: lsErr } = await supabase
            .from("lead_stages")
            .select("id,code,name")
            .in("id", stageIds);

          if (lsErr) return { ...p, stages: [] };

          const stageLookup: Record<string, any> = {};
          leadStages.forEach((s: any) => {
            stageLookup[s.id] = s;
          });

          const stages = stageLinks.map((sl: any) => ({
            id: sl.stage_id,
            code: stageLookup[sl.stage_id]?.code || "",
            name: stageLookup[sl.stage_id]?.name || "",
            probability: sl.probability,
            is_won: sl.is_won,
            is_lost: sl.is_lost,
            sort_order: sl.sort_order,
          }));

          return { ...p, stages: stages || [], pipeline_stages: stageLinks };
        })
      );

      setPipelines(pipelinesWithStages);
    };

    fetchPipelines();
  }, []);

  const handleStageChange = (pipelineId: string, stageId: string, field: string, value: any) => {
    setPipelines(
      pipelines.map((pipeline) => {
        if (pipeline.id !== pipelineId) return pipeline;
        return {
          ...pipeline,
          stages: pipeline.stages?.map((stage) =>
            stage.id === stageId ? { ...stage, [field]: value } : stage
          ),
        };
      })
    );
  };

  const handleAddStage = (pipelineId: string) => {
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    const newStage = {
      id: `new-${Date.now()}`,
      code: `stage_${pipeline?.stages?.length || 0}`,
      name: "New Stage",
      probability: 25,
      is_won: false,
      is_lost: false,
      sort_order: pipeline?.stages?.length || 0,
    };

    setPipelines(
      pipelines.map((p) =>
        p.id === pipelineId
          ? { ...p, stages: [...(p.stages || []), newStage] }
          : p
      )
    );
  };

  const handleDeleteStage = (pipelineId: string, stageId: string) => {
    setPipelines(
      pipelines.map((p) =>
        p.id === pipelineId
          ? { ...p, stages: p.stages?.filter((s) => s.id !== stageId) || [] }
          : p
      )
    );
  };

  const handleSavePipeline = async (pipeline: Pipeline) => {
    if (!pipeline.stages) return;

    try {
      // Update pipeline
      const { error: pipeErr } = await supabase
        .from("lead_pipelines")
        .update({
          name: pipeline.name,
          is_default: pipeline.is_default,
          is_active: pipeline.is_active,
          rotten_days: pipeline.rotten_days,
        })
        .eq("id", pipeline.id);

      if (pipeErr) throw pipeErr;

      // Update stage links
      for (const stage of pipeline.stages) {
        const stageId = stage.code.startsWith("new-") ? undefined : stage.id;
        if (stageId) {
          const { error: slErr } = await supabase
            .from("pipeline_stages")
            .update({
              sort_order: stage.sort_order,
              probability: stage.probability,
              is_won: stage.is_won,
              is_lost: stage.is_lost,
            })
            .eq("pipeline_id", pipeline.id)
            .eq("stage_id", stage.id);

          if (slErr) console.error("Failed to update pipeline stage:", slErr);
        }
      }

      alert("Pipeline saved successfully!");
    } catch (err) {
      console.error("Failed to save pipeline:", err);
      alert("Failed to save pipeline. Check console for details.");
    }
  };

  const handleSaveSettings = async () => {
    // Save settings to a settings table or local storage
    localStorage.setItem("nexus_crm_settings", JSON.stringify(settings));
    alert("Settings saved!");
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
        ⚙️ Settings
      </Typography>

      <Grid container spacing={3}>
        {/* System Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="System Settings" />
            <CardContent>
              <FormControl fullWidth margin="normal">
                <InputLabel>Currency</InputLabel>
                <Select
                  value={settings.currency}
                  label="Currency"
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                >
                  {currencies.map((c) => (
                    <MenuItem key={c.code} value={c.code}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Timezone</InputLabel>
                <Select
                  value={settings.timezone}
                  label="Timezone"
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                >
                  {timezones.map((tz) => (
                    <MenuItem key={tz} value={tz}>
                      {tz}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Language</InputLabel>
                <Select
                  value={settings.language}
                  label="Language"
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="ar">Arabic</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Lead Assignment</InputLabel>
                <Select
                  value={settings.lead_assignment}
                  label="Lead Assignment"
                  onChange={(e) => setSettings({ ...settings, lead_assignment: e.target.value })}
                >
                  <MenuItem value="round_robin">Round Robin</MenuItem>
                  <MenuItem value="owner_based">Owner Based</MenuItem>
                  <MenuItem value="territory">Territory Based</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={true}
                    onChange={() => {}}
                  />
                }
                label="Enable AI Lead Scoring"
              />

              <Button
                variant="contained"
                onClick={handleSaveSettings}
                startIcon={<SaveIcon />}
                sx={{ mt: 2 }}
                fullWidth
              >
                Save System Settings
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Pipeline Management */}
        <Grid item xs={12} md={6}>
          {pipelines.map((pipeline) => (
            <Card key={pipeline.id} sx={{ mb: 3 }}>
              <CardHeader
                title={
                  <TextField
                    value={pipeline.name}
                    onChange={(e) =>
                      setPipelines(
                        pipelines.map((p) =>
                          p.id === pipeline.id ? { ...p, name: e.target.value } : p
                        )
                      )
                    }
                    variant="standard"
                    fullWidth
                  />
                }
                action={
                  <FormControlLabel
                    control={
                      <Switch
                        checked={pipeline.is_default}
                        onChange={(e) =>
                          setPipelines(
                            pipelines.map((p) =>
                              p.id === pipeline.id ? { ...p, is_default: e.target.checked } : p
                            )
                          )
                        }
                      />
                    }
                    label="Default"
                  />
                }
              />
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Pipeline Stages</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Stage Name</TableCell>
                        <TableCell>Probability (%)</TableCell>
                        <TableCell>Won</TableCell>
                        <TableCell>Lost</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pipeline.stages?.map((stage) => (
                        <TableRow key={stage.id}>
                          <TableCell>
                            <TextField
                              value={stage.name}
                              onChange={(e) =>
                                handleStageChange(pipeline.id, stage.id, "name", e.target.value)
                              }
                              variant="standard"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={stage.probability}
                              onChange={(e) =>
                                handleStageChange(
                                  pipeline.id,
                                  stage.id,
                                  "probability",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              variant="standard"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={stage.is_won}
                              onChange={(e) =>
                                handleStageChange(pipeline.id, stage.id, "is_won", e.target.checked)
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={stage.is_lost}
                              onChange={(e) =>
                                handleStageChange(pipeline.id, stage.id, "is_lost", e.target.checked)
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteStage(pipeline.id, stage.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div style={{ padding: 8, display: "flex", justifyContent: "space-between" }}>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => handleAddStage(pipeline.id)}
                    >
                      Add Stage
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={() => handleSavePipeline(pipeline)}
                    >
                      Save Pipeline
                    </Button>
                  </div>
                </TableContainer>
              </CardContent>
            </Card>
          ))}
        </Grid>
      </Grid>
    </div>
  );
};
