# 跨境电商智能体系统实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在OpenWork项目中实现4个跨境电商智能体（市场洞察、产品规划、商业化策略、运营客服），作为5个OpenCode Skills（1个Hub + 4个子Skill）

**Architecture:** 
- Hub Skill (`e-commerce-agent-hub`) 作为统一入口，负责协调调度
- 4个子Skills分别实现具体业务功能
- Skills存储在 `.opencode/skills/` 目录下
- 使用tools定义标准化的工具接口

**Tech Stack:** OpenCode Skills (SKILL.md格式), TypeScript

---

## 任务清单

### Task 1: 创建 Hub Skill (e-commerce-agent-hub)

**Files:**
- Create: `.opencode/skills/e-commerce-agent-hub/SKILL.md`

**Step 1: 创建Hub Skill目录和文件**

```markdown
---
name: e-commerce-agent-hub
description: 跨境电商智能体Hub - 协调市场洞察、产品规划、商业化策略、运营客服四大智能体
trigger: 需要跨境电商业务分析、运营决策支持
---

# 跨境电商智能体 Hub

## 概述

你是跨境电商业务的AI决策中枢，协调四大智能体完成从市场洞察到运营执行的全流程。

## 智能体架构

### 子智能体

1. **市场洞察智能体** (market-insight-agent)
   - 职能: 机会发现与评估
   - 能力: 多源数据扫描、趋势挖掘、四维交叉分析

2. **产品规划智能体** (product-planning-agent)  
   - 职能: 产品定义与创新
   - 能力: 组合式创新、产品定位、卖点提炼、潜力评估

3. **商业化策略智能体** (gtm-agent)
   - 职能: 上市与推广策略
   - 能力: GTM策略、多语言营销、广告投放

4. **运营客服智能体** (ops-support-agent)
   - 职能: 用户互动与服务
   - 能力: 订单管理、跨文化沟通、复杂查询处理

## 调度规则

根据用户需求类型，自动选择合适的子智能体：

| 需求类型 | 调用的智能体 |
|---------|-------------|
| 市场分析、趋势、机会 | market-insight-agent |
| 新品开发、产品定义 | product-planning-agent |
| 营销推广、上市计划 | gtm-agent |
| 客服、订单、运营 | ops-support-agent |
| 复杂业务场景 | 组合调用多个智能体 |

## 工具生态

所有子智能体共享以下工具能力：

### 数据获取
- `fetch_market_data` - 获取市场数据
- `search_trends` - 搜索趋势信息
- `analyze_competitors` - 分析竞争对手

### 分析能力
- `analyze_opportunity` - 评估商业机会
- `assess_product_potential` - 评估产品潜力
- `forecast_demand` - 需求预测

### 内容生成
- `generate_marketing_copy` - 生成营销文案
- `create_gtm_plan` - 创建GTM计划
- `translate_content` - 跨语言内容翻译

### 运营支持
- `query_order_status` - 查询订单状态
- `analyze_customer_sentiment` - 分析客户情感
- `generate_response` - 生成客服回复

## 输出格式

根据任务类型输出结构化结果：

### 市场洞察报告
```json
{
  "opportunity_score": 8.5,
  "market_size": "$2.5B",
  "growth_rate": "15% YoY",
  "key_trends": ["趋势1", "趋势2"],
  "recommendations": ["建议1", "建议2"]
}
```

### 产品规划方案
```json
{
  "product_concept": "产品概念描述",
  "positioning": "市场定位",
  "key_benefits": ["卖点1", "卖点2"],
  "potential_score": 8.2,
  "development_timeline": "8-12周"
}
```

### GTM策略
```json
{
  "launch_timeline": "Q2 2024",
  "target_markets": ["US", "EU"],
  "marketing_channels": ["Google Ads", "Meta"],
  "budget_allocation": {"paid": "60%", "organic": "30%", "content": "10%"}
}
```

## 使用示例

**用户请求:** "帮我分析智能家居出海机会"

**处理流程:**
1. 识别为市场洞察需求
2. 调用 market-insight-agent
3. 执行数据收集、趋势分析、机会评估
4. 输出结构化洞察报告

**用户请求:** "设计一款面向欧洲市场的厨房用品"

**处理流程:**
1. 识别为产品规划需求
2. 调用 product-planning-agent
3. 执行组合创新、定位、潜力评估
4. 输出产品规划方案

---

## 注意事项

- 成本控制：简单任务使用快速模型，复杂分析使用深度模型
- 准确率优先：关键决策需要多角度验证
- 工具安全：所有外部调用需明确权限
- 可解释性：输出需包含推理过程和置信度
```

**Step 2: 验证文件创建成功**

Run: `ls -la .opencode/skills/e-commerce-agent-hub/`
Expected: SKILL.md 文件存在

**Step 3: Commit**

```bash
git add .opencode/skills/e-commerce-agent-hub/
git commit -m "feat: add e-commerce-agent-hub skill"
```

---

### Task 2: 创建市场洞察智能体 Skill

**Files:**
- Create: `.opencode/skills/market-insight-agent/SKILL.md`

**Step 1: 创建市场洞察智能体**

```markdown
---
name: market-insight-agent
description: 市场洞察智能体 - 多源数据扫描、趋势挖掘、四维交叉分析
trigger: 市场分析、机会发现、趋势研究
---

# 市场洞察智能体

## 核心职能

**职能:** 机会发现与评估
**价值:** 分析周期从2周缩短至2小时，从跟风模仿转向先发创新

## 能力矩阵

### 1. 多源数据扫描
- 电商平台数据（Amazon, eBay, AliExpress, Shopee等）
- 社交媒体趋势（TikTok, Instagram, Twitter）
- 搜索引擎趋势（Google Trends）
- 行业报告数据

### 2. 趋势挖掘
- 识别上升趋势品类
- 发现新兴需求
- 预测季节性波动
- 追踪竞品动态

### 3. 四维交叉分析
- **消费者维度**: 需求痛点购买行为
- **市场维度**: 规模增长率竞争格局
- **供应链维度**: 成本产能物流
- **技术维度**: 创新机会替代风险

## 工具定义

### fetch_market_data
获取指定市场/品类的数据

```typescript
interface FetchMarketDataParams {
  category: string;      // 品类，如 "smart home"
  region: string;        // 区域，如 "US", "EU"
  dataSource?: string;   // 数据源，可选
  timeRange?: string;    // 时间范围，如 "last_30_days"
}
```

### search_trends
搜索趋势关键词

```typescript
interface SearchTrendsParams {
  keywords: string[];    // 关键词列表
  region?: string;       // 区域
  category?: string;      // 品类
}
```

### analyze_competitors
分析竞争对手

```typescript
interface AnalyzeCompetitorsParams {
  competitors: string[];  // 竞品列表
  metrics?: string[];     // 分析维度
}
```

### analyze_opportunity
评估商业机会

```typescript
interface AnalyzeOpportunityParams {
  market: string;        // 目标市场
  category: string;      // 目标品类
  dimensions?: string[]; // 分析维度
}
```

## 分析框架

### 机会评估模型

| 维度 | 指标 | 权重 |
|-----|------|-----|
| 市场规模 | TAM, SAM, SOM | 25% |
| 增长潜力 | YoY增长率 | 25% |
| 竞争程度 | 集中度、新进入者 | 20% |
| 供应链可行性 | 成本、产能、物流 | 15% |
| 技术成熟度 | 创新性、替代风险 | 15% |

### 趋势识别流程

1. **数据收集**: 多源数据聚合
2. **信号提取**: 识别异常波动
3. **模式识别**: 分类趋势类型
4. **预测验证**: 多角度交叉验证
5. **输出洞察**: 结构化建议

## 输出格式

### 市场洞察报告

```json
{
  "executive_summary": "核心发现一句话",
  "opportunity_score": 8.5,
  "market_analysis": {
    "size": "$2.5B",
    "growth_rate": "15% YoY",
    "segmentation": ["细分1", "细分2"]
  },
  "trend_analysis": {
    "rising_trends": ["趋势1", "趋势2"],
    "declining_trends": ["趋势1"],
    "seasonal_patterns": ["模式1"]
  },
  "competitive_landscape": {
    "key_players": ["玩家1", "玩家2"],
    "market_share": {"玩家1": "30%"},
    "opportunities": ["空白区1"]
  },
  "recommendations": [
    {"action": "行动1", "priority": "high", "rationale": "理由"}
  ],
  "risks": [
    {"risk": "风险1", "mitigation": "缓解措施"}
  ],
  "confidence": 0.85,
  "data_sources": ["数据源1", "数据源2"]
}
```

## 使用示例

**输入:**
```
分析智能家居品类在北美市场的出海机会，重点关注Amazon热销趋势和竞品动态
```

**处理:**
1. 调用 fetch_market_data 获取智能家居北美数据
2. 调用 search_trends 搜索相关趋势
3. 调用 analyze_competitors 分析主要竞品
4. 调用 analyze_opportunity 进行机会评估
5. 生成结构化报告

**输出:** 完整的市场洞察报告（见上方格式）

## 注意事项

- 数据源需注明可信度
- 预测性结论需标注置信度
- 避免过度依赖单一数据源
- 定期更新分析框架
```

**Step 2: 验证文件创建**

Run: `ls -la .opencode/skills/market-insight-agent/`
Expected: SKILL.md 文件存在

**Step 3: Commit**

```bash
git add .opencode/skills/market-insight-agent/
git commit -m "feat: add market-insight-agent skill"
```

---

### Task 3: 创建产品规划智能体 Skill

**Files:**
- Create: `.opencode/skills/product-planning-agent/SKILL.md`

**Step 1: 创建产品规划智能体**

```markdown
---
name: product-planning-agent
description: 产品规划智能体 - 组合式创新、产品定位、卖点提炼、潜力评估
trigger: 产品开发、新品规划、产品定义
---

# 产品规划智能体

## 核心职能

**职能:** 产品定义与创新
**价值:** 新品开发周期从2周缩短至2小时，提升新品成功率

## 能力矩阵

### 1. 组合式创新
- 跨品类特性组合
- 现有产品改良
- 差异化定位

### 2. 产品定位
- 目标用户画像
- 价格区间策略
- 渠道选择

### 3. 卖点提炼
- 核心差异化优势
- 用户痛点解决方案
- 情感价值主张

### 4. 量化潜力评估
- 市场接受度预测
- 利润空间估算
- 竞争壁垒分析

## 工具定义

### generate_concept
生成产品概念

```typescript
interface GenerateConceptParams {
  category: string;        // 目标品类
  target_market: string;  // 目标市场
  constraints?: {          // 约束条件
    price_range?: string;
    features?: string[];
    timeline?: string;
  };
}
```

### assess_product_potential
评估产品潜力

```typescript
interface AssessPotentialParams {
  product_concept: string;   // 产品概念
  target_market: string;    // 目标市场
  competitive_analysis?: boolean;
}
```

### analyze_positioning
分析产品定位

```typescript
interface AnalyzePositioningParams {
  product: string;          // 产品描述
  competitors: string[];   // 竞品列表
  target_segment: string;   // 目标细分
}
```

## 创新方法论

### 组合式创新框架

1. **需求扫描**: 识别目标用户核心痛点
2. **特性映射**: 列出可用特性/技术
3. **交叉组合**: 尝试非常规组合
4. **可行性验证**: 评估技术/供应链可行性
5. **差异化提炼**: 明确独特卖点

### 产品概念模板

```json
{
  "concept_name": "产品名称",
  "category": "品类",
  "core_proposition": "核心价值主张",
  "target_users": {
    "demographics": "人口统计特征",
    "psychographics": "心理特征",
    "pain_points": ["痛点1", "痛点2"]
  },
  "key_features": ["功能1", "功能2"],
  "differentiation": "差异化点",
  "price_point": "价格定位",
  "channels": ["渠道1", "渠道2"],
  "timeline": "上市时间线"
}
```

## 输出格式

### 产品规划方案

```json
{
  "executive_summary": "产品概念一句话描述",
  "product_concept": {
    "name": "产品名称",
    "category": "品类",
    "core_proposition": "核心价值"
  },
  "market_positioning": {
    "target_segment": "目标细分",
    "price_position": "价格定位",
    "competitive_differentiation": "差异化"
  },
  "key_benefits": [
    {"benefit": "卖点1", "evidence": "支撑证据"}
  ],
  "potential_assessment": {
    "market_fit_score": 8.5,
    "profit_margin_estimate": "35-45%",
    "competitive_advantage": "中等",
    "timeline_to_market": "8-12周"
  },
  "development_roadmap": [
    {"phase": "概念验证", "duration": "2周", "deliverable": "概念原型"},
    {"phase": "产品设计", "duration": "4周", "deliverable": "设计稿"},
    {"phase": "开发测试", "duration": "6周", "deliverable": "可量产样品"},
    {"phase": "上市准备", "duration": "2周", "deliverable": "GTM计划"}
  ],
  "risks": [
    {"risk": "风险1", "likelihood": "中", "mitigation": "缓解措施"}
  ],
  "confidence": 0.8
}
```

## 使用示例

**输入:**
```
设计一款面向欧洲市场的厨房用品，需要考虑欧洲消费者的使用习惯和审美偏好
```

**处理:**
1. 调用 generate_concept 生成产品概念
2. 调用 analyze_positioning 分析市场定位
3. 调用 assess_product_potential 评估市场潜力
4. 生成完整产品规划方案

**输出:** 结构化的产品规划方案（见上方格式）

## 注意事项

- 概念创新需平衡创新性与可行性
- 定位需基于充分的市场洞察
- 潜力评估需注明假设条件
- 建议多提供几个概念选项供选择
```

**Step 2: 验证文件创建**

Run: `ls -la .opencode/skills/product-planning-agent/`
Expected: SKILL.md 文件存在

**Step 3: Commit**

```bash
git add .opencode/skills/product-planning-agent/
git commit -m "feat: add product-planning-agent skill"
```

---

### Task 4: 创建商业化策略智能体 Skill

**Files:**
- Create: `.opencode/skills/gtm-agent/SKILL.md`

**Step 1: 创建商业化策略智能体**

```markdown
---
name: gtm-agent
description: 商业化策略智能体 - GTM策略、多语言营销、广告投放计划
trigger: 上市计划、营销推广、广告投放
---

# 商业化策略智能体

## 核心职能

**职能:** 上市与推广策略
**价值:** 制定精准上市计划，提升销售经营精准度与效率

## 能力矩阵

### 1. GTM (Go-To-Market) 策略
- 市场进入策略
- 渠道布局规划
- 定价策略

### 2. 多语言营销文案
- Amazon/电商平台文案
- 社交媒体内容
- 邮件营销模板

### 3. 广告投放计划
- 平台选择建议
- 受众定位策略
- 预算分配方案
- ROI预测

## 工具定义

### create_gtm_plan
创建GTM计划

```typescript
interface CreateGTMPlanParams {
  product: string;           // 产品描述
  target_markets: string[];  // 目标市场
  launch_timeline: string;   // 上市时间
  budget?: string;           // 预算
}
```

### generate_marketing_copy
生成营销文案

```typescript
interface GenerateMarketingCopyParams {
  product: string;        // 产品
  markets: string[];      // 目标市场
  channels: string[];    // 渠道
  tone?: string;         // 语调
  length?: string;       // 长度
}
```

### plan_ad_campaign
规划广告投放

```typescript
interface PlanAdCampaignParams {
  product: string;
  target_audience: string;
  budget: string;
  objectives: string[];
  platforms?: string[];
}
```

## GTM 框架

### 市场进入策略

1. **市场选择**: 基于潜力评估选择优先市场
2. **渠道策略**: 线上/线下/全渠道
3. **定价策略**: 渗透/撇脂/竞争定价
4. **促销策略**: 引流/转化/留存

### 上市时间线

```
T-8周: 市场洞察完成
T-6周: 产品定位确认
T-4周: 渠道谈判完成
T-2周: 营销素材准备
T-1周: 种子用户测试
T: 正式上市
T+2周: 效果评估优化
```

## 输出格式

### GTM 策略报告

```json
{
  "executive_summary": "GTM策略一句话概述",
  "launch_timeline": "Q2 2024",
  "target_markets": [
    {"market": "US", "priority": 1, "strategy": "主攻"}
  ],
  "pricing_strategy": {
    "initial": "渗透定价 $29.99",
    "rationale": "快速获取市场份额",
    "future": "$39.99"
  },
  "channel_strategy": {
    "primary": ["Amazon", "独立站"],
    "secondary": ["线下渠道"],
    "allocation": {"线上": "80%", "线下": "20%"}
  },
  "marketing_plan": {
    "channels": ["Google", "Meta", "TikTok"],
    "budget": "$50,000/月",
    "phases": [
      {"phase": "预热", "budget": "20%", "objective": " awareness"},
      {"phase": " launch", "budget": "50%", "objective": "conversion"},
      {"phase": "维持", "budget": "30%", "objective": "retention"}
    ]
  },
  "kpis": [
    {"metric": "月销量", "target": "1000"},
    {"metric": "ROAS", "target": "3.0"}
  ],
  "risks": ["风险1"],
  "contingency": ["应对1"]
}
```

### 营销文案示例

```json
{
  "amazon_title": "智能厨房秤 - 精准计量烘焙帮手",
  "bullet_points": [
    "精准称重，0.1g精度",
    "多种单位切换",
    "易清洁防水设计"
  ],
  "description": "产品描述文案..."
}
```

## 使用示例

**输入:**
```
为一款智能厨房秤制定上市计划，目标美国市场，预算每月5万美金
```

**处理:**
1. 调用 create_gtm_plan 创建GTM计划
2. 调用 generate_marketing_copy 生成营销文案
3. 调用 plan_ad_campaign 规划广告投放
4. 生成完整商业化方案

**输出:** GTM策略报告 + 营销素材 + 广告计划

## 注意事项

- GTM策略需与产品规划衔接
- 文案需考虑文化差异
- 广告预算需合理分配
- 设置清晰的KPI和监控机制
```

**Step 2: 验证文件创建**

Run: `ls -la .opencode/skills/gtm-agent/`
Expected: SKILL.md 文件存在

**Step 3: Commit**

```bash
git add .opencode/skills/gtm-agent/
git commit -m "feat: add gtm-agent skill"
```

---

### Task 5: 创建运营客服智能体 Skill

**Files:**
- Create: `.opencode/skills/ops-support-agent/SKILL.md`

**Step 1: 创建运营客服智能体**

```markdown
---
name: ops-support-agent
description: 运营客服智能体 - 订单管理、跨文化沟通、复杂查询处理
trigger: 客服咨询、订单问题、运营支持
---

# 运营客服智能体

## 核心职能

**职能:** 用户互动与服务
**价值:** 7×24小时服务，缩短消费者决策链路，提升满意度

## 能力矩阵

### 1. 分层Agent架构
- 基础问答层
- 复杂查询层
- 升级处理层

### 2. 复杂查询处理
- 多平台订单整合
- 物流状态追踪
- 退换货处理

### 3. 订单管理
- 订单查询/修改
- 批量操作
- 异常处理

### 4. 跨文化沟通
- 多语言支持
- 文化适配
- 时区管理

## 工具定义

### query_order_status
查询订单状态

```typescript
interface QueryOrderParams {
  order_id?: string;
  email?: string;
  platform?: string;
}
```

### analyze_customer_sentiment
分析客户情感

```typescript
interface AnalyzeSentimentParams {
  message: string;
  context?: string;
}
```

### generate_response
生成客服回复

```typescript
interface GenerateResponseParams {
  customer_query: string;
  order_info?: any;
  sentiment?: string;
  language?: string;
  tone?: "formal" | "friendly" | "empathetic";
}
```

### translate_content
跨语言内容翻译

```typescript
interface TranslateContentParams {
  content: string;
  source_lang: string;
  target_lang: string;
  style?: "formal" | "casual" | "marketing";
}
```

## 分层处理架构

### L1: 基础问答
- FAQ匹配
- 简单查询
- 自动化回复

### L2: 复杂查询
- 订单详情查询
- 物流追踪
- 退换货处理

### L3: 人工升级
- 投诉处理
- 特殊情况
- 批量/批量问题

## 输出格式

### 客服响应

```json
{
  "response": "回复内容",
  "language": "en",
  "tone": "friendly",
  "sentiment_detected": "neutral",
  "action_required": false,
  "escalation_needed": false,
  "confidence": 0.95,
  "suggested_actions": [
    {"action": "查看订单", "type": "link", "value": "/order/123"}
  ]
}
```

### 订单查询结果

```json
{
  "order_id": "ORD-12345",
  "status": "shipped",
  "items": [
    {"name": "产品1", "qty": 1, "price": 29.99}
  ],
  "shipping": {
    "carrier": "UPS",
    "tracking": "1Z999...",
    "eta": "2024-03-15"
  },
  "total": 29.99,
  "platform": "Amazon"
}
```

## 使用示例

**输入:**
```
Order #12345 的物流到哪了？预计什么时候到？
```

**处理:**
1. 调用 query_order_status 获取订单信息
2. 调用 analyze_customer_sentiment 分析客户情感
3. 调用 generate_response 生成回复
4. 输出结构化响应

**输出:** 订单状态 + 预计送达时间 + 客服回复

**输入:**
```
我要退货，怎么操作？
```

**处理:**
1. 识别为退换货请求
2. 查询订单信息确认是否符合退货条件
3. 生成退货指引
4. 如需人工升级，标记并转交

## 注意事项

- 敏感信息需脱敏处理
- 情感分析用于提升服务质量
- 复杂问题及时升级人工
- 跨文化沟通注意文化敏感性
- 7×24小时服务需考虑时区
```

**Step 2: 验证文件创建**

Run: `ls -la .opencode/skills/ops-support-agent/`
Expected: SKILL.md 文件存在

**Step 3: Commit**

```bash
git add .opencode/skills/ops-support-agent/
git commit -m "feat: add ops-support-agent skill"
```

---

## 执行选项

**Plan complete. Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
