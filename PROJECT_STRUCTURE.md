# SmartVPN 项目结构整理方案

## 📁 建议的新项目结构

```
smartVPN/
├── 📄 文档文件
│   ├── README.md                 # 项目主文档
│   ├── QUICKSTART.md             # 快速开始指南
│   ├── CONTRIBUTING.md           # 贡献指南
│   ├── CHANGELOG.md              # 更新日志
│   ├── LICENSE                   # 许可证
│   └── PROJECT_STRUCTURE.md      # 项目结构说明（本文件）
│
├── 🚀 主程序
│   ├── src/
│   │   ├── client.js             # 客户端主程序
│   │   ├── server.js             # 服务端主程序
│   │   └── index.js              # 程序入口点
│   └── bin/
│       └── smartvpn              # 命令行工具
│
├── ⚙️ 配置和证书
│   ├── config/
│   │   ├── config.example.js     # 配置文件示例
│   │   ├── whitelist.example.js  # 白名单配置示例
│   │   └── config.js             # 实际配置文件（gitignore）
│   ├── certs/
│   │   ├── server-key.pem        # 服务器私钥
│   │   ├── server-cert.pem       # 服务器证书
│   │   ├── client-key.pem        # 客户端私钥
│   │   ├── client-cert.pem       # 客户端证书
│   │   └── ca-cert.pem           # CA证书
│   └── scripts/
│       ├── generate-certs.sh     # 证书生成脚本
│       └── openssl.cnf           # OpenSSL配置
│
├── 🧪 测试文件
│   ├── tests/
│   │   ├── client.test.js        # 客户端测试
│   │   ├── server.test.js        # 服务端测试
│   │   ├── proxy.test.js         # 代理功能测试
│   │   └── utils/
│   │       └── test-helpers.js   # 测试辅助函数
│   └── fixtures/                 # 测试数据
│       └── test-registry.txt     # 测试用注册表数据
│
├── 🛠️ 工具和脚本
│   ├── scripts/
│   │   ├── setup.js              # 项目设置脚本
│   │   ├── install.sh            # 安装脚本
│   │   └── dev.sh                # 开发环境脚本
│   ├── tools/
│   │   ├── setProxy.js           # 代理设置工具
│   │   ├── login-to-start-vpn.sh # 登录启动工具（临时使用）
│   │   └── registry/             # Windows注册表工具
│   │       ├── regedit.vbs       # 主注册表脚本
│   │       └── regedit-vbs/      # 注册表脚本库
│   └── examples/
│       └── test-proxy.js         # 代理测试示例
│
├── 📦 核心模块
│   ├── lib/
│   │   ├── proxy.js              # 代理核心逻辑
│   │   ├── tls.js                # TLS连接管理
│   │   ├── whitelist.js          # 白名单管理
│   │   └── utils/
│   │       ├── logger.js         # 日志工具
│   │       ├── config.js         # 配置管理
│   │       └── network.js        # 网络工具
│   └── middleware/               # 中间件
│       ├── auth.js               # 认证中间件
│       └── rate-limit.js         # 限流中间件
│
├── 📋 项目配置
│   ├── package.json              # Node.js项目配置
│   ├── package-lock.json         # 依赖锁定文件
│   ├── .gitignore                # Git忽略文件
│   ├── .eslintrc.js              # ESLint配置
│   ├── .prettierrc               # Prettier配置
│   └── nodemon.json              # Nodemon配置
│
    └── 🔧 开发工具
        ├── docs/                     # 详细文档
        │   ├── api.md                # API文档
        │   ├── deployment.md         # 部署指南
        │   └── troubleshooting.md    # 故障排除
        ├── .github/                  # GitHub配置
        │   ├── workflows/            # CI/CD工作流
        │   └── ISSUE_TEMPLATE.md     # Issue模板
        └── userinput.py              # 交互式反馈工具（gitignore）
```

## 🔄 迁移计划

### 第一阶段：创建新目录结构

1. 创建新的目录结构
2. 移动文件到对应位置
3. 更新文件引用路径

### 第二阶段：代码重构

1. 将主程序代码拆分到 `src/` 目录
2. 将工具函数提取到 `lib/` 目录
3. 创建统一的入口点

### 第三阶段：配置优化

1. 统一配置文件管理
2. 优化证书文件组织
3. 改进脚本文件结构

### 第四阶段：测试和文档

1. 整理测试文件
2. 更新文档引用
3. 验证所有功能正常

## ✅ 整理的好处

1. **更清晰的结构**：按功能分类，易于理解和维护
2. **更好的可扩展性**：模块化设计，便于添加新功能
3. **更专业的项目**：符合 Node.js 项目最佳实践
4. **更容易协作**：清晰的目录结构便于团队协作
5. **更好的测试**：测试文件集中管理，便于维护

## 🚀 下一步行动

1. 确认新的项目结构方案
2. 开始执行迁移计划
3. 更新所有相关文档
4. 测试确保功能正常
