import { tool } from "@opencode-ai/plugin";

export const queryOrderStatus = tool({
  description: "查询订单状态，包含物流信息、预计送达时间",
  args: {
    order_id: tool.schema.string().optional().describe("订单ID"),
    email: tool.schema.string().optional().describe("邮箱"),
    platform: tool.schema.string().optional().describe("平台"),
  },
  async execute(args: { order_id?: string; email?: string; platform?: string }) {
    const { order_id = "ORD-" + Math.random().toString(36).substr(2, 8).toUpperCase(), email, platform = "amazon" } = args;

    const order = {
      orderId: order_id,
      status: ["processing", "shipped", "out_for_delivery", "delivered"][Math.floor(Math.random() * 4)],
      platform,
      customer: {
        email: email || "customer@example.com",
        name: "Customer Name",
      },
      items: [
        {
          name: "Product Name",
          sku: "SKU-12345",
          quantity: 1,
          price: 29.99,
          image: "https://example.com/image.jpg",
        },
      ],
      shipping: {
        carrier: ["UPS", "FedEx", "DHL", "USPS"][Math.floor(Math.random() * 4)],
        trackingNumber: "1Z999AA10123456784",
        status: "in_transit",
        eta: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        history: [
          { status: "Order placed", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
          { status: "Shipped", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
          { status: "In transit", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
        ],
      },
      payment: {
        method: "Credit Card",
        status: "paid",
        total: 29.99,
        shipping: 5.99,
        tax: 2.50,
      },
      timeline: {
        ordered: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        shipped: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      queriedAt: new Date().toISOString(),
    };

    return JSON.stringify(order, null, 2);
  },
});

export const analyzeCustomerSentiment = tool({
  description: "分析客户消息的情感倾向",
  args: {
    message: tool.schema.string().describe("客户消息内容"),
    context: tool.schema.string().optional().describe("上下文信息"),
  },
  async execute(args: { message: string; context?: string }) {
    const { message, context } = args;

    const positiveWords = ["great", "excellent", "love", "amazing", "wonderful", "感谢", "棒", "好评"];
    const negativeWords = ["bad", "terrible", "hate", "awful", "worst", "差", "投诉", "失望"];

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
      keyEmotions: sentiment === "positive" ? ["satisfaction", "excitement"] : sentiment === "negative" ? ["frustration", "disappointment"] : ["curiosity", "neutral"],
      suggestedTone: sentiment === "positive" ? "appreciative" : sentiment === "negative" ? "empathetic" : "helpful",
      urgencyLevel: lowerMessage.includes("urgent") || lowerMessage.includes("紧急") ? "high" : lowerMessage.includes("asap") ? "medium" : "normal",
      analyzedAt: new Date().toISOString(),
    };

    return JSON.stringify(analysis, null, 2);
  },
});

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
    const { customer_query, order_info, sentiment = "neutral", language = "en", tone = "friendly" } = args;

    const responses: Record<string, Record<string, string>> = {
      en: {
        order_status: `Your order is on its way! You can track it using tracking number ${order_info ? order_info["trackingNumber"] : "1Z999AA10123456784"}. Expected delivery: ${new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString()}.`,
        return: `We're sorry to hear you'd like to return your item. Please visit our returns portal at example.com/returns or reply with your order number and we'll help you process it.`,
        general: "Thank you for reaching out! How can I help you today?",
      },
      cn: {
        order_status: "您的订单已在配送中！您可以使用快递单号查询物流信息。预计送达日期：两天后。",
        return: "非常抱歉您需要退货。请访问我们的退货门户或回复订单号，我们将协助您处理。",
        general: "感谢您的咨询！请问有什么可以帮助您的？",
      },
    };

    let queryType = "general";
    const lowerQuery = customer_query.toLowerCase();
    if (lowerQuery.includes("order") || lowerQuery.includes("shipping") || lowerQuery.includes("物流")) {
      queryType = "order_status";
    } else if (lowerQuery.includes("return") || lowerQuery.includes("refund") || lowerQuery.includes("退货")) {
      queryType = "return";
    }

    const response = {
      response: responses[language]?.[queryType] || responses["en"]["general"],
      language,
      tone,
      sentiment,
      suggestedActions: queryType === "order_status" ? [
        { action: "Track Order", type: "link", value: "/track-order" },
      ] : queryType === "return" ? [
        { action: "Start Return", type: "link", value: "/returns" },
      ] : [],
      escalationNeeded: sentiment === "negative" && !queryType,
      confidence: 0.9,
      generatedAt: new Date().toISOString(),
    };

    return JSON.stringify(response, null, 2);
  },
});

export const translateContent = tool({
  description: "跨语言内容翻译，适用于产品文案、客服对话",
  args: {
    content: tool.schema.string().describe("待翻译内容"),
    source_lang: tool.schema.string().describe("源语言"),
    target_lang: tool.schema.string().describe("目标语言"),
    style: tool.schema.string().optional().describe("翻译风格"),
  },
  async execute(args: { content: string; source_lang: string; target_lang: string; style?: string }) {
    const { content, source_lang, target_lang, style = "formal" } = args;

    const translations: Record<string, Record<string, string>> = {
      "en-cn": {
        "Shop Now": "立即购买",
        "Free Shipping": "免费配送",
        "30-Day Return": "30天退换",
        "Premium Quality": "优质品质",
      },
      "cn-en": {
        "立即购买": "Shop Now",
        "免费配送": "Free Shipping",
        "30天退换": "30-Day Return",
        "优质品质": "Premium Quality",
      },
    };

    const key = `${source_lang}-${target_lang}`;
    let translated = content;

    if (translations[key]) {
      for (const [src, dst] of Object.entries(translations[key])) {
        translated = translated.replace(new RegExp(src, "gi"), dst);
      }
    }

    if (translated === content) {
      translated = `[${target_lang}] ${content}`;
    }

    const result = {
      original: content,
      translated,
      sourceLang: source_lang,
      targetLang: target_lang,
      style,
      alternatives: [
        { text: translated, confidence: 0.9, style: "formal" },
        { text: `[casual:${target_lang}] ${content}`, confidence: 0.7, style: "casual" },
      ],
      localizedAt: new Date().toISOString(),
    };

    return JSON.stringify(result, null, 2);
  },
});
