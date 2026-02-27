# Worker 设计文档

## 概述

Worker 是 OpenWork 的核心执行单元，代表一个可配置的自动化运行环境。它是连接用户意图与实际执行的桥梁，支持本地运行、远程连接和容器化部署等多种模式。

---

## 核心理念

### 1. 本地优先 (Local-First)

Worker 优先在用户本地机器上运行：
- 低延迟：无需网络往返
- 隐私：数据保留在本地
- 成本：无需云资源
- 离线可用：断网也能工作

### 2. 云就绪 (Cloud-Ready)

当本地计算资源不足或需要共享时，可轻松扩展到云端：
- 统一的 API 表面
- 无缝的连接体验
- 灵活的资源配置

### 3. 能力可组合 (Composable)

Worker 的能力由可插拔的组件构成：
- **Agents**: 任务执行的智能体
- **Skills**: 可复用的任务模板
- **Tools**: 原子化的操作能力
- **MCP Servers**: 扩展服务接口

---

## 架构设计

### 分层架构

```
┌─────────────────────────────────────────────┐
│              User Interface                  │
│   (Desktop App / Web / CLI / Messaging)     │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────┴───────────────────────┐
│            OpenWork Control Layer            │
│   (Session Management / UI State / Auth)    │
└─────────────────────┴───────────────────────┘
                      │
┌─────────────────────┴───────────────────────┐
│              Worker Runtime                   │
│  ┌─────────────────────────────────────────┐│
│  │           OpenCode Engine               ││
│  │  (Agents + Skills + Tools + MCP)       ││
│  └─────────────────────────────────────────┘│
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────┴───────────────────────┐
│           Execution Environment              │
│   (Local / Remote / Docker Sandbox)         │
└─────────────────────────────────────────────┘
```

### 执行模式

| 模式 | 描述 | 适用场景 |
|------|------|----------|
| **Local** | 本地文件系统运行 | 日常开发、快速迭代 |
| **Remote** | 连接到远程服务器 | 团队共享、算力需求 |
| **Sandbox** | Docker 容器隔离 | 安全隔离、测试环境 |

---

## 核心组件

### 1. Workspace (工作区)

工作区是 Worker 的配置容器：

```typescript
interface Workspace {
  id: string;                    // 唯一标识
  name: string;                  // 显示名称
  path: string;                  // 本地路径
  type: "local" | "remote";     // 工作区类型
  status: "idle" | "running";    // 运行状态
}
```

**职责**：
- 管理配置文件
- 维护授权目录
- 协调资源访问

### 2. Session (会话)

会话是任务执行的基本单元：

```typescript
interface Session {
  id: string;
  workspaceId: string;
  agent: string;                 // 使用的 Agent
  status: "active" | "paused" | "completed";
  messages: Message[];           // 交互历史
  tools: Tool[];                // 可用工具
}
```

**职责**：
- 维护执行上下文
- 管理消息流
- 处理工具调用

### 3. Agent (智能体)

Agent 是任务的实际执行者：

```typescript
interface Agent {
  id: string;
  name: string;
  model: string;                 // 使用的模型
  systemPrompt?: string;         // 系统提示
  tools?: string[];             // 可用工具列表
  skills?: string[];           // 加载的技能
}
```

**职责**：
- 理解用户意图
- 规划执行步骤
- 调用工具完成任务

### 4. Skill (技能)

Skill 是可复用的任务模板：

```yaml
# SKILL.md
# Skill Name

## Description
What this skill does

## Parameters
- param1: type - description
- param2: type - description

## Steps
1. Step description
2. Another step
```

**职责**：
- 封装常见任务模式
- 提供可配置的模板
- 支持版本化和共享

### 5. Tool (工具)

Tool 是原子化的操作能力：

```typescript
interface Tool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  execute: (input: any) => Promise<any>;
}
```

**职责**：
- 提供基础操作能力
- 抽象系统交互
- 支持扩展和自定义

---

## 数据流

### 任务执行流程

```
1. 用户输入
   ↓
2. UI 转发到 Session
   ↓
3. Session 传递给 Agent
   ↓
4. Agent 理解意图
   ↓
5. Agent 规划步骤
   ↓
6. Agent 调用 Tool
   ↓
7. Tool 执行操作
   ↓
8. 结果返回给 Agent
   ↓
9. Agent 生成响应
   ↓
10. Session 记录消息
   ↓
11. UI 渲染响应
```

### 状态同步

```
┌──────────────┐     事件      ┌──────────────┐
│   UI 层      │ ──────────→  │   Session    │
│              │ ←──────────  │              │
└──────────────┘    状态更新   └──────────────┘
                           │
                           │ 状态变更
                           ▼
                    ┌──────────────┐
                    │   Engine    │
                    └──────────────┘
```

---

## 配置模型

### openwork.json

```json
{
  "version": 1,
  "workspace": {
    "name": "My Project",
    "type": "local"
  },
  "authorizedRoots": [
    "./src",
    "./data"
  ],
  "reload": {
    "auto": true
  },
  "mcpServers": {}
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| version | number | 是 | 配置版本 |
| workspace | object | 是 | 工作区信息 |
| workspace.name | string | 是 | 显示名称 |
| workspace.type | string | 是 | local/remote |
| authorizedRoots | string[] | 是 | 授权目录 |
| reload | object | 否 | 重载配置 |
| mcpServers | object | 否 | MCP 服务 |

---

## 生命周期

### 创建阶段

```
1. 选择位置
   ↓
2. 选择预设 (starter/empty/automation)
   ↓
3. 创建目录结构
   ↓
4. 初始化配置
   ↓
5. 安装依赖 (可选)
   ↓
6. 启动运行时
```

### 运行阶段

```
1. 加载配置
   ↓
2. 初始化 Engine
   ↓
3. 启动 API 服务
   ↓
4. 等待任务
   ↓
5. 处理任务
   ↓
6. 返回结果
```

### 停止阶段

```
1. 接收停止信号
   ↓
2. 保存状态
   ↓
3. 清理资源
   ↓
4. 关闭连接
   ↓
5. 退出进程
```

---

## 连接模式

### Deep Link

用于从外部触发连接：

```
openwork://connect?url={server_url}&token={access_token}
```

### 手动连接

用户主动添加远程 Worker：

```
URL: https://worker.example.com
Token: xxxxxxxx
```

### OAuth 认证

支持第三方登录：

```
支持的提供商: GitHub, Google, Email
```

---

## 扩展性

### MCP 协议

Model Context Protocol (MCP) 提供标准化扩展：

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    }
  }
}
```

### 自定义工具

```typescript
// 注册自定义工具
registerTool({
  name: "myTool",
  description: "Do something",
  inputSchema: { ... },
  execute: async (input) => { ... }
});
```

### 插件系统

未来将支持更灵活的插件机制。

---

## 安全性

### 目录隔离

- `authorizedRoots` 限制可访问目录
- 防止路径穿越攻击

### 权限确认

- 敏感操作需要用户确认
- 支持手动/自动两种模式

### 网络隔离

- 本地模式：无网络暴露
- 远程模式：可选 OAuth 认证
- Sandbox：容器网络隔离

---

## 性能目标

| 指标 | 目标 |
|------|------|
| 首次响应 | < 500ms |
| 工具调用 | < 100ms |
| 内存占用 | < 200MB (idle) |
| 启动时间 | < 2s |

---

## 设计原则总结

1. **简单优先**: 最简单的方案往往最好
2. **本地优先**: 充分利用本地资源
3. **可组合**: 通过组合实现复杂性
4. **可扩展**: 保持架构开放
5. **安全默认**: 最小权限原则
6. **用户可控**: 始终让用户做主

---

## 相关文档

- [创建 Worker](./create-worker.md)
- [目录结构](./workspace-structure.md)
- [API 参考](./api-reference.md)
- [故障排查](./troubleshooting.md)
