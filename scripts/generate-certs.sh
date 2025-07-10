#!/bin/bash

# SmartVPN TLS 证书生成脚本
# 自动生成服务端和客户端证书

set -e

echo "🔐 SmartVPN TLS 证书生成脚本"
echo "================================"

# 检查 OpenSSL 是否安装
if ! command -v openssl &> /dev/null; then
    echo "❌ 错误: OpenSSL 未安装"
    echo "请先安装 OpenSSL:"
    echo "  macOS: brew install openssl"
    echo "  Ubuntu: sudo apt-get install openssl"
    echo "  CentOS: sudo yum install openssl"
    exit 1
fi

echo "✅ OpenSSL 已安装: $(openssl version)"

# 检查配置文件
if [ ! -f "openssl.cnf" ]; then
    echo "❌ 错误: openssl.cnf 配置文件不存在"
    exit 1
fi

echo "✅ 配置文件检查通过"

# 生成服务器证书
echo ""
echo "🔧 生成服务器证书..."
echo "------------------------"

# 生成服务器私钥
if [ ! -f "server-key.pem" ]; then
    echo "生成服务器私钥..."
    openssl req -newkey rsa:4096 -nodes -keyout server-key.pem -out server.csr -config openssl.cnf -subj "/C=CN/ST=Beijing/L=Beijing/O=SmartVPN/OU=Server/CN=smartvpn-server"
    echo "✅ 服务器私钥生成完成"
else
    echo "⚠️  服务器私钥已存在，跳过生成"
fi

# 生成服务器证书
if [ ! -f "server-cert.pem" ]; then
    echo "生成服务器证书..."
    openssl x509 -req -in server.csr -signkey server-key.pem -out server-cert.pem -extensions req_ext -extfile openssl.cnf -days 365
    echo "✅ 服务器证书生成完成"
else
    echo "⚠️  服务器证书已存在，跳过生成"
fi

# 生成客户端证书
echo ""
echo "🔧 生成客户端证书..."
echo "------------------------"

# 生成客户端私钥
if [ ! -f "client-key.pem" ]; then
    echo "生成客户端私钥..."
    openssl req -newkey rsa:4096 -nodes -keyout client-key.pem -out client.csr -config openssl.cnf -subj "/C=CN/ST=Beijing/L=Beijing/O=SmartVPN/OU=Client/CN=smartvpn-client"
    echo "✅ 客户端私钥生成完成"
else
    echo "⚠️  客户端私钥已存在，跳过生成"
fi

# 生成客户端证书
if [ ! -f "client-cert.pem" ]; then
    echo "生成客户端证书..."
    openssl x509 -req -in client.csr -signkey client-key.pem -out client-cert.pem -extensions req_ext -extfile openssl.cnf -days 365
    echo "✅ 客户端证书生成完成"
else
    echo "⚠️  客户端证书已存在，跳过生成"
fi

# 清理临时文件
echo ""
echo "🧹 清理临时文件..."
rm -f server.csr client.csr
echo "✅ 临时文件清理完成"

# 设置文件权限
echo ""
echo "🔒 设置文件权限..."
chmod 600 *.pem
echo "✅ 文件权限设置完成"

# 验证证书
echo ""
echo "🔍 验证证书..."
echo "------------------------"

echo "服务器证书信息:"
openssl x509 -in server-cert.pem -text -noout | grep -E "(Subject:|Issuer:|Not Before|Not After)"

echo ""
echo "客户端证书信息:"
openssl x509 -in client-cert.pem -text -noout | grep -E "(Subject:|Issuer:|Not Before|Not After)"

echo ""
echo "🎉 证书生成完成！"
echo "================================"
echo ""
echo "📁 生成的文件:"
echo "  - server-key.pem    (服务器私钥)"
echo "  - server-cert.pem   (服务器证书)"
echo "  - client-key.pem    (客户端私钥)"
echo "  - client-cert.pem   (客户端证书)"
echo ""
echo "⚠️  重要提醒:"
echo "  - 请妥善保管私钥文件"
echo "  - 证书有效期为 365 天"
echo "  - 生产环境建议使用 CA 签发的证书"
echo ""
echo "📖 下一步:"
echo "  1. 配置 env/config.js 文件"
echo "  2. 启动服务端: npm run server"
echo "  3. 启动客户端: npm start" 