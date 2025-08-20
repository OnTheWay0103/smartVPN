# 🚀 快速开始指南

## 1. 环境准备

- **Node.js**: 12.0 或更高版本
- **操作系统**: Windows 10/11 或 macOS
- **网络**: 稳定的网络连接
- **权限**: 管理员权限（用于修改系统代理）

## 2. 安装步骤

### 2.1 下载项目
```bash
git clone git@github.com:OnTheWay0103/smartVPN.git
cd smartVPN
npm install
```

### 2.2 生成证书
```bash
# 一键生成证书
npm run cert:generate

# 手动生成（如果需要）
./scripts/setup/generate-certs.sh
```

### 2.3 配置服务端

**在服务器上操作：**

1. 复制配置模板：
```bash
cp config/config.example.js config/config.js
```

2. 编辑配置文件：
```javascript
// config/config.js
module.exports = {
  client: {
    local: { port: 8080 }
  },
  server: {
    remote: {
      host: '0.0.0.0',  // 监听所有网卡
      port: 443         // 监听端口
    }
  },
  tls: {
    key: './certs/server-key.pem',
    cert: './certs/server-cert.pem'
  }
};
```

3. 启动服务端：
```bash
npm run server
# 或
CLIENT_PORT=443 npm start -- --server
```

### 2.4 配置客户端

**在客户端机器上操作：**

1. 复制配置模板：
```bash
cp config/config.example.js config/config.js
```

2. 编辑配置文件：
```javascript
// config/config.js
module.exports = {
  client: {
    local: { port: 8080 }
  },
  server: {
    remote: {
      host: 'YOUR_SERVER_IP',  // 替换为你的服务器IP
      port: 443
    }
  },
  tls: {
    key: './certs/client-key.pem',
    cert: './certs/client-cert.pem',
    ca: ['./certs/server-cert.pem']
  }
};
```

3. 配置白名单（可选）：
```bash
cp config/whitelist.example.js config/whitelist.js
# 编辑 config/whitelist.js 添加需要代理的域名
```

## 3. 启动客户端

### 3.1 全局代理模式
```bash
npm start
```
**效果**：所有网络流量都通过代理服务器

### 3.2 白名单模式
```bash
npm start -- --white
```
**效果**：只有白名单中的域名通过代理服务器，其他直接连接

### 3.3 指定端口
```bash
CLIENT_PORT=8087 npm start -- --white
```

## 4. 验证连接

### 4.1 检查启动日志
成功启动后应看到：
```
[INFO] 启动SmartVPN客户端...
[INFO] 系统代理设置成功: 127.0.0.1:8080
[INFO] 本地代理服务器启动成功，监听端口: 8080
[INFO] 客户端已准备就绪，系统代理已自动设置
```

### 4.2 测试代理
```bash
# 测试HTTP代理
curl -x http://127.0.0.1:8080 http://httpbin.org/ip

# 测试HTTPS代理
curl -x http://127.0.0.1:8080 https://httpbin.org/ip
```

### 4.3 查看状态
```bash
# 查看客户端状态（在另一个终端）
npm run status
```

## 5. 系统代理验证

### Windows
```cmd
# 检查代理设置
netsh winhttp show proxy

# 检查注册表
reg query "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyEnable
```

### macOS
```bash
# 检查网络代理设置
networksetup -getwebproxy "Wi-Fi"
networksetup -getsecurewebproxy "Wi-Fi"
```

## 6. 故障快速排查

| 问题 | 检查项 | 解决方案 |
|---|---|---|
| 端口占用 | `lsof -i :8080` | 使用其他端口：CLIENT_PORT=8087 |
| 证书错误 | 检查证书文件 | 重新生成证书 |
| 连接超时 | 检查服务器IP和端口 | 确认服务器可访问 |
| 权限错误 | 以管理员身份运行 | Windows: 右键以管理员运行 |

## 7. 一键启动脚本

创建快捷启动脚本：

```bash
# ~/.bashrc 或 ~/.zshrc
alias vpn-start='cd ~/smartVPN && CLIENT_PORT=8087 npm start -- --white'
alias vpn-stop='cd ~/smartVPN && npm run client:stop'
```

## 8. 常用命令汇总

```bash
# 启动服务端
npm run server

# 启动客户端（全局代理）  
npm start

# 启动客户端（白名单代理）
npm start -- --white

# 指定端口启动
CLIENT_PORT=8087 npm start

# 测试连接
npm run test:connection

# 查看帮助
npm run help
```