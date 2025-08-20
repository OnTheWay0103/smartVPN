# 🔧 故障排除指南

## 1. 启动问题

### 1.1 端口占用错误

**错误信息：**
```
listen EADDRINUSE: address already in use :::8080
```

**解决方案：**
```bash
# 查看端口占用
lsof -i :8080

# 使用其他端口
CLIENT_PORT=8087 npm start
```

### 1.2 证书错误

**错误信息：**
```
Error: ENOENT: no such file or directory, open './certs/client-key.pem'
```

**解决方案：**
```bash
# 生成证书
npm run cert:generate

# 或手动生成
./scripts/setup/generate-certs.sh
```

### 1.3 权限错误

**Windows错误：**
```
设置代理失败: 需要管理员权限
```

**解决方案：**
- 右键以管理员身份运行
- 或使用管理员PowerShell

**macOS错误：**
```
设置代理失败: networksetup: command not found
```

**解决方案：**
```bash
# 检查命令是否存在
which networksetup
# 确保有完整Xcode工具
xcode-select --install
```

## 2. 连接问题

### 2.1 连接超时

**错误信息：**
```
connect ETIMEDOUT XXX.XXX.XXX.XXX:443
```

**排查步骤：**
1. 检查服务端是否运行
2. 检查防火墙设置
3. 验证网络连通性
4. 检查服务端IP配置

### 2.2 证书验证失败

**错误信息：**
```
Error: unable to verify the first certificate
```

**解决方案：**
```bash
# 检查证书有效期
openssl x509 -in certs/server-cert.pem -text -noout

# 重新生成证书
npm run cert:generate
```

### 2.3 白名单模式异常

**症状：** 所有流量都代理，白名单不生效

**排查：**
```bash
# 检查白名单配置
node -e "console.log(require('./config/whitelist.js'))"

# 检查环境变量
echo $NODE_ENV
```

## 3. 系统代理问题

### 3.1 Windows代理设置失败

**症状：** 代理已启动但浏览器不走代理

**解决方案：**
```cmd
# 手动检查代理设置
reg query "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyEnable

# 手动设置代理
npm run proxy:set -- --host 127.0.0.1 --port 8080
```

### 3.2 macOS代理设置失败

**症状：** 系统代理未生效

**解决方案：**
```bash
# 检查当前网络服务
networksetup -listallnetworkservices

# 手动设置代理
networksetup -setwebproxy "Wi-Fi" 127.0.0.1 8080
networksetup -setsecurewebproxy "Wi-Fi" 127.0.0.1 8080
```

## 4. 日志调试

### 4.1 开启详细日志

```bash
# 设置调试日志级别
LOG_LEVEL=debug npm start

# 或修改配置文件
logging: { level: 'debug' }
```

### 4.2 查看日志

```bash
# 实时查看日志
tail -f logs/smartvpn.log

# 查看最近错误
grep ERROR logs/smartvpn.log | tail -20
```

## 5. 网络诊断

### 5.1 测试连接

```bash
# 测试服务端连通性
telnet YOUR_SERVER_IP 443

# 测试代理功能
curl -x http://127.0.0.1:8080 http://httpbin.org/ip
```

### 5.2 DNS诊断

```bash
# 检查DNS解析
nslookup google.com

# 检查通过代理的DNS
curl -x http://127.0.0.1:8080 http://httpbin.org/dns
```

## 6. 性能调优

### 6.1 内存优化

```bash
# 监控内存使用
node --max-old-space-size=256 src/client/index.js

# 使用PM2管理
pm2 start src/client/index.js --name smartvpn-client --max-memory-restart 200M
```

### 6.2 连接优化

```javascript
// 修改config.js
connection: {
  timeout: 10000,        // 减少超时时间
  maxRetries: 2,         // 减少重试次数
  retryDelay: 2000       // 减少重试延迟
}
```

## 7. 常见问题FAQ

### Q1: 为什么浏览器显示证书错误？
**A:** 使用自签名证书，需要在浏览器中手动信任证书。

### Q2: 如何验证代理是否生效？
**A:** 访问 http://httpbin.org/ip 查看返回的IP是否为服务端IP。

### Q3: 如何临时禁用代理？
**A:** 按Ctrl+C关闭客户端，系统代理会自动恢复。

### Q4: 如何查看当前配置？
**A:** 
```bash
node -e "console.log(require('./src/shared/config').getClientConfig())"
```

### Q5: 如何修改监听端口？
**A:**
```bash
CLIENT_PORT=8087 npm start
```

## 8. 一键诊断脚本

创建诊断脚本 `diagnose.sh`：

```bash
#!/bin/bash
echo "=== SmartVPN 诊断报告 ==="
echo "1. 系统信息:"
node --version
echo "2. 端口状态:"
lsof -i :8080 || echo "8080端口空闲"
echo "3. 证书检查:"
ls -la certs/
openssl x509 -in certs/server-cert.pem -noout -dates 2>/dev/null || echo "证书异常"
echo "4. 配置检查:"
node -e "console.log(JSON.stringify(require('./src/shared/config').getClientConfig(), null, 2))"
echo "5. 网络测试:"
curl -s http://httpbin.org/ip || echo "网络连接异常"
```

## 9. 获取帮助

### 9.1 查看帮助信息

```bash
npm run help
```

### 9.2 查看版本

```bash
npm run version
```

### 9.3 调试模式

```bash
DEBUG=* npm start
```

## 10. 联系支持

如果以上方法无法解决问题：

1. 收集错误日志和系统信息
2. 创建GitHub Issue提供详细信息
3. 包含以下信息：
   - 操作系统版本
   - Node.js版本
   - 错误日志
   - 配置文件（去除敏感信息）
   - 重现步骤

## 11. 紧急处理

### 11.1 完全重置

```bash
# 停止服务
pkill -f smartvpn

# 恢复系统代理
npm run proxy:reset

# 清理配置文件
rm config/config.js config/whitelist.js

# 重新配置
cp config/config.example.js config/config.js
cp config/whitelist.example.js config/whitelist.js
```

### 11.2 快速重启

```bash
npm run restart
```