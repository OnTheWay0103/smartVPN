/**
 * 老版本客户端兼容配置
 * 用于确保服务端能正确处理老版本客户端的请求
 */

module.exports = {
    // 服务端配置
    server: {
        remote: {
            host: '0.0.0.0',  // 监听所有网络接口
            port: 443
        },
        monitoring: {
            connectionCleanupInterval: 30000,
            statsLogInterval: 60000,
            memoryCheckInterval: 600000,
            uptimeLogInterval: 1200000
        },
        tls: {
            minVersion: 'TLSv1.0',  // 支持老版本TLS
            ciphers: 'DEFAULT',     // 使用默认密码套件
            requestCert: false,     // 不要求客户端证书（兼容老版本）
            rejectUnauthorized: false // 不验证客户端证书（兼容老版本）
        }
    },

    // TLS证书配置
    tls: {
        key: './certs/server-key.pem',
        cert: './certs/server-cert.pem',
        ca: ['./certs/client-cert.pem']
    },

    // 日志配置
    logging: {
        level: 'debug',  // 开启详细日志
        format: 'text',
        destinations: ['console']
    }
}
