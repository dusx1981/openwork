import type { HubSkillCard } from "../types";

export const E_COMMERCE_BUILTIN_SKILLS: HubSkillCard[] = [
  {
    name: "e-commerce-agent-hub",
    description: "跨境电商智能体Hub - 协调市场洞察、产品规划、商业化策略、运营客服四大智能体",
    trigger: "需要跨境电商业务分析、运营决策支持",
    source: { owner: "local", repo: "builtin", ref: "main", path: "skills/e-commerce-agent-hub" },
  },
  {
    name: "market-insight-agent",
    description: "市场洞察智能体 - 多源数据扫描、趋势挖掘、四维交叉分析",
    trigger: "市场分析、机会发现、趋势研究",
    source: { owner: "local", repo: "builtin", ref: "main", path: "skills/market-insight-agent" },
  },
  {
    name: "product-planning-agent",
    description: "产品规划智能体 - 组合式创新、产品定位、卖点提炼、潜力评估",
    trigger: "产品开发、新品规划、产品定义",
    source: { owner: "local", repo: "builtin", ref: "main", path: "skills/product-planning-agent" },
  },
  {
    name: "gtm-agent",
    description: "商业化策略智能体 - GTM策略、多语言营销、广告投放计划",
    trigger: "上市计划、营销推广、广告投放",
    source: { owner: "local", repo: "builtin", ref: "main", path: "skills/gtm-agent" },
  },
  {
    name: "ops-support-agent",
    description: "运营客服智能体 - 订单管理、跨文化沟通、复杂查询处理",
    trigger: "客服咨询、订单问题、运营支持",
    source: { owner: "local", repo: "builtin", ref: "main", path: "skills/ops-support-agent" },
  },
];

export function getECommerceSkills(): HubSkillCard[] {
  return E_COMMERCE_BUILTIN_SKILLS;
}
