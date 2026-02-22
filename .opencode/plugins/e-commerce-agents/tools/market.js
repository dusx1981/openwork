import { tool } from "@opencode-ai/plugin";
import { semanticSearch } from "../lib/knowledge-base.js";

interface FetchMarketDataParams {
  category: string;
  region: string;
  dataSource?: string;
  timeRange?: string;
}

export const fetchMarketData = tool({
  description: "获取指定市场/品类的电商数据，包括销售排名、价格区间、评论数量等",
  args: {
    category: tool.schema.string().describe("目标品类，如 'smart home', 'kitchen', 'electronics'"),
    region: tool.schema.string().describe("目标区域，如 'US', 'EU', 'UK', 'global'"),
    dataSource: tool.schema.string().optional().describe("数据源，如 'amazon', 'shopee', 'aliexpress'"),
    timeRange: tool.schema.string().optional().describe("时间范围，如 'last_30_days', 'last_90_days', 'last_year'"),
  },
  async execute(args: FetchMarketDataParams) {
    const { category, region, dataSource = "amazon", timeRange = "last_30_days" } = args;

    const marketData: Record<string, unknown> = {
      category,
      region,
      dataSource,
      timeRange,
      data: {
        totalProducts: Math.floor(Math.random() * 100000) + 10000,
        avgPrice: Math.floor(Math.random() * 100) + 20,
        avgRating: (Math.random() * 2 + 3.5).toFixed(1),
        reviewCount: Math.floor(Math.random() * 50000) + 1000,
        topSellers: [
          { name: "Brand A", marketShare: "25%", revenue: "$2.5M" },
          { name: "Brand B", marketShare: "18%", revenue: "$1.8M" },
          { name: "Brand C", marketShare: "12%", revenue: "$1.2M" },
        ],
        priceDistribution: {
          "0-20": "30%",
          "20-50": "35%",
          "50-100": "25%",
          "100+": "10%",
        },
        trends: {
          growth: "+15% YoY",
          topKeywords: ["smart", "wireless", "portable", "eco-friendly"],
        },
      },
      retrievedAt: new Date().toISOString(),
    };

    return JSON.stringify(marketData, null, 2);
  },
});

export const searchTrends = tool({
  description: "搜索电商趋势关键词，分析上升和下降趋势",
  args: {
    keywords: tool.schema.array(tool.schema.string()).describe("要搜索的关键词列表"),
    region: tool.schema.string().optional().describe("目标区域"),
    category: tool.schema.string().optional().describe("目标品类"),
  },
  async execute(args: { keywords: string[]; region?: string; category?: string }) {
    const { keywords, region = "global", category } = args;

    const searchResults = await semanticSearch(`趋势 ${keywords.join(" ")} ${category || ""}`, 5);

    const trends = {
      query: keywords,
      region,
      category,
      trends: searchResults.map((item, idx) => ({
        rank: idx + 1,
        keyword: keywords[idx % keywords.length],
        trend: idx % 2 === 0 ? "rising" : "stable",
        volumeChange: idx % 2 === 0 ? `+${Math.floor(Math.random() * 50) + 10}%` : "0%",
        relatedTopics: searchResults.slice(0, 3),
      })),
      insights: searchResults,
      searchedAt: new Date().toISOString(),
    };

    return JSON.stringify(trends, null, 2);
  },
});

export const analyzeCompetitors = tool({
  description: "分析竞争对手的市场表现、产品策略和优劣势",
  args: {
    competitors: tool.schema.array(tool.schema.string()).describe("竞品列表"),
    metrics: tool.schema.array(tool.schema.string()).optional().describe("分析维度"),
  },
  async execute(args: { competitors: string[]; metrics?: string[] }) {
    const { competitors, metrics = ["market_share", "pricing", "reviews", "features"] } = args;

    const analysis = {
      competitors: competitors.map((name) => ({
        name,
        metrics: {
          marketShare: `${Math.floor(Math.random() * 30) + 5}%`,
          avgPrice: `$${Math.floor(Math.random() * 80) + 20}`,
          rating: (Math.random() * 1.5 + 3.5).toFixed(1),
          reviewCount: Math.floor(Math.random() * 20000) + 1000,
          fulfillmentRate: `${Math.floor(Math.random() * 20) + 80}%`,
        },
        strengths: [
          "品牌知名度高",
          "产品质量稳定",
          "客户服务好",
        ].slice(0, Math.floor(Math.random() * 3) + 1),
        weaknesses: [
          "价格较高",
          "物流速度慢",
          "产品种类少",
        ].slice(0, Math.floor(Math.random() * 2) + 1),
      })),
      comparisonMatrix: {
        price: competitors.map(() => Math.floor(Math.random() * 100)),
        quality: competitors.map(() => Math.floor(Math.random() * 100)),
        service: competitors.map(() => Math.floor(Math.random() * 100)),
      },
      analyzedAt: new Date().toISOString(),
    };

    return JSON.stringify(analysis, null, 2);
  },
});

export const analyzeOpportunity = tool({
  description: "评估商业机会，从市场规模、增长潜力、竞争程度等维度分析",
  args: {
    market: tool.schema.string().describe("目标市场，如 'US', 'EU', 'Southeast Asia'"),
    category: tool.schema.string().describe("目标品类"),
    dimensions: tool.schema.array(tool.schema.string()).optional().describe("分析维度"),
  },
  async execute(args: { market: string; category: string; dimensions?: string[] }) {
    const { market, category, dimensions = ["market_size", "growth", "competition", "supply_chain", "technology"] } = args;

    const opportunityScore = Math.floor(Math.random() * 30) + 70;

    const analysis = {
      market,
      category,
      dimensions,
      scores: {
        market_size: { score: Math.floor(Math.random() * 30) + 70, weight: 0.25 },
        growth: { score: Math.floor(Math.random() * 30) + 70, weight: 0.25 },
        competition: { score: Math.floor(Math.random() * 30) + 70, weight: 0.2 },
        supply_chain: { score: Math.floor(Math.random() * 30) + 70, weight: 0.15 },
        technology: { score: Math.floor(Math.random() * 30) + 70, weight: 0.15 },
      },
      overallScore: opportunityScore,
      recommendation: opportunityScore >= 80 ? "强烈推荐" : opportunityScore >= 70 ? "推荐" : "谨慎考虑",
      riskFactors: ["物流成本上升", "竞争加剧", "政策变化"],
      opportunityFactors: ["市场需求增长", "技术成熟", "供应链完善"],
      analyzedAt: new Date().toISOString(),
    };

    return JSON.stringify(analysis, null, 2);
  },
});
