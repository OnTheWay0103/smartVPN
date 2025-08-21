/**
 * 服务端专用配置文件
 * 服务端监听本机地址，客户端连接到远程服务器
 */

module.exports = {
    // 服务端监听配置
    server: {
        // 服务端监听的地址和端口
        listen: {
            host: '0.0.0.0',  // 监听所有网络接口
            port: 443          // 监听443端口
        },
        // 监控配置
        monitoring: {
            connectionCleanupInterval: 30000,
            statsLogInterval: 60000,
            memoryCheckInterval: 600000,
            uptimeLogInterval: 1200000
        },
        // TLS配置
        tls: {
            minVersion: 'TLSv1.2',
            ciphers: 'HIGH:!aNULL:!MD5',
            requestCert: true,
            rejectUnauthorized: true
        }
    },

    // TLS证书配置（服务端使用）
    tls: {
        key: './certs/server-key.pem',
        cert: './certs/server-cert.pem',
        ca: ['./certs/client-cert.pem']
    },

    // 日志配置
    logging: {
        level: process.env.LOG_LEVEL || 'debug',
        format: 'text',
        destinations: ['console']
    }
};
