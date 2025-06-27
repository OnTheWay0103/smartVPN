/**
 * SmartVPN 客户端配置文件
 * 
 * 使用说明：
 * 1. 复制此文件为 config.js
 * 2. 修改配置项以匹配您的环境
 * 3. 确保证书文件路径正确
 */

module.exports = {
    // 远程服务器配置
    remote: {
        host: 'your-server-ip',  // 替换为您的服务器IP地址
        port: 443                // 服务器端口，建议使用443或888
    },
    
    // 本地代理配置
    local: {
        port: 8080               // 本地代理端口，确保此端口未被占用
    },
    
    // TLS证书配置
    tls: {
        // 客户端私钥文件路径
        key: './env/client-key.pem',
        
        // 客户端证书文件路径
        cert: './env/client-cert.pem',
        
        // 服务器证书文件路径（用于验证服务器身份）
        ca: './env/server-cert.pem'
    },
    
    // 连接配置
    connection: {
        timeout: 10000,          // 连接超时时间（毫秒）
        keepAlive: true,         // 是否保持连接
        keepAliveInterval: 30000 // 保活间隔（毫秒）
    },
    
    // 日志配置
    logging: {
        level: 'info',           // 日志级别: debug, info, warn, error
        file: './logs/client.log', // 日志文件路径（可选）
        console: true            // 是否输出到控制台
    }
} 