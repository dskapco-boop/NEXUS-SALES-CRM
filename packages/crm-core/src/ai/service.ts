// Nexus CRM - AI Service
// Routes all AI operations through local OmniRoute gateway (localhost:20128)

import { getEnv } from "@nexus-crm/config";

export interface LeadScoreParams {
  source: string;
  company?: string;
  industry?: string;
  estimated_value?: number;
  urgency?: string;
  notes?: string;
}

export interface LeadScoreResult {
  score: number;
  reasoning: string;
  recommendations: string[];
}

export interface QuoteOptimizationParams {
  total_amount: number;
  currency: string;
  line_items: any[];
  account_name?: string;
  competitor?: string;
  urgency?: string;
}

export interface ForecastResult {
  months: Array<{
    month: string;
    forecast: number;
    confidence: string;
    opportunities: number;
  }>;
  summary: string;
}

export interface EmailDraftParams {
  type: "follow_up" | "quote" | "reminder" | "thank_you" | "meeting_request";
  customer_name?: string;
  subject?: string;
  key_points?: string;
}

export interface DocumentExtractionParams {
  document_text: string;
  document_type: "rfq" | "contract" | "email" | "proposal";
}

export interface DocumentExtractionResult {
  company_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  product_interest?: string;
  estimated_budget?: number;
  urgency_level?: string;
  delivery_requirements?: string;
}

export class AIService {
  private baseUrl: string;
  private apiKey: string;
  private defaultModel: string;
  private fastModel: string;

  constructor() {
    const env = getEnv();
    this.baseUrl = env.OMNIROUTE_BASE_URL || "http://localhost:20128";
    this.apiKey = env.OMNIROUTE_API_KEY || "";
    this.defaultModel = "captian";
    this.fastModel = "auto/best-fast";
  }

  /**
   * Score a lead for conversion likelihood (1-100)
   * Uses OmniRoute AI gateway
   */
  async scoreLead(params: LeadScoreParams): Promise<LeadScoreResult> {
    try {
      const prompt = `
        Score this sales lead on a scale of 0-100 for conversion likelihood.
        Consider these factors:
        - Lead source: ${params.source || "unknown"}
        - Company: ${params.company || "N/A"}
        - Industry: ${params.industry || "N/A"}
        - Estimated value: ${params.estimated_value || "N/A"} AED
        - Urgency: ${params.urgency || "N/A"}
        - Notes: ${params.notes || "N/A"}

        Return your score and brief reasoning as JSON:
        {"score": number, "reasoning": "string", "recommendations": ["array"]}
      `;

      const response = await this.callOmniRoute(prompt, this.defaultModel, 0.3, 2000);

      try {
        const parsed = JSON.parse(response);
        return {
          score: Math.max(1, Math.min(100, parsed.score || 50)),
          reasoning: parsed.reasoning || "No reasoning provided",
          recommendations: parsed.recommendations || [],
        };
      } catch {
        // If JSON parse fails, use fallback
        return this.fallbackLeadScore(params);
      }
    } catch (error) {
      console.error("AI lead scoring failed:", error);
      return this.fallbackLeadScore(params);
    }
  }

  /**
   * Generate a sales forecast
   */
  async generateForecast(pipelineData: any): Promise<ForecastResult> {
    try {
      const prompt = `
        You are a sales forecasting assistant. Based on the pipeline data provided,
        generate a 3-month sales forecast with confidence intervals.
        Pipeline data: ${JSON.stringify(pipelineData)}
        Return JSON: {"months": [{"month": "...", "forecast": number, "confidence": "...", "opportunities": number}], "summary": "..."}
      `;

      const response = await this.callOmniRoute(prompt, this.defaultModel, 0.5, 2000);

      try {
        const parsed = JSON.parse(response);
        return {
          months: parsed.months || [],
          summary: parsed.summary || "Forecast generated",
        };
      } catch {
        return {
          months: [],
          summary: "AI forecast unavailable - using basic calculation",
        };
      }
    } catch (error) {
      console.error("Forecast generation failed:", error);
      return {
        months: [],
        summary: "Forecast unavailable",
      };
    }
  }

  /**
   * Optimize a quotation
   */
  async optimizeQuote(params: QuoteOptimizationParams): Promise<any> {
    try {
      const prompt = `
        You are a sales optimization assistant. Review this quotation and suggest:
        1. Pricing adjustments for competitiveness
        2. Terms improvements
        3. Risk factors
        Quotation: ${JSON.stringify(params)}
        Return as structured JSON.
      `;

      const response = await this.callOmniRoute(prompt, this.defaultModel, 0.4, 2000);

      try {
        return JSON.parse(response);
      } catch {
        return { suggestions: "AI optimization unavailable" };
      }
    } catch (error) {
      console.error("Quote optimization failed:", error);
      return { suggestions: "AI optimization unavailable" };
    }
  }

  /**
   * Draft an email
   */
  async draftEmail(params: EmailDraftParams): Promise<string> {
    try {
      const prompt = `
        You are a professional sales email writer for a B2B trading and ISO consultancy company.
        Draft a concise, professional email based on the context.
        Type: ${params.type}
        Customer: ${params.customer_name || "N/A"}
        Subject: ${params.subject || "Follow-up on your inquiry"}
        Key points: ${params.key_points || "None provided"}
        Keep it under 150 words. Return only the email body.
      `;

      return await this.callOmniRoute(prompt, this.fastModel, 0.7, 300);
    } catch (error) {
      console.error("Email drafting failed:", error);
      return `Thank you for your inquiry. We will review your request and get back to you shortly.`;
    }
  }

  /**
   * Extract structured data from documents
   */
  async extractDocumentData(
    params: DocumentExtractionParams
  ): Promise<DocumentExtractionResult> {
    try {
      const prompt = `
        You are a document analysis assistant. Extract structured data from the provided
        document text. Return JSON with: company_name, contact_person, email, phone,
        product_interest, estimated_budget, urgency_level, delivery_requirements.
        Document type: ${params.document_type}
        Document text: ${params.document_text}
      `;

      const response = await this.callOmniRoute(prompt, this.defaultModel, 0.2, 2000);

      try {
        return JSON.parse(response);
      } catch {
        return {};
      }
    } catch (error) {
      console.error("Document extraction failed:", error);
      return {};
    }
  }

  /**
   * Generate ISO gap analysis
   */
  async generateGapAnalysis(findings: any): Promise<any> {
    try {
      const prompt = `
        You are an ISO 9001:2015 compliance assistant. Analyze the provided audit
        findings and identify gaps. Rate each gap as critical, major, or minor.
        Suggest corrective actions.
        Findings: ${JSON.stringify(findings)}
        Return as JSON.
      `;

      const response = await this.callOmniRoute(prompt, this.defaultModel, 0.4, 3000);

      try {
        return JSON.parse(response);
      } catch {
        return { error: "AI analysis unavailable" };
      }
    } catch (error) {
      console.error("Gap analysis failed:", error);
      return { error: "AI analysis unavailable" };
    }
  }

  /**
   * Call OmniRoute API
   */
  private async callOmniRoute(
    prompt: string,
    model: string,
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are Nexus AI, a helpful assistant for a B2B sales CRM system.",
          },
          { role: "user", content: prompt },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OmniRoute API error: ${response.status} ${errorText}`
      );
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || "";
  }

  /**
   * Fallback lead scoring (rule-based)
   */
  private fallbackLeadScore(params: LeadScoreParams): LeadScoreResult {
    let score = 50;
    const recommendations: string[] = [];
    const sourceScores: Record<string, number> = {
      website: 5,
      referral: 10,
      event: 8,
      social: 7,
      advertisement: 6,
      cold_outreach: 3,
      other: 0,
    };

    score += sourceScores[params.source] || 0;

    if (params.estimated_value) {
      if (params.estimated_value > 50000) {
        score += 15;
        recommendations.push("High-value lead - prioritize follow-up");
      } else if (params.estimated_value > 10000) score += 10;
      else if (params.estimated_value > 1000) score += 5;
    }

    const urgencyScores: Record<string, number> = {
      urgent: 15,
      high: 10,
      medium: 5,
      low: 0,
    };
    score += urgencyScores[params.urgency || ""] || 0;

    const finalScore = Math.max(1, Math.min(100, score));

    if (finalScore >= 80) recommendations.push("Hot lead - assign immediately");
    if (finalScore <= 30) recommendations.push("Cold lead - nurture via email");

    return {
      score: finalScore,
      reasoning: "AI unavailable - using rule-based scoring",
      recommendations,
    };
  }
}

export const aiService = new AIService();
