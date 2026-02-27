# API 参考

## 工作区相关 API

### workspaceCreate

```typescript
const result = await workspaceCreate({
  folderPath: string,
  name: string,
  preset: "starter" | "minimal" | "automation"
});
```

**返回**：
```typescript
{
  workspaces: Workspace[];
  activeId: string;
}
```

### workspaceCreateRemote

```typescript
const result = await workspaceCreateRemote({
  url: string,
  token: string,
  name: string
});
```

### workspaceSetActive

```typescript
await workspaceSetActive(workspaceId: string);
```

### workspaceForget

```typescript
await workspaceForget(workspaceId: string);
```

### workspaceExportConfig

```typescript
await workspaceExportConfig({
  workspaceId: string,
  outputPath: string
});
```

### workspaceImportConfig

```typescript
await workspaceImportConfig(filePath: string);
```

### pickDirectory

```typescript
const path = await pickDirectory({
  title?: string,
  defaultPath?: string,
  multiple?: boolean
});
```

### saveFile

```typescript
const path = await saveFile({
  title?: string,
  defaultPath?: string,
  filters?: Array<{ name: string; extensions: string[] }>
});
```

### pickFile

```typescript
const path = await pickFile({
  title?: string,
  defaultPath?: string,
  multiple?: boolean,
  filters?: Array<{ name: string; extensions: string[] }>
});
```
