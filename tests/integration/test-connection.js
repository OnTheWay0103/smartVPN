#!/usr/bin/env node

/**
 * 网络连接测试脚本
 * 用于测试与远程服务器的连接
 */

const net = require('net');
const tls = require('tls');

console.log('🌐 开始测试网络连接功能...\n');

// 测试目标
const testTargets = [
    { host: '43.159.38.35', port: 443, description: '远程服务器HTTPS端口' },
    { host: '43.159.38.35', port: 80, description: '远程服务器HTTP端口' },
    { host: '8.8.8.8', port: 53, description: 'Google DNS' },
    { host: '1.1.1.1', port: 53, description: 'Cloudflare DNS' }
];

// 测试1: 普通TCP连接
async function testTcpConnections() {
    console.log('📡 测试1: TCP连接测试');
    
    for (const target of testTargets) {
        try {
            await new Promise((resolve, reject) => {
                const socket = net.connect({
                    host: target.host,
                    port: target.port,
                    timeout: 10000
                }, () => {
                    console.log(`✅ ${target.description}: ${target.host}:${target.port} - 连接成功`);
                    socket.destroy();
                    resolve();
                });

                socket.on('error', (error) => {
                    console.log(`❌ ${target.description}: ${target.host}:${target.port} - 连接失败: ${error.message}`);
                    resolve();
                });

                socket.on('timeout', () => {
                    console.log(`⏰ ${target.description}: ${target.host}:${target.port} - 连接超时`);
                    socket.destroy();
                    resolve();
                });
            });
        } catch (error) {
            console.log(`❌ ${target.description}: ${target.host}:${target.port} - 测试异常: ${error.message}`);
        }
    }
}

// 测试2: TLS连接
async function testTlsConnections() {
    console.log('\n🔒 测试2: TLS连接测试');
    
    const tlsTargets = testTargets.filter(t => t.port === 443);
    
    for (const target of tlsTargets) {
        try {
            await new Promise((resolve, reject) => {
                const socket = tls.connect({
                    host: target.host,
                    port: target.port,
                    timeout: 10000,
                    rejectUnauthorized: false
                }, () => {
                    console.log(`✅ ${target.description}: ${target.host}:${target.port} - TLS连接成功`);
                    console.log(`   - 协议版本: ${socket.getProtocol()}`);
                    console.log(`   - 密码套件: ${socket.getCipher().name}`);
                    socket.destroy();
                    resolve();
                });

                socket.on('error', (error) => {
                    console.log(`❌ ${target.description}: ${target.host}:${target.port} - TLS连接失败: ${error.message}`);
                    resolve();
                });

                socket.on('timeout', () => {
                    console.log(`⏰ ${target.description}: ${target.host}:${target.port} - TLS连接超时`);
                    socket.destroy();
                    resolve();
                });
            });
        } catch (error) {
            console.log(`❌ ${target.description}: ${target.host}:${target.port} - TLS测试异常: ${error.message}`);
        }
    }
}

// 测试3: 网络连通性
async function testNetworkConnectivity() {
    console.log('\n📶 测试3: 网络连通性测试');
    
    const { exec } = require('child_process');
    
    const pingTargets = ['43.159.38.35', '8.8.8.8', '1.1.1.1'];
    
    for (const target of pingTargets) {
        try {
            await new Promise((resolve) => {
                exec(`ping -c 3 ${target}`, (error, stdout, stderr) => {
                    if (error) {
                        console.log(`❌ Ping ${target} 失败: ${error.message}`);
                    } else {
                        console.log(`✅ Ping ${target} 成功`);
                        const lines = stdout.split('\n');
                        const timeLine = lines.find(line => line.includes('time='));
                        if (timeLine) {
                            const timeMatch = timeLine.match(/time=(\d+\.?\d*)/);
                            if (timeMatch) {
                                console.log(`   - 响应时间: ${timeMatch[1]}ms`);
                            }
                        }
                    }
                    resolve();
                });
            });
        } catch (error) {
            console.log(`❌ Ping ${target} 异常: ${error.message}`);
        }
    }
}

// 主测试函数
async function runAllTests() {
    try {
        await testTcpConnections();
        await testTlsConnections();
        await testNetworkConnectivity();
        
        console.log('\n🎯 所有连接测试完成！');
        console.log('\n💡 建议:');
        console.log('1. 如果TCP连接失败，检查网络配置');
        console.log('2. 如果TLS连接失败，检查服务器TLS配置');
        console.log('3. 如果Ping失败，检查网络连通性');
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        process.exit(1);
    }
}

// 运行测试
runAllTests();
