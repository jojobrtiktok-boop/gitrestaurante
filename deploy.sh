#!/bin/bash
# Deploy do Cheffya para a VPS
set -e

REPO_DIR="/var/www/restaurante-src"
WEB_DIR="/var/www/restaurante"

echo "==> Atualizando código..."
cd "$REPO_DIR"
git pull origin master

echo "==> Copiando arquivos..."
cp -r dist/* "$WEB_DIR/"

echo "==> Deploy concluído!"
