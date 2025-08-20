# SmartVPN - 智能代理系统

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-12.0+-green.svg)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-blue.svg)](https://github.com/OnTheWay0103/smartVPN)

SmartVPN 是一个基于 Node.js 开发的智能代理系统，支持自动设置系统代理、TLS 加密通信和白名单域名过滤。

## 🚀 快速开始

### 1. 安装

```bash
git clone git@github.com:OnTheWay0103/smartVPN.git
cd smartVPN
npm install
```

### 2. 生成证书

```bash
npm run cert:generate
```

### 3. 配置

```bash
cp config/config.example.js config/config.js
# 编辑 config/config.js 设置服务器IP

cp config/whitelist.example.js config/whitelist.js
# 可选：编辑白名单配置
```

### 4. 启动

**服务端：**
```bash
npm run server
```

**客户端：**
```bash
# 全局代理模式（默认）
npm start

# 白名单模式（仅代理白名单域名）
npm start -- --white

# 指定端口
CLIENT_PORT=8087 npm start -- --white
```

## 📋 功能特性

- **TLS 加密通信** - 使用 TLS 1.2+ 加密所有通信
- **自动代理设置** - 启动时自动配置系统代理，关闭时自动恢复
- **白名单过滤** - 支持精确匹配和通配符域名过滤
- **跨平台支持** - Windows 和 macOS 完全支持
- **实时监控** - 显示连接状态和流量信息
- **完善的日志** - 支持不同级别的日志输出

## 📁 项目结构

```
smartVPN/
├── src/                    # 主程序源码
│   ├── client/            # 客户端代码
│   ├── server/            # 服务端代码
│   └── shared/            # 共享模块
├── config/                # 配置文件
├── certs/                 # TLS证书
├── docs/                  # 文档
├── tools/                 # 系统工具
└── tests/                 # 测试文件
```

## 📊 代理模式

| 模式 | 命令 | 行为 |
|------|------|------|
| 全局代理 | `npm start` | 所有流量通过代理 |
| 白名单代理 | `npm start -- --white` | 仅白名单域名通过代理 |

## 🔧 配置文件

### 主配置
编辑 `config/config.js`：

```javascript
module.exports = {
  client: {
    local: { port: 8080 },
    whitelist: { enabled: false, domains: [] }
  },
  server: {
    remote: { host: 'your-server-ip', port: 443 }
  },
  tls: {
    key: './certs/client-key.pem',
    cert: './certs/client-cert.pem',
    ca: ['./certs/server-cert.pem']
  }
};
```

### 白名单配置
编辑 `config/whitelist.js`：

```javascript
module.exports = {
  domains: [
    "google.com",
    "*.google.com",
    "api.example.com"
  ]
};
```

## 🔍 故障排除

### 端口冲突
```bash
lsof -i :8080  # 查看端口占用
CLIENT_PORT=8087 npm start  # 使用其他端口
```

### 证书问题
- 确保证书文件存在且路径正确
- 检查证书有效期
- 验证证书配置

### 权限问题
- 确保以管理员权限运行
- 检查防火墙设置

## 📖 详细文档

- [快速开始指南](QUICKSTART.md)
- [部署指南](deployment.md)
- [架构说明](ARCHITECTURE.md)
- [故障排除](troubleshooting.md)

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)