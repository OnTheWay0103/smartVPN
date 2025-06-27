# 贡献指南

感谢您对 SmartVPN 项目的关注！我们欢迎所有形式的贡献，包括但不限于：

- 🐛 Bug 报告
- 💡 功能建议
- 📝 文档改进
- 🔧 代码贡献
- 🧪 测试用例

## 开发环境设置

### 1. 克隆项目

```bash
git clone git@github.com:OnTheWay0103/smartVPN.git
cd smartVPN
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置开发环境

```bash
# 复制配置文件模板
cp env/config.example.js env/config.js

# 生成测试证书
cd env
openssl req -newkey rsa:4096 -nodes -keyout server-key.pem -out server.csr -config openssl.cnf
openssl x509 -req -in server.csr -signkey server-key.pem -out server-cert.pem -extensions req_ext -extfile openssl.cnf -days 365
openssl req -newkey rsa:4096 -nodes -keyout client-key.pem -out client.csr -config openssl.cnf
openssl x509 -req -in client.csr -signkey client-key.pem -out client-cert.pem -extensions req_ext -extfile openssl.cnf -days 365
cd ..
```

### 4. 运行测试

```bash
# 运行所有测试
npm test

# 运行客户端测试
node client.test.js

# 运行服务端测试
node server.test.js

# 运行代理测试
node test-proxy.js
```

## 代码规范

### JavaScript 代码风格

- 使用 2 个空格缩进
- 使用单引号
- 行末不加分号
- 使用 ES6+ 语法
- 添加适当的注释

### 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

类型说明：

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

示例：

```
feat(client): 添加连接重试机制

- 实现指数退避重试算法
- 添加最大重试次数限制
- 优化错误处理逻辑

Closes #123
```

## 贡献流程

### 1. 创建 Issue

在提交代码之前，请先创建 Issue 描述您要解决的问题或添加的功能。

### 2. Fork 项目

点击 GitHub 页面右上角的 "Fork" 按钮，将项目复制到您的账户。

### 3. 创建分支

```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

### 4. 开发代码

- 遵循代码规范
- 添加必要的测试
- 更新相关文档

### 5. 提交代码

```bash
git add .
git commit -m "feat: 添加新功能描述"
```

### 6. 推送分支

```bash
git push origin feature/your-feature-name
```

### 7. 创建 Pull Request

在 GitHub 上创建 Pull Request，并：

- 描述您的更改
- 关联相关 Issue
- 添加测试结果
- 请求代码审查

## 测试指南

### 单元测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
node test/client.test.js
```

### 集成测试

```bash
# 启动服务端
npm run server

# 在另一个终端启动客户端
npm start

# 运行代理测试
node test-proxy.js
```

### 手动测试

1. 启动服务端和客户端
2. 验证代理设置是否生效
3. 测试白名单功能
4. 检查日志输出
5. 验证 TLS 连接

## 文档贡献

### README 更新

- 保持文档与代码同步
- 添加新功能的说明
- 更新配置示例
- 完善故障排除指南

### 代码注释

- 为复杂逻辑添加注释
- 说明函数参数和返回值
- 添加使用示例

## 问题报告

报告 Bug 时，请包含以下信息：

1. **环境信息**

   - 操作系统版本
   - Node.js 版本
   - 项目版本

2. **问题描述**

   - 详细的问题现象
   - 复现步骤
   - 期望行为

3. **错误信息**

   - 完整的错误日志
   - 控制台输出
   - 相关配置文件

4. **附加信息**
   - 相关 Issue 链接
   - 可能的解决方案

## 功能建议

提出功能建议时，请考虑：

- 功能的价值和必要性
- 实现的技术可行性
- 对现有功能的影响
- 用户体验的改进

## 代码审查

所有代码贡献都需要经过审查：

- 代码质量和风格
- 功能完整性
- 测试覆盖率
- 文档更新
- 安全性考虑

## 发布流程

### 版本号规范

使用 [Semantic Versioning](https://semver.org/)：

- `MAJOR.MINOR.PATCH`
- 主版本号：不兼容的 API 修改
- 次版本号：向下兼容的功能性新增
- 修订号：向下兼容的问题修正

### 发布步骤

1. 更新版本号
2. 更新 CHANGELOG.md
3. 创建 Release 标签
4. 发布到 npm（如果适用）

## 联系方式

如果您有任何问题或建议，请通过以下方式联系：

- 创建 [GitHub Issue](https://github.com/OnTheWay0103/smartVPN/issues)
- 发送邮件到项目维护者

感谢您的贡献！🎉
