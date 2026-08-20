import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "@nexus-crm/api";
import { Database } from "@nexus-crm/database";
import { aiService } from "@nexus-crm/crm-core";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type CreateLead = Database["public"]["Tables"]["leads"]["Insert"];
type UpdateLead = Database["public"]["Tables"]["leads"]["Update"];

export function useLeads() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseClient();

  const { data: leads, isLoading, error } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  const createLead = useMutation({
    mutationFn: async (payload: CreateLead) => {
      // If no score provided, calculate AI score
      let leadPayload = { ...payload };
      if (!leadPayload.score || leadPayload.score === 0) {
        try {
          const scoreResult = await aiService.scoreLead({
            source: payload.source || "unknown",
            company: payload.company || undefined,
            industry: payload.industry || undefined,
            estimated_value: payload.custom_fields?.estimated_value || undefined,
            urgency: payload.custom_fields?.urgency || undefined,
            notes: payload.notes || undefined,
          });
          leadPayload.score = scoreResult.score;
          leadPayload.custom_fields = {
            ...leadPayload.custom_fields,
            ai_score_reasoning: scoreResult.reasoning,
            ai_recommendations: JSON.stringify(scoreResult.recommendations),
          };
        } catch (err) {
          console.warn("AI scoring failed, using default score:", err);
          leadPayload.score = 50;
        }
      }

      const { data, error } = await supabase
        .from("leads")
        .insert(leadPayload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const updateLead = useMutation({
    mutationFn: ({ id, ...patch }: UpdateLead & { id: string }) =>
      supabase.from("leads").update(patch).eq("id", id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const deleteLead = useMutation({
    mutationFn: (id: string) =>
      supabase.from("leads").delete().eq("id", id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  // AI-powered lead scoring
  const scoreLeadWithAI = useMutation({
    mutationFn: async (leadId: string) => {
      const { data: lead, error: fetchError } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .single();
      if (fetchError) throw fetchError;

      const scoreResult = await aiService.scoreLead({
        source: lead.source,
        company: lead.company || undefined,
        industry: lead.industry || undefined,
        estimated_value: lead.custom_fields?.estimated_value || undefined,
        urgency: lead.custom_fields?.urgency || undefined,
        notes: lead.notes || undefined,
      });

      const { data, error } = await supabase
        .from("leads")
        .update({
          score: scoreResult.score,
          custom_fields: {
            ...lead.custom_fields,
            ai_score_reasoning: scoreResult.reasoning,
            ai_recommendations: JSON.stringify(scoreResult.recommendations),
            last_ai_scored_at: new Date().toISOString(),
          },
        })
        .eq("id", leadId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  // Convert lead to inquiry
  const convertToInquiry = useMutation({
    mutationFn: async ({ id, ...inquiryData }: any) => {
      // Update lead status
      await supabase
        .from("leads")
        .update({ status: "converted" })
        .eq("id", id);

      // Create inquiry
      const { data, error } = await supabase
        .from("inquiries")
        .insert({
          ...inquiryData,
          lead_id: id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
    },
  });

  return {
    leads,
    isLoading,
    error,
    createLead,
    updateLead,
    deleteLead,
    scoreLeadWithAI,
    convertToInquiry,
  };
}

export function useLead(id: string) {
  const supabase = getSupabaseClient();

  return useQuery({
    queryKey: ["lead", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Lead;
    },
  });
}
