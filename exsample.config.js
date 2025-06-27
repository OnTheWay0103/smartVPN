module.exports = {
    // 远程服务器配置，IP和端口，默认443
    remote: {
        host: '8.8.8.8',
        port: 443
    },
    
    // 本地代理配置, 按实际情况更新本地端口，默认8080
    local: {
        port: 8080
    },
    
    // TLS证书配置
    tls: {
        key: './env/client-key.pem',
        cert: './env/client-cert.pem',
        ca: './env/server-cert.pem'
    }
} 