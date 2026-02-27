# Worker 配置隔离机制

## 概述

OpenWork 通过多层次的隔离机制确保不同工作区的配置、状态和资源相互独立。本文详细介绍这种隔离是如何实现的。

---

## 隔离层次

```
┌─────────────────────────────────────────────────────────────┐
│                     用户界面层                               │
│            (不同的 Workspace Tab)                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                   Workspace 隔离                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ Workspace A │  │ Workspace B │  │ Workspace C │           │
│  │ /path/to/a │  │ /path/to/b │  │ /path/to/c │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                   目录权限隔离                                │
│            authorizedRoots 配置                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                   Session 隔离                               │
│  ┌─────────────┐  ┌─────────────┐                           │
│  │ Session 1   │  │ Session 2   │                           │
│  │ (Agent A)   │  │ (Agent B)   │                           │
│  └─────────────┘  └─────────────┘                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                   配置文件隔离                               │
│  ┌─────────────┐  ┌─────────────┐                           │
│  │ opencode   │  │ openwork    │                           │
│  │ .json     │  │ .json      │                           │
│  └─────────────┘  └─────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Workspace 隔离

### 1.1 核心概念

每个 Worker (Workspace) 有独立的：
- **ID**: 唯一标识符
- **路径**: 本地文件系统路径
- **配置**: 独立的 openwork.json 和 opencode.json
- **状态**: 独立的运行状态

### 1.2 数据结构

```typescript
interface Workspace {
  id: string;                    // 唯一标识: "local:/path/to/workspace"
  name: string;                   // 显示名称
  path: string;                   // 本地路径
  type: "local" | "remote";      // 工作区类型
  status: "idle" | "running";   // 运行状态
}
```

### 1.3 隔离实现

**路径规范化** (`utils/index.ts:183-190`):

```typescript
export function normalizeDirectoryPath(input?: string | null) {
  const trimmed = (input ?? "").trim();
  if (!trimmed) return "";
  
  // 统一路径分隔符
  const unified = trimmed.replace(/\\/g, "/");
  
  // 移除尾部斜杠
  const withoutTrailing = unified.replace(/\/+$/, "");
  
  // Windows 平台大小写不敏感
  return isWindowsPlatform() 
    ? withoutTrailing.toLowerCase() 
    : withoutTrailing;
}
```

**工作区 ID 格式**:
- 本地: `local:/absolute/path`
- 远程: `remote:https://server.com:workspace-id`

---

## 2. 目录权限隔离 (authorizedRoots)

### 2.1 核心概念

`authorizedRoots` 是工作区安全隔离的核心机制：

```json
// .opencode/openwork.json
{
  "authorizedRoots": [
    "/home/user/project-a/src",
    "/home/user/project-a/data"
  ]
}
```

### 2.2 安全作用

| 功能 | 说明 |
|------|------|
| **路径穿越防护** | 防止 Agent 访问授权目录外的文件 |
| **多项目隔离** | 不同工作区可指向同一父目录的不同子目录 |
| **精确控制** | 精确到目录级别的访问控制 |

### 2.3 隔离示例

**场景 A: 独立项目**

```
Project A (/home/user/project-a/)
├── .opencode/openwork.json
│   └── authorizedRoots: ["/home/user/project-a"]
└── src/

Project B (/home/user/project-b/)
├── .opencode/openwork.json
│   └── authorizedRoots: ["/home/user/project-b"]
└── src/
```

**结果**: Project A 无法访问 Project B 的任何文件

**场景 B: 共享父目录**

```
Parent (/home/user/parent/)
├── project-a/
│   └── authorizedRoots: ["/home/user/parent/project-a"]
└── project-b/
    └── authorizedRoots: ["/home/user/parent/project-b"]
```

**结果**: 两个项目在同一个父目录下，但彼此隔离

---

## 3. Session 隔离

### 3.1 核心概念

Session 是任务执行的基本单元，每个 Session 属于特定 Workspace：

```typescript
interface Session {
  id: string;                    // Session ID
  workspaceId: string;          // 所属 Workspace ID
  directory: string;           // 工作目录
  agent: string;                // 使用的 Agent
  status: "active" | "paused";
}
```

### 3.2 Session 过滤

加载 Session 时按 Workspace 过滤 (`session.ts:543-548`):

```typescript
// 只加载当前 Workspace 的 Sessions
const root = normalizeDirectoryPath(scopeRoot);
const filtered = root
  ? list.filter((session) => 
      normalizeDirectoryPath(session.directory) === root
    )
  : list;
```

### 3.3 隔离示例

```
Workspace A (path: /project-a)
├── Session 1: Agent - GPT-4
├── Session 2: Agent - Claude
└── Session 3: Agent - GPT-4

Workspace B (path: /project-b)
├── Session 4: Agent - GPT-4
└── Session 5: Agent - Custom
```

**注意**: Session 4 和 Session 5 属于 Workspace B，与 Workspace A 的 Sessions 完全隔离

---

## 4. 配置隔离

### 4.1 配置文件结构

每个工作区有独立的配置文件：

```
project-a/
└── .opencode/
    ├── openwork.json      # OpenWork 配置
    └── opencode.json     # OpenCode 配置

project-b/
└── .opencode/
    ├── openwork.json      # 独立的 OpenWork 配置
    └── opencode.json     # 独立的 OpenCode 配置
```

### 4.2 配置文件读取

按工作区路径读取配置 (`tauri.ts:641-646`):

```typescript
export async function readOpencodeConfig(
  scope: "project" | "global",
  projectDir: string,  // 工作区路径
): Promise<OpencodeConfigFile> {
  return invoke("read_opencode_config", { 
    scope, 
    projectDir  // 传递给 Rust 后端
  });
}
```

**关键**: `projectDir` 参数确保读取的是当前工作区的配置文件

### 4.3 配置内容隔离

**Workspace A 的 opencode.json**:

```json
{
  "agents": {
    "default": {
      "model": "openai/gpt-4",
      "system": "You are a coding assistant for Project A"
    }
  },
  "skills": ["project-a-skills"]
}
```

**Workspace B 的 opencode.json**:

```json
{
  "agents": {
    "default": {
      "model": "anthropic/claude-3",
      "system": "You are a data analysis assistant"
    }
  },
  "skills": ["data-analysis", "visualization"]
}
```

**结果**: 两个工作区使用完全不同的 Agent 配置和技能集合

---

## 5. 热重载隔离

### 5.1 重载触发

只对当前活动工作区触发重载：

```typescript
const maybeMarkReloadRequired = (part: Part) => {
  const root = normalizeDirectoryPath(options.activeWorkspaceRoot());
  if (root) {
    const session = store.sessions.find(
      (candidate) => candidate.id === part.sessionID
    );
    const sessionRoot = normalizeDirectoryPath(session?.directory ?? "");
    
    // 只有属于当前工作区的 Session 才触发重载
    if (!sessionRoot || sessionRoot !== root) {
      return;  // 忽略其他工作区的变化
    }
  }
  // 处理重载...
};
```

### 5.2 重载队列

重载信号按 Workspace ID 隔离：

```typescript
// 重载队列是 per-workspace 的
interface ReloadSignal {
  workspaceId: string;   // 工作区标识
  reason: string;         // 重载原因
  timestamp: number;
}
```

---

## 6. 实际使用示例

### 6.1 创建多个隔离的工作区

```bash
# 工作区 1: 前端项目
mkdir ~/projects/frontend-app
cd ~/projects/frontend-app
# 选择此文件夹创建 Worker

# 工作区 2: 后端项目
mkdir ~/projects/backend-api  
cd ~/projects/backend-api
# 选择此文件夹创建另一个 Worker

# 工作区 3: 数据分析
mkdir ~/projects/data-analysis
cd ~/projects/data-analysis
# 选择此文件夹创建第三个 Worker
```

### 6.2 配置差异

**frontend-app 的 opencode.json**:

```json
{
  "agents": {
    "default": {
      "model": "openai/gpt-4o",
      "tools": ["browser", "filesystem", "preview"]
    }
  }
}
```

**backend-api 的 opencode.json**:

```json
{
  "agents": {
    "default": {
      "model": "anthropic/claude-3-opus",
      "tools": ["bash", "database", "api"]
    }
  }
}
```

### 6.3 运行效果

```
┌─────────────────────────────────────────────────────────────┐
│ OpenWork Desktop                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Workspace: frontend-app]  [Workspace: backend-api]       │
│                                                             │
│  ┌──────────────────────┐   ┌──────────────────────────┐   │
│  │ Session 1            │   │ Session A               │   │
│  │ > Build the UI      │   │ > Create API endpoint   │   │
│  │                      │   │                         │   │
│  │ Using: GPT-4o       │   │ Using: Claude-3         │   │
│  │ Tools: browser, fs   │   │ Tools: bash, database   │   │
│  └──────────────────────┘   └──────────────────────────┘   │
│                                                             │
│  每个工作区:                                                │
│  - 独立的配置文件                                            │
│  - 独立的 Agent 和工具集                                      │
│  - 独立的 Session 历史                                       │
│  - 独立的权限边界                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. 远程工作区的隔离

### 7.1 连接方式

远程工作区通过 URL + Token 连接：

```
URL: https://openwork.example.com/w/workspace-id
Token: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 7.2 隔离机制

远程工作区与本地工作区有相同的隔离保证：

| 方面 | 本地 | 远程 |
|------|------|------|
| 配置文件 | `.opencode/` 目录 | 服务器端存储 |
| Session 隔离 | 按 directory 过滤 | 按 workspace_id 过滤 |
| 权限控制 | authorizedRoots | 服务器端验证 |
| 工具访问 | 本地文件系统 | 服务器端可访问范围 |

### 7.3 API 请求隔离

所有 API 请求都包含 workspace_id:

```typescript
// 请求远程工作区 API
GET /workspace/{workspace_id}/sessions
POST /workspace/{workspace_id}/sessions
DELETE /workspace/{workspace_id}/sessions/{session_id}
```

---

## 8. 最佳实践

### 8.1 目录结构建议

```
~/
└── projects/
    ├── frontend/          # 独立工作区
    │   └── .opencode/
    ├── backend/          # 独立工作区  
    │   └── .opencode/
    ├── data/             # 独立工作区
    │   └── .opencode/
    └── experiments/      # 独立工作区
        └── .opencode/
```

### 8.2 authorizedRoots 建议

**推荐**: 精确到项目根目录

```json
{
  "authorizedRoots": ["/home/user/projects/my-app"]
}
```

**避免**: 过宽的权限

```json
{
  "authorizedRoots": ["/home/user"]  // ❌ 风险高
}
```

### 8.3 配置同步

**团队共享**:

```bash
# 提交到 Git
git add .opencode/openwork.json .opencode/opencode.json
git commit -m "Add OpenWork configuration"
```

**本地覆盖**:

```bash
# 本地私有配置
echo '*.local' >> .gitignore
# 或使用 .opencode/.gitignore
```

---

## 9. 故障排查

### 9.1 无法访问文件

**症状**: Agent 报告 "Permission denied"

**检查**:
1. 文件是否在 authorizedRoots 中
2. 路径是否正确（注意大小写）

**修复**:
```json
{
  "authorizedRoots": [
    "/correct/path",
    "/additional/path"
  ]
}
```

### 9.2 配置不生效

**症状**: 修改 opencode.json 后没有效果

**检查**:
1. 是否修改了正确工作区的配置文件
2. 是否触发了热重载
3. 重启应用试试

### 9.3 Session 混乱

**症状**: 看到了其他工作区的 Session

**原因**: 可能缓存问题

**解决**:
```bash
# 重启 OpenWork
# 或清除缓存
npx openwork reset-cache
```

---

## 总结

OpenWork 的隔离机制确保：

1. **Workspace 级别**: 每个工作区有独立的 ID、路径、配置
2. **权限级别**: authorizedRoots 精确控制文件访问
3. **Session 级别**: 每个 Session 绑定到特定 Workspace
4. **配置级别**: 每个 Workspace 有独立的 opencode.json
5. **重载级别**: 热重载只影响当前活动工作区

这种多层隔离让用户可以安全地在同一机器上运行多个相互独立的自动化环境。
