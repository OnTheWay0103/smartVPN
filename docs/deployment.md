# 🚀 部署指南

## 1. 部署前准备

### 1.1 系统要求

**服务端：**
- 操作系统：Ubuntu 18.04+ / CentOS 7+ / Windows Server 2019+
- Node.js：16.0+ (推荐18.0+)
- 网络：公网IP，开放443端口
- 防火墙：允许443端口的TCP连接

**客户端：**
- 操作系统：Windows 10/11 / macOS 10.14+ / Ubuntu 20.04+
- Node.js：16.0+ (推荐18.0+)
- 权限：管理员权限（用于修改系统代理）

### 1.2 版本检查

```bash
# 检查Node.js版本
node --version
npm --version

# 检查系统信息
uname -a  # Linux/macOS
systeminfo  # Windows
```

## 2. 服务端部署

### 2.1 Linux部署

#### Ubuntu/Debian

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装项目
git clone git@github.com:OnTheWay0103/smartVPN.git
cd smartVPN
npm install

# 生成证书
npm run cert:generate

# 配置服务端
cp config/config.example.js config/config.js
# 编辑config/config.js设置监听IP为0.0.0.0
```

#### CentOS/RHEL

```bash
# 更新系统
sudo yum update -y

# 安装Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 其余步骤同上
```

### 2.2 防火墙配置

#### Ubuntu (UFW)

```bash
# 启用防火墙
sudo ufw enable

# 允许443端口
sudo ufw allow 443/tcp

# 检查防火墙状态
sudo ufw status
```

#### CentOS (firewalld)

```bash
# 允许443端口
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload

# 检查状态
sudo firewall-cmd --list-all
```

### 2.3 系统服务配置

#### 创建systemd服务

创建 `/etc/systemd/system/smartvpn-server.service`：

```ini
[Unit]
Description=SmartVPN Server
After=network.target

[Service]
Type=simple
User=smartvpn
WorkingDirectory=/opt/smartvpn
ExecStart=/usr/bin/node src/server/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable smartvpn-server
sudo systemctl start smartvpn-server
sudo systemctl status smartvpn-server
```

### 2.4 Windows服务端部署

#### Windows Server配置

```powershell
# 下载并安装Node.js
# https://nodejs.org/

# 安装项目
git clone git@github.com:OnTheWay0103/smartVPN.git
cd smartVPN
npm install

# 生成证书
npm run cert:generate

# 配置防火墙
netsh advfirewall firewall add rule name="SmartVPN-443" dir=in action=allow protocol=TCP localport=443

# 创建服务（使用nssm）
nssm install SmartVPN-Server "C:\Program Files\nodejs\node.exe" "C:\smartvpn\src\server\index.js"
nssm set SmartVPN-Server Environment "NODE_ENV=production"
nssm start SmartVPN-Server
```

## 3. 客户端部署

### 3.1 自动部署脚本

创建部署脚本 `deploy-client.sh`：

```bash
#!/bin/bash
set -e

echo "=== SmartVPN 客户端部署 ==="

# 1. 检查系统
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "msys" ]]; then
    OS="windows"
else
    echo "不支持的操作系统"
    exit 1
fi

echo "检测系统: $OS"

# 2. 检查Node.js
if ! command -v node &> /dev/null; then
    echo "请先安装Node.js 16.0+"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "Node.js版本过低，需要16.0+"
    exit 1
fi

# 3. 下载项目
git clone git@github.com:OnTheWay0103/smartVPN.git
cd smartVPN

# 4. 安装依赖
npm install

# 5. 生成证书
npm run cert:generate

# 6. 配置客户端
echo "请编辑 config/config.js 设置服务端IP地址"
echo "示例配置："
cat << EOF > config/config.js
module.exports = {
  client: {
    local: { port: 8080 }
  },
  server: {
    remote: {
      host: 'YOUR_SERVER_IP_HERE',
      port: 443
    }
  },
  tls: {
    key: './certs/client-key.pem',
    cert: './certs/client-cert.pem',
    ca: ['./certs/server-cert.pem']
  }
};
EOF

echo "部署完成！请编辑 config/config.js 设置服务端IP"
echo "启动命令：npm start"
```

### 3.2 一键安装命令

```bash
# 一键安装
bash <(curl -s https://raw.githubusercontent.com/OnTheWay0103/smartVPN/main/scripts/deploy-client.sh)
```

## 4. Docker部署

### 4.1 Docker服务端

创建 `Dockerfile.server`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制项目文件
COPY package*.json ./
RUN npm install --production

COPY . .

# 生成证书
RUN npm run cert:generate

# 暴露端口
EXPOSE 443

# 设置环境变量
ENV NODE_ENV=production

CMD ["node", "src/server/index.js"]
```

构建并运行：

```bash
# 构建镜像
docker build -f Dockerfile.server -t smartvpn-server .

# 运行容器
docker run -d \
  --name smartvpn-server \
  -p 443:443 \
  -v $(pwd)/config:/app/config \
  smartvpn-server
```

### 4.2 Docker客户端

创建 `Dockerfile.client`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm install --production

COPY . .

# 生成证书
RUN npm run cert:generate

# 设置环境变量
ENV NODE_ENV=production

CMD ["node", "src/client/index.js"]
```

运行客户端：

```bash
# 运行客户端容器
docker run -it \
  --name smartvpn-client \
  --network host \
  -v $(pwd)/config:/app/config \
  -e CLIENT_PORT=8080 \
  -e NODE_ENV=production \
  smartvpn-client
```

## 5. 配置管理

### 5.1 环境变量配置

创建 `.env` 文件：

```bash
# 服务端配置
SERVER_HOST=0.0.0.0
SERVER_PORT=443
NODE_ENV=production

# 客户端配置
CLIENT_HOST=127.0.0.1
CLIENT_PORT=8080
SERVER_IP=your-server-ip
```

### 5.2 配置文件模板

#### 服务端配置

创建 `config/production.js`：

```javascript
module.exports = {
  server: {
    remote: {
      host: '0.0.0.0',
      port: 443
    },
    monitoring: {
      connectionCleanupInterval: 60000,
      statsLogInterval: 300000,
      memoryCheckInterval: 600000,
      uptimeLogInterval: 1800000
    }
  },
  logging: {
    level: 'info',
    format: 'json',
    destinations: ['file', 'console']
  }
}
```

#### 客户端配置

创建 `config/client.js`：

```javascript
module.exports = {
  client: {
    local: {
      port: process.env.CLIENT_PORT || 8080
    },
    whitelist: {
      enabled: false,
      domains: [
        'google.com',
        '*.google.com',
        'github.com',
        '*.github.com'
      ]
    }
  },
  server: {
    remote: {
      host: process.env.SERVER_IP || 'localhost',
      port: 443
    }
  }
}
```

## 6. 安全加固

### 6.1 系统安全

#### Linux系统加固

```bash
# 创建专用用户
sudo useradd -r -s /bin/false smartvpn
sudo chown -R smartvpn:smartvpn /opt/smartvpn

# 限制资源
sudo systemctl edit smartvpn-server
# 添加：
[Service]
LimitNOFILE=65536
LimitNPROC=4096
MemoryLimit=512M
```

#### 防火墙配置

```bash
# 仅允许特定IP访问
sudo ufw allow from CLIENT_IP to any port 443

# 速率限制
sudo iptables -A INPUT -p tcp --dport 443 -m limit --limit 25/minute --limit-burst 100 -j ACCEPT
```

### 6.2 证书管理

#### 定期更新证书

创建证书更新脚本 `scripts/update-certs.sh`：

```bash
#!/bin/bash
# 证书更新脚本
cd /opt/smartvpn

# 生成新证书
npm run cert:generate

# 平滑重启服务
sudo systemctl reload smartvpn-server

# 记录更新时间
echo "$(date): 证书已更新" >> logs/cert-update.log
```

设置定时任务：

```bash
# 每月1号更新证书
0 0 1 * * /opt/smartvpn/scripts/update-certs.sh
```

## 7. 监控与告警

### 7.1 基本监控

创建监控脚本 `scripts/monitor.sh`：

```bash
#!/bin/bash
# 基础监控脚本

SERVER_IP="your-server-ip"
CLIENT_IP="your-client-ip"

# 检查服务端
if ! nc -z $SERVER_IP 443; then
    echo "$(date): 服务端连接失败" >> logs/monitor.log
fi

# 检查客户端
if ! pgrep -f "smartvpn.*client" > /dev/null; then
    echo "$(date): 客户端进程异常" >> logs/monitor.log
fi

# 检查内存使用
MEMORY_USAGE=$(ps aux | grep smartvpn | awk '{sum+=$4} END {print sum}')
if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    echo "$(date): 内存使用过高: $MEMORY_USAGE%" >> logs/monitor.log
fi
```

### 7.2 集成监控工具

#### Prometheus监控

添加metrics端点：

```javascript
// 在server/index.js中添加
const promClient = require('prom-client');
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics();

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'status_code']
});
```

#### Grafana仪表板

创建Grafana配置文件：

```json
{
  "dashboard": {
    "title": "SmartVPN 监控",
    "panels": [
      {
        "title": "连接数",
        "targets": [
          {
            "expr": "active_connections"
          }
        ]
      },
      {
        "title": "流量统计",
        "targets": [
          {
            "expr": "bytes_sent"
          },
          {
            "expr": "bytes_received"
          }
        ]
      }
    ]
  }
}
```

## 8. 高可用部署

### 8.1 负载均衡

#### Nginx负载均衡

```nginx
upstream smartvpn_backend {
    server 192.168.1.10:443;
    server 192.168.1.11:443;
    server 192.168.1.12:443;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass https://smartvpn_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 8.2 故障转移

#### Keepalived配置

```bash
# 安装keepalived
sudo apt install keepalived

# 配置主节点
sudo tee /etc/keepalived/keepalived.conf << EOF
vrrp_instance VI_1 {
    state MASTER
    interface eth0
    virtual_router_id 51
    priority 100
    advert_int 1
    virtual_ipaddress {
        192.168.1.100
    }
}
EOF
```

## 9. 自动化部署

### 9.1 CI/CD配置

#### GitHub Actions

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy SmartVPN

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Generate certificates
      run: npm run cert:generate
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SERVER_KEY }}
        script: |
          cd /opt/smartvpn
          git pull origin main
          npm ci --production
          npm run cert:generate
          sudo systemctl restart smartvpn-server
```

### 9.2 一键部署脚本

创建 `deploy.sh`：

```bash
#!/bin/bash
set -e

echo "=== SmartVPN 一键部署 ==="

# 配置参数
SERVER_IP=${1:-"localhost"}
CLIENT_IP=${2:-"localhost"}

echo "部署服务端到: $SERVER_IP"
echo "配置客户端到: $CLIENT_IP"

# 服务端部署
ssh root@$SERVER_IP << 'EOF'
  apt update && apt install -y nodejs npm
  git clone git@github.com:OnTheWay0103/smartVPN.git /opt/smartvpn
  cd /opt/smartvpn
  npm install --production
  npm run cert:generate
  
  # 配置并启动
  cp config/config.example.js config/config.js
  sed -i "s/localhost/$SERVER_IP/g" config/config.js
  
  # 创建systemd服务
  cat > /etc/systemd/system/smartvpn-server.service << EOL
[Unit]
Description=SmartVPN Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/smartvpn
ExecStart=/usr/bin/node src/server/index.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOL

  systemctl daemon-reload
  systemctl enable smartvpn-server
  systemctl start smartvpn-server
EOF

echo "服务端部署完成！"
echo "服务端地址: $SERVER_IP:443"
echo "客户端配置请设置 SERVER_IP=$SERVER_IP"
```

## 10. 验证部署

### 10.1 服务端验证

```bash
# 检查服务状态
sudo systemctl status smartvpn-server

# 检查端口监听
sudo netstat -tlnp | grep :443

# 检查日志
sudo journalctl -u smartvpn-server -f
```

### 10.2 客户端验证

```bash
# 测试连接
curl -x http://127.0.0.1:8080 http://httpbin.org/ip

# 检查代理设置
node -e "console.log(require('./src/shared/config').getClientConfig())"
```

## 11. 维护计划

### 11.1 日常维护

- **日志清理**：每周清理旧日志
- **证书更新**：每月检查证书有效期
- **性能监控**：每日检查系统资源使用
- **安全更新**：及时更新Node.js和依赖

### 11.2 备份策略

```bash
#!/bin/bash
# 备份脚本
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/smartvpn/$DATE"

mkdir -p $BACKUP_DIR

# 备份配置文件
cp -r config $BACKUP_DIR/
cp -r certs $BACKUP_DIR/

# 备份日志
tar -czf $BACKUP_DIR/logs.tar.gz logs/

echo "备份完成: $BACKUP_DIR"
```

---

## 部署检查清单

- [ ] 系统环境满足要求
- [ ] Node.js和npm已安装
- [ ] 防火墙配置完成
- [ ] TLS证书已生成
- [ ] 配置文件已设置
- [ ] 服务已启动并运行
- [ ] 客户端连接测试通过
- [ ] 日志监控已配置
- [ ] 备份策略已实施
- [ ] 安全加固已完成