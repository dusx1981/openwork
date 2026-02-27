# 创建远程 Worker

## 概述

远程 Worker 允许连接到运行在远程服务器上的 OpenWork 实例，适用于：
- 团队共享同一工作环境
- 需要更强算力
- 多设备同步工作

---

## 创建方式

### 方式一：通过 UI 创建

#### 步骤 1: 打开连接界面

在 OpenWork Desktop 中：
- 点击左侧边栏的 "Add Worker" 或 "+" 按钮
- 选择 "Connect Remote" 或 "添加远程"

#### 步骤 2: 输入连接信息

```
URL: https://your-worker-url.workers.example.com
Token: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**参数说明**：

| 参数 | 必填 | 说明 |
|------|------|------|
| URL | 是 | 远程 Worker 的 URL 地址 |
| Token | 是 | 访问令牌 |

#### 步骤 3: 确认连接

- 点击 "Connect" 或 "连接"
- 系统会验证 URL 和 Token
- 验证成功后添加到工作区列表

---

### 方式二：通过 Deep Link

#### 格式

```
openwork://connect?url={URL}&token={TOKEN}
```

#### 示例

```
openwork://connect?url=https://worker123.workers.example.com&token=ghp_xxxxxxxxxxxx
```

#### 使用场景

- 从浏览器或其他应用快速打开
- 分享给团队成员

---

### 方式三：通过代码创建

#### 函数签名

```typescript
async function createRemoteWorkspaceFlow(input: {
  openworkHostUrl?: string;   // 远程 URL
  openworkToken?: string;     // 访问令牌
  directory?: string;         // 工作目录（可选）
  displayName?: string;       // 显示名称（可选）
})
```

#### 使用示例

```typescript
await workspaceStore.createRemoteWorkspaceFlow({
  openworkHostUrl: "https://worker123.workers.example.com",
  openworkToken: "ghp_xxxxxxxxxxxx",
  displayName: "My Remote Worker"
});
```

---

## 工作原理

### 连接流程

```
1. 用户输入 URL + Token
   ↓
2. normalizeOpenworkServerUrl() 规范化 URL
   ↓
3. resolveOpenworkHost() 解析服务器
   ↓
4. connectToServer() 建立连接
   ↓
5. workspaceCreateRemote() 注册工作区
   ↓
6. 更新 UI 状态，显示远程工作区
```

### 核心函数

**resolveOpenworkHost** (`workspace.ts:1747-1785`):

```typescript
const resolved = await resolveOpenworkHost({
  hostUrl: "https://worker.example.com",
  token: "your-token",
  directoryHint: "/project"
});
```

**connectToServer** (`workspace.ts:1797-1810`):

```typescript
const ok = await connectToServer(
  "https://worker.example.com/opencode",
  "/project",
  {
    workspaceType: "remote",
    reason: "workspace-create-remote"
  },
  { token: "your-token", mode: "openwork" }
);
```

---

## 远程 Worker 数据结构

```typescript
interface RemoteWorkspace {
  id: string;                    // "remote:https://worker.example.com:/project"
  name: string;                  // 显示名称
  path: string;                  // 空（本地无文件）
  type: "remote";               // 远程类型
  baseUrl: string;              // "https://worker.example.com/opencode"
  directory: string | null;     // 工作目录
  openworkHostUrl: string;      // 原始 URL
  openworkToken: string;        // 访问令牌
  openworkWorkspaceId: string;   // 服务器端 workspace ID
  sandboxBackend?: "docker";    // Docker 沙箱（可选）
}
```

---

## 连接选项

### 1. 直接连接

适用于已有的远程 OpenWork Server：
- 团队共享服务器
- 云托管实例

### 2. Sandbox 连接

通过 Docker 容器创建临时远程环境：

```typescript
await createRemoteWorkspaceFlow({
  openworkHostUrl: "http://localhost:8787",
  token: "sandbox-token",
  sandboxBackend: "docker",
  sandboxRunId: "run-123",
  sandboxContainerName: "openwork-sandbox-abc123"
});
```

---

## 认证方式

### 1. Token 认证

```typescript
{
  token: "ghp_xxxxxxxxxxxx",
  mode: "openwork"
}
```

### 2. OAuth 认证

通过 GitHub、Google 等第三方登录。

---

## 限制和注意事项

### 功能限制

| 功能 | 本地 | 远程 |
|------|------|------|
| 文件系统访问 | ✅ | ❌ (通过 Inbox) |
| 本地插件 | ✅ | ❌ |
| Docker Sandbox | ✅ | ✅ |
| 导出配置 | ✅ | ❌ |

### 远程文件传输

远程 Worker 无法直接访问本地文件系统。需通过 **Inbox** 功能传输文件：

```
1. 在本地准备文件
2. 上传到 Inbox
3. 文件在远程可用
```

---

## 故障排查

### 1. 连接失败

**症状**: "OpenWork server unavailable"

**排查**:
- 检查 URL 是否正确
- 检查 Token 是否有效
- 检查网络连接

### 2. 认证失败

**症状**: "Invalid token" 或 "Unauthorized"

**排查**:
- 确认 Token 未过期
- 确认 Token 有足够权限

### 3. 性能问题

**症状**: 响应慢

**排查**:
- 检查网络延迟
- 考虑使用更近的服务器

---

## 最佳实践

### 1. 安全

- 不在代码中硬编码 Token
- 使用环境变量
- 定期轮换 Token

### 2. 团队协作

- 使用共享的服务器 URL
- 每人使用独立的 Token
- 通过 Inbox 共享文件

### 3. 断开连接

```typescript
// 忘记工作区
await workspaceStore.forgetWorkspace(workspaceId);
```

---

## 相关文档

- [Worker 设计](./worker-design.md)
- [隔离机制](./isolation.md)
- [热重载](./hot-reload.md)
