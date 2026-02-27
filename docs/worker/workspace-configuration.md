# 工作区配置参考

## openwork.json 结构

```json
{
  "version": 1,
  "workspace": {
    "name": "Project Name",
    "path": "/absolute/path/to/project"
  },
  "authorizedRoots": [
    "/absolute/path/to/project"
  ],
  "reload": {
    "auto": true
  },
  "mcpServers": {
    "tools": {
      "command": "opencode",
      "args": ["mcp", "list"]
    }
  },
  "proxy": {
    "enabled": false,
    "url": "http://localhost:8080"
  }
}
```

## 配置字段说明

### version

- **类型**：number
- **必需**：是
- **说明**：配置文件版本号

### workspace

- **类型**：object
- **必需**：是
- **子字段**：
  - `name`: string - 工作区名称
  - `path`: string - 本地路径（仅本地工作区）
  - `type`: "local" | "remote" - 工作区类型

### authorizedRoots

- **类型**：string[]
- **必需**：是
- **说明**：授权的根目录列表

### reload

- **类型**：object
- **必需**：否
- **子字段**：
  - `auto`: boolean - 自动重载开关

### mcpServers

- **类型**：object
- **必需**：否
- **说明**：MCP 服务器配置

### proxy

- **类型**：object
- **必需**：否
- **子字段**：
  - `enabled`: boolean
  - `url`: string
