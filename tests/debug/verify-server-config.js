#!/usr/bin/env node

/**
 * 服务端配置验证脚本
 * 用于检查服务端配置是否正确
 */

console.log('🔍 开始验证SmartVPN服务端配置...\n');

try {
    const config = require('../../src/shared/config');
    
    console.log('✅ 配置管理器加载成功');
    
    // 验证服务端配置
    console.log('\n📋 服务端配置:');
    const serverConfig = config.getServerConfig();
    console.log(JSON.stringify(serverConfig, null, 2));
    
    // 检查监听配置
    if (serverConfig.listen) {
        const { host, port } = serverConfig.listen;
        
        console.log('\n🔍 服务端监听配置检查:');
        console.log(`- 监听地址: ${host}`);
        console.log(`- 监听端口: ${port}`);
        
        // 验证监听地址
        if (!host || host === '43.159.38.35') {
            console.log('❌ 监听地址无效:', host);
            console.log('   服务端应该监听本机地址（如 0.0.0.0），而不是远程服务器地址');
        } else if (host === '0.0.0.0') {
            console.log('✅ 监听地址有效（监听所有网络接口）');
        } else if (host === '127.0.0.1' || host === 'localhost') {
            console.log('✅ 监听地址有效（仅监听本地回环接口）');
        } else {
            console.log('✅ 监听地址有效');
        }
        
        // 验证端口
        if (!port || port <= 0 || port > 65535) {
            console.log('❌ 监听端口无效:', port);
        } else {
            console.log('✅ 监听端口有效');
        }
        
        // 检查端口是否被占用
        if (host && port && port > 0 && port <= 65535) {
            console.log('\n🌐 检查端口占用情况...');
            const net = require('net');
            
            const server = net.createServer();
            server.listen(port, host, () => {
                console.log(`✅ 端口 ${port} 可用，可以绑定到 ${host}`);
                server.close();
            });
            
            server.on('error', (error) => {
                if (error.code === 'EADDRINUSE') {
                    console.log(`❌ 端口 ${port} 已被占用`);
                } else if (error.code === 'EADDRNOTAVAIL') {
                    console.log(`❌ 地址 ${host} 不可用`);
                } else {
                    console.log(`❌ 端口检查失败: ${error.message}`);
                }
            });
        }
    } else {
        console.log('❌ 缺少服务端监听配置 (server.listen)');
        console.log('   请检查配置文件中的 server.listen 设置');
    }
    
    // 验证TLS配置
    console.log('\n🔒 TLS配置:');
    const tlsConfig = config.getTlsConfig();
    console.log(JSON.stringify(tlsConfig, null, 2));
    
    // 检查证书文件
    if (tlsConfig.key && tlsConfig.cert) {
        const fs = require('fs');
        const path = require('path');
        
        console.log('\n📁 服务端证书文件检查:');
        
        const certFiles = [
            { name: '服务端私钥', path: tlsConfig.key },
            { name: '服务端证书', path: tlsConfig.cert }
        ];
        
        if (tlsConfig.ca && tlsConfig.ca.length > 0) {
            tlsConfig.ca.forEach((ca, index) => {
                certFiles.push({ name: `CA证书${index + 1}`, path: ca });
            });
        }
        
        for (const cert of certFiles) {
            const fullPath = path.resolve(cert.path);
            if (fs.existsSync(fullPath)) {
                console.log(`✅ ${cert.name}: ${fullPath}`);
            } else {
                console.log(`❌ ${cert.name}: ${fullPath} (文件不存在)`);
            }
        }
    }
    
    console.log('\n🎉 服务端配置验证完成！');
    
} catch (error) {
    console.error('❌ 服务端配置验证失败:', error.message);
    console.error('错误堆栈:', error.stack);
    process.exit(1);
}
