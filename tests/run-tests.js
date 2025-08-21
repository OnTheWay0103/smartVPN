#!/usr/bin/env node

/**
 * 测试运行脚本
 * 统一运行所有测试用例
 */

const { exec } = require('child_process');
const path = require('path');

console.log('🚀 开始运行SmartVPN测试套件...\n');

const tests = [
    {
        name: '配置测试',
        path: './debug/test-config.js',
        description: '测试配置管理器功能'
    },
    {
        name: 'EventEmitter测试',
        path: './debug/test-event-cleanup.js',
        description: '测试监听器清理功能'
    },
    {
        name: '连接测试',
        path: './integration/test-connection.js',
        description: '测试网络连接功能'
    }
];

async function runTest(test) {
    return new Promise((resolve) => {
        console.log(`\n🧪 运行测试: ${test.name}`);
        console.log(`📝 描述: ${test.description}`);
        console.log(`📁 路径: ${test.path}`);
        console.log('─'.repeat(50));
        
        const testProcess = exec(`node ${test.path}`, {
            cwd: __dirname,
            timeout: 30000
        }, (error, stdout, stderr) => {
            if (error) {
                console.log(`❌ ${test.name} 失败: ${error.message}`);
                if (stderr) {
                    console.log(`错误输出: ${stderr}`);
                }
                resolve({ name: test.name, success: false, error: error.message });
            } else {
                console.log(`✅ ${test.name} 成功`);
                if (stdout) {
                    console.log(`输出: ${stdout}`);
                }
                resolve({ name: test.name, success: true });
            }
        });
        
        testProcess.stdout?.on('data', (data) => {
            process.stdout.write(data);
        });
        
        testProcess.stderr?.on('data', (data) => {
            process.stderr.write(data);
        });
    });
}

async function runAllTests() {
    const results = [];
    
    for (const test of tests) {
        const result = await runTest(test);
        results.push(result);
    }
    
    // 输出测试结果摘要
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试结果摘要');
    console.log('='.repeat(60));
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${result.name}: ${result.success ? '通过' : '失败'}`);
        if (!result.success) {
            console.log(`   错误: ${result.error}`);
        }
    });
    
    console.log('\n' + '─'.repeat(60));
    console.log(`总计: ${successCount}/${totalCount} 个测试通过`);
    
    if (successCount === totalCount) {
        console.log('🎉 所有测试都通过了！');
        process.exit(0);
    } else {
        console.log('⚠️  部分测试失败，请检查相关功能');
        process.exit(1);
    }
}

// 运行所有测试
runAllTests().catch(error => {
    console.error('❌ 测试运行过程中发生错误:', error.message);
    process.exit(1);
});
