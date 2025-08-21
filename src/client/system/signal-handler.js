const logger = require('../../shared/utils/logger');
const ProxyManager = require('./proxy-manager');
const EventCleanup = require('./event-cleanup');

class SignalHandler {
    constructor() {
        // 防止重复初始化
        if (SignalHandler.instance) {
            return SignalHandler.instance;
        }
        
        this.cleanupFunctions = [];
        this.proxyManager = new ProxyManager();
        this.eventCleanup = new EventCleanup();
        this.isInitialized = false;
        this.setupSignalHandlers();
        
        SignalHandler.instance = this;
    }

    addCleanupFunction(fn) {
        this.cleanupFunctions.push(fn);
    }

    setupSignalHandlers() {
        // 防止重复设置监听器
        if (this.isInitialized) {
            return;
        }

        const cleanup = async () => {
            logger.info('收到关闭信号，开始清理...');
            
            try {
                // 执行所有注册的清理函数
                for (const fn of this.cleanupFunctions) {
                    await fn();
                }

                // 恢复系统代理设置
                await this.proxyManager.closeProxy();
                logger.info('系统代理设置已恢复');

                logger.info('客户端已安全关闭');
                process.exit(0);
            } catch (error) {
                logger.error(`关闭时发生错误: ${error.message}`);
                process.exit(1);
            }
        };

        // 移除可能存在的旧监听器
        process.removeAllListeners('SIGINT');
        process.removeAllListeners('SIGTERM');
        process.removeAllListeners('SIGQUIT');
        process.removeAllListeners('uncaughtException');
        process.removeAllListeners('unhandledRejection');
        process.removeAllListeners('warning');

        // 监听各种退出信号
        process.on('SIGINT', cleanup);   // Ctrl+C
        process.on('SIGTERM', cleanup);  // 终止信号
        process.on('SIGQUIT', cleanup);  // 退出信号
        
        // 监听未捕获的异常
        process.on('uncaughtException', async (error) => {
            logger.error(`未捕获的异常: ${error.message}`);
            logger.error(error.stack);
            await cleanup();
        });
        
        // 监听未处理的Promise拒绝
        process.on('unhandledRejection', async (reason, promise) => {
            logger.error(`未处理的Promise拒绝: ${reason}`);
            logger.error(`Promise: ${promise}`);
            await cleanup();
        });

        // 监听内存警告
        process.on('warning', (warning) => {
            logger.warn(`进程警告: ${warning.name} - ${warning.message}`);
        });

        this.isInitialized = true;
    }

    // 清理所有监听器
    cleanup() {
        // 使用EventCleanup工具清理
        this.eventCleanup.cleanupAll();
        
        // 清理process监听器
        process.removeAllListeners('SIGINT');
        process.removeAllListeners('SIGTERM');
        process.removeAllListeners('SIGQUIT');
        process.removeAllListeners('uncaughtException');
        process.removeAllListeners('unhandledRejection');
        process.removeAllListeners('warning');
        
        this.cleanupFunctions = [];
        this.isInitialized = false;
    }

    async gracefulShutdown() {
        logger.info('开始优雅关闭...');
        
        // 给清理函数一些时间完成
        const cleanupTimeout = setTimeout(() => {
            logger.error('优雅关闭超时，强制退出');
            process.exit(1);
        }, 10000);

        try {
            for (const fn of this.cleanupFunctions) {
                await fn();
            }
            
            await this.proxyManager.closeProxy();
            clearTimeout(cleanupTimeout);
            
            logger.info('优雅关闭完成');
            process.exit(0);
        } catch (error) {
            clearTimeout(cleanupTimeout);
            logger.error(`优雅关闭失败: ${error.message}`);
            process.exit(1);
        }
    }
}

module.exports = SignalHandler;