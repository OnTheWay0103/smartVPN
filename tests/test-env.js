#!/usr/bin/env node

console.log('=== 环境变量测试 ===');
console.log('1. 脚本开始时的 NODE_ENV:', process.env.NODE_ENV);

// 模拟配置管理器的行为
class TestConfigManager {
    constructor() {
        console.log('2. ConfigManager 构造函数被调用');
        this.config = this.loadConfig();
    }

    loadConfig() {
        const env = process.env.NODE_ENV || 'default';
        console.log('3. loadConfig() 中的 env:', env);
        console.log('4. process.env.NODE_ENV:', process.env.NODE_ENV);
        return { env };
    }
}

console.log('5. 创建 ConfigManager 实例前');
const configManager = new TestConfigManager();
console.log('6. ConfigManager 实例创建完成');

console.log('7. 最终配置:', configManager.config); 