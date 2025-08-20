const fs = require('fs');
const path = require('path');

class ConfigManager {
    constructor() {
        this.config = this.loadConfig();
    }

    loadConfig() {
        const env = process.env.NODE_ENV || 'development';
        
        // 加载默认配置
        const configDir = path.join(__dirname, '..', '..', '..', 'config');
        const defaultConfigPath = path.join(configDir, 'default.js');
        
        let config = {};
        if (fs.existsSync(defaultConfigPath)) {
            config = require(defaultConfigPath);
        }
        
        // 加载环境特定配置
        const envConfigPath = path.join(configDir, `${env}.js`);
        if (fs.existsSync(envConfigPath)) {
            const envConfig = require(envConfigPath);
            config = this.mergeDeep(config, envConfig);
        }
        
        return config;
    }

    mergeDeep(target, source) {
        const output = Object.assign({}, target);
        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] });
                    } else {
                        output[key] = this.mergeDeep(target[key], source[key]);
                    }
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        return output;
    }

    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    get(path) {
        if (!path) return this.config;
        return path.split('.').reduce((obj, key) => obj && obj[key], this.config);
    }

    getClientConfig() {
        const config = this.config.client || {};
        // 允许环境变量覆盖端口
        if (process.env.CLIENT_PORT) {
            config.local = config.local || {};
            config.local.port = parseInt(process.env.CLIENT_PORT, 10);
        }
        // 允许环境变量覆盖白名单设置
        if (process.env.WHITELIST_ENABLED) {
            config.whitelist = config.whitelist || {};
            config.whitelist.enabled = process.env.WHITELIST_ENABLED === 'true';
        }
        return config;
    }

    getServerConfig() {
        return this.config.server || {};
    }

    getTlsConfig() {
        return this.config.tls || {};
    }

    getLoggingConfig() {
        return this.config.logging || {};
    }
}

// 创建单例实例并导出
const configManager = new ConfigManager();
module.exports = configManager;