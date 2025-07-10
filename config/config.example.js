/**
 * SmartVPN 配置文件模板
 * 
 * 使用说明：
 * 1. 复制此文件为 config.js
 * 2. 修改配置项以匹配您的环境
 * 3. 确保证书文件路径正确
 * 
 * 注意：
 * - 服务端和客户端使用相同的配置文件
 * - 服务端使用 remote.port 作为监听端口
 * - 客户端使用 remote.host 和 remote.port 连接服务端
 */

module.exports = {
    // 远程服务器配置
    remote: {
        host: 'your-server-ip',  // 替换为您的服务器IP地址
        port: 443                // 服务器端口，服务端监听此端口，客户端连接此端口
    },
    
    // 本地代理配置（仅客户端使用）
    local: {
        port: 8080               // 本地代理端口，确保此端口未被占用
    },
    
    // TLS证书配置
    tls: {
        // 客户端私钥文件路径（仅客户端使用）
        key: './certs/client-key.pem',
        
        // 客户端证书文件路径（仅客户端使用）
        cert: './certs/client-cert.pem',
        
        // 服务器证书文件路径（客户端用于验证服务器身份）
        ca: './certs/server-cert.pem'
    },
    
    // 连接配置
    connection: {
        timeout: 10000,          // 连接超时时间（毫秒）
        keepAlive: true,         // 是否保持连接
        keepAliveInterval: 30000, // 保活间隔（毫秒）
        maxRetries: 3,           // 最大重试次数
        retryDelay: 5000         // 重试延迟（毫秒）
    },
    
    // 日志配置
    logging: {
        level: 'info',           // 日志级别: debug, info, warn, error
        file: './logs/server.log', // 日志文件路径（可选）
        console: true            // 是否输出到控制台
    }
} 