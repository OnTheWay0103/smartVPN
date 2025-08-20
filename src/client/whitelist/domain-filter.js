const config = require('../../shared/config');
const logger = require('../../shared/utils/logger');

class DomainFilter {
    constructor() {
        this.whitelist = [];
        this.loadWhitelist();
    }

    loadWhitelist() {
        const clientConfig = config.getClientConfig();
        if (clientConfig.whitelist.enabled) {
            // 尝试加载独立的白名单配置文件
            try {
                const whitelistConfig = require('../../../config/whitelist');
                this.whitelist = whitelistConfig.domains || [];
                logger.info(`从独立配置文件加载白名单: ${this.whitelist.length} 个域名`);
            } catch (error) {
                // 如果独立配置文件不存在，使用默认配置
                this.whitelist = clientConfig.whitelist.domains || [];
                logger.debug(`使用默认白名单配置: ${this.whitelist.length} 个域名`);
            }
        } else {
            logger.debug('白名单模式未启用');
        }
    }

    isDomainInWhitelist(domain) {
        // 移除端口号(如果有)
        const cleanDomain = domain.split(':')[0];

        // 检查精确匹配
        if (this.whitelist.includes(cleanDomain)) {
            logger.debug(`精确匹配: ${cleanDomain}`);
            return true;
        }

        // 检查通配符匹配
        const matched = this.whitelist.some(pattern => {
            if (pattern.startsWith('*.')) {
                const baseDomain = pattern.slice(2);
                return cleanDomain === baseDomain || cleanDomain.endsWith('.' + baseDomain);
            }
            return cleanDomain === pattern;
        });

        if (matched) {
            logger.debug(`通配符匹配: ${cleanDomain}`);
        } else {
            logger.debug(`域名不在白名单: ${cleanDomain}`);
        }

        return matched;
    }

    shouldUseProxy(domain) {
        const clientConfig = config.getClientConfig();
        
        if (!clientConfig.whitelist.enabled) {
            // 白名单模式未启用，所有流量都通过代理
            logger.debug('全局代理模式：所有域名都通过代理');
            return true;
        }
        
        // 白名单模式启用，只有白名单中的域名才通过代理
        const inWhitelist = this.isDomainInWhitelist(domain);
        if (inWhitelist) {
            logger.debug(`白名单模式：域名 ${domain} 通过代理`);
            return true;
        } else {
            logger.debug(`白名单模式：域名 ${domain} 直接连接`);
            return false;
        }
    }

    addDomain(domain) {
        if (!this.whitelist.includes(domain)) {
            this.whitelist.push(domain);
            logger.info(`添加到白名单: ${domain}`);
        }
    }

    removeDomain(domain) {
        const index = this.whitelist.indexOf(domain);
        if (index > -1) {
            this.whitelist.splice(index, 1);
            logger.info(`从白名单移除: ${domain}`);
        }
    }

    getWhitelist() {
        return [...this.whitelist];
    }

    reload() {
        this.loadWhitelist();
        logger.info('白名单已重新加载');
    }
}

module.exports = DomainFilter;