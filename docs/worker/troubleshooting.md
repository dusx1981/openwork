# 故障排查

## 常见问题

### 1. 文件选择失败

**症状**：Web 版本无法选择文件夹

**原因**：Web 版本不支持 Tauri 的文件对话框

**解决**：使用 Tauri Desktop 版本

### 2. 权限错误

**症状**：无法写入文件

**解决**：
```bash
# 检查权限
ls -la /path/to/project

# 修复权限
chmod -R u+w /path/to/project
```

### 3. 热重载不触发

**症状**：修改配置后不生效

**排查**：
1. 检查 `reload.auto` 设置
2. 确认文件在监控目录
3. 查看日志输出

### 4. Docker Sandbox 失败

**症状**：无法创建 sandbox

**排查**：
```bash
# 检查 Docker 安装
docker --version

# 检查服务状态
docker ps
```

---

## 日志位置

```
~/.local/share/com.differentai.openwork/workspaces/
└── [workspace-id]/
    └── .opencode/
        └── logs/
```

---

## 调试命令

```bash
# 启用详细日志
OPENWORK_LOG=debug npx openwork start

# 查看当前状态
npx openwork status

# 手动重载
npx openwork reload
```
