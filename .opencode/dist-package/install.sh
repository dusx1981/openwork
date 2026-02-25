#!/bin/bash

# OpenWork E-commerce Agents Installer
# 用法: ./install-ecommerce.sh [目标目录]
# 示例: ./install-ecommerce.sh ~/my-project

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
    echo -e "${CYAN}[ecommerce]${NC} $1"
}

success() {
    echo -e "${GREEN}[ok]${NC} $1"
}

error() {
    echo -e "${RED}[error]${NC} $1"
}

TARGET_DIR="${1:-.}"
OPENCODE_DIR="$TARGET_DIR/.opencode"
SKILLS_DIR="$OPENCODE_DIR/skills"
AGENTS_DIR="$OPENCODE_DIR/agents"

log "安装跨境电商智能体到: $TARGET_DIR"

# Create directories
mkdir -p "$SKILLS_DIR"
mkdir -p "$AGENTS_DIR"

# Skills to install
SKILLS=(
    "ecommerce-hub"
    "market-insight"
    "product-planning"
    "gtm"
    "ops-support"
)

# Install skills
for skill in "${SKILLS[@]}"; do
    SKILL_PATH="$SCRIPT_DIR/../skills/$skill"
    if [ -d "$SKILL_PATH" ]; then
        DEST="$SKILLS_DIR/$skill"
        rm -rf "$DEST"
        cp -r "$SKILL_PATH" "$DEST"
        success "installed skill: $skill"
    else
        error "not found: $skill"
    fi
done

# Install agents
AGENT_PATH="$SCRIPT_DIR/../agents/ecommerce"
if [ -d "$AGENT_PATH" ]; then
    DEST="$AGENTS_DIR/ecommerce"
    rm -rf "$DEST"
    cp -r "$AGENT_PATH" "$DEST"
    success "installed agent: ecommerce"
else
    error "agent not found: ecommerce"
fi

echo ""
log "安装完成!"
echo ""
echo "技能列表:"
for skill in "${SKILLS[@]}"; do
    echo "  - $skill"
done
echo ""
echo "智能体: @ecommerce"
echo ""
echo "在 OpenWork 中刷新后即可使用"
