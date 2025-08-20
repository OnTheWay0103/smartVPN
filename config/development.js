module.exports = {
    client: {
        local: {
            port: 8081  // 开发环境使用不同端口
        },
        whitelist: {
            enabled: false,
            domains: [
                'localhost',
                '127.0.0.1',
                '*.local',
                'test.example.com'
            ]
        }
    },
    
    server: {
        remote: {
            host: 'localhost',  // 开发环境使用本地
            port: 8443
        },
        monitoring: {
            connectionCleanupInterval: 10000,  // 更快的清理间隔
            statsLogInterval: 30000,
            memoryCheckInterval: 120000,
            uptimeLogInterval: 300000
        }
    },

    logging: {
        level: 'DEBUG',
        format: 'pretty',
        destinations: ['console']
    }
};