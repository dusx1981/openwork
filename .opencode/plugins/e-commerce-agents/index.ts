import type { Plugin } from "@opencode-ai/plugin";
import { fetchMarketData } from "./tools/market.js";
import { searchTrends } from "./tools/trends.js";
import { analyzeCompetitors } from "./tools/competitors.js";
import { analyzeOpportunity } from "./tools/opportunity.js";
import { generateConcept } from "./tools/concept.js";
import { assessProductPotential } from "./tools/potential.js";
import { analyzePositioning } from "./tools/positioning.js";
import { createGtmPlan } from "./tools/gtm.js";
import { generateMarketingCopy } from "./tools/marketing.js";
import { planAdCampaign } from "./tools/ad-campaign.js";
import { queryOrderStatus } from "./tools/order.js";
import { analyzeCustomerSentiment } from "./tools/sentiment.js";
import { generateResponse } from "./tools/response.js";
import { translateContent } from "./tools/translate.js";
import { initializeKnowledgeBase } from "./lib/knowledge-base.js";

export const ECommerceAgentsPlugin: Plugin = async (context) => {
  await initializeKnowledgeBase(context);

  return {
    tools: {
      fetch_market_data: fetchMarketData,
      search_trends: searchTrends,
      analyze_competitors: analyzeCompetitors,
      analyze_opportunity: analyzeOpportunity,
      generate_concept: generateConcept,
      assess_product_potential: assessProductPotential,
      analyze_positioning: analyzePositioning,
      create_gtm_plan: createGtmPlan,
      generate_marketing_copy: generateMarketingCopy,
      plan_ad_campaign: planAdCampaign,
      query_order_status: queryOrderStatus,
      analyze_customer_sentiment: analyzeCustomerSentiment,
      generate_response: generateResponse,
      translate_content: translateContent,
    },
  };
};

export default ECommerceAgentsPlugin;
