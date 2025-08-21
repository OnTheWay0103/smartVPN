const net = require('net');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/config');

class HttpHandler {
    constructor() {
        this.activeConnections = new Set();
    }

    async handleHttpRequest(clientSocket, target, payload) {
        logger.info(`处理HTTP请求: ${target}`);

        try {
            // 解析目标地址和端口
            const [host, port = 80] = target.split(':');
            
            logger.debug(`尝试连接到目标服务器: ${host}:${port}`);

            // 创建到目标服务器的连接
            const targetSocket = net.connect({
                host: host,
                port: port,
                timeout: 10000
            }, () => {
                logger.info(`HTTP连接建立成功: ${target}`);
                
                // 发送HTTP请求到目标服务器
                targetSocket.write(payload);
                this.activeConnections.add(targetSocket);
            });

            // 当目标服务器返回数据时，转发给客户端
            targetSocket.on('data', (data) => {
                clientSocket.write(data);
            });

            // 处理目标服务器断开连接
            targetSocket.on('end', () => {
                logger.info(`HTTP连接关闭: ${target}`);
                clientSocket.end();
                this.activeConnections.delete(targetSocket);
            });

            // 处理错误
            targetSocket.on('error', (err) => {
                logger.error(`HTTP目标错误: ${err.message}`);
                // 发送错误响应给客户端
                clientSocket.write(`HTTP/1.1 502 Bad Gateway\r\n\r\n`);
                clientSocket.end();
                this.activeConnections.delete(targetSocket);
            });

            // 处理超时
            targetSocket.on('timeout', () => {
                logger.warn(`HTTP连接超时: ${target}`);
                targetSocket.end();
                clientSocket.end();
                this.activeConnections.delete(targetSocket);
            });

            // 处理连接关闭
            targetSocket.on('close', (hadError) => {
                if (hadError) {
                    logger.warn(`HTTP目标连接异常关闭: ${target}`);
                }
                this.activeConnections.delete(targetSocket);
            });

        } catch (error) {
            logger.error(`处理HTTP请求失败: ${error.message}`);
            clientSocket.end();
        }
    }

    getActiveConnections() {
        return this.activeConnections.size;
    }

    cleanup() {
        logger.info(`清理 ${this.activeConnections.size} 个HTTP连接...`);
        for (const conn of this.activeConnections) {
            try {
                conn.destroy();
            } catch (err) {
                logger.error(`关闭HTTP连接时出错: ${err.message}`);
            }
        }
        this.activeConnections.clear();
    }
}

module.exports = HttpHandler;