# 创建 Worker 逻辑文档

## 目录
- [概述](#概述)
- [完整流程](#完整流程)
- [关键文件](#关键文件)
- [详细实现](#详细实现)
- [UI 组件](#ui-组件)
- [错误处理](#错误处理)

---

## 概述

OpenWork 支持两种方式创建 Worker：
1. **本地 Worker**：选择本地文件夹创建
2. **Cloud Worker**：在远程服务器创建

本文档重点介绍**本地 Worker 的文件夹选择逻辑**，包括 UI 层、业务逻辑层和 Tauri 系统集成。

---

## 完整流程

```
用户点击"Create Workspace"按钮
          ↓
  打开 CreateWorkspaceModal 模态框
          ↓
    1. 选择文件夹 (onPickFolder)
          ↓
  pickWorkspaceFolder() [workspace.ts:2141]
          ↓
  isTauriRuntime() 检查
          ↓
  pickDirectory({ title }) [tauri.ts:474]
          ↓
  @tauri-apps/plugin-dialog.open()
          ↓
    用户选择文件夹
          ↓
    返回 folder 路径
          ↓
    2. 选择 preset
          ↓
  Starter / Empty Workspace
          ↓
    3. 确认创建
          ↓
  createWorkspaceFlow(preset, folder) [workspace.ts:1398]
          ↓
  resolveWorkspacePath(folder) [workspace.ts:2686]
          ↓
  workspaceCreate({ folderPath, name, preset })
```

---

## 关键文件

| 文件 | 路径 | 作用 |
|------|------|------|
| CreateWorkspaceModal | `packages/app/src/app/components/create-workspace-modal.tsx` | UI 组件，文件夹选择界面 |
| Workspace Context | `packages/app/src/app/context/workspace.ts` | 业务逻辑，工作区管理 |
| Tauri Helpers | `packages/app/src/app/lib/tauri.ts` | Tauri 命令封装 |
| App Entry | `packages/app/src/app/app.tsx` | 主应用入口，集成模态框 |

---

## 详细实现

### 1. UI 组件：CreateWorkspaceModal

**组件签名** (`create-workspace-modal.tsx:8-39`):
```typescript
export default function CreateWorkspaceModal(props: {
  open: boolean;                              // 是否显示
  onClose: () => void;                        // 关闭回调
  onConfirm: (preset: WorkspacePreset, folder: string | null) => void;  // 确认创建
  onConfirmWorker?: (preset: WorkspacePreset, folder: string | null) => void;  // Sandbox 创建
  onPickFolder: () => Promise<string | null>; // 选择文件夹回调
  submitting?: boolean;                       // 提交中状态
})
```

#### 文件夹选择 UI

**按钮区域** (`create-workspace-modal.tsx:155-180`):
```typescript
<button
  type="button"
  ref={pickFolderRef}
  onClick={handlePickFolder}
  disabled={pickingFolder() || submitting()}
>
  <div class="flex items-center gap-3">
    <FolderPlus size={20} />
    <div class="flex-1 min-w-0">
      <div class="text-sm font-medium">{folderLabel()}</div>
      <div class="text-xs font-mono">{folderSubLabel()}</div>
    </div>
  </div>
</button>
```

**标签函数** (`create-workspace-modal.tsx:66-77`):
```typescript
const folderLabel = () => {
  const folder = selectedFolder();
  if (!folder) return "Choose folder";
  const parts = folder.replace(/\\/g, "/").split("/").filter(Boolean);
  return parts[parts.length - 1] ?? folder;
};

const folderSubLabel = () => {
  const folder = selectedFolder();
  if (!folder) return "Choose folder next";
  return folder;
};
```

#### 处理点击事件

**handlePickFolder** (`create-workspace-modal.tsx:79-91`):
```typescript
const handlePickFolder = async () => {
  if (pickingFolder()) return;
  setPickingFolder(true);
  try {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    const next = await props.onPickFolder();
    if (next) {
      setSelectedFolder(next);
    }
  } finally {
    setPickingFolder(false);
  }
};
```

---

### 2. 业务逻辑：workspace.ts

#### pickWorkspaceFolder

**位置** (`workspace.ts:2141-2158`):
```typescript
async function pickWorkspaceFolder() {
  if (!isTauriRuntime()) {
    options.setError(t("app.error.tauri_required", currentLocale()));
    return null;
  }

  try {
    const selection = await pickDirectory({
      title: t("onboarding.choose_workspace_folder", currentLocale())
    });
    
    const folder =
      typeof selection === "string" ? selection 
        : Array.isArray(selection) ? selection[0] 
        : null;
    
    return folder ?? null;
  } catch (e) {
    const message = e instanceof Error ? e.message : safeStringify(e);
    options.setError(addOpencodeCacheHint(message));
    return null;
  }
}
```

#### resolveWorkspacePath

**位置** (`workspace.ts:2686-2709`):
```typescript
async function resolveWorkspacePath(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (!isTauriRuntime()) return trimmed;

  if (trimmed === "~") {
    try {
      const home = await homeDir();
      return home.replace(/[\\/]+$/, "");
    } catch {
      return trimmed;
    }
  }

  if (trimmed.startsWith("~/") || trimmed.startsWith("~\\")) {
    try {
      const home = (await homeDir()).replace(/[\\/]+$/, "");
      return `${home}${trimmed.slice(1)}`;
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}
```

#### createWorkspaceFlow

**位置** (`workspace.ts:1398-1449`):
```typescript
async function createWorkspaceFlow(preset: WorkspacePreset, folder: string | null) {
  if (!isTauriRuntime()) {
    options.setError(t("app.error.tauri_required", currentLocale()));
    return;
  }

  if (!folder) {
    options.setError(t("app.error.choose_folder", currentLocale()));
    return;
  }

  options.setBusy(true);
  options.setBusyLabel("status.creating_workspace");
  options.setError(null);

  try {
    const resolvedFolder = await resolveWorkspacePath(folder);
    if (!resolvedFolder) {
      options.setError(t("app.error.choose_folder", currentLocale()));
      return;
    }

    const name = resolvedFolder.split("/").filter(Boolean).pop() ?? "Worker";

    const ws = await workspaceCreate({
      folderPath: resolvedFolder,
      name,
      preset,
    });

    setWorkspaces(ws.workspaces);
    syncActiveWorkspaceId(ws.activeId);

    const active = ws.workspaces.find((w) => w.id === ws.activeId);
    if (active) {
      setProjectDir(active.path);
      setAuthorizedDirs([active.path]);
    }

    setCreateWorkspaceOpen(false);
    options.setTab("scheduled");
    options.setView("dashboard");
    markOnboardingComplete();
  } catch (e) {
    const message = e instanceof Error ? e.message : safeStringify(e);
    options.setError(addOpencodeCacheHint(message));
  } finally {
    options.setBusy(false);
    options.setBusyLabel(null);
  }
}
```

---

### 3. Tauri 层：tauri.ts

#### pickDirectory

**位置** (`tauri.ts:474-486`):
```typescript
export async function pickDirectory(options?: {
  title?: string;
  defaultPath?: string;
  multiple?: boolean;
}): Promise<string | string[] | null> {
  const { open } = await import("@tauri-apps/plugin-dialog");
  return open({
    title: options?.title,
    defaultPath: options?.defaultPath,
    directory: true,
    multiple: options?.multiple,
  });
}
```

---

## UI 组件

### CreateWorkspaceModal 结构

```
┌──────────────────────────────────────────────────┐
│  Header                                          │
│  ├─ Title: "Create workspace"                    │
│  └─ Close button (×)                             │
├──────────────────────────────────────────────────┤
│  Body                                            │
│                                                  │
│  Step 1: Select folder                           │
│  ┌─────────────────────────────────────────┐    │
│  │ [📁] Folder name                        │    │
│  │      /path/to/folder                    │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  Step 2: Choose preset                           │
│  ┌─────────────────┐      ┌─────────────────┐   │
│  │ ⭐ Starter      │      │ ⚪ Empty        │   │
│  └─────────────────┘      └─────────────────┘   │
├──────────────────────────────────────────────────┤
│  Footer                                          │
│  [Cancel]  [Create Sandbox]  [Create Workspace] │
└──────────────────────────────────────────────────┘
```

---

## 错误处理

### 1. 非 Tauri 运行时

**场景**: 在 Web 版本尝试创建本地 Worker

```typescript
if (!isTauriRuntime()) {
  options.setError(t("app.error.tauri_required", currentLocale()));
  return null;
}
```

### 2. 未选择文件夹

**场景**: 用户未选择文件夹就点击确认

```typescript
disabled={!selectedFolder() || submitting()}
title={!selectedFolder() ? "Choose folder first" : undefined}
```

### 3. Docker 不可用（Sandbox）

**场景**: Sandbox 模式但 Docker 未安装或未启动

```typescript
if (!doctor?.ready) {
  const detail = doctor?.error?.trim() || "Docker is required for sandboxes...";
  options.setError(detail);
  return false;
}
```

---

## 数据流程

```
用户点击创建按钮
  ↓
CreateWorkspaceModal.handlePickFolder()
  ↓
workspace.pickWorkspaceFolder()
  ↓
isTauriRuntime() check
  ↓
tauri.pickDirectory()
  ↓
系统文件选择器（macOS/Windows/Linux）
  ↓
返回路径 → setSelectedFolder()
  ↓
用户选择 preset 并确认
  ↓
createWorkspaceFlow(preset, folder)
  ↓
resolveWorkspacePath()
  ↓
workspaceCreate()
  ↓
OpenWork Engine 创建目录结构
```

---

## 重要限制

### 1. Tauri 依赖

- **问题**: Web 版本无法打开系统文件对话框
- **影响**: 本地 Worker 仅限 Tauri 运行时

### 2. 单文件夹选择

- `multiple: false` - 只能选择一个目录
- `directory: true` - 只能选目录，不能选文件

### 3. 路径格式

**支持**：
- `/absolute/path` - 绝对路径
- `~/path` - home 目录相对路径
- `~` - home 目录本身

**不支持**：
- 环境变量（如 `$HOME/path`）
- `../relative` - 相对路径

---

## 调试技巧

### 1. 查看路径解析

```typescript
const path = await resolveWorkspacePath("~/my-project");
console.log("Resolved:", path);
// 输出: "/home/user/my-project"
```

### 2. 测试选择器

```typescript
console.log("Tauri:", isTauriRuntime());
const folder = await pickDirectory({ title: "Test" });
console.log("Selected:", folder);
```

### 3. 检查权限

```typescript
import { accessSync, constants } from "node:fs";

try {
  accessSync("/path/to/dir", constants.W_OK);
  console.log("Directory is writable");
} catch {
  console.error("Directory is not writable");
}
```
