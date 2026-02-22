import { tool } from "@opencode-ai/plugin";

export const generateMarketingCopy = tool({
  description: "生成多语言营销文案，适用于电商平台、社交媒体等",
  args: {
    product: tool.schema.string().describe("产品描述"),
    markets: tool.schema.array(tool.schema.string()).describe("目标市场"),
    channels: tool.schema.array(tool.schema.string()).describe("营销渠道"),
    tone: tool.schema.string().optional().describe("语调风格"),
    length: tool.schema.string().optional().describe("文案长度"),
  },
  async execute(args: { product: string; markets: string[]; channels: string[]; tone?: string; length?: string }) {
    const { product, markets, channels, tone = "professional", length = "medium" } = args;

    const copies = {};

    for (const market of markets) {
      for (const channel of channels) {
        const key = `${market}_${channel}`;
        copies[key] = {
          market,
          channel,
          title: `${product} - ${market === "US" ? "Premium Quality" : "高品质"}`,
          headline: market === "CN" ? "智能生活从这里开始" : "Upgrade Your Lifestyle Today",
          bulletPoints: [
            "Premium quality materials",
            "Smart features for modern living",
            "Fast shipping worldwide",
            "30-day money-back guarantee",
          ],
          description: channel === "amazon"
            ? `Experience the future with ${product}. Premium quality, smart features, and exceptional value.`
            : `Discover ${product}. Join thousands of satisfied customers worldwide.`,
          cta: market === "CN" ? "立即购买" : "Shop Now",
        };
      }
    }

    return JSON.stringify({ product, markets, channels, tone, copies }, null, 2);
  },
});
