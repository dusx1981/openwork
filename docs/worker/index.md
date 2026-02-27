# OpenWork Worker 文档

## 概述

OpenWork Worker 是可配置的自动化执行单元，代表一个独立的开发/自动化环境。

### 核心特性

- **本地运行**: 在本地机器上执行任务
- **远程连接**: 通过 URL + Token 连接到远程服务器
- **容器隔离**: Docker Sandbox 提供安全的隔离环境
- **热重载**: 运行时动态更新配置

---

## 文档导航

### 设计与架构

| 文档 | 说明 |
|------|------|
| [worker-design.md](./worker-design.md) | Worker 核心设计思想、架构、组件 |
| [isolation.md](./isolation.md) | Worker 配置隔离机制详解 |
| [workspace-structure.md](./workspace-structure.md) | 工作区目录结构和文件组织 |

### 入门指南

| 文档 | 说明 |
|------|------|
| [create-worker.md](./create-worker.md) | 创建本地 Worker |
| [create-remote-worker.md](./create-remote-worker.md) | 创建远程 Worker |
| [remote-worker-management.md](./remote-worker-management.md) | 远程 Worker 管理（连接/编辑/断开） |
| [workflow.md](./workflow.md) | 标准工作流指南 |

### 配置参考

| 文档 | 说明 |
|------|------|
| [workspace-configuration.md](./workspace-configuration.md) | 工作区配置详解 |
| [hot-reload.md](./hot-reload.md) | 热重载机制说明 |

### API 与调试

| 文档 | 说明 |
|------|------|
| [api-reference.md](./api-reference.md) | 相关 API 参考 |
| [troubleshooting.md](./troubleshooting.md) | 常见问题与解决方案 |

---

## 快速开始

### 1. 创建本地 Worker

```
1. 打开 OpenWork Desktop
2. 点击 "Create Workspace"
3. 选择本地文件夹
4. 选择预设 (Starter/Empty)
5. 点击创建
```

### 2. 配置工作区

编辑 `.opencode/openwork.json`:

```json
{
  "version": 1,
  "workspace": {
    "name": "My Project"
  },
  "authorizedRoots": ["./"],
  "reload": {
    "auto": true
  }
}
```

### 3. 启动使用

```bash
# 本地运行
npx openwork start

# 或连接远程
npx openwork connect https://example.com/token
```

---

## 核心概念

### Worker (工作区)

一个完整的自动化环境，包含：
- 配置文件 (`.opencode/`)
- 授权目录
- 执行引擎

### Session (会话)

一次任务执行会话，包含：
- 消息历史
- 执行上下文
- 工具调用记录

### Agent (智能体)

任务的实际执行者，使用模型理解和生成回复。

### Skill (技能)

可复用的任务模板，封装常见操作模式。

### Tool (工具)

原子化的操作能力，如执行命令、读写文件等。

---

## 执行模式

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| Local | 本地文件系统运行 | 日常开发 |
| Remote | 连接到远程服务器 | 团队共享 |
| Sandbox | Docker 容器隔离 | 测试/安全 |

---

## 隔离机制

Worker 通过以下方式隔离不同配置：

1. **Workspace 隔离**: 每个工作区有独立的 ID、路径、配置
2. **目录权限隔离**: `authorizedRoots` 控制文件访问
3. **Session 隔离**: 每个 Session 绑定到特定 Workspace
4. **配置隔离**: 每个 Workspace 有独立的 opencode.json

详见 [isolation.md](./isolation.md)

---

## 版本

当前版本：**v0.11.125**

---

## 相关链接

- [OpenCode 文档](https://opencode.ai/docs)
- [GitHub Issues](https://github.com/different-ai/openwork/issues)
- [Discord](https://discord.gg/openwork)
