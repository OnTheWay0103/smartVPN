const path = require('path');
const config = require(path.join(__dirname, '..', 'shared', 'config'));
const logger = require(path.join(__dirname, '..', 'shared', 'utils', 'logger'));
const LocalProxyServer = require('./proxy/local-server');
const SignalHandler = require('./system/signal-handler');
const ProxyManager = require('./system/proxy-manager');

class SmartVPNClient {
    constructor() {
        this.localServer = new LocalProxyServer();
        this.signalHandler = new SignalHandler();
        this.proxyManager = new ProxyManager();
        this.isRunning = false;
    }

    async start() {
        try {
            logger.info('启动SmartVPN客户端...');
            
            // 显示启动信息
            const clientConfig = config.getClientConfig();
            const whitelistEnabled = clientConfig.whitelist.enabled;
            
            if (whitelistEnabled) {
                logger.info('启动模式: 白名单模式 (仅代理白名单中的域名)');
                logger.info(`白名单域名数量: ${clientConfig.whitelist.domains.length}`);
            } else {
                logger.info('启动模式: 全局代理模式 (代理所有流量)');
            }

            // 注册清理函数
            this.signalHandler.addCleanupFunction(async () => {
                await this.stop();
            });

            // 设置系统代理
            await this.setupSystemProxy();

            // 启动本地代理服务器
            await this.localServer.start();

            this.isRunning = true;
            logger.info('客户端已准备就绪，系统代理已自动设置');
            logger.info(`本地代理地址: 127.0.0.1:${clientConfig.local.port}`);

        } catch (error) {
            logger.error(`启动客户端失败: ${error.message}`);
            throw error;
        }
    }

    async setupSystemProxy() {
        try {
            logger.info('正在设置系统代理...');
            const clientConfig = config.getClientConfig();
            await this.proxyManager.setProxy('127.0.0.1', clientConfig.local.port);
            logger.info(`系统代理设置成功: 127.0.0.1:${clientConfig.local.port}`);
        } catch (error) {
            logger.error(`设置系统代理失败: ${error.message}`);
            throw error;
        }
    }

    async stop() {
        try {
            if (!this.isRunning) return;

            logger.info('正在停止客户端...');
            
            // 停止本地服务器
            await this.localServer.stop();
            
            // 恢复系统代理
            await this.proxyManager.closeProxy();
            
            this.isRunning = false;
            logger.info('客户端已停止');
        } catch (error) {
            logger.error(`停止客户端时发生错误: ${error.message}`);
            throw error;
        }
    }

    async restart() {
        logger.info('重启客户端...');
        await this.stop();
        await this.start();
    }

    getStatus() {
        return {
            running: this.isRunning,
            localPort: config.getClientConfig().local.port,
            whitelistEnabled: config.getClientConfig().whitelist.enabled,
            activeConnections: this.localServer.getActiveConnections(),
            uptime: process.uptime()
        };
    }
}

// 命令行参数解析
function parseArgs() {
    const args = process.argv.slice(2);
    return {
        whitelist: args.includes('--white') || args.includes('--whitelist'),
        port: args.find(arg => arg.startsWith('--port='))?.split('=')[1],
        config: args.find(arg => arg.startsWith('--config='))?.split('=')[1]
    };
}

// 主程序
async function main() {
    const args = parseArgs();
    
    // 设置环境变量
    if (args.config) {
        process.env.NODE_ENV = args.config;
    }
    
    if (args.port) {
        process.env.CLIENT_PORT = args.port;
    }
    
    if (args.whitelist) {
        process.env.WHITELIST_ENABLED = 'true';
    } else {
        process.env.WHITELIST_ENABLED = 'false';
    }

    const client = new SmartVPNClient();
    
    try {
        await client.start();
        
        // 保持进程运行
        process.stdin.resume();
        
    } catch (error) {
        logger.error(`客户端启动失败: ${error.message}`);
        process.exit(1);
    }
}

// 如果是直接运行，则启动主程序
if (require.main === module) {
    main().catch(error => {
        logger.error(`未处理的错误: ${error.message}`);
        process.exit(1);
    });
}

module.exports = SmartVPNClient;