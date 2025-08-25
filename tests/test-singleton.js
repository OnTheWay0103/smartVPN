#!/usr/bin/env node

console.log('=== 单例模式测试 ===');
console.log('1. 脚本开始时的 NODE_ENV:', process.env.NODE_ENV);

// 模拟配置管理器的单例模式
class TestConfigManager {
    constructor() {
        console.log('2. ConfigManager 构造函数被调用');
        this.config = this.loadConfig();
        console.log('3. 配置加载完成，env:', this.config.env);
    }

    loadConfig() {
        const env = process.env.NODE_ENV || 'default';
        console.log('4. loadConfig() 中的 env:', env);
        console.log('5. process.env.NODE_ENV:', process.env.NODE_ENV);
        return { env };
    }
}

// 模拟立即创建单例实例
console.log('6. 开始创建单例实例');
const configManager = new TestConfigManager();
console.log('7. 单例实例创建完成');

// 模拟后续的环境变量设置
console.log('8. 模拟后续设置环境变量');
process.env.NODE_ENV = 'client';
console.log('9. 设置后的 NODE_ENV:', process.env.NODE_ENV);

// 但是单例实例的配置已经固定了
console.log('10. 单例实例的配置仍然是:', configManager.config.env);
console.log('11. 这就是问题所在！'); 