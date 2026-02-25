#!/bin/bash

# OpenWork E-commerce Agents 安装脚本
# 用法: 
#   ./install.sh              # 安装到当前目录
#   ./install.sh <目录>      # 安装到指定目录
#   ./install.sh --global    # 安装到全局 ~/.config/opencode/

set -e

# ============================================
# 颜色定义
# ============================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================
# 日志函数
# ============================================
log() {
    echo -e "${CYAN}[安装]${NC} $*"
}

info() {
    echo -e "${BLUE}[信息]${NC} $*"
}

success() {
    echo -e "${GREEN}[成功]${NC} $*"
}

error() {
    echo -e "${RED}[错误]${NC} $*" >&2
}

warn() {
    echo -e "${YELLOW}[警告]${NC} $*"
}

# ============================================
# 帮助信息
# ============================================
show_help() {
    cat << EOF
OpenWork 电商智能体安装脚本

用法:
    ./install.sh [选项] [目标目录]

选项:
    -g, --global     安装到全局目录 ~/.config/opencode/
    -h, --help       显示帮助信息
    -l, --list       列出包含的内容

示例:
    ./install.sh                           # 安装到当前目录
    ./install.sh ~/my-project               # 安装到指定目录
    ./install.sh --global                   # 安装到全局目录

包含内容:
    技能 (Skills):
      - ecommerce-hub      电商 Hub (协调中枢)
      - market-insight     市场洞察
      - product-planning   产品规划
      - gtm               商业化策略
      - ops-support        运营客服

    智能体 (Agents):
      - @ecommerce        电商智能体
EOF
}

# ============================================
# 列出内容
# ============================================
list_content() {
    echo ""
    info "技能列表:"
    echo ""
    echo "  ${GREEN}ecommerce-hub${NC}      - 电商 Hub (协调中枢)"
    echo "  ${GREEN}market-insight${NC}     - 市场洞察"
    echo "  ${GREEN}product-planning${NC}   - 产品规划"
    echo "  ${GREEN}gtm${NC}               - 商业化策略"
    echo "  ${GREEN}ops-support${NC}        - 运营客服"
    echo ""
    info "智能体列表:"
    echo ""
    echo "  ${CYAN}@ecommerce${NC}          - 电商智能体"
    echo ""
}

# ============================================
# 获取脚本所在目录
# ============================================
get_script_dir() {
    local source="${BASH_SOURCE[0]}"
    while [ -h "$source" ]; do
        local dir="$(cd -P "$(dirname "$source")" && pwd)"
        source="$(readlink "$source")"
        [[ $source != /* ]] && source="$dir/$source"
    done
    echo "$(cd -P "$(dirname "$source")" && pwd)"
}

# ============================================
# 安装函数
# ============================================
do_install() {
    local target_dir="$1"
    local script_dir
    script_dir="$(get_script_dir)"
    
    # 检查内容可安装
    if [ ! -d "$script_dir/skills" ] && [ ! -d "$script_dir/agents" ]; then
        # 尝试从父目录获取
        script_dir="$(dirname "$script_dir")"
    fi
    
    log "目标目录: $target_dir"
    
    # 创建目录
    local opencode_dir="$target_dir/.opencode"
    local skills_dir="$opencode_dir/skills"
    local agents_dir="$opencode_dir/agents"
    
    mkdir -p "$skills_dir"
    mkdir -p "$agents_dir"
    
    # 技能列表
    local skills=("ecommerce-hub" "market-insight" "product-planning" "gtm" "ops-support")
    local installed_count=0
    local skipped_count=0
    
    # 安装技能
    echo ""
    info "安装技能..."
    for skill in "${skills[@]}"; do
        local src="$script_dir/skills/$skill"
        local dest="$skills_dir/$skill"
        
        if [ -d "$src" ]; then
            rm -rf "$dest"
            cp -r "$src" "$dest"
            success "已安装: $skill"
            installed_count=$((installed_count + 1))
        else
            warn "未找到: $skill"
            skipped_count=$((skipped_count + 1))
        fi
    done
    
    # 安装智能体
    echo ""
    info "安装智能体..."
    local agent_src="$script_dir/agents/ecommerce"
    local agent_dest="$agents_dir/ecommerce"
    
    if [ -d "$agent_src" ]; then
        rm -rf "$agent_dest"
        cp -r "$agent_src" "$agent_dest"
        success "已安装: @ecommerce"
        installed_count=$((installed_count + 1))
    else
        warn "未找到智能体: @ecommerce"
        skipped_count=$((skipped_count + 1))
    fi
    
    # 完成
    echo ""
    if [ $skipped_count -eq 0 ]; then
        success "安装完成!"
    else
        warn "安装完成 (跳过: $skipped_count)"
    fi
    echo ""
    echo "────────────────────────────────────────"
    echo ""
    info "已安装内容:"
    echo "  技能: ${#skills[@]} 个"
    echo "  智能体: 1 个"
    echo ""
    info "安装位置: $opencode_dir"
    echo ""
    info "下一步:"
    echo "  1. 重启 OpenWork"
    echo "  2. 在聊天框输入 @ecommerce 开始使用"
    echo ""
}

# ============================================
# 全局安装
# ============================================
do_install_global() {
    local home_dir="${HOME:-$(eval echo ~$(whoami))}"
    local global_dir="$home_dir/.config/opencode"
    
    log "全局安装到: $global_dir"
    
    mkdir -p "$global_dir/skills"
    mkdir -p "$global_dir/agents"
    
    do_install "$global_dir"
}

# ============================================
# 主程序
# ============================================
main() {
    # 解析参数
    local target_dir=""
    local install_global=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -l|--list)
                list_content
                exit 0
                ;;
            -g|--global)
                install_global=true
                shift
                ;;
            -*)
                error "未知选项: $1"
                show_help
                exit 1
                ;;
            *)
                target_dir="$1"
                shift
                ;;
        esac
    done
    
    # 检查是否为全局安装
    if [ "$install_global" = true ]; then
        do_install_global
    elif [ -z "$target_dir" ]; then
        do_install "$(pwd)"
    else
        # 检查目录是否存在
        if [ -d "$target_dir" ]; then
            do_install "$target_dir"
        else
            error "目录不存在: $target_dir"
            exit 1
        fi
    fi
}

# 运行主程序
main "$@"
