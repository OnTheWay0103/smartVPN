const tls = require('tls');
const fs = require('fs');
const path = require('path');
const logger = require('../shared/utils/logger');
const config = require('../shared/config');
const ConnectionManager = require('./monitoring/connection-manager');
const HttpHandler = require('./handlers/http-handler');
const HttpsHandler = require('./handlers/https-handler');

class SmartVPNServer {
    constructor() {
        this.server = null;
        this.connectionManager = new ConnectionManager();
        this.httpHandler = new HttpHandler();
        this.httpsHandler = new HttpsHandler();
        this.isRunning = false;
    }

    async start() {
        try {
            logger.info('启动SmartVPN服务端...');

            // 检查证书文件
            await this.validateCertificates();

            // 创建TLS服务器
            const serverConfig = config.getServerConfig();
            const tlsConfig = config.getTlsConfig();

            // 兼容性TLS配置
            const tlsOptions = {
                key: fs.readFileSync(tlsConfig.key),
                cert: fs.readFileSync(tlsConfig.cert),
                minVersion: 'TLSv1.2',  // 使用支持的TLS版本
                ciphers: 'DEFAULT',     // 使用默认密码套件
                requestCert: false,     // 不要求客户端证书（兼容老版本）
                rejectUnauthorized: false // 不验证客户端证书（兼容老版本）
            };

            // 如果有CA证书，则添加
            if (tlsConfig.ca && tlsConfig.ca.length > 0) {
                tlsOptions.ca = tlsConfig.ca.map(caFile => fs.readFileSync(caFile));
            }

            this.server = tls.createServer(tlsOptions, (socket) => {
                this.handleClientConnection(socket);
            });

            return new Promise((resolve, reject) => {
                this.server.listen(serverConfig.remote.port, serverConfig.remote.host, () => {
                    logger.info(`服务端启动成功，监听 ${serverConfig.remote.host}:${serverConfig.remote.port}`);
                    this.isRunning = true;
                    this.startMonitoring();
                    resolve();
                });

                this.server.on('error', (err) => {
                    logger.error(`服务端错误: ${err.message}`);
                    reject(err);
                });
            });

        } catch (error) {
            logger.error(`启动服务端失败: ${error.message}`);
            throw error;
        }
    }

    async validateCertificates() {
        const tlsConfig = config.getTlsConfig();
        const requiredFiles = [
            tlsConfig.key,
            tlsConfig.cert,
            ...tlsConfig.ca
        ];

        for (const certFile of requiredFiles) {
            const certPath = path.resolve(certFile);
            if (!fs.existsSync(certPath)) {
                throw new Error(`证书文件不存在: ${certPath}`);
            }
        }

        logger.info('证书验证通过');
    }

    handleClientConnection(socket) {
        this.connectionManager.addConnection(socket);

        // 兼容性处理：不强制要求客户端证书验证
        if (socket.authorized === false) {
            logger.warn(`客户端认证失败: ${socket.authorizationError}`);
            // 不立即断开连接，继续处理（兼容老版本客户端）
            logger.info('继续处理未认证的客户端连接（兼容模式）');
        } else {
            logger.debug('客户端认证成功');
        }

        // 设置超时
        socket.setTimeout(30000);

        let clientData = Buffer.alloc(0);
        let dataLength = 0;

        // 监听客户端发送的数据
        socket.on('data', (data) => {
            try {
                // 使用Buffer来累积数据
                clientData = Buffer.concat([clientData, data]);
                dataLength += data.length;

                // 尝试解析JSON数据
                const dataStr = clientData.toString();
                
                // 检查是否有完整的JSON数据
                let jsonData = null;
                let parseSuccess = false;
                
                try {
                    jsonData = JSON.parse(dataStr);
                    parseSuccess = true;
                } catch (parseErr) {
                    // JSON解析失败，可能数据不完整
                    // 检查是否有明显的JSON结构
                    if (dataStr.includes('"type"') && dataStr.includes('"target"')) {
                        // 有JSON结构但可能不完整，继续等待
                        return;
                    }
                    // 数据格式错误，记录并清理
                    logger.warn(`无效的JSON格式: ${dataStr.substring(0, 100)}...`);
                    clientData = Buffer.alloc(0);
                    dataLength = 0;
                    return;
                }

                if (parseSuccess && jsonData) {
                    const { type, target, payload } = jsonData;

                    if (!type || !target) {
                        logger.error(`无效的请求格式: ${JSON.stringify(jsonData)}`);
                        socket.write(JSON.stringify({ error: '无效的请求格式' }));
                        return;
                    }

                    logger.debug(`收到请求: type=${type}, target=${target}`);

                    if (type === 'CONNECT') {
                        this.httpsHandler.handleHttpsRequest(socket, target);
                    } else if (type === 'HTTP') {
                        this.httpHandler.handleHttpRequest(socket, target, payload);
                    } else {
                        logger.error(`未知的请求类型: ${type}`);
                        socket.write(JSON.stringify({ error: '未知的请求类型' }));
                        return;
                    }

                    // 清空缓存
                    clientData = Buffer.alloc(0);
                    dataLength = 0;
                }
            } catch (err) {
                logger.error(`数据解析错误: ${err.message}`);
                logger.error(`原始数据: ${clientData.toString().substring(0, 200)}...`);
                socket.write(JSON.stringify({ error: `数据解析错误: ${err.message}` }));
                clientData = Buffer.alloc(0);
                dataLength = 0;
            }
        });

        // 处理超时
        socket.on('timeout', () => {
            logger.warn(`连接超时: ${socket.remoteAddress}:${socket.remotePort}`);
            socket.end();
            this.connectionManager.removeConnection(socket);
        });

        // 处理客户端断开连接
        socket.on('end', () => {
            this.connectionManager.removeConnection(socket);
        });

        // 处理错误
        socket.on('error', (err) => {
            logger.error(`客户端错误: ${err.message}`);
            this.connectionManager.removeConnection(socket);
        });

        // 处理连接关闭
        socket.on('close', (hadError) => {
            if (hadError) {
                logger.warn(`连接异常关闭: ${socket.remoteAddress}:${socket.remotePort}`);
            }
            this.connectionManager.removeConnection(socket);
        });
    }

    startMonitoring() {
        // 内存监控
        setInterval(() => {
            const memUsage = process.memoryUsage();
            const memUsageMB = {
                rss: Math.round(memUsage.rss / 1024 / 1024),
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                external: Math.round(memUsage.external / 1024 / 1024)
            };
            
            logger.info(`内存使用: RSS=${memUsageMB.rss}MB, Heap=${memUsageMB.heapUsed}/${memUsageMB.heapTotal}MB, External=${memUsageMB.external}MB`);
            
            // 如果内存使用过高，记录警告
            if (memUsageMB.rss > 2000) {
                logger.warn(`内存使用较高: ${memUsageMB.rss}MB`);
            }
        }, 600000); // 每10分钟输出一次

        // 定期检查进程健康状态
        setInterval(() => {
            const uptime = process.uptime();
            const memUsage = process.memoryUsage();
            
            logger.info(`进程运行时间: ${Math.round(uptime)}秒, 内存: ${Math.round(memUsage.rss / 1024 / 1024)}MB, 连接数: ${this.connectionManager.getActiveConnections()}`);
        }, 1200000); // 每20分钟检查一次
    }

    async stop() {
        try {
            if (!this.isRunning) return;

            logger.info('正在停止服务端...');
            
            return new Promise((resolve) => {
                this.server.close(() => {
                    logger.info('服务器已停止接受新连接');
                    
                    // 清理所有连接
                    this.connectionManager.cleanup();
                    this.httpHandler.cleanup();
                    this.httpsHandler.cleanup();
                    
                    logger.info('所有连接已关闭');
                    this.isRunning = false;
                    resolve();
                });

                // 如果10秒内没有完成关闭，强制退出
                setTimeout(() => {
                    logger.error('优雅关闭超时，强制退出');
                    process.exit(1);
                }, 10000);
            });

        } catch (error) {
            logger.error(`停止服务端时发生错误: ${error.message}`);
            throw error;
        }
    }

    getStatus() {
        return {
            running: this.isRunning,
            port: config.getServerConfig().remote.port,
            host: config.getServerConfig().remote.host,
            activeConnections: this.connectionManager.getActiveConnections(),
            uptime: process.uptime(),
            memory: process.memoryUsage()
        };
    }
}

// 命令行参数解析
function parseArgs() {
    const args = process.argv.slice(2);
    return {
        port: args.find(arg => arg.startsWith('--port='))?.split('=')[1],
        host: args.find(arg => arg.startsWith('--host='))?.split('=')[1],
        config: args.find(arg => arg.startsWith('--config='))?.split('=')[1]
    };
}

// 主程序
async function main() {
    const args = parseArgs();
    
    // 设置环境变量
    if (args.config) {
        process.env.NODE_ENV = args.config;
    }
    
    if (args.port) {
        process.env.SERVER_PORT = args.port;
    }
    
    if (args.host) {
        process.env.SERVER_HOST = args.host;
    }

    const server = new SmartVPNServer();
    
    // 设置优雅关闭
    process.on('SIGTERM', async () => {
        await server.stop();
        process.exit(0);
    });
    
    process.on('SIGINT', async () => {
        await server.stop();
        process.exit(0);
    });
    
    try {
        await server.start();
        
        // 保持进程运行
        process.stdin.resume();
        
    } catch (error) {
        logger.error(`服务端启动失败: ${error.message}`);
        process.exit(1);
    }
}

// 如果是直接运行，则启动主程序
if (require.main === module) {
    main().catch(error => {
        logger.error(`未处理的错误: ${error.message}`);
        process.exit(1);
    });
}

module.exports = SmartVPNServer;