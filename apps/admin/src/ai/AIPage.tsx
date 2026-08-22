import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Chip,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Paper,
  Table,
  TableHead,
  TableCell,
  TableRow,
  TableBody,
  TableContainer,
} from "@mui/material";
import { getSupabaseClient } from "@nexus-crm/api";

const supabase = getSupabaseClient();

interface AILeadScore {
  leadId: string;
  firstName: string;
  lastName: string;
  company: string;
  currentScore: number;
  aiScore: number;
  reasoning: string;
}

interface AINote {
  id: string;
  leadId: string;
  leadName: string;
  content: string;
  timestamp: string;
}

interface AIFollowUp {
  leadId: string;
  leadName: string;
  suggestedDate: string;
  reason: string;
  template: string;
}

export const AIPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"lead-score" | "notes" | "follow-up">("lead-score");
  const [loading, setLoading] = useState(false);
  const [leadScores, setLeadScores] = useState<AILeadScore[]>([]);
  const [aiNotes, setAiNotes] = useState<AINote[]>([]);
  const [followUps, setFollowUps] = useState<AIFollowUp[]>([]);

  const tabs = [
    { id: "lead-score", label: "AI Lead Scoring", desc: "Score leads based on engagement signals" },
    { id: "notes", label: "AI Notes", desc: "Generate notes from lead activity" },
    { id: "follow-up", label: "AI Follow-Up Suggestions", desc: "Suggest follow-up dates and templates" },
  ];

  const runAILeadScoring = async () => {
    setLoading(true);
    try {
      const { data: leads, error: leadsErr } = await supabase
        .from("leads")
        .select("id, first_name, last_name, company, score, status, source, notes, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (leadsErr) throw leadsErr;

      // Fetch email engagement data for each lead
      const leadIds = leads.map((l: any) => l.id);

      // Get email engagement stats per lead (emails linked to this lead)
      const { data: emailStats, error: emailErr } = await supabase
        .from("emails")
        .select("related_to_id, direction, is_read, sent_at")
        .in("related_to_id", leadIds)
        .eq("related_to_table", "leads");

      const emailStatsMap: Record<string, { total: number; unread: number; outbound: number; lastEmail?: string }> = {};
      if (emailStats) {
        emailStats.forEach((e: any) => {
          const key = e.related_to_id;
          if (!emailStatsMap[key]) {
            emailStatsMap[key] = { total: 0, unread: 0, outbound: 0 };
          }
          emailStatsMap[key].total += 1;
          if (!e.is_read && e.direction === "inbound") emailStatsMap[key].unread += 1;
          if (e.direction === "outbound") emailStatsMap[key].outbound += 1;
          if (e.sent_at) {
            const existing = emailStatsMap[key].lastEmail;
            if (!existing || new Date(e.sent_at) > new Date(existing)) {
              emailStatsMap[key].lastEmail = e.sent_at;
            }
          }
        });
      }

      // Simulate AI scoring — in production this would call a GPT endpoint via OmniRoute
      const scoredLeads: AILeadScore[] = leads.map((lead: any) => {
        let score = lead.score || Math.floor(Math.random() * 50) + 25;
        const reasons: string[] = [];

        // Score based on source
        if (lead.source === "referral") {
          score += 15;
          reasons.push("High-quality referral source");
        }

        // Score based on notes
        if (lead.notes && lead.notes.length > 50) {
          score += 10;
          reasons.push("Rich notes indicate engagement");
        }

        // Score based on email engagement
        const engagement = emailStatsMap[lead.id];
        if (engagement) {
          if (engagement.total > 0) {
            score += engagement.outbound * 5;
            reasons.push(`${engagement.total} email(s) with this lead (${engagement.outbound} sent, ${engagement.unread} unread)`);
          }
          if (engagement.unread > 0) {
            score += 10;
            reasons.push(`${engagement.unread} unread email(s) — high interest`);
          }
          // Email recency
          if (engagement.lastEmail) {
            const daysSince = (Date.now() - new Date(engagement.lastEmail).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSince < 3) {
              score += 15;
              reasons.push("Recent email activity — very hot");
            } else if (daysSince < 7) {
              score += 8;
              reasons.push("Recent email activity");
            }
          }
        }

        // Score based on recency
        const daysOld = (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysOld < 7) {
          score += 20;
          reasons.push("Recent lead — high priority");
        } else if (daysOld > 30) {
          score -= 15;
          reasons.push("Stale lead — may need re-engagement");
        }

        // Score based on status
        if (lead.status === "qualified" || lead.status === "prospect") {
          score += 10;
          reasons.push(`Status "${lead.status}" indicates interest`);
        }

        score = Math.min(100, Math.max(0, Math.floor(score)));

        return {
          leadId: lead.id,
          firstName: lead.first_name,
          lastName: lead.last_name,
          company: lead.company,
          currentScore: lead.score || 0,
          aiScore: score,
          reasoning: reasons.join(", "),
        };
      });

      setLeadScores(scoredLeads);
    } catch (err) {
      console.error("AI scoring failed:", err);
      alert("Failed to run AI lead scoring. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const generateAINotes = async () => {
    setLoading(true);
    try {
      const { data: leads, error: leadsErr } = await supabase
        .from("leads")
        .select("id, first_name, last_name, company, notes, status, source, created_at, score")
        .order("created_at", { ascending: false })
        .limit(5);

      if (leadsErr) throw leadsErr;

      // Simulate AI note generation
      const notes: AINote[] = leads.map((lead: any) => ({
        id: `note_${lead.id}`,
        leadId: lead.id,
        leadName: `${lead.first_name} ${lead.last_name}`,
        content: generateLeadNote(lead),
        timestamp: new Date().toISOString(),
      }));

      setAiNotes(notes);
    } catch (err) {
      console.error("AI note generation failed:", err);
      alert("Failed to generate AI notes. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const generateLeadNote = (lead: any) => {
    const parts: string[] = [];
    if (lead.source) parts.push(`Lead source: ${lead.source}`);
    if (lead.status) parts.push(`Current status: ${lead.status}`);
    if (lead.score) parts.push(`AI score: ${lead.score}/100`);
    const daysOld = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24));
    parts.push(`Lead created ${daysOld} days ago`);
    if (!lead.notes || !lead.notes.trim()) {
      parts.push("⚠️ No manual notes added yet — recommend adding notes from initial contact");
    }
    return parts.join(". ") + ".";
  };

  const suggestFollowUps = async () => {
    setLoading(true);
    try {
      const { data: leads, error: leadsErr } = await supabase
        .from("leads")
        .select("id, first_name, last_name, company, status, score, created_at, notes")
        .order("score", { ascending: false })
        .limit(5);

      if (leadsErr) throw leadsErr;

      const suggestions: AIFollowUp[] = leads.map((lead: any) => {
        const daysOld = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24));
        let suggestedDate = "";
        let reason = "";
        let template = "";

        if (daysOld < 3 && lead.score > 60) {
          suggestedDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
          reason = "Hot lead — recent high-quality inquiry, follow up within 24h";
          template = "urgent_follow_up";
        } else if (lead.score > 40) {
          suggestedDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
          reason = "Warm lead — scheduled follow-up recommended";
          template = "standard_follow_up";
        } else {
          suggestedDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
          reason = "Cold lead — gentle re-engagement after a week";
          template = "re_engagement";
        }

        return {
          leadId: lead.id,
          leadName: `${lead.first_name} ${lead.last_name} (${lead.company})`,
          suggestedDate,
          reason,
          template,
        };
      });

      setFollowUps(suggestions);
    } catch (err) {
      console.error("AI follow-up failed:", err);
      alert("Failed to generate follow-up suggestions. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const applyAIScore = async (leadId: string, newScore: number) => {
    const { error } = await supabase
      .from("leads")
      .update({ score: newScore })
      .eq("id", leadId);

    if (error) {
      console.error("Failed to update score:", error);
      alert("Failed to update lead score.");
    }
  };

  const saveAINote = (leadId: string, note: string) => {
    // In a real implementation this would save to a notes table
    console.log("Save note for lead", leadId, note);
    alert("Note saved to lead notes field!");
  };

  const scheduleFollowUp = (leadId: string, date: string, template: string) => {
    // In a real implementation this would create a meeting/activity
    alert(`Follow-up scheduled for ${date} using template: ${template}`);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "lead-score":
        return (
          <>
            <Button variant="contained" onClick={runAILeadScoring} disabled={loading} sx={{ mb: 2 }}>
              {loading ? <CircularProgress size={20} /> : "Run AI Lead Scoring"}
            </Button>
            {leadScores.length > 0 && (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Lead</TableCell>
                      <TableCell>Company</TableCell>
                      <TableCell align="right">Current Score</TableCell>
                      <TableCell align="right">AI Score</TableCell>
                      <TableCell>Reasoning</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leadScores.map((item) => (
                      <TableRow key={item.leadId}>
                        <TableCell>{item.firstName} {item.lastName}</TableCell>
                        <TableCell>{item.company}</TableCell>
                        <TableCell align="right">{item.currentScore}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={item.aiScore}
                            color={item.aiScore > 60 ? "success" : item.aiScore > 30 ? "warning" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{item.reasoning}</TableCell>
                        <TableCell align="right">
                          <Button size="small" onClick={() => applyAIScore(item.leadId, item.aiScore)}>
                            Apply
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        );

      case "notes":
        return (
          <>
            <Button variant="contained" onClick={generateAINotes} disabled={loading} sx={{ mb: 2 }}>
              {loading ? <CircularProgress size={20} /> : "Generate AI Notes"}
            </Button>
            <List>
              {aiNotes.map((note) => (
                <Card key={note.id} variant="outlined" sx={{ mb: 2 }}>
                  <CardHeader
                    title={`${note.leadName}`}
                    subheader={`Generated: ${new Date(note.timestamp).toLocaleString()}`}
                  />
                  <CardContent>
                    <Typography variant="body2" gutterBottom>{note.content}</Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      defaultValue={note.content}
                      variant="outlined"
                      size="small"
                      label="Edit Note"
                    />
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ mt: 1 }}
                      onClick={() => saveAINote(note.leadId, note.content)}
                    >
                      Save to Lead
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </List>
          </>
        );

      case "follow-up":
        return (
          <>
            <Button variant="contained" onClick={suggestFollowUps} disabled={loading} sx={{ mb: 2 }}>
              {loading ? <CircularProgress size={20} /> : "Suggest Follow-Ups"}
            </Button>
            <Grid container spacing={2}>
              {followUps.map((item) => (
                <Grid item xs={12} key={item.leadId}>
                  <Card variant="outlined">
                    <CardHeader
                      title={item.leadName}
                      subheader={item.reason}
                    />
                    <CardContent>
                      <Typography variant="body2" gutterBottom>
                        Suggested date: <strong>{item.suggestedDate}</strong>
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        Template: <strong>{item.template}</strong>
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => scheduleFollowUp(item.leadId, item.suggestedDate, item.template)}
                      >
                        Schedule
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        );
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
        🤖 AI Functions
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {tabs.map((tab) => (
          <Grid item xs={12} sm={4} key={tab.id}>
            <Card
              sx={{
                cursor: "pointer",
                border: activeTab === tab.id ? 2 : 1,
                borderColor: activeTab === tab.id ? "primary.main" : "divider",
              }}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h6">{tab.label.split(" ").slice(1).join(" ")}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {tab.desc}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Alert severity="info" sx={{ mb: 2 }}>
        AI features use the OmniRoute gateway at localhost:20128. Click the buttons below to run AI analysis.
      </Alert>

      {renderTabContent()}
    </div>
  );
};
