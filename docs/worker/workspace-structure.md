# Worker 目录结构

## 概述

OpenWork Workspace 的目录结构遵循以下原则：
- **Local-first**: 本地文件夹作为工作区 root
- **Self-contained**: `.opencode/` 目录包含所有配置
- **Versioned**: 使用 `openwork.json` 版本控制

---

## 标准目录结构

```
your-project/
├── .opencode/                    # OpenWork 配置目录
│   ├── opencode.db              # 数据库（OpenCode）
│   ├── opencode.json            # OpenCode 配置
│   └── openwork.json            # OpenWork 工作区配置
├── src/                          # 项目源代码
├── package.json
├── .git/
└── openwork.json                 # 工作区根配置（可选）
```

---

## 核心文件

### 1. .opencode/openwork.json

OpenWork 工作区配置文件：

```json
{
  "version": 1,
  "workspace": {
    "name": "My Project",
    "path": "/path/to/project"
  },
  "authorizedRoots": [
    "/path/to/project"
  ],
  "reload": {
    "auto": false
  },
  "mcpServers": {
    "tools": {
      "command": "opencode",
      "args": ["mcp", "list"]
    }
  }
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| version | number | 是 | 配置版本 |
| workspace | object | 是 | 工作区信息 |
| authorizedRoots | string[] | 是 | 授权的根目录列表 |
| reload | object | 否 | 热重载配置 |
| reload.auto | boolean | 否 | 自动重载开关 |
| mcpServers | object | 否 | MCP 服务器配置 |

### 2. .opencode/opencode.json

OpenCode 配置文件，定义 agents/skills/tools：

```json
{
  "agents": {
    "default": {
      "model": "openai/gpt-4",
      "system": "You are a helpful assistant."
    }
  },
  "skills": {
    "typescript": {
      "path": "./skills/typescript"
    }
  },
  "tools": {
    "execute": {
      "command": "bash",
      "description": "Execute shell commands"
    }
  }
}
```

---

## 工作区类型

### 1. Local Workspace

**特征**：
- 本地文件夹作为工作区
- 直接编辑源代码
- 使用本地 OpenCode Engine

**创建方式**：
```typescript
await workspaceCreate({
  folderPath: "/path/to/folder",
  name: "My Project",
  preset: "starter",
});
```

**目录**：
```
/local-workspace/
├── .opencode/
│   ├── openwork.json
│   └── opencode.json
├── src/
└── openwork.json
```

### 2. Remote Workspace

**特征**：
- 连接到远程 OpenWork Server
- 通过 API 访问工作区
- 保持本地 `.opencode/` 同步

**创建方式**：
```typescript
await workspaceCreateRemote({
  url: "https://openwork.example.com",
  token: "your-token",
  name: "Remote Workspace",
});
```

**配置**：
```json
{
  "version": 1,
  "workspace": {
    "name": "Remote Workspace",
    "type": "remote",
    "url": "https://openwork.example.com",
    "token": "xxx"
  }
}
```

---

## 默认预设

### Starter Workspace

包含完整的开发环境：

```
starter/
├── .opencode/
│   ├── openwork.json
│   └── opencode.json
├── package.json
└── README.md
```

**特点**：
- 已配置 OpenCode agents
- 包含示例技能
- Node.js 环境

### Empty Workspace

最小化模板：

```
empty/
└── .opencode/
    └── openwork.json
```

**特点**：
- 空的 `.opencode/` 目录
- 需要手动配置
- 清洁的起点

---

## 热重载机制

### 触发条件

OpenWork 会监控以下文件变化：

1. `.opencode/openwork.json`
2. `.opencode/opencode.json`
3. `opencode.json`（如果存在）
4. `.opencode/agents/` 目录
5. `.opencode/skills/` 目录
6. `.opencode/tools/` 目录

### 配置

```json
{
  "reload": {
    "auto": false
  }
}
```

**auto: false**:
- 手动触发重载
- 需要重启 sesssions

**auto: true**:
- 自动重载
- 非活动 sessions 会自动重启

### 重载流程

```
1. 文件变化
   ↓
2. 监听器检测
   ↓
3. 重载队列
   ↓
4. 检查 active sessions
   ↓
5a. 有 active sessions → 等待完成
5b. 无 active sessions → 立即重载
   ↓
6. 重启 sessions
   ↓
7. 应用新配置
```

---

## 权限管理

### authorizedRoots

决定哪些目录可以被访问：

```json
{
  "authorizedRoots": [
    "/project/root",
    "/project/data"
  ]
}
```

**安全特性**：
- 只能访问授权目录
- 防止路径穿越攻击
- 可以包含多个目录

### 当前工作区

```
当前工作区 = activeWorkspace.path
授权根目录 = authorizedRoots[]
```

访问限制：文件必须在授权目录内

---

## 远程连接

### deep link 格式

```
openwork://connect?url={url}&token={token}
```

### 手动连接

1. 打开设置
2. 选择 "Add Remote Worker"
3. 输入 URL 和 Token
4. 点击 Connect

### 连接状态

```json
{
  "status": "connected" | "connecting" | "failed" | "disconnected",
  "message": "Connection established" | "Failed to connect"
}
```

---

## 最佳实践

### 1. 版本控制

**推荐**：
```bash
# 创建 .gitignore
echo ".opencode/opencode.db" >> .gitignore
```

**避免**：
```bash
# 不要提交数据库文件
.opencode/opencode.db  # 应该在 .gitignore
```

### 2. 组织技能

```
project/
└── .opencode/
    └── skills/
        ├── typescript/
        │   ├── README.md
        │   └── SKILL.md
        └── react/
            ├── README.md
            └── SKILL.md
```

### 3. 共享配置

**团队共享**：
```bash
# 推荐
.gitignore:
  .opencode/opencode.db

# 可以提交
.git:
  .opencode/openwork.json
  .opencode/opencode.json
```

### 4. 本地开发

**推荐工作流**：
```bash
# 1. 创建项目
mkdir my-project
cd my-project

# 2. 克隆或创建文件
git clone https://github.com/user/repo.git

# 3. 选择工作区
cd /path/to/repo
openwork

# 4. 启动工作区
openwork start
```

---

## 故障排查

### 问题：无法访问文件

**原因**：文件不在 authorizedRoots 中

**解决**：
```json
{
  "authorizedRoots": [
    "/path/to/project",
    "/path/to/data"  // 添加新路径
  ]
}
```

### 问题：热重载不工作

**检查**：
1. `reload.auto` 是否正确设置
2. 文件是否在监控范围内
3. 是否有 active sessions

### 问题：连接远程失败

**排查**：
```bash
# 检查 URL
curl https://openwork.example.com/health

# 检查 Token
# 确保 token 有效且未过期
```

---

## 参考

- [OpenCode 配置](https://opencode.ai/docs)
- [OpenWork Server](../server)
- [Sandbox 配置](../sandboxes)
- [工作区 API](../api)
