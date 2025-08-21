#!/usr/bin/env node

/**
 * 启动兼容老版本客户端的服务端
 * 使用兼容性配置
 */

// 设置环境变量
process.env.NODE_ENV = 'server-legacy';

console.log('🚀 启动兼容老版本客户端的SmartVPN服务端...');
console.log('📋 使用兼容性配置...');

// 启动服务端
const SmartVPNServer = require('./src/server/index');

async function startServer() {
    try {
        const server = new SmartVPNServer();
        await server.start();
        
        console.log('✅ 服务端启动成功！');
        console.log('🌐 监听地址: 0.0.0.0:443');
        console.log('🔒 TLS已启用（兼容模式）');
        console.log('📝 日志级别: debug');
        
        // 保持进程运行
        process.stdin.resume();
        
    } catch (error) {
        console.error('❌ 服务端启动失败:', error.message);
        process.exit(1);
    }
}

// 处理退出信号
process.on('SIGINT', () => {
    console.log('\n🛑 收到退出信号，正在关闭服务端...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 收到终止信号，正在关闭服务端...');
    process.exit(0);
});

// 启动服务端
startServer();
