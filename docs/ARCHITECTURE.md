# SmartVPN 架构重组文档

## 项目重组概述

本文档描述了smartVPN项目从原始结构到新架构的完整重组方案，旨在提升代码可维护性、模块化和扩展性。

## 新目录结构

```
smartVPN/
├── bin/                      # 可执行二进制文件
│   └── smartvpn             # 主命令行工具
├── src/                      # 源代码根目录
│   ├── client/              # 客户端代码
│   │   ├── index.js         # 客户端主入口
│   │   ├── proxy/           # 代理服务器实现
│   │   │   ├── local-server.js     # 本地代理服务器
│   │   │   ├── request-handler.js  # HTTP/HTTPS请求处理
│   │   │   └── connection-pool.js  # 连接池管理
│   │   ├── whitelist/       # 白名单管理
│   │   │   ├── domain-filter.js    # 域名过滤逻辑
│   │   │   ├── whitelist-loader.js # 白名单配置加载
│   │   │   └── matcher.js          # 通配符匹配算法
│   │   └── system/          # 系统集成
│   │       ├── proxy-manager.js    # 系统代理管理
│   │       ├── signal-handler.js   # 信号处理
│   │       └── platform/           # 平台特定实现
│   │           ├── windows.js      # Windows平台
│   │           └── macos.js        # macOS平台
│   ├── server/              # 服务端代码
│   │   ├── index.js         # 服务端主入口
│   │   ├── handlers/        # 请求处理器
│   │   │   ├── http-handler.js     # HTTP请求处理
│   │   │   ├── https-handler.js    # HTTPS隧道处理
│   │   │   └── error-handler.js    # 错误处理
│   │   ├── monitoring/      # 监控和指标
│   │   │   ├── connection-manager.js # 连接管理
│   │   │   ├── health-monitor.js     # 健康监控
│   │   │   └── metrics.js            # 指标收集
│   │   └── security/        # 安全相关
│   │       ├── tls-config.js       # TLS配置
│   │       └── cert-validator.js   # 证书验证
│   └── shared/              # 共享工具库
│       ├── utils/           # 通用工具
│       │   ├── logger.js         # 日志系统
│       │   ├── constants.js      # 常量定义
│       │   └── validator.js      # 数据验证
│       ├── config/          # 配置管理
│       │   ├── loader.js         # 配置加载器
│       │   ├── validator.js      # 配置验证器
│       │   └── schema.js         # 配置模式
│       ├── crypto/          # 加密工具
│       │   ├── tls-utils.js      # TLS工具函数
│       │   └── cert-utils.js     # 证书工具
│       └── network/         # 网络工具
│           ├── socket-utils.js   # Socket工具
│           └── protocol.js       # 协议处理
├── config/                  # 配置文件
│   ├── default.js           # 默认配置
│   ├── development.js       # 开发环境配置
│   ├── production.js        # 生产环境配置
│   ├── test.js              # 测试环境配置
│   ├── schema.js            # 配置验证模式
│   └── whitelist/           # 白名单配置
│       ├── default.json         # 默认白名单
│       ├── development.json     # 开发环境白名单
│       └── production.json      # 生产环境白名单
├── certs/                   # 证书文件
│   ├── client-key.pem       # 客户端私钥
│   ├── client-cert.pem      # 客户端证书
│   ├── server-key.pem       # 服务端私钥
│   ├── server-cert.pem      # 服务端证书
│   └── ca-cert.pem          # CA证书
├── scripts/                 # 脚本文件
│   ├── setup/              # 设置脚本
│   │   ├── generate-certs.sh   # 证书生成脚本
│   │   ├── initial-setup.js    # 初始设置脚本
│   │   └── openssl.cnf         # OpenSSL配置
│   ├── deployment/         # 部署脚本
│   │   ├── deploy.sh           # 部署脚本
│   │   ├── docker-build.sh     # Docker构建
│   │   └── k8s-deploy.sh       # Kubernetes部署
│   └── development/        # 开发脚本
│       ├── dev-setup.sh        # 开发环境设置
│       └── watch.sh            # 文件监控
├── tools/                   # 开发工具
│   ├── system/             # 系统工具
│   │   ├── windows/        # Windows工具
│   │   │   ├── registry-vbs/   # VBS注册表脚本
│   │   │   └── proxy-config.js # Windows代理配置
│   │   └── macos/          # macOS工具
│   │       └── network-setup.js # macOS网络设置
│   └── dev/                # 开发工具
│       ├── code-formatter.js   # 代码格式化
│       └── lint-runner.js      # 代码检查
├── tests/                   # 测试文件
│   ├── unit/               # 单元测试
│   │   ├── client/         # 客户端单元测试
│   │   ├── server/         # 服务端单元测试
│   │   └── shared/         # 共享工具单元测试
│   ├── integration/        # 集成测试
│   │   ├── client-server.test.js   # 客户端-服务端集成测试
│   │   ├── proxy-functionality.test.js # 代理功能测试
│   │   └── certificate-validation.test.js # 证书验证测试
│   ├── fixtures/           # 测试数据
│   │   ├── certificates/       # 测试证书
│   │   ├── mock-requests/      # 模拟请求
│   │   └── test-configs/       # 测试配置
│   ├── mocks/              # 模拟对象
│   │   ├── network-mocks.js    # 网络模拟
│   │   └── system-mocks.js     # 系统模拟
│   └── helpers/            # 测试辅助工具
│       ├── test-server.js      # 测试服务器
│       └── certificate-generator.js # 证书生成工具
├── examples/                # 使用示例
│   ├── basic-usage/        # 基础使用示例
│   ├── advanced-config/    # 高级配置示例
│   └── deployment/         # 部署示例
├── docs/                    # 文档
│   ├── api/                # API文档
│   │   ├── client-api.md       # 客户端API
│   │   └── server-api.md       # 服务端API
│   ├── guides/             # 用户指南
│   │   ├── quickstart.md       # 快速开始
│   │   ├── configuration.md    # 配置指南
│   │   └── troubleshooting.md  # 故障排除
│   ├── architecture/       # 架构文档
│   │   ├── overview.md         # 架构概览
│   │   ├── security.md         # 安全设计
│   │   └── performance.md      # 性能优化
│   └── deployment/         # 部署文档
│       ├── docker.md           # Docker部署
│       ├── kubernetes.md       # Kubernetes部署
│       └── manual-setup.md     # 手动部署
├── package.json
├── README.md
└── CHANGELOG.md
```

## 重构阶段计划

### 第一阶段：结构创建 (第1周)
- [ ] 创建新目录结构
- [ ] 移动文件到新位置
- [ ] 更新导入语句
- [ ] 创建配置文件结构

### 第二阶段：代码重构 (第2周)
- [ ] 拆分client.js为模块
- [ ] 拆分server.js为模块
- [ ] 创建共享工具库
- [ ] 实现配置管理

### 第三阶段：测试完善 (第3周)
- [ ] 建立单元测试
- [ ] 创建集成测试
- [ ] 设置CI/CD
- [ ] 性能测试

### 第四阶段：文档发布 (第4周)
- [ ] 更新所有文档
- [ ] 创建迁移指南
- [ ] 发布候选版本
- [ ] 最终部署

## 迁移指南

### 开发环境设置
```bash
# 安装依赖
npm install

# 生成测试证书
npm run cert:generate

# 开发模式启动
npm run dev:client    # 启动客户端
npm run dev:server    # 启动服务端

# 运行测试
npm test
npm run test:watch
```

### 配置文件迁移
旧配置格式：
```javascript
// config/config.js
module.exports = {
    remote: { host: '43.159.38.35', port: 443 },
    local: { port: 8080 },
    tls: { key: './certs/client-key.pem', ... }
}
```

新配置格式：
```javascript
// config/default.js
module.exports = {
    client: {
        local: { port: 8080 },
        whitelist: { enabled: false }
    },
    server: {
        remote: { host: '43.159.38.35', port: 443 }
    },
    tls: {
        key: './certs/client-key.pem',
        cert: './certs/client-cert.pem',
        ca: ['./certs/server-cert.pem']
    }
}
```

## 关键改进点

1. **模块化架构**: 每个模块职责单一，易于维护
2. **配置管理**: 支持多环境配置，验证机制
3. **测试覆盖**: 单元测试+集成测试的完整测试体系
4. **文档完善**: 多层次文档结构，便于使用和维护
5. **部署友好**: Docker支持，CI/CD集成
6. **平台兼容**: 更好的Windows/macOS平台支持

## 向后兼容性

- 保持原有API接口不变
- 配置文件自动迁移脚本
- 命令行参数保持不变
- 证书文件格式不变