# SmartVPN - 智能代理系统

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-12.0+-green.svg)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-blue.svg)](https://github.com/OnTheWay0103/smartVPN)

SmartVPN 是一个基于 Node.js 开发的智能代理系统，支持自动设置系统代理、TLS 加密通信和白名单域名过滤。该系统包含服务端和客户端两个组件，提供安全、高效的网络代理服务。

## ✨ 功能特性

### 🔒 安全特性

- **TLS 加密通信** - 使用 TLS 1.2+ 加密所有通信数据
- **证书验证** - 双向证书验证确保连接安全
- **白名单过滤** - 支持精确匹配和通配符域名过滤

### 🚀 自动化功能

- **自动代理设置** - 启动时自动配置系统代理
- **智能恢复** - 关闭时自动恢复原始代理设置
- **跨平台支持** - 支持 Windows 和 macOS 系统

### 📊 监控与日志

- **实时状态监控** - 显示连接状态和流量信息
- **详细日志记录** - 支持不同级别的日志输出
- **错误处理** - 完善的错误处理和恢复机制

## 📋 系统要求

- **Node.js**: 12.0 或更高版本
- **操作系统**: Windows 10/11 或 macOS
- **权限**: 管理员权限（用于修改系统代理设置）
- **网络**: 稳定的网络连接

## 🛠️ 安装指南

### 1. 克隆项目

```bash
git clone git@github.com:OnTheWay0103/smartVPN.git
cd smartVPN
```

### 2. 安装依赖

```bash
npm install
```

### 3. 生成 TLS 证书

```bash
# 使用自动生成脚本（推荐）
npm run cert:generate

# 或手动生成证书
cd scripts

# 生成服务器私钥和证书签名请求
openssl req -newkey rsa:4096 -nodes -keyout ../certs/server-key.pem -out server.csr -config openssl.cnf

# 生成服务器证书
openssl x509 -req -in server.csr -signkey ../certs/server-key.pem -out ../certs/server-cert.pem -extensions req_ext -extfile openssl.cnf -days 365

# 生成客户端私钥和证书签名请求
openssl req -newkey rsa:4096 -nodes -keyout ../certs/client-key.pem -out client.csr -config openssl.cnf

# 生成客户端证书
openssl x509 -req -in client.csr -signkey ../certs/client-key.pem -out ../certs/client-cert.pem -extensions req_ext -extfile openssl.cnf -days 365
```

### 4. 配置服务端和客户端

复制配置模板并修改：

```bash
cp config/config.example.js config/config.js
```

编辑 `config/config.js` 文件：

```javascript
module.exports = {
  // 远程服务器配置
  remote: {
    host: "your-server-ip", // 替换为您的服务器IP地址
    port: 443, // 服务器端口，服务端监听此端口，客户端连接此端口
  },

  // 本地代理配置（仅客户端使用）
  local: {
    port: 8080, // 本地代理端口
  },

  // TLS证书配置
  tls: {
    key: "./env/client-key.pem", // 客户端私钥（仅客户端使用）
    cert: "./env/client-cert.pem", // 客户端证书（仅客户端使用）
    ca: "./env/server-cert.pem", // 服务器证书（客户端用于验证服务器）
  },

  // 连接配置
  connection: {
    timeout: 30000, // 连接超时时间（毫秒）
    keepAlive: true, // 是否保持连接
    keepAliveInterval: 30000, // 保活间隔（毫秒）
    maxRetries: 3, // 最大重试次数
    retryDelay: 5000, // 重试延迟（毫秒）
  },
};
```

**重要说明**：

- 服务端和客户端使用**相同的配置文件**
- 服务端使用 `remote.port` 作为监听端口
- 客户端使用 `remote.host` 和 `remote.port` 连接服务端
- 确保服务端和客户端的端口配置一致

### 5. 配置白名单（可选）

复制白名单配置模板：

```bash
cp config/whitelist.example.js config/whitelist.js
```

编辑 `config/whitelist.js` 文件，添加需要代理的域名：

```javascript
module.exports = {
  domains: [
    "example.com", // 精确匹配
    "*.example.org", // 通配符匹配
    "api.example.net", // API域名
  ],
};
```

**注意**：白名单配置仅在启用白名单模式时生效。默认情况下，客户端会代理所有流量。

## 🚀 使用方法

### 环境配置

SmartVPN 支持多种环境配置：

- **开发环境**: `NODE_ENV=development` 使用本地配置
- **生产环境**: `NODE_ENV=production` 使用远程配置
- **默认环境**: 使用默认配置文件

### 启动服务端

```bash
# 使用开发环境配置
NODE_ENV=development npm run server

# 使用生产环境配置
NODE_ENV=production npm run server

# 或直接使用
node src/server/index.js
```

服务端将在配置文件中指定的端口监听客户端连接。

### 启动客户端

```bash
# 使用开发环境配置
NODE_ENV=development npm start

# 使用生产环境配置
NODE_ENV=production npm start

# 或直接使用
node src/client/index.js

# 启用白名单模式（仅代理白名单中的域名）
node src/client/index.js --white
```

客户端启动后会：

1. 自动设置系统代理（端口根据环境配置，开发环境为8081）
2. 启动本地代理服务器
3. 显示连接状态信息和代理模式

#### 代理模式说明

- **全局代理模式**（默认）：代理所有网络流量
- **白名单模式**（使用 `--white` 参数）：仅代理白名单中配置的域名

#### 环境配置说明

- **开发环境**: 使用 `config/development.js` 中的配置，本地调试
- **生产环境**: 使用 `config/production.js` 中的配置，实际部署
- **默认配置**: 使用 `config/default.js` 中的配置，通用设置

### 关闭客户端

按 `Ctrl+C` 或关闭终端窗口，客户端会：

1. 自动恢复原始系统代理设置
2. 清理资源并退出

## ⚙️ 配置说明

### 环境配置系统

SmartVPN 使用分层配置系统，支持多种环境：

#### 配置文件层级

1. **默认配置**: `config/default.js`
2. **环境配置**: `config/development.js` (开发) / `config/production.js` (生产)
3. **本地配置**: `config/config.js` (用户自定义)

#### 配置项说明

| 配置项                 | 说明               | 开发环境默认值 | 生产环境默认值 |
| ---------------------- | ------------------ | -------------- | -------------- |
| `client.local.port`    | 本地代理端口       | 8081           | 8080           |
| `server.remote.host`   | 远程服务器地址     | localhost      | 远程IP         |
| `server.remote.port`   | 远程服务器端口     | 8443           | 443            |
| `whitelist.enabled`    | 白名单功能开关     | false          | false          |
| `logging.level`        | 日志级别           | DEBUG          | info           |
| `logging.format`       | 日志格式           | pretty         | text           |

#### 使用示例

```bash
# 开发环境（本地调试）
NODE_ENV=development node src/server/index.js
NODE_ENV=development node src/client/index.js

# 生产环境（实际部署）
NODE_ENV=production node src/server/index.js
NODE_ENV=production node src/client/index.js
```

### 服务端配置

服务端主要使用以下配置：

- `remote.port`: 监听端口
- `connection.*`: 连接相关配置

### 客户端配置

客户端使用所有配置项：

- `remote.host` + `remote.port`: 连接服务端
- `local.port`: 本地代理端口
- `tls.*`: TLS 证书配置
- `connection.*`: 连接相关配置

## 🔧 故障排除

### 常见问题

#### 1. 代理设置失败

**症状**: 无法设置系统代理

**解决方案**:

- 确保以管理员权限运行
- 检查防火墙设置
- 验证 `regedit.vbs` 文件存在（Windows）

#### 2. 连接失败

**症状**: 无法连接到远程服务器

**解决方案**:

- 检查远程服务器配置
- 验证 TLS 证书文件
- 确认网络连接正常
- 检查服务器防火墙设置

#### 3. 证书错误

**症状**: TLS 证书验证失败

**解决方案**:

- 确保证书文件存在且路径正确
- 检查证书有效期
- 验证证书配置

### 日志级别

可以通过修改 `utils/logger.js` 来调整日志级别：

```javascript
const logLevel = "info"; // 可选: debug, info, warn, error
```

## 📁 项目结构

```
smartVPN/
├── src/                           # 主程序源码
│   ├── client/                    # 客户端模块
│   │   ├── index.js               # 客户端主程序
│   │   ├── proxy/                 # 代理相关
│   │   │   └── local-server.js    # 本地代理服务器
│   │   ├── system/                # 系统相关
│   │   │   ├── event-cleanup.js   # 事件清理
│   │   │   ├── proxy-manager.js   # 代理管理
│   │   │   └── signal-handler.js  # 信号处理
│   │   └── whitelist/             # 白名单相关
│   │       └── domain-filter.js   # 域名过滤器
│   ├── server/                    # 服务端模块
│   │   ├── index.js               # 服务端主程序
│   │   ├── handlers/              # 请求处理器
│   │   │   ├── http-handler.js    # HTTP处理器
│   │   │   └── https-handler.js   # HTTPS处理器
│   │   └── monitoring/            # 监控模块
│   │       └── connection-manager.js # 连接管理器
│   ├── shared/                    # 共享模块
│   │   ├── config/                # 配置管理
│   │   │   └── index.js           # 配置管理器
│   │   └── utils/                 # 工具模块
│   │       ├── constants.js       # 常量定义
│   │       └── logger.js          # 日志工具
│   └── index.js                   # 程序入口点（兼容旧版本）
├── bin/                           # 命令行工具目录
├── config/                        # 配置文件目录
│   ├── config.example.js          # 配置文件示例
│   ├── config.js                  # 当前配置文件
│   ├── default.js                 # 默认配置
│   ├── development.js             # 开发环境配置
│   ├── production.js              # 生产环境配置
│   ├── whitelist.example.js       # 白名单配置示例
│   └── whitelist.js               # 实际白名单配置
├── certs/                         # 证书文件目录
│   ├── server-key.pem             # 服务器私钥
│   ├── server-cert.pem            # 服务器证书
│   ├── client-key.pem             # 客户端私钥
│   └── client-cert.pem            # 客户端证书
├── docs/                          # 文档目录
│   ├── ARCHITECTURE.md            # 架构文档
│   ├── QUICKSTART.md              # 快速开始
│   ├── deployment.md              # 部署文档
│   └── troubleshooting.md         # 故障排除
├── examples/                      # 示例文件
│   ├── advanced-config/           # 高级配置示例
│   ├── basic-usage/               # 基础用法示例
│   ├── deployment/                # 部署示例
│   └── test-proxy.js              # 代理测试示例
├── scripts/                       # 脚本文件
│   ├── deployment/                # 部署脚本
│   ├── development/               # 开发脚本
│   └── setup/                     # 设置脚本
│       ├── generate-certs.sh      # 证书生成脚本
│       ├── initial-setup.js       # 初始设置
│       └── openssl.cnf            # OpenSSL配置
├── tests/                         # 测试文件
│   ├── fixtures/                  # 测试数据
│   ├── integration/               # 集成测试
│   ├── performance/               # 性能测试
│   ├── unit/                      # 单元测试
│   └── setup.js                   # 测试设置
├── tools/                         # 工具和脚本
│   ├── login-to-start-vpn.sh      # 登录启动工具
│   └── system/                    # 系统工具
│       └── windows/               # Windows特定工具
├── package.json                   # 项目配置
├── LICENSE                        # 许可证文件
└── README.md                      # 项目文档
```

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 开发环境设置

```bash
# 安装开发依赖
npm install

# 运行所有测试
npm test

# 运行特定测试
npm run test:unit
npm run test:integration

# 使用开发环境配置
NODE_ENV=development npm run server
NODE_ENV=development npm start
```

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如果您遇到问题或有建议，请：

1. 查看 [故障排除](#故障排除) 部分
2. 搜索 [Issues](https://github.com/OnTheWay0103/smartVPN/issues)
3. 创建新的 Issue

## 🔄 更新日志

### v1.0.0

- 初始版本发布
- 支持 TLS 加密通信
- 自动代理设置功能
- 白名单域名过滤
- 跨平台支持（Windows/macOS）

---

**注意**: 首次运行可能需要管理员权限来修改系统代理设置。请确保在安全的环境中使用本软件。
