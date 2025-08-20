# 🏗️ 系统架构设计

## 1. 整体架构

SmartVPN采用客户端-服务端架构，基于Node.js开发：

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     浏览器      │────▶│   SmartVPN客户端 │────▶│   SmartVPN服务端 │
│   (系统代理)    │◀────│  (本地代理8080) │◀────│   (远程443端口) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 2. 模块架构

### 2.1 客户端架构

```
src/client/
├── index.js                 # 客户端主入口
├── proxy/
│   └── local-server.js      # 本地代理服务器
├── system/
│   ├── proxy-manager.js     # 系统代理管理
│   └── signal-handler.js    # 信号处理
└── whitelist/
    └── domain-filter.js     # 域名过滤
```

### 2.2 服务端架构

```
src/server/
├── index.js                 # 服务端主入口
├── handlers/
│   ├── http-handler.js      # HTTP请求处理
│   └── https-handler.js     # HTTPS请求处理
└── monitoring/
    └── connection-manager.js # 连接管理
```

## 3. 数据流设计

### 3.1 HTTP请求流程

```
客户端请求 → 本地代理8080 → 域名过滤 → TLS加密 → 服务端443 → 目标服务器
```

### 3.2 HTTPS请求流程

```
客户端CONNECT → 本地代理8080 → 域名过滤 → TLS隧道 → 服务端443 → 目标服务器
```

## 4. 域名过滤机制

### 4.1 模式切换

| 模式 | 命令行参数 | 行为 |
|---|---|---|
| 全局代理 | 无 | 所有流量通过代理 |
| 白名单代理 | `--white` | 仅白名单域名通过代理 |

### 4.2 匹配规则

- **精确匹配**：`example.com` 匹配 `example.com`
- **通配符匹配**：`*.example.com` 匹配 `api.example.com`

## 5. 安全设计

### 5.1 TLS配置

```javascript
{
  minVersion: 'TLSv1.2',
  ciphers: 'HIGH:!aNULL:!MD5',
  requestCert: true,
  rejectUnauthorized: true
}
```

### 5.2 证书验证

- **双向认证**：客户端和服务端互相验证证书
- **证书链**：使用自签名CA进行证书签发

## 6. 技术栈

- **运行时**：Node.js 12.0+
- **网络**：Node.js net/tls模块
- **配置**：多环境配置管理
- **测试**：Jest测试框架

## 7. 性能指标

- **吞吐量**：单客户端可达1000+ req/s
- **延迟**：本地代理延迟 < 1ms
- **内存使用**：< 100MB 常驻内存
- **CPU使用**：< 5% 正常负载

## 8. 兼容性

- **操作系统**：Windows 10/11, macOS 10.14+
- **Node.js**：12.0+ (推荐16.0+)
- **浏览器**：Chrome, Firefox, Safari, Edge完全支持
