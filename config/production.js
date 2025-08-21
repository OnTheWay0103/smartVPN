module.exports = {
    client: {
        local: {
            port: process.env.CLIENT_PORT || 8080
        },
        whitelist: {
            enabled: process.env.WHITELIST_ENABLED === 'true',
            domains: process.env.WHITELIST_DOMAINS ? 
                process.env.WHITELIST_DOMAINS.split(',') : []
        }
    },
    
    server: {
        remote: {
            host: process.env.SERVER_HOST || '43.159.38.35',
            port: process.env.SERVER_PORT || 443
        },
        monitoring: {
            connectionCleanupInterval: 30000,
            statsLogInterval: 300000,  // 生产环境减少日志频率
            memoryCheckInterval: 600000,
            uptimeLogInterval: 1800000
        }
    },

    tls: {
        key: process.env.TLS_KEY_PATH || './certs/server-key.pem',
        cert: process.env.TLS_CERT_PATH || './certs/server-cert.pem',
        ca: process.env.TLS_CA_PATH ? 
            process.env.TLS_CA_PATH.split(',') : []
    },

    logging: {
        level: process.env.LOG_LEVEL || 'INFO',
        format: 'json',
        destinations: ['console', 'file']
    }
};