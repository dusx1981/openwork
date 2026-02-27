# 工作流指南

## 标准流程

### 1. 初始化

```bash
# 创建本地工作区
mkdir my-project
cd my-project

# 克隆或创建代码
git clone https://github.com/user/repo.git
```

### 2. 配置

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

### 3. 添加技能

创建 `.opencode/skills/my-skill/SKILL.md`:

```markdown
# My Skill

## Description
Do something useful

## Parameters
- name: string - The name to use

## Steps
1. echo "Hello, {{name}}"
```

### 4. 运行

```bash
# 本地运行
npx openwork start

# 或连接远程
npx openwork connect https://example.com/token
```

---

## 远程工作流

### 1. 创建远程工作区

```bash
npx openwork add-remote
# 输入 URL 和 Token
```

### 2. 配置同步

```json
{
  "workspace": {
    "url": "https://openwork.example.com",
    "sync": {
      "onSave": true,
      "debounce": 1000
    }
  }
}
```

### 3. 运行远程任务

```bash
npx openwork run --remote my-task
```
