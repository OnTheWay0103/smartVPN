const net = require('net');
const logger = require('../shared/utils/logger');

class HttpsHandler {
    constructor() {
        this.activeConnections = new Set();
    }

    async handleHttpsRequest(clientSocket, target) {
        logger.info(`处理HTTPS请求: ${target}`);

        try {
            // 解析目标地址和端口
            const [host, port = 443] = target.split(':');

            // 连接到目标服务器
            const targetSocket = net.connect({
                host: host,
                port: port,
                timeout: 10000
            }, () => {
                logger.info(`HTTPS隧道建立: ${target}`);
                clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
                
                // 双向转发数据
                clientSocket.pipe(targetSocket);
                targetSocket.pipe(clientSocket);
                
                this.activeConnections.add(targetSocket);
            });

            // 处理目标服务器断开连接
            targetSocket.on('end', () => {
                logger.info(`HTTPS隧道关闭: ${target}`);
                clientSocket.end();
                this.activeConnections.delete(targetSocket);
            });

            // 处理错误
            targetSocket.on('error', (err) => {
                logger.error(`HTTPS目标错误: ${err.message}`);
                clientSocket.end();
                this.activeConnections.delete(targetSocket);
            });

            // 处理超时
            targetSocket.on('timeout', () => {
                logger.warn(`HTTPS连接超时: ${target}`);
                targetSocket.end();
                clientSocket.end();
                this.activeConnections.delete(targetSocket);
            });

            // 处理连接关闭
            targetSocket.on('close', (hadError) => {
                if (hadError) {
                    logger.warn(`HTTPS目标连接异常关闭: ${target}`);
                }
                this.activeConnections.delete(targetSocket);
            });

        } catch (error) {
            logger.error(`处理HTTPS请求失败: ${error.message}`);
            clientSocket.end();
        }
    }

    getActiveConnections() {
        return this.activeConnections.size;
    }

    cleanup() {
        logger.info(`清理 ${this.activeConnections.size} 个HTTPS连接...`);
        for (const conn of this.activeConnections) {
            try {
                conn.destroy();
            } catch (err) {
                logger.error(`关闭HTTPS连接时出错: ${err.message}`);
            }
        }
        this.activeConnections.clear();
    }
}

module.exports = HttpsHandler;