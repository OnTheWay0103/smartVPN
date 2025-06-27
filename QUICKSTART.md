# SmartVPN 快速开始指南

本指南将帮助您在 5 分钟内快速设置和运行 SmartVPN。

## 🚀 快速安装

### 1. 克隆项目

```bash
git clone git@github.com:OnTheWay0103/smartVPN.git
cd smartVPN
```

### 2. 运行安装脚本

```bash
npm run setup
```

这个脚本会自动：
- 检查 Node.js 版本
- 安装依赖包
- 创建必要的目录
- 复制配置文件模板

### 3. 生成证书

```bash
cd env
./generate-certs.sh
cd ..
```

### 4. 配置服务器信息

编辑 `env/config.js` 文件：

```javascript
module.exports = {
    remote: {
        host: 'your-server-ip',  // 替换为您的服务器IP
        port: 443
    },
    // ... 其他配置保持不变
}
```

## 🏃‍♂️ 快速运行

### 启动服务端（在服务器上）

```bash
npm run server
```

### 启动客户端（在本地机器上）

```bash
npm start
```

## ✅ 验证安装

1. **检查代理设置**
   - Windows: 设置 → 网络和 Internet → 代理
   - macOS: 系统偏好设置 → 网络 → 高级 → 代理

2. **测试连接**
   ```bash
   curl -x http://127.0.0.1:8080 https://httpbin.org/ip
   ```

3. **查看日志**
   - 客户端和服务端都会在控制台显示连接状态

## 🔧 常见问题

### 证书生成失败
```bash
# 确保 OpenSSL 已安装
openssl version

# 手动生成证书
cd env
openssl req -newkey rsa:4096 -nodes -keyout server-key.pem -out server.csr -config openssl.cnf
openssl x509 -req -in server.csr -signkey server-key.pem -out server-cert.pem -extensions req_ext -extfile openssl.cnf -days 365
```

### 权限问题
```bash
# macOS/Linux
sudo npm start

# Windows (以管理员身份运行)
npm start
```

### 端口被占用
修改 `env/config.js` 中的端口：
```javascript
local: {
    port: 8081  // 使用其他端口
}
```

## 📋 检查清单

- [ ] Node.js 12.0+ 已安装
- [ ] 项目已克隆
- [ ] 依赖已安装
- [ ] 证书已生成
- [ ] 配置文件已设置
- [ ] 服务端已启动
- [ ] 客户端已启动
- [ ] 代理设置已生效
- [ ] 连接测试通过

## 🆘 需要帮助？

如果遇到问题：

1. 查看 [故障排除指南](../README.md#故障排除)
2. 检查 [完整文档](../README.md)
3. 创建 [GitHub Issue](https://github.com/OnTheWay0103/smartVPN/issues)

## 🎯 下一步

- 阅读 [完整文档](../README.md) 了解更多功能
- 查看 [配置说明](../README.md#配置说明) 进行高级配置
- 参与 [项目贡献](../CONTRIBUTING.md)

---

**提示**: 首次运行可能需要管理员权限来修改系统代理设置。 