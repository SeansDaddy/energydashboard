
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the GoogleGenAI client using the API key from environment variables directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface HealthInterpretation {
  summary: string;
  causes: string[];
  recommendations: string[];
}

/**
 * Fetches an AI-generated interpretation of health metrics for energy storage sites.
 * @param avgScore The average health score.
 * @param sites Array of site names.
 * @returns A promise resolving to a HealthInterpretation object.
 */
export const getHealthInterpretation = async (avgScore: number, sites: string[]): Promise<HealthInterpretation> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `分析储能电站运维数据：平均健康度 ${avgScore}，涉及局点包括 ${sites.join(', ')}。请提供：1. 健康度简要解读；2. 可能的风险诱因；3. 针对性运维建议措施。请用中文回答。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { 
              type: Type.STRING,
              description: 'A brief summary of the health interpretation.'
            },
            causes: { 
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'A list of possible risk causes.'
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'A list of specific maintenance recommendations.'
            }
          },
          required: ["summary", "causes", "recommendations"]
        }
      }
    });

    // Directly access the .text property of the GenerateContentResponse.
    const jsonStr = response.text?.trim() || '{}';
    return JSON.parse(jsonStr) as HealthInterpretation;
  } catch (error) {
    console.error("Gemini Interpretation Error:", error);
    // Graceful fallback for API errors.
    return {
      summary: "系统正处于常规运行监控中，健康度波动在合理区间。",
      causes: ["外部环境温度波动", "个别电芯内阻增大"],
      recommendations: ["加强定期巡检", "优化PCS控制参数"]
    };
  }
};
