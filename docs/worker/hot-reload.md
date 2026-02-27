# 热重载机制

## 概述

热重载允许在不重启 OpenWork 运行时的情况下动态更新配置。

---

## 触发条件

以下文件变化会触发重载：

1. `.opencode/openwork.json`
2. `.opencode/opencode.json`
3. `opencode.json`（根目录）
4. `.opencode/agents/` 目录
5. `.opencode/skills/` 目录
6. `.opencode/tools/` 目录

---

## 配置

```json
{
  "reload": {
    "auto": true
  }
}
```

### reload.auto

| 值 | 行为 |
|----|------|
| `false` | 需要手动触发 |
| `true` | 自动重载 |

---

## 重载流程

```
1. 监听文件变化
   ↓
2. 添加到重载队列
   ↓
3. 检查 active sessions
   ↓
4a. 有 active sessions → 等待完成
4b. 无 active sessions → 立即重载
   ↓
5. 重启 sessions
   ↓
6. 应用新配置
```

---

## 最佳实践

### 1. 开发模式

```json
{
  "reload": {
    "auto": true
  }
}
```

**优点**：快速迭代配置

### 2. 生产模式

```json
{
  "reload": {
    "auto": false
  }
}
```

**优点**：稳定可控

---

## API

### 手动触发

```typescript
await openwork.reload();
```

### 状态查询

```typescript
const status = await openwork.getReloadStatus();
// {
//   queueSize: 0,
//   pending: false,
//   auto: true
// }
```
