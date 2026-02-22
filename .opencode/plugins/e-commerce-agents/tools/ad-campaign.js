import { tool } from "@opencode-ai/plugin";

export const planAdCampaign = tool({
  description: "规划广告投放计划，包含平台选择、受众定位、预算分配",
  args: {
    product: tool.schema.string().describe("产品描述"),
    target_audience: tool.schema.string().describe("目标受众"),
    budget: tool.schema.string().describe("预算"),
    objectives: tool.schema.array(tool.schema.string()).describe("营销目标"),
    platforms: tool.schema.array(tool.schema.string()).optional().describe("投放平台"),
  },
  async execute(args: { product: string; target_audience: string; budget: string; objectives: string[]; platforms?: string[] }) {
    const { product, target_audience, budget, objectives, platforms = ["Google", "Meta", "TikTok"] } = args;

    const campaign = {
      product,
      targetAudience: target_audience,
      budget,
      objectives,
      platforms: platforms.map((platform) => ({
        name: platform,
        budgetAllocation: `${Math.floor(Math.random() * 40 + 20)}%`,
        bidStrategy: platform === "Google" ? "Maximize Conversions" : "Lowest Cost",
        targeting: {
          demographics: "25-45岁",
          interests: ["Technology", "Lifestyle", "Shopping"],
        },
        kpis: [
          { metric: "CTR", target: "2%" },
          { metric: "CPC", target: "<$1" },
          { metric: "ROAS", target: "3.0" },
        ],
      })),
      timeline: {
        start: "T-2周",
        end: "T+4周",
      },
      createdAt: new Date().toISOString(),
    };

    return JSON.stringify(campaign, null, 2);
  },
});
