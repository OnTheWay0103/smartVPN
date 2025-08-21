const logger = require('../../shared/utils/logger');

class ConnectionManager {
    constructor() {
        this.activeConnections = new Set();
        this.connectionCount = 0;
        this.startMonitoring();
    }

    addConnection(socket) {
        this.connectionCount++;
        this.activeConnections.add(socket);
        logger.info(`客户端连接: ${socket.remoteAddress}:${socket.remotePort} (连接 #${this.connectionCount})`);
    }

    removeConnection(socket) {
        if (this.activeConnections.has(socket)) {
            this.activeConnections.delete(socket);
            logger.info(`客户端断开连接: ${socket.remoteAddress}:${socket.remotePort}`);
        }
    }

    startMonitoring() {
        // 定期清理断开的连接
        setInterval(() => {
            const beforeSize = this.activeConnections.size;
            for (const conn of this.activeConnections) {
                if (conn.destroyed || conn.closed) {
                    this.activeConnections.delete(conn);
                }
            }
            const afterSize = this.activeConnections.size;
            if (beforeSize !== afterSize) {
                logger.info(`清理了 ${beforeSize - afterSize} 个断开的连接`);
            }
        }, 30000); // 每30秒清理一次

        // 定期输出连接统计
        setInterval(() => {
            this.logConnectionStats();
        }, 60000); // 每分钟输出一次
    }

    logConnectionStats() {
        logger.info(`活跃连接数: ${this.activeConnections.size}, 总连接数: ${this.connectionCount}`);
    }

    getConnectionStats() {
        return {
            activeConnections: this.activeConnections.size,
            totalConnections: this.connectionCount,
            connections: Array.from(this.activeConnections).map(conn => ({
                remoteAddress: conn.remoteAddress,
                remotePort: conn.remotePort,
                authorized: conn.authorized,
                encrypted: conn.encrypted
            }))
        };
    }

    cleanup() {
        logger.info(`关闭所有 ${this.activeConnections.size} 个活跃连接...`);
        for (const conn of this.activeConnections) {
            try {
                conn.destroy();
            } catch (err) {
                logger.error(`关闭连接时出错: ${err.message}`);
            }
        }
        this.activeConnections.clear();
    }

    getActiveConnections() {
        return this.activeConnections.size;
    }
}

module.exports = ConnectionManager;