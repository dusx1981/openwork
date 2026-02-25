#!/bin/bash

# Build a distributable package
# Usage: ./build-package.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/.."
DIST_DIR="$ROOT_DIR/dist-package"
PKG_NAME="ecommerce-agents"

echo "Building distributable package..."

# Clean
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR/skills"
mkdir -p "$DIST_DIR/agents"

# Skills to include
SKILLS=("ecommerce-hub" "market-insight" "product-planning" "gtm" "ops-support")

# Copy skills
echo "Copying skills..."
for skill in "${SKILLS[@]}"; do
    SRC="$ROOT_DIR/skills/$skill"
    if [ -d "$SRC" ]; then
        cp -r "$SRC" "$DIST_DIR/skills/"
        echo "  - $skill"
    else
        echo "  [skip] $skill not found"
    fi
done

# Copy agents
echo "Copying agents..."
AGENT_SRC="$ROOT_DIR/agents/ecommerce"
if [ -d "$AGENT_SRC" ]; then
    cp -r "$AGENT_SRC" "$DIST_DIR/agents/"
    echo "  - ecommerce"
fi

# Copy install script
cp "$ROOT_DIR/install.sh" "$DIST_DIR/"

# Copy package.json
cp "$ROOT_DIR/package.json" "$DIST_DIR/"

# Create tarball
cd "$DIST_DIR"
tar -czvf "$ROOT_DIR/scripts/${PKG_NAME}.tar.gz" ./*

echo ""
echo "Package created: $ROOT_DIR/scripts/${PKG_NAME}.tar.gz"
echo ""
echo "To install:"
echo "  1. Extract: tar -xzvf ${PKG_NAME}.tar.gz"
echo "  2. Run: ./install.sh [target-directory]"
