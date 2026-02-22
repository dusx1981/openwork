import { tool } from "@opencode-ai/plugin";

export const createGtmPlan = tool({
  description: "创建完整的上市计划(Go-To-Market)，包含市场进入、渠道、定价策略",
  args: {
    product: tool.schema.string().describe("产品描述"),
    target_markets: tool.schema.array(tool.schema.string()).describe("目标市场列表"),
    launch_timeline: tool.schema.string().describe("预计上市时间"),
    budget: tool.schema.string().optional().describe("预算范围"),
  },
  async execute(args: { product: string; target_markets: string[]; launch_timeline: string; budget?: string }) {
    const { product, target_markets, launch_timeline, budget = "$50,000/月" } = args;

    const gtmPlan = {
      product,
      launchTimeline: launch_timeline,
      budget,
      marketStrategy: target_markets.map((market, idx) => ({
        market,
        priority: idx + 1,
        strategy: idx === 0 ? "主攻市场" : "拓展市场",
        timeline: `T+${idx * 4}周`,
        allocation: idx === 0 ? "60%" : "40%",
      })),
      pricingStrategy: {
        initial: "渗透定价",
        initialPrice: "$29.99",
        rationale: "快速获取市场份额",
        futurePrice: "$39.99",
        futureTimeline: "T+3个月",
      },
      channelStrategy: {
        primary: ["Amazon", "独立站"],
        secondary: ["线下渠道"],
        allocation: { "线上": "80%", "线下": "20%" },
        timeline: [
          { phase: "T-4周", task: "Amazon店铺开设" },
          { phase: "T-3周", task: "独立站上线" },
          { phase: "T-2周", task: "线下渠道谈判" },
          { phase: "T", task: "正式上市" },
        ],
      },
      marketingPlan: {
        channels: ["Google Ads", "Meta Ads", "TikTok", "内容营销"],
        budget: budget,
        phases: [
          { phase: "预热(T-2周)", budget: "20%", objective: "awareness", kpis: ["曝光量", "点击率"] },
          { phase: "Launch(T)", budget: "50%", objective: "conversion", kpis: ["销量", "ROAS"] },
          { phase: "维持(T+)", budget: "30%", objective: "retention", kpis: ["复购率", "LTV"] },
        ],
      },
      kpis: [
        { metric: "月销量", target: "1000", timeline: "T+1个月" },
        { metric: "ROAS", target: "3.0", timeline: "T+2个月" },
        { metric: "客户评分", target: "4.5", timeline: "T+3个月" },
      ],
      risks: [
        { risk: "竞争激烈", likelihood: "高", mitigation: "差异化营销" },
        { risk: "物流延迟", likelihood: "中", mitigation: "提前备货" },
      ],
      contingency: [
        "备用供应商",
        "多平台分发",
      ],
      createdAt: new Date().toISOString(),
    };

    return JSON.stringify(gtmPlan, null, 2);
  },
});

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

    const copy = {
      product,
      markets,
      channels,
      tone,
      length,
      copies: markets.flatMap((market) =>
        channels.map((channel) => ({
          market,
          channel,
          title: `${product} - ${market === "US" ? "Premium Quality" : "高品质"}${market === "DE" ? " - Top Qualität" : ""}`,
          headline: market === "CN" ? "限时优惠！智能生活从这里开始" : "Upgrade Your Lifestyle Today",
          bulletPoints: [
            "Premium quality materials",
            "Smart features for modern living",
            "Fast shipping worldwide",
            "30-day money-back guarantee",
          ],
          description: channel === "amazon"
            ? `Experience the future with ${product}. Premium quality, smart features, and exceptional value. Perfect for modern living. Order now!`
            : `Discover ${product}. Join thousands of satisfied customers worldwide. Free shipping on orders over $50.`,
          cta: market === "CN" ? "立即购买" : "Shop Now",
        }))
      ),
      seoKeywords: ["smart", "premium", "quality", "lifestyle", "modern"],
      generatedAt: new Date().toISOString(),
    };

    return JSON.stringify(copy, null, 2);
  },
});

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

    const budgetNum = parseInt(budget.replace(/[^0-9]/g, "")) || 50000;

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
          customAudiences: ["Website Visitors", "Similar Audiences"],
        },
        creativeFormats: platform === "Meta" ? ["Carousel", "Video", "Collection"] : ["Search", "Display", "Shopping"],
        kpis: [
          { metric: "CTR", target: "2%" },
          { metric: "CPC", target: "<$1" },
          { metric: "ROAS", target: "3.0" },
        ],
      })),
      timeline: {
        start: "T-2周",
        end: "T+4周",
        optimizationPoints: ["T+1周", "T+2周", "T+4周"],
      },
      totalBudget: budget,
      allocation: {
        awareness: "20%",
        consideration: "30%",
        conversion: "50%",
      },
      createdAt: new Date().toISOString(),
    };

    return JSON.stringify(campaign, null, 2);
  },
});
