const { exec } = require('child_process')
const logger = require('./utils/logger')

// 清理可能存在的旧进程
logger.info('清理可能存在的旧进程...')
exec('pkill -f "node client.js"', (error) => {
    if (error) {
        logger.debug('没有找到需要清理的旧进程')
    } else {
        logger.info('已清理旧进程')
    }
    
    // 等待1秒确保端口释放
    setTimeout(() => {
        // 启动代理服务器
        logger.info('正在启动代理服务器...')
        const proxyServer = exec('node client.js')

        // 处理代理服务器输出
        proxyServer.stdout.on('data', (data) => {
            logger.info(`代理服务器: ${data}`)
        })

        proxyServer.stderr.on('data', (data) => {
            logger.error(`代理服务器错误: ${data}`)
        })

        // 等待代理服务器启动
        setTimeout(() => {
            // 测试访问百度
            logger.info('开始测试访问百度...')
            exec('curl -v -x http://localhost:8080 https://www.baidu.com', (error, stdout, stderr) => {
                if (error) {
                    logger.error(`测试失败: ${error.message}`)
                    if (stderr) {
                        logger.error(`错误详情: ${stderr}`)
                    }
                    proxyServer.kill()
                    return
                }
                if (stderr) {
                    logger.error(`测试错误: ${stderr}`)
                }
                logger.info('测试成功!')
                logger.info('响应内容:')
                logger.info(stdout)
                
                // 关闭代理服务器
                proxyServer.kill()
            })
        }, 5000) // 等待5秒确保代理服务器启动
    }, 1000)
})

// 处理进程退出
process.on('SIGINT', () => {
    logger.info('正在关闭代理服务器...')
    exec('pkill -f "node client.js"')
    process.exit()
}) 