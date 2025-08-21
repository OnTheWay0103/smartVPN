module.exports = {
    // 客户端配置
    client: {
        local: {
            port: 8080
        },
        whitelist: {
            enabled: false,
            domains: [
                'example.com',
                '*.example.com',
                'test.com'
            ]
        },
        connection: {
            timeout: 30000,
            keepAlive: true,
            keepAliveInterval: 30000,
            maxRetries: 3,
            retryDelay: 5000
        }
    },

    // 服务端配置
    server: {
        remote: {
            host: 'localhost',  // 默认本地测试，生产环境需修改为实际服务器IP
            port: 443
        },
        monitoring: {
            connectionCleanupInterval: 30000,
            statsLogInterval: 60000,
            memoryCheckInterval: 600000,
            uptimeLogInterval: 1200000
        },
        tls: {
            minVersion: 'TLSv1.2',
            ciphers: 'HIGH:!aNULL:!MD5',
            requestCert: true,
            rejectUnauthorized: true
        }
    },

    // TLS证书配置
    tls: {
        key: './certs/client-key.pem',
        cert: './certs/client-cert.pem',
        ca: ['./certs/server-cert.pem']
    },

    // 日志配置
    logging: {
        level: process.env.LOG_LEVEL || 'debug',
        format: 'text',
        destinations: ['console']
    }
}