/**
 * 客户端专用配置文件
 * 确保客户端连接到正确的远程服务器
 */

module.exports = {
    // 客户端配置
    client: {
        local: {
            port: process.env.CLIENT_PORT || 8080
        },
        whitelist: {
            enabled: process.env.WHITELIST_ENABLED === 'true',
            domains: process.env.WHITELIST_DOMAINS ? 
                process.env.WHITELIST_DOMAINS.split(',') : []
        },
        connection: {
            timeout: 30000,
            keepAlive: true,
            keepAliveInterval: 30000,
            maxRetries: 3,
            retryDelay: 5000
        }
    },

    // 远程服务器配置 - 客户端专用
    server: {
        remote: {
            host: process.env.SERVER_HOST || '43.159.38.35',  // 远程服务器IP
            port: process.env.SERVER_PORT || 443               // 远程服务器端口
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
};
