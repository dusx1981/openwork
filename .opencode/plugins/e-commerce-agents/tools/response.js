import { tool } from "@opencode-ai/plugin";

export const generateResponse = tool({
  description: "生成客服回复，支持多语言和不同语调",
  args: {
    customer_query: tool.schema.string().describe("客户问题"),
    order_info: tool.schema.any().optional().describe("订单信息"),
    sentiment: tool.schema.string().optional().describe("检测到的情感"),
    language: tool.schema.string().optional().describe("回复语言"),
    tone: tool.schema.string().optional().describe("语调"),
  },
  async execute(args: { customer_query: string; order_info?: unknown; sentiment?: string; language?: string; tone?: string }) {
    const { customer_query, sentiment = "neutral", language = "en", tone = "friendly" } = args;

    const responses: Record<string, string> = language === "cn" ? {
      general: "感谢您的咨询！请问有什么可以帮助您的？",
      order_status: "您的订单已在配送中！您可以随时查看物流进度。",
      return: "非常抱歉您需要退货。请告诉我们您的订单号，我们将协助处理。",
    } : {
      general: "Thank you for reaching out! How can I help you today?",
      order_status: "Your order is on its way! You can track it anytime.",
      return: "We're sorry you'd like to return. Please provide your order number.",
    };

    let queryType = "general";
    const lowerQuery = customer_query.toLowerCase();
    if (lowerQuery.includes("order") || lowerQuery.includes("shipping") || lowerQuery.includes("物流")) {
      queryType = "order_status";
    } else if (lowerQuery.includes("return") || lowerQuery.includes("refund") || lowerQuery.includes("退货")) {
      queryType = "return";
    }

    const response = {
      response: responses[queryType],
      language,
      tone,
      sentiment,
      escalationNeeded: sentiment === "negative" && queryType === "general",
      confidence: 0.9,
      generatedAt: new Date().toISOString(),
    };

    return JSON.stringify(response, null, 2);
  },
});
