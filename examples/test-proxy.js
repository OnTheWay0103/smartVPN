const { setProxy, closeProxy } = require('./setProxy');
const logger = require('./utils/logger');

async function testProxy() {
    try {
        logger.info('开始测试代理设置功能...');
        
        // 测试设置代理
        logger.info('正在设置代理...');
        await setProxy('127.0.0.1', 8080);
        logger.info('代理设置成功！');
        
        // 等待3秒
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 测试关闭代理
        logger.info('正在关闭代理...');
        await closeProxy();
        logger.info('代理关闭成功！');
        
        logger.info('测试完成！');
        
    } catch (error) {
        logger.error(`测试失败: ${error.message}`);
    }
}

testProxy(); 