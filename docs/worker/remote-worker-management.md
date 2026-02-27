# 远程 Worker 管理

## 概述

远程 Worker 的管理包括连接、断开、编辑、删除等操作。本文详细介绍远程 Worker 的管理机制和实现方式。

---

## 管理功能概览

| 功能 | 说明 | 实现位置 |
|------|------|----------|
| 创建连接 | 添加新的远程 Worker | `createRemoteWorkspaceFlow` |
| 编辑配置 | 修改 URL/Token 等 | `updateRemoteWorkspaceFlow` |
| 测试连接 | 验证连接是否有效 | `testWorkspaceConnection` |
| 断开连接 | 断开与远程服务器的连接 | `forgetWorkspace` |
| 状态监控 | 实时监控连接状态 | `WorkspaceConnectionState` |

---

## 连接状态管理

### 状态类型

```typescript
type WorkspaceConnectionStatus = 
  | "idle"       // 空闲，未连接
  | "connecting" // 连接中
  | "connected"  // 已连接
  | "error";    // 连接错误
```

### 状态数据结构

```typescript
interface WorkspaceConnectionState {
  status: WorkspaceConnectionStatus;
  message?: string | null;   // 状态消息
  checkedAt?: number | null; // 最后检查时间
}
```

### 状态管理函数

**更新状态** (`workspace.ts:362-379`):

```typescript
const updateWorkspaceConnectionState = (
  workspaceId: string,
  next: Partial<WorkspaceConnectionState>,
) => {
  const id = workspaceId.trim();
  if (!id) return;
  
  setWorkspaceConnectionStateById((prev) => {
    const current = prev[id] ?? { status: "idle", message: null, checkedAt: null };
    return {
      ...prev,
      [id]: {
        ...current,
        ...next,
        checkedAt: Date.now(),
      },
    };
  });
};
```

**清除状态** (`workspace.ts:381-390`):

```typescript
const clearWorkspaceConnectionState = (workspaceId: string) => {
  const id = workspaceId.trim();
  if (!id) return;
  
  setWorkspaceConnectionStateById((prev) => {
    if (!prev[id]) return prev;
    const next = { ...prev };
    delete next[id];
    return next;
  });
};
```

---

## 创建远程 Worker

### 函数签名

```typescript
async function createRemoteWorkspaceFlow(input: {
  openworkHostUrl?: string;    // 远程 URL
  openworkToken?: string;      // 访问令牌
  directory?: string;          // 工作目录
  displayName?: string;      // 显示名称
  sandboxBackend?: "docker"; // 沙箱后端
}): Promise<boolean>
```

### 实现流程

```
1. 输入 URL + Token
   ↓
2. normalizeOpenworkServerUrl() 规范化 URL
   ↓
3. resolveOpenworkHost() 解析服务器
   ├─ 验证服务器可用性
   ├─ 获取 workspace 信息
   └─ 返回认证信息
   ↓
4. connectToServer() 建立连接
   ↓
5. workspaceCreateRemote() 注册工作区
   ↓
6. 更新 UI 状态
```

### 核心代码

```typescript
async function createRemoteWorkspaceFlow(input) {
  // 1. 规范化 URL
  const hostUrl = normalizeOpenworkServerUrl(input.openworkHostUrl ?? "");
  
  // 2. 解析服务器
  const resolved = await resolveOpenworkHost({
    hostUrl,
    token: input.openworkToken,
    directoryHint: input.directory,
  });
  
  // 3. 建立连接
  const ok = await connectToServer(
    resolved.opencodeBaseUrl,
    resolved.directory,
    { workspaceType: "remote" },
    resolved.auth,
  );
  
  // 4. 注册工作区
  const ws = await workspaceCreateRemote({
    baseUrl: resolved.baseUrl,
    directory: resolved.directory,
    displayName: input.displayName,
    openworkHostUrl: resolved.hostUrl,
    openworkToken: input.openworkToken,
  });
  
  // 5. 更新状态
  updateWorkspaceConnectionState(ws.activeId, { 
    status: "connected", 
    message: null 
  });
}
```

---

## 编辑远程 Worker

### 函数签名

```typescript
async function updateRemoteWorkspaceFlow(
  workspaceId: string,
  input: {
    openworkHostUrl?: string;  // 新 URL（可选）
    openworkToken?: string;    // 新 Token（可选）
    directory?: string;        // 新目录（可选）
    displayName?: string;      // 新显示名称
  }
): Promise<boolean>
```

### 实现流程

```
1. 查找现有工作区
   ↓
2. 合并新旧配置
   ↓
3. 验证新服务器
   ↓
4. 更新连接
   ↓
5. 保存新配置
```

### 核心代码

```typescript
async function updateRemoteWorkspaceFlow(workspaceId, input) {
  // 1. 查找工作区
  const workspace = workspaces().find(w => w.id === workspaceId);
  if (!workspace || workspace.workspaceType !== "remote") {
    return false;
  }
  
  // 2. 合并配置
  const hostUrl = normalizeOpenworkServerUrl(
    input.openworkHostUrl ?? workspace.openworkHostUrl
  );
  const token = input.openworkToken ?? workspace.openworkToken;
  
  // 3. 验证服务器
  const resolved = await resolveOpenworkHost({
    hostUrl,
    token,
    workspaceId: workspace.openworkWorkspaceId,
  });
  
  if (resolved.kind !== "openwork") {
    options.setError("OpenWork server unavailable");
    return false;
  }
  
  // 4. 更新配置
  await workspaceUpdateRemote({
    workspaceId,
    baseUrl: resolved.baseUrl,
    directory: resolved.directory,
    displayName: input.displayName,
  });
  
  // 5. 重新连接
  await connectToServer(resolved.baseUrl, resolved.directory, ...);
  
  return true;
}
```

---

## 测试连接

### 函数签名

```typescript
async function testWorkspaceConnection(workspaceId: string): Promise<boolean>
```

### 实现逻辑

```typescript
async function testWorkspaceConnection(workspaceId) {
  const workspace = workspaces().find(w => w.id === workspaceId);
  if (!workspace) return false;
  
  // 设置状态为 connecting
  updateWorkspaceConnectionState(workspaceId, { 
    status: "connecting" 
  });
  
  try {
    // 尝试连接
    const client = await createOpenworkServerClient({
      baseUrl: workspace.baseUrl,
      token: workspace.openworkToken,
    });
    
    // 验证连接
    const info = await client.getInfo();
    
    // 成功
    updateWorkspaceConnectionState(workspaceId, { 
      status: "connected",
      message: null 
    });
    return true;
  } catch (error) {
    // 失败
    updateWorkspaceConnectionState(workspaceId, { 
      status: "error",
      message: error.message 
    });
    return false;
  }
}
```

---

## 断开连接 (Forget)

### 函数签名

```typescript
async function forgetWorkspace(workspaceId: string): Promise<void>
```

### 实现逻辑

```typescript
async function forgetWorkspace(workspaceId) {
  const id = workspaceId.trim();
  if (!id) return;
  
  console.log("[workspace] forget", { id });
  
  // 1. 调用后端删除
  const ws = await workspaceForget(id);
  
  // 2. 清除连接状态
  clearWorkspaceConnectionState(id);
  
  // 3. 更新工作区列表
  setWorkspaces(ws.workspaces);
  
  // 4. 如果删除的是当前活动的工作区，切换到其他
  if (ws.activeId) {
    await activateWorkspace(ws.activeId);
  }
}
```

---

## 远程工作区数据结构

```typescript
interface RemoteWorkspace {
  // 基础信息
  id: string;                    // "remote:https://worker.example.com:/project"
  name: string;                 // 显示名称
  path: string;                 // 本地路径（远程为空）
  workspaceType: "remote";       // 工作区类型
  remoteType: "openwork";       // 远程类型
  
  // 连接信息
  baseUrl: string;              // "https://worker.example.com/opencode"
  directory: string | null;     // 工作目录
  openworkHostUrl: string;      // 原始 URL
  openworkToken: string;        // 访问令牌
  openworkWorkspaceId: string; // 服务器端 ID
  openworkWorkspaceName: string;
  
  // Sandbox（可选）
  sandboxBackend?: "docker";
  sandboxRunId?: string;
  sandboxContainerName?: string;
}
```

---

## 状态流转图

```
                    ┌──────────┐
                    │   idle   │
                    └────┬─────┘
                         │
                         │ 用户点击连接
                         ▼
                   ┌────────────┐
         ┌───────── │ connecting │
         │         └─────┬──────┘
         │               │
         │               │ 连接成功
         │               ▼
         │         ┌────────────┐
         │         │ connected │
         │         └─────┬──────┘
         │               │
    连接失败          用户断开
         │               │
         ▼               ▼
    ┌─────────┐   ┌──────────┐
    │  error  │   │   idle   │
    └─────────┘   └──────────┘
```

---

## UI 管理界面

### 创建/编辑模态框

使用 `CreateRemoteWorkspaceModal` 组件：

```tsx
<CreateRemoteWorkspaceModal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={(input) => {
    await createRemoteWorkspaceFlow(input);
  }}
  initialValues={{
    openworkHostUrl: "https://worker.example.com",
    openworkToken: "xxx",
    displayName: "My Remote Worker"
  }}
  error={errorMessage}
/>
```

### 状态显示

```tsx
// 显示连接状态
const state = workspaceConnectionStateById()[workspaceId];

<div className={`status-${state?.status}`}>
  {state?.status === "connected" && "✓ 已连接"}
  {state?.status === "connecting" && "⟳ 连接中..."}
  {state?.status === "error" && "✗ 连接失败"}
  {state?.status === "idle" && "○ 未连接"}
</div>
```

---

## 最佳实践

### 1. 验证后再保存

```typescript
// 不好：直接保存
await workspaceCreateRemote({ url, token });

// 好：先验证再保存
const resolved = await resolveOpenworkHost({ url, token });
if (resolved.kind === "openwork") {
  await workspaceCreateRemote({ ...resolved });
}
```

### 2. 处理连接错误

```typescript
try {
  await connectToServer(url, token);
} catch (error) {
  updateWorkspaceConnectionState(id, {
    status: "error",
    message: error.message
  });
  // 显示错误给用户
  setError(error.message);
}
```

### 3. 断开时清理状态

```typescript
async function handleDisconnect(workspaceId) {
  // 1. 断开连接
  await forgetWorkspace(workspaceId);
  
  // 2. 清理本地状态
  clearWorkspaceConnectionState(workspaceId);
  
  // 3. 切换到其他工作区
  if (activeWorkspaceId() === workspaceId) {
    await switchToOtherWorkspace();
  }
}
```

---

## 故障排查

### 1. 连接失败

**症状**: "OpenWork server unavailable"

**排查步骤**:
1. 检查 URL 是否正确
2. 检查 Token 是否有效
3. 检查网络连通性

**代码位置**: `resolveOpenworkHost()`

### 2. 状态不同步

**症状**: UI 显示已连接但实际已断开

**排查步骤**:
1. 检查 SSE 连接状态
2. 重新调用 `testWorkspaceConnection()`

### 3. 配置更新失败

**症状**: 编辑后无法连接

**排查步骤**:
1. 检查新 URL/Token 是否正确
2. 验证新服务器是否可达
3. 查看错误消息

---

## 相关文档

- [创建远程 Worker](./create-remote-worker.md)
- [Worker 设计](./worker-design.md)
- [隔离机制](./isolation.md)
