# Worker (Workspace) 模块

## 概述

在 OpenWork 代码库中，**Worker** 和 **Workspace** 是同义词，可以互换使用。Workspace 代表一个独立的工作环境，包含配置文件、技能(Skills)、插件(Plugins)、MCP 配置等。

---

## 类型定义

### Server 端类型

**文件**: `packages/server/src/types.ts`

```typescript
export type WorkspaceType = "local" | "remote";

export interface WorkspaceConfig {
  path: string;
  name?: string;
  workspaceType?: WorkspaceType;
  baseUrl?: string;
  directory?: string;
  opencodeUsername?: string;
  opencodePassword?: string;
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  path: string;
  workspaceType: WorkspaceType;
  baseUrl?: string;
  directory?: string;
  opencodeUsername?: string;
  opencodePassword?: string;
  opencode?: {
    baseUrl?: string;
    directory?: string;
    username?: string;
    password?: string;
  };
}
```

### App 端类型

**文件**: `packages/app/src/app/lib/tauri.ts`

```typescript
export type WorkspaceInfo = {
  id: string;
  name: string;
  path: string;
  preset: string;
  workspaceType: "local" | "remote";
  remoteType?: "openwork" | "opencode" | null;
  baseUrl?: string | null;
  directory?: string | null;
  displayName?: string | null;
  openworkHostUrl?: string | null;
  openworkToken?: string | null;
  openworkWorkspaceId?: string | null;
  openworkWorkspaceName?: string | null;

  // Sandbox lifecycle metadata (desktop-managed)
  sandboxBackend?: "docker" | null;
  sandboxRunId?: string | null;
  sandboxContainerName?: string | null;
};
```

---

## 核心文件

| 文件路径 | 核心功能 |
|---------|---------|
| `packages/server/src/types.ts` | Server 端类型定义 |
| `packages/server/src/workspaces.ts` | Workspace ID 生成和构建工具函数 |
| `packages/server/src/server.ts` | Workspace API 端点实现 |
| `packages/app/src/app/lib/tauri.ts` | Tauri commands 定义 |
| `packages/app/src/app/types.ts` | App 端类型定义 |
| `packages/app/src/app/context/ 核心状态管理workspace.ts` | (3000+行) |
| `packages/app/src/app/lib/openwork-server.ts` | OpenWork Server 客户端 |

---

## Workspace 类型

### 1. Local Workspace (本地)

- 在本地文件系统存储配置和数据
- 配置文件存储在 `.opencode/` 目录

### 2. Remote Workspace (远程)

连接到远程 OpenWork Server 实例，支持两种远程类型：

- **OpenWork Remote**: 连接 OpenWork 托管的远程服务器
- **OpenCode Remote**: 连接 OpenCode 托管的远程服务器

### 3. Sandbox Workspace (沙箱)

基于 Docker 容器的隔离工作环境：
- 启动独立的 Docker 容器运行 OpenWork server
- 提供完全隔离的执行环境

---

## Workspace 预设

| 预设 | 说明 |
|------|------|
| `starter` | 包含示例技能的起始工作区 |
| `automation` | 自动化工作流模板 |
| `minimal` | 最小化空工作区 |

---

## API 端点

**文件**: `packages/server/src/server.ts`

| 方法 | 路径 | 权限 | 功能 |
|------|------|------|------|
| GET | `/workspaces` | client | 获取所有 workspaces |
| GET | `/w/:id/workspaces` | client | 获取指定 workspace 信息 |
| POST | `/workspaces/:id/activate` | host | 激活指定 workspace |
| DELETE | `/workspaces/:id` | host | 删除 workspace |
| GET | `/workspace/:id/config` | - | 获取 workspace 配置 (已废弃) |
| PATCH | `/workspace/:id/config` | - | 更新 workspace 配置 (已废弃) |

---

## Workspace 创建流程

### 本地 Workspace

1. 用户选择文件夹和预设 (starter/automation/minimal)
2. 调用 `workspaceCreate` Tauri command
3. 创建 `.opencode/` 目录结构
4. 生成 `opencode.json` 和 `openwork.json` 配置文件

### Sandbox Workspace

1. Docker 检查 (`sandboxDoctor`)
2. 创建本地 workspace
3. 启动 Docker 容器运行 OpenWork server
4. 调用 `orchestratorStartDetached` 启动沙箱服务
5. 通过 `createRemoteWorkspaceFlow` 连接远程 workspace

### 远程 Workspace 连接

1. 通过 OpenWork server URL 连接远程 workspace
2. 支持 OpenWork remote 和 OpenCode remote 两种类型

---

## 状态管理

**核心 Store**: `createWorkspaceStore` (`packages/app/src/app/context/workspace.ts`)

关键状态：

- `workspaces`: 所有 workspace 列表
- `activeWorkspaceId`: 当前活动的 workspace ID
- `workspaceConnectionStateById`: 每个 workspace 的连接状态
- `projectDir`: 当前项目目录
- `workspaceConfig`: 当前 workspace 的配置

关键函数：

- `activateWorkspace(workspaceId)`: 切换 workspace
- `connectToServer(baseUrl, directory)`: 连接到 server
- `forgetWorkspace(workspaceId)`: 删除 workspace
- `createWorkspaceFlow(preset, folder)`: 创建新 workspace
- `createSandboxFlow(preset, folder)`: 创建沙箱 workspace

---

## UI 组件

| 组件 | 功能 |
|------|------|
| `create-workspace-modal.tsx` | 创建本地/sandbox workspace |
| `create-remote-workspace-modal.tsx` | 连接远程 workspace |
| `rename-workspace-modal.tsx` | 重命名 workspace |
| `share-workspace-modal.tsx` | 导出/分享 workspace |
| `workspace-chip.tsx` | Workspace 显示芯片 |
| `workspace-switch-overlay.tsx` | Workspace 切换覆盖层 |
| `reload-workspace-toast.tsx` | Reload 提示 |

---

## Workspace 与其他模块的交互

### Skills

每个 workspace 有自己的 `.opencode/skills` 目录

### Plugins

Workspace 级别的 plugins 存储在 `.opencode/plugins`

### MCP

Workspace 配置存储在 `opencode.json` 的 `mcp` 字段

### Sessions

每个 workspace 维护自己的会话历史

### Orchestrator

Workspace 通过 orchestrator 进行管理，支持多 workspace 路由

---

## 工具函数

**文件**: `packages/server/src/workspaces.ts`

```typescript
// 根据路径生成 workspace ID
export function workspaceIdForPath(path: string): string

// 构建 workspace 信息列表
export function buildWorkspaceInfos(
  workspaces: WorkspaceConfig[],
  cwd: string,
): WorkspaceInfo[]
```

---

## 相关配置文件

- `.opencode/` - OpenCode 配置目录
- `.opencode/skills/` - 工作区技能
- `.opencode/plugins/` - 工作区插件
- `opencode.json` - OpenCode 主配置
- `openwork.json` - OpenWork 工作区配置
