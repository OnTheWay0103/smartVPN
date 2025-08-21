const net = require('net');
const tls = require('tls');
const config = require('../../shared/config');
const logger = require('../../shared/utils/logger');
const DomainFilter = require('../whitelist/domain-filter');
const ProxyManager = require('../system/proxy-manager');

class LocalProxyServer {
    constructor() {
        this.server = null;
        this.domainFilter = new DomainFilter();
        this.proxyManager = new ProxyManager();
        this.activeConnections = new Set();
    }

    async start() {
        const clientConfig = config.getClientConfig();
        
        this.server = net.createServer((clientSocket) => {
            this.handleClientConnection(clientSocket);
        });

        return new Promise((resolve, reject) => {
            this.server.listen(clientConfig.local.port, () => {
                logger.info(`本地代理服务器启动成功，监听端口: ${clientConfig.local.port}`);
                resolve();
            });

            this.server.on('error', (err) => {
                logger.error(`本地代理服务器错误: ${err.message}`);
                reject(err);
            });
        });
    }

    handleClientConnection(clientSocket) {
        logger.debug('新的客户端连接');
        this.activeConnections.add(clientSocket);

        let clientData = '';

        clientSocket.on('data', (data) => {
            try {
                clientData += data.toString();

                // 检查是否接收到完整的HTTP请求头
                if (!clientData.includes('\r\n\r\n')) {
                    return;
                }

                const [requestLine] = clientData.split('\r\n');
                const [method, path, httpVersion] = requestLine.split(' ');

                if (method === 'CONNECT') {
                    this.handleHttpsRequest(clientSocket, path, clientData);
                } else {
                    this.handleHttpRequest(clientSocket, clientData);
                }

                clientData = '';
            } catch (err) {
                this.handleError(clientSocket, err, '请求处理错误');
            }
        });

        clientSocket.on('end', () => {
            logger.debug('客户端断开连接');
            this.activeConnections.delete(clientSocket);
        });

        clientSocket.on('error', (err) => {
            this.handleError(clientSocket, err, '客户端连接错误');
        });
    }

    async handleHttpsRequest(clientSocket, target, requestData) {
        const [host, port] = target.split(':');
        
        if (this.domainFilter.shouldUseProxy(host)) {
            logger.info(`处理HTTPS代理请求: ${target}`);
        } else {
            logger.debug(`域名 ${host} 不在白名单中，直接连接`);
            await this.directConnect(clientSocket, host, port || 443, requestData);
            return;
        }
        
        try {
            const remoteSocket = await this.createRemoteConnection();
            await this.establishHttpsTunnel(remoteSocket, clientSocket, target);
        } catch (err) {
            this.handleError(clientSocket, err, 'HTTPS代理错误');
        }
    }

    async handleHttpRequest(clientSocket, requestData) {
        const [requestLine, ...headers] = requestData.split('\r\n');
        const [method, path, httpVersion] = requestLine.split(' ');

        const hostHeader = headers.find((header) => header.startsWith('Host:'));
        if (!hostHeader) {
            this.handleError(clientSocket, new Error('缺少Host头'), 'HTTP请求错误');
            return;
        }

        const targetAddress = hostHeader.split(' ')[1];
        
        // 验证目标地址
        if (!targetAddress || targetAddress === '0.0.0.0' || targetAddress === '127.0.0.1') {
            this.handleError(clientSocket, new Error(`无效的目标地址: ${targetAddress}`), 'HTTP请求错误');
            return;
        }
        
        logger.debug(`HTTP请求目标地址: ${targetAddress}`);
        
        if (this.domainFilter.shouldUseProxy(targetAddress)) {
            logger.info(`处理HTTP代理请求: ${targetAddress}`);
        } else {
            logger.debug(`域名 ${targetAddress} 不在白名单中，直接连接`);
            await this.directHttpConnect(clientSocket, requestData, targetAddress);
            return;
        }
        
        try {
            const remoteSocket = await this.createRemoteConnection();
            await this.proxyHttpRequest(remoteSocket, clientSocket, requestData, targetAddress);
        } catch (err) {
            this.handleError(clientSocket, err, 'HTTP代理错误');
        }
    }

    async createRemoteConnection() {
        const tlsConfig = config.getTlsConfig();
        const serverConfig = config.getServerConfig();
        
        // 获取远程服务器配置，支持多种配置格式
        const remoteHost = serverConfig.remote?.host || serverConfig.host || '43.159.38.35';
        const remotePort = serverConfig.remote?.port || serverConfig.port || 443;
        
        logger.debug(`尝试连接到远程服务器: ${remoteHost}:${remotePort}`);
        
        return new Promise((resolve, reject) => {
            const socket = tls.connect({
                host: remoteHost,
                port: remotePort,
                key: require('fs').readFileSync(tlsConfig.key),
                cert: require('fs').readFileSync(tlsConfig.cert),
                ca: tlsConfig.ca.map(caFile => require('fs').readFileSync(caFile)),
                timeout: 30000
            }, () => {
                if (socket.authorized) {
                    logger.debug('TLS认证成功');
                    resolve(socket);
                } else {
                    reject(new Error(`TLS认证失败: ${socket.authorizationError}`));
                }
            });

            socket.on('error', (error) => {
                logger.error(`TLS连接错误: ${error.message}`);
                logger.error(`尝试连接的地址: ${remoteHost}:${remotePort}`);
                reject(error);
            });
            
            socket.setTimeout(30000, () => {
                socket.destroy();
                reject(new Error(`连接超时: ${remoteHost}:${remotePort}`));
            });
        });
    }

    async establishHttpsTunnel(remoteSocket, clientSocket, target) {
        const jsonData = JSON.stringify({
            type: 'CONNECT',
            target: target
        });

        remoteSocket.write(jsonData);

        remoteSocket.once('data', (response) => {
            const responseStr = response.toString();
            
            if (responseStr.startsWith('HTTP/1.1 200')) {
                logger.info('HTTPS隧道建立成功');
                clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
                
                // 双向数据转发
                clientSocket.pipe(remoteSocket);
                remoteSocket.pipe(clientSocket);
            } else {
                this.handleError(clientSocket, new Error(`隧道建立失败: ${responseStr}`), '隧道建立');
            }
        });
    }

    async proxyHttpRequest(remoteSocket, clientSocket, requestData, targetAddress) {
        const jsonData = JSON.stringify({
            type: 'HTTP',
            target: targetAddress,
            payload: requestData
        });

        remoteSocket.write(jsonData);

        // 数据转发
        remoteSocket.on('data', (data) => {
            clientSocket.write(data);
        });

        remoteSocket.on('end', () => {
            clientSocket.end();
        });

        remoteSocket.on('error', (err) => {
            this.handleError(clientSocket, err, '远程服务器错误');
        });
    }

    async directConnect(clientSocket, host, port, requestData) {
        // 验证主机地址
        if (!host || host === '0.0.0.0' || host === '127.0.0.1') {
            this.handleError(clientSocket, new Error(`无效的目标主机地址: ${host}`), '直接连接错误');
            return;
        }

        logger.debug(`尝试直接连接到: ${host}:${port}`);
        
        const targetSocket = require('net').connect({
            host: host,
            port: port || 443,
            timeout: 10000
        }, () => {
            logger.debug(`直接连接成功: ${host}:${port}`);
            if (requestData.startsWith('CONNECT')) {
                clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
            } else {
                targetSocket.write(requestData);
            }
            
            clientSocket.pipe(targetSocket);
            targetSocket.pipe(clientSocket);
        });

        targetSocket.on('error', (err) => {
            logger.error(`直接连接错误 ${host}:${port}: ${err.message}`);
            this.handleError(clientSocket, err, '直接连接错误');
        });

        targetSocket.on('end', () => {
            logger.debug(`直接连接结束: ${host}:${port}`);
        });
    }

    async directHttpConnect(clientSocket, requestData, targetAddress) {
        const [requestLine, ...headers] = requestData.split('\r\n');
        const [method, path, httpVersion] = requestLine.split(' ');

        const options = {
            hostname: targetAddress,
            port: 443,
            path: path,
            method: method,
            headers: {}
        };

        headers.forEach(header => {
            if (header) {
                const [key, value] = header.split(': ');
                if (key && value) {
                    options.headers[key] = value;
                }
            }
        });

        const https = require('https');
        const req = https.request(options, (res) => {
            clientSocket.write(`HTTP/1.1 ${res.statusCode} ${res.statusMessage}\r\n`);
            
            Object.entries(res.headers).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach(v => {
                        clientSocket.write(`${key}: ${v}\r\n`);
                    });
                } else {
                    clientSocket.write(`${key}: ${value}\r\n`);
                }
            });
            clientSocket.write('\r\n');

            res.on('data', (chunk) => {
                clientSocket.write(chunk);
            });

            res.on('end', () => {
                clientSocket.end();
            });
        });

        req.on('error', (err) => {
            this.handleError(clientSocket, err, 'HTTPS请求错误');
        });

        const body = requestData.split('\r\n\r\n')[1];
        if (body) {
            req.write(body);
        }
        req.end();
    }

    handleError(socket, error, context) {
        logger.error(`${context}: ${error.message}`);
        if (socket && !socket.destroyed) {
            socket.end();
        }
    }

    async stop() {
        if (this.server) {
            // 清理所有活跃连接
            for (const connection of this.activeConnections) {
                if (!connection.destroyed) {
                    connection.destroy();
                }
            }
            this.activeConnections.clear();

            return new Promise((resolve) => {
                this.server.close(() => {
                    logger.info('本地代理服务器已停止');
                    resolve();
                });
            });
        }
    }

    getActiveConnections() {
        return this.activeConnections.size;
    }
}

module.exports = LocalProxyServer;