#!/usr/bin/env node

/**
 * 配置验证脚本
 * 用于检查客户端配置是否正确
 */

console.log('🔍 开始验证SmartVPN配置...\n');

try {
    const config = require('../../src/shared/config');
    
    console.log('✅ 配置管理器加载成功');
    
    // 验证服务端配置
    console.log('\n📋 服务端配置:');
    const serverConfig = config.getServerConfig();
    console.log(JSON.stringify(serverConfig, null, 2));
    
    // 检查远程服务器配置
    if (serverConfig.remote) {
        const { host, port } = serverConfig.remote;
        
        console.log('\n🔍 远程服务器配置检查:');
        console.log(`- 主机地址: ${host}`);
        console.log(`- 端口: ${port}`);
        
        // 验证主机地址
        if (!host || host === '0.0.0.0' || host === 'localhost') {
            console.log('❌ 主机地址无效:', host);
            console.log('   请检查配置文件中的 server.remote.host 设置');
        } else {
            console.log('✅ 主机地址有效');
        }
        
        // 验证端口
        if (!port || port <= 0 || port > 65535) {
            console.log('❌ 端口无效:', port);
            console.log('   请检查配置文件中的 server.remote.port 设置');
        } else {
            console.log('✅ 端口有效');
        }
        
        // 检查网络连通性
        if (host && port && host !== '0.0.0.0' && host !== 'localhost') {
            console.log('\n🌐 测试网络连通性...');
            const net = require('net');
            
            const socket = net.connect({
                host: host,
                port: port,
                timeout: 10000
            }, () => {
                console.log(`✅ TCP连接到 ${host}:${port} 成功`);
                socket.destroy();
            });
            
            socket.on('error', (error) => {
                console.log(`❌ TCP连接到 ${host}:${port} 失败: ${error.message}`);
            });
            
            socket.on('timeout', () => {
                console.log(`⏰ TCP连接到 ${host}:${port} 超时`);
                socket.destroy();
            });
        }
    } else {
        console.log('❌ 缺少远程服务器配置 (server.remote)');
    }
    
    // 验证TLS配置
    console.log('\n🔒 TLS配置:');
    const tlsConfig = config.getTlsConfig();
    console.log(JSON.stringify(tlsConfig, null, 2));
    
    // 检查证书文件
    if (tlsConfig.key && tlsConfig.cert && tlsConfig.ca) {
        const fs = require('fs');
        const path = require('path');
        
        console.log('\n📁 证书文件检查:');
        
        const certFiles = [
            { name: '客户端私钥', path: tlsConfig.key },
            { name: '客户端证书', path: tlsConfig.cert },
            ...tlsConfig.ca.map((ca, index) => ({ name: `CA证书${index + 1}`, path: ca }))
        ];
        
        for (const cert of certFiles) {
            const fullPath = path.resolve(cert.path);
            if (fs.existsSync(fullPath)) {
                console.log(`✅ ${cert.name}: ${fullPath}`);
            } else {
                console.log(`❌ ${cert.name}: ${fullPath} (文件不存在)`);
            }
        }
    }
    
    console.log('\n🎉 配置验证完成！');
    
} catch (error) {
    console.error('❌ 配置验证失败:', error.message);
    console.error('错误堆栈:', error.stack);
    process.exit(1);
}
