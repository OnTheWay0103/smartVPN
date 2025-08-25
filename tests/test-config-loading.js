#!/usr/bin/env node

console.log('=== 配置加载测试 ===');
console.log('1. 脚本开始时的 NODE_ENV:', process.env.NODE_ENV);

// 模拟配置管理器的加载过程
const path = require('path');
const fs = require('fs');

function loadConfig() {
    const env = process.env.NODE_ENV || 'default';
    console.log('2. loadConfig() 中的 env:', env);
    console.log('3. process.env.NODE_ENV:', process.env.NODE_ENV);
    
    // 加载默认配置
    const configDir = path.join(__dirname, 'config');
    const defaultConfigPath = path.join(configDir, 'default.js');
    
    let config = {};
    if (fs.existsSync(defaultConfigPath)) {
        console.log('4. 找到 default.js 文件');
        config = require(defaultConfigPath);
    } else {
        console.log('4. 未找到 default.js 文件');
    }
    
    // 加载环境特定配置
    const envConfigPath = path.join(configDir, `${env}.js`);
    if (fs.existsSync(envConfigPath)) {
        console.log('5. 找到环境配置文件:', envConfigPath);
        const envConfig = require(envConfigPath);
        console.log('6. 环境配置内容:', Object.keys(envConfig));
    } else {
        console.log('5. 未找到环境配置文件:', envConfigPath);
    }
    
    return config;
}

console.log('7. 开始加载配置');
const config = loadConfig();
console.log('8. 配置加载完成'); 