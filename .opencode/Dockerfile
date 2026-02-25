FROM node:20-alpine AS builder

# 安装 bash 和 tar (Alpine 默认没有)
RUN apk add --no-cache bash tar

# 设置工作目录
WORKDIR /app

# 复制源码
COPY . .

# 构建安装包
RUN tar -czvf /tmp/ecommerce-agents.tar.gz \
    ./skills/ecommerce-hub \
    ./skills/market-insight \
    ./skills/product-planning \
    ./skills/gtm \
    ./skills/ops-support \
    ./agents/ecommerce \
    ./install.sh \
    ./package.json

# ============================================
# 最终镜像
# ============================================
FROM alpine:3.19

LABEL maintainer="OpenWork"
LABEL description="OpenWork E-commerce Agents - 跨境电商智能体套件"

# 安装必要工具
RUN apk add --no-cache \
    bash \
    tar \
    curl \
    ca-certificates

# 创建非 root 用户
RUN addgroup -g 1000 appgroup && \
    adduser -u 1000 -G appgroup -s /bin/bash -D appuser

# 设置工作目录
WORKDIR /home/appuser

# 从 builder 阶段复制文件
COPY --from=builder /tmp/ecommerce-agents.tar.gz /tmp/
COPY --from=builder /app/install.sh /usr/local/bin/
COPY --from=builder /app/package.json ./

# 复制技能和智能体
RUN tar -xzvf /tmp/ecommerce-agents.tar.gz && \
    rm /tmp/ecommerce-agents.tar.gz && \
    mkdir -p .opencode/skills .opencode/agents && \
    mv skills/* .opencode/skills/ 2>/dev/null || true && \
    mv agents/* .opencode/agents/ 2>/dev/null || true && \
    rm -rf skills agents && \
    chmod +x /usr/local/bin/install.sh

# 设置权限
RUN chown -R appuser:appgroup /home/appuser

# 切换到非 root 用户
USER appuser

# 默认命令: 安装到 /data 并保持容器运行
VOLUME ["/data"]

# 环境变量
ENV OPENWORK_AGENTS_VERSION=1.0.0

# 入口脚本
COPY --chmod=755 <<'EOF' /entrypoint.sh
#!/bin/bash
set -e

case "${1:-install}" in
    install)
        echo "Installing ecommerce agents to /data..."
        mkdir -p /data
        cp -r /home/appuser/.opencode/* /data/.opencode/ 2>/dev/null || true
        ls -la /data/.opencode/
        echo "Installation complete!"
        ;;
    shell)
        exec /bin/bash
        ;;
    *)
        exec "$@"
        ;;
esac
EOF

ENTRYPOINT ["/entrypoint.sh"]
CMD ["install"]
