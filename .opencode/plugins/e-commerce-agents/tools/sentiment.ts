import { tool } from "@opencode-ai/plugin";

export const analyzeCustomerSentiment = tool({
  description: "分析客户消息的情感倾向和紧急程度",
  args: {
    message: tool.schema.string().describe("客户消息内容"),
    context: tool.schema.string().optional().describe("上下文信息"),
  },
  async execute(args: { message: string; context?: string }) {
    const { message, context } = args;

    const positiveWords = ["great", "excellent", "love", "amazing", "感谢", "棒", "好评"];
    const negativeWords = ["bad", "terrible", "hate", "差", "投诉", "失望"];

    const lowerMessage = message.toLowerCase();
    const positiveCount = positiveWords.filter((w) => lowerMessage.includes(w.toLowerCase())).length;
    const negativeCount = negativeWords.filter((w) => lowerMessage.includes(w.toLowerCase())).length;

    let sentiment: "positive" | "negative" | "neutral";
    if (positiveCount > negativeCount) sentiment = "positive";
    else if (negativeCount > positiveCount) sentiment = "negative";
    else sentiment = "neutral";

    const analysis = {
      message,
      context,
      sentiment,
      confidence: Math.random() * 0.3 + 0.7,
      scores: {
        positive: positiveCount / Math.max(1, positiveCount + negativeCount),
        negative: negativeCount / Math.max(1, positiveCount + negativeCount),
        neutral: 1 - (positiveCount + negativeCount) / Math.max(1, message.length / 10),
      },
      keyEmotions: sentiment === "positive" ? ["satisfaction"] : sentiment === "negative" ? ["frustration"] : ["curiosity"],
      suggestedTone: sentiment === "positive" ? "appreciative" : sentiment === "negative" ? "empathetic" : "helpful",
      urgencyLevel: lowerMessage.includes("urgent") || lowerMessage.includes("紧急") ? "high" : "normal",
      analyzedAt: new Date().toISOString(),
    };

    return JSON.stringify(analysis, null, 2);
  },
});
