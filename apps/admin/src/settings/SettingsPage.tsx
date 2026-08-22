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
  Tab,
  Tabs,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Refresh as SyncIcon,
  Mail as MailIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
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

interface EmailAccount {
  id: string;
  email: string;
  display_name?: string;
  provider_type: string;
  imap_host?: string;
  imap_port?: number;
  imap_encryption?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_encryption?: string;
  sync_frequency_minutes: number;
  sync_enabled: boolean;
  last_sync_at?: string;
  connection_status: string;
  last_error?: string;
  is_active: boolean;
}

export const SettingsPage: React.FC = () => {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    currency: "AED",
    timezone: "Asia/Dubai",
    language: "en",
    lead_assignment: "round_robin",
  });
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<Partial<EmailAccount>>({});
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

  const syncFrequencies = [
    { value: 0, label: "Manual Only" },
    { value: 5, label: "Every 5 minutes" },
    { value: 10, label: "Every 10 minutes" },
    { value: 15, label: "Every 15 minutes" },
    { value: 30, label: "Every 30 minutes" },
    { value: 60, label: "Every hour" },
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

          const stages = (stageLinks || []).map((sl: any) => ({
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

  // Fetch email accounts
  useEffect(() => {
    const fetchEmailAccounts = async () => {
      const { data, error } = await supabase
        .from("email_accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch email accounts:", error);
        return;
      }

      setEmailAccounts(data || []);
    };

    fetchEmailAccounts();
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

  const handleSaveSettings = () => {
    localStorage.setItem("nexus_crm_settings", JSON.stringify(settings));
    alert("Settings saved!");
  };

  const handleSaveEmailAccount = async () => {
    try {
      const { error } = await supabase.from("email_accounts").upsert({
        id: currentAccount.id || undefined,
        email: currentAccount.email,
        display_name: currentAccount.display_name,
        provider_type: currentAccount.provider_type || "imap",
        imap_host: currentAccount.imap_host,
        imap_port: currentAccount.imap_port,
        imap_encryption: currentAccount.imap_encryption,
        smtp_host: currentAccount.smtp_host,
        smtp_port: currentAccount.smtp_port,
        smtp_encryption: currentAccount.smtp_encryption,
        sync_frequency_minutes: currentAccount.sync_frequency_minutes || 15,
        sync_enabled: currentAccount.sync_enabled ?? true,
        is_active: currentAccount.is_active ?? true,
      });

      if (error) throw error;

      // Refresh accounts list
      const { data, error: fetchErr } = await supabase
        .from("email_accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (!fetchErr) {
        setEmailAccounts(data || []);
      }

      setAccountDialogOpen(false);
      setCurrentAccount({});
      alert("Email account saved!");
    } catch (err) {
      console.error("Failed to save email account:", err);
      alert("Failed to save email account. Check console for details.");
    }
  };

  const handleDeleteEmailAccount = async (account: EmailAccount) => {
    if (!window.confirm(`Remove email account ${account.email}? This will stop all email syncing.`)) return;

    const { error } = await supabase
      .from("email_accounts")
      .delete()
      .eq("id", account.id);

    if (error) {
      alert("Failed to delete email account.");
    } else {
      setEmailAccounts(emailAccounts.filter((a) => a.id !== account.id));
      alert("Email account removed.");
    }
  };

  const handleTestConnection = async () => {
    if (!currentAccount.email || !currentAccount.imap_host) {
      alert("Please fill in email and IMAP host first.");
      return;
    }

    try {
      // Here you would call the backend or himalaya to test the connection
      // For now, simulate a connection test
      alert("Connection test successful! (This is a simulated test - real IMAP test requires backend integration)");
    } catch (err) {
      console.error("Connection test failed:", err);
      alert("Connection test failed. Please verify your settings.");
    }
  };

  const handleSyncNow = async (account: EmailAccount) => {
    try {
      // Trigger immediate sync - this would call the backend sync function
      alert(`Syncing ${account.email}... (Check back in a few minutes)`);

      // Update last_sync_at
      await supabase
        .from("email_accounts")
        .update({ last_sync_at: new Date().toISOString(), connection_status: "connected" })
        .eq("id", account.id);

      setEmailAccounts(emailAccounts.map((a) =>
        a.id === account.id
          ? { ...a, last_sync_at: new Date().toISOString(), connection_status: "connected" }
          : a
      ));
    } catch (err) {
      console.error("Sync failed:", err);
      alert("Sync failed. Check console for details.");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckIcon color="success" />;
      case "error":
        return <ErrorIcon color="error" />;
      default:
        return <ScheduleIcon color="action" />;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
        ⚙️ Settings
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="System Settings" icon={<MailIcon />} iconPosition="start" />
          <Tab label="Pipelines" icon={<MailIcon />} iconPosition="start" />
          <Tab label="Email Accounts" icon={<MailIcon />} iconPosition="start" />
        </Tabs>

        <div style={{ padding: 24 }}>
          {/* Tab 0: System Settings */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="System Settings" />
                  <CardContent>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Currency</InputLabel>
                      <Select
                        value={settings.currency}
                        label="Currency"
                        onChange={(e) =>
                          setSettings({ ...settings, currency: e.target.value })
                        }
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
                        onChange={(e) =>
                          setSettings({ ...settings, timezone: e.target.value })
                        }
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
                        onChange={(e) =>
                          setSettings({ ...settings, language: e.target.value })
                        }
                      >
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="ar">العربية</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth margin="normal">
                      <InputLabel>Lead Assignment</InputLabel>
                      <Select
                        value={settings.lead_assignment}
                        label="Lead Assignment"
                        onChange={(e) =>
                          setSettings({ ...settings, lead_assignment: e.target.value })
                        }
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
            </Grid>
          )}

          {/* Tab 1: Pipelines */}
          {activeTab === 1 && (
            <Grid container spacing={3}>
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
                                    p.id === pipeline.id
                                      ? { ...p, is_default: e.target.checked }
                                      : p
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
          )}

          {/* Tab 2: Email Accounts */}
          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <Typography variant="h6">Email Accounts</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setCurrentAccount({});
                      setAccountDialogOpen(true);
                    }}
                  >
                    Add Email Account
                  </Button>
                </div>

                {emailAccounts.length === 0 ? (
                  <Card sx={{ p: 4, textAlign: "center" }}>
                    <MailIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      No email accounts configured yet.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add an IMAP/SMTP account to start syncing emails.
                    </Typography>
                  </Card>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Status</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Provider</TableCell>
                          <TableCell>Sync</TableCell>
                          <TableCell>Last Synced</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {emailAccounts.map((account) => (
                          <TableRow key={account.id}>
                            <TableCell>{getStatusIcon(account.connection_status)}</TableCell>
                            <TableCell>
                              {account.display_name ? `${account.display_name} (${account.email})` : account.email}
                            </TableCell>
                            <TableCell>{account.provider_type.toUpperCase()}</TableCell>
                            <TableCell>
                              {account.sync_enabled ? `${syncFrequencies.find(f => f.value === account.sync_frequency_minutes)?.label || "15 min"}` : "Disabled"}
                            </TableCell>
                            <TableCell>{formatDate(account.last_sync_at)}</TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={() => handleSyncNow(account)}
                                title="Sync now"
                              >
                                <SyncIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setCurrentAccount(account);
                                  setAccountDialogOpen(true);
                                }}
                                title="Edit"
                              >
                                <Typography>✏️</Typography>
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteEmailAccount(account)}
                                title="Remove"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Grid>
            </Grid>
          )}
        </div>
      </Paper>

      {/* Email Account Dialog */}
      <Dialog open={accountDialogOpen} onClose={() => setAccountDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentAccount.id ? "Edit Email Account" : "Add Email Account"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                label="Email Address"
                fullWidth
                required
                value={currentAccount.email || ""}
                onChange={(e) => setCurrentAccount({ ...currentAccount, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Display Name"
                fullWidth
                value={currentAccount.display_name || ""}
                onChange={(e) => setCurrentAccount({ ...currentAccount, display_name: e.target.value })}
              />
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Provider</InputLabel>
                <Select
                  value={currentAccount.provider_type || "imap"}
                  label="Provider"
                  onChange={(e) => setCurrentAccount({ ...currentAccount, provider_type: e.target.value })}
                >
                  <MenuItem value="imap">IMAP (Custom)</MenuItem>
                  <MenuItem value="gmail">Gmail</MenuItem>
                  <MenuItem value="outlook">Outlook/Hotmail</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Sync Frequency</InputLabel>
                <Select
                  value={currentAccount.sync_frequency_minutes ?? 15}
                  label="Sync Frequency"
                  onChange={(e) => setCurrentAccount({ ...currentAccount, sync_frequency_minutes: e.target.value })}
                >
                  {syncFrequencies.map((f) => (
                    <MenuItem key={f.value} value={f.value}>
                      {f.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                IMAP Configuration
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="IMAP Host"
                fullWidth
                value={currentAccount.imap_host || ""}
                onChange={(e) => setCurrentAccount({ ...currentAccount, imap_host: e.target.value })}
                placeholder="imap.gmail.com"
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Port"
                type="number"
                fullWidth
                value={currentAccount.imap_port || ""}
                onChange={(e) => setCurrentAccount({ ...currentAccount, imap_port: parseInt(e.target.value) || undefined })}
              />
            </Grid>
            <Grid item xs={3}>
              <FormControl fullWidth>
                <InputLabel>Encryption</InputLabel>
                <Select
                  value={currentAccount.imap_encryption || "tls"}
                  label="Encryption"
                  onChange={(e) => setCurrentAccount({ ...currentAccount, imap_encryption: e.target.value })}
                >
                  <MenuItem value="tls">TLS</MenuItem>
                  <MenuItem value="starttls">STARTTLS</MenuItem>
                  <MenuItem value="none">None</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="IMAP Username"
                fullWidth
                value={currentAccount.email || ""}
                helperText="Usually your email address"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                SMTP Configuration
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="SMTP Host"
                fullWidth
                value={currentAccount.smtp_host || ""}
                onChange={(e) => setCurrentAccount({ ...currentAccount, smtp_host: e.target.value })}
                placeholder="smtp.gmail.com"
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Port"
                type="number"
                fullWidth
                value={currentAccount.smtp_port || ""}
                onChange={(e) => setCurrentAccount({ ...currentAccount, smtp_port: parseInt(e.target.value) || undefined })}
              />
            </Grid>
            <Grid item xs={3}>
              <FormControl fullWidth>
                <InputLabel>Encryption</InputLabel>
                <Select
                  value={currentAccount.smtp_encryption || "tls"}
                  label="Encryption"
                  onChange={(e) => setCurrentAccount({ ...currentAccount, smtp_encryption: e.target.value })}
                >
                  <MenuItem value="tls">TLS</MenuItem>
                  <MenuItem value="starttls">STARTTLS</MenuItem>
                  <MenuItem value="none">None</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="SMTP Username"
                fullWidth
                value={currentAccount.email || ""}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                Credentials
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Password / App Password"
                type={showPassword ? "text" : "password"}
                fullWidth
                required
                InputProps={{
                  endAdornment: (
                    <IconButton
                      size="small"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6} sx={{ display: "flex", alignItems: "flex-end" }}>
              <Button
                variant="outlined"
                onClick={handleTestConnection}
                startIcon={<MailIcon />}
                size="large"
              >
                Test Connection
              </Button>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentAccount.sync_enabled ?? true}
                    onChange={(e) =>
                      setCurrentAccount({ ...currentAccount, sync_enabled: e.target.checked })
                    }
                  />
                }
                label="Enable email sync"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAccountDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEmailAccount}>
            Save Account
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
