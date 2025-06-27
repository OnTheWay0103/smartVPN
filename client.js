const net = require('net')
const tls = require('tls')
const https = require('https')
const http = require('http')
const fs = require('fs')
const config = require('./env/config')
const whitelist = require('./whitelist')
const logger = require('./utils/logger')
const { setProxy, closeProxy } = require('./setProxy')
const path = require('path')

// 存储原始代理设置，用于恢复
let originalProxySettings = null

// 检查域名是否在白名单中
function isDomainInWhitelist(domain) {
    // 移除端口号(如果有)
    domain = domain.split(':')[0]
    
    // 检查精确匹配
    if (whitelist.domains.includes(domain)) {
        return true
    }
    
    // 检查通配符匹配
    return whitelist.domains.some(pattern => {
        if (pattern.startsWith('*.')) {
            const baseDomain = pattern.slice(2)
            return domain === baseDomain || domain.endsWith('.' + baseDomain)
        }
        return false
    })
}

// 创建TLS连接配置
function createTlsConfig() {
    try {
        const tlsConfig = {
            host: config.remote.host,
            port: config.remote.port,
            key: fs.readFileSync(path.resolve(config.tls.key)),
            cert: fs.readFileSync(path.resolve(config.tls.cert)),
            ca: [fs.readFileSync(path.resolve(config.tls.ca))],
            // 添加超时设置
            timeout: 30000,  // 30秒连接超时
            // rejectUnauthorized: true,  // 启用证书验证
            // secureProtocol: 'TLSv1_2_method',
            // ciphers: 'ALL',
            // 添加更多 TLS 选项
            // minVersion: 'TLSv1.2',
            // maxVersion: 'TLSv1.3',
            // 客户端证书验证
            // requestCert: true,
            // 添加 SNI 支持
            // servername: config.remote.host
        }
        
        logger.debug(`TLS配置创建成功: ${config.remote.host}:${config.remote.port}`)
        return tlsConfig
    } catch (error) {
        logger.error(`创建TLS配置失败: ${error.message}`)
        throw error
    }
}

// 统一的错误处理函数
function handleError(socket, error, context) {
    logger.error(`${context}: ${error.message}`)
    if (socket && !socket.destroyed) {
        socket.end()
    }
}

// 设置系统代理
async function setupSystemProxy() {
    try {
        logger.info('正在设置系统代理...')
        await setProxy('127.0.0.1', config.local.port)
        logger.info(`系统代理设置成功: 127.0.0.1:${config.local.port}`)
    } catch (error) {
        logger.error(`设置系统代理失败: ${error.message}`)
        throw error
    }
}

// 恢复系统代理设置
async function restoreSystemProxy() {
    try {
        logger.info('正在恢复系统代理设置...')
        await closeProxy()
        logger.info('系统代理设置已恢复')
    } catch (error) {
        logger.error(`恢复系统代理设置失败: ${error.message}`)
    }
}

// 处理程序退出信号
function setupExitHandlers() {
    const cleanup = async () => {
        logger.info('正在关闭客户端...')
        try {
            await restoreSystemProxy()
            process.exit(0)
        } catch (error) {
            logger.error(`关闭时发生错误: ${error.message}`)
            process.exit(1)
        }
    }

    // 监听各种退出信号
    process.on('SIGINT', cleanup)   // Ctrl+C
    process.on('SIGTERM', cleanup)  // 终止信号
    process.on('SIGQUIT', cleanup)  // 退出信号
    
    // 监听未捕获的异常
    process.on('uncaughtException', async (error) => {
        logger.error(`未捕获的异常: ${error.message}`)
        await cleanup()
    })
    
    // 监听未处理的 Promise 拒绝
    process.on('unhandledRejection', async (reason, promise) => {
        logger.error(`未处理的 Promise 拒绝: ${reason}`)
        await cleanup()
    })
}

// 创建本地代理服务器
const localServer = net.createServer((clientSocket) => {
    // logger.info("新的客户端连接")

    // 缓存客户端数据
    let clientData = ''

    // 当客户端发送数据时，处理HTTP或HTTPS请求
    clientSocket.on('data', (data) => {
        try {
            // 将数据追加到缓存中
            clientData += data.toString()

            // 检查是否接收到完整的HTTP请求头
            if (!clientData.includes('\r\n\r\n')) {
                return // 等待更多数据
            }

            // 解析HTTP请求行
            const [requestLine] = clientData.split('\r\n')
            const [method, path, httpVersion] = requestLine.split(' ')

            if (method === 'CONNECT') {
                handleHttpsRequest(clientSocket, path)
            } else {
                handleHttpRequest(clientSocket, clientData)
            }

            // 清空缓存
            clientData = ''
        } catch (err) {
            handleError(clientSocket, err, '请求解析错误')
        }
    })

    // 处理客户端断开连接
    clientSocket.on('end', () => {
        logger.debug("客户端断开连接")
    })

    // 处理错误
    clientSocket.on('error', (err) => {
        handleError(clientSocket, err, '客户端连接错误')
    })
})

/**
 * 处理HTTPS请求（CONNECT方法）
 */
function handleHttpsRequest(clientSocket, target) {
    // 从target中提取域名
    const [host, port] = target.split(':')
    
    // 检查域名是否在白名单中
    if (!isDomainInWhitelist(host)) {
        // logger.info(`域名 ${host} 不在白名单中,直接连接`)
        // 直接连接到目标服务器
        const targetSocket = net.connect(port || 443, host, () => {
            clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
            clientSocket.pipe(targetSocket)
            targetSocket.pipe(clientSocket)
        })
        
        targetSocket.on('error', (err) => {
            handleError(clientSocket, err, '目标服务器连接错误')
        })
        return
    }

    logger.info(`处理HTTPS请求: ${target}`)
    // 连接到远程代理服务器
    const remoteSocket = tls.connect(createTlsConfig(), () => {
        logger.info(`已连接到远程代理服务器,目标: ${target}`)
        logger.debug(`TLS连接状态: authorized=${remoteSocket.authorized}, encrypted=${remoteSocket.encrypted}`)
        
        if (remoteSocket.authorized) {
            logger.debug('TLS认证成功')
            logger.debug(`服务器证书: ${remoteSocket.getPeerCertificate().subject.CN || 'Unknown'}`)
        } else {
            logger.error(`TLS认证失败: ${remoteSocket.authorizationError}`)
            handleError(remoteSocket, new Error(`TLS认证失败: ${remoteSocket.authorizationError}`), 'TLS认证')
            return
        }

        // 构造JSON数据
        const jsonData = JSON.stringify({
            type: 'CONNECT',
            target: target
        })

        logger.debug(`发送请求到远程服务器: ${jsonData}`)
        remoteSocket.write(jsonData)

        // 等待远程服务器响应
        remoteSocket.once('data', (response) => {
            const responseStr = response.toString()
            logger.debug(`收到远程服务器响应: ${responseStr.length} 字节`)
            logger.debug(`响应内容: ${responseStr.substring(0, 100)}...`)

            if (responseStr.startsWith('HTTP/1.1 200')) {
                logger.info("隧道建立成功")

                // 响应客户端，表示隧道已建立
                clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n')

                // 开始双向转发数据
                clientSocket.pipe(remoteSocket)
                remoteSocket.pipe(clientSocket)
            } else {
                logger.error(`隧道建立失败，响应: ${responseStr}`)
                handleError(clientSocket, new Error(`隧道建立失败: ${responseStr}`), '隧道建立')
            }
        })
    })

    // 添加连接超时处理
    remoteSocket.setTimeout(30000, () => {
        logger.warn(`远程服务器连接超时: ${target}`)
        handleError(remoteSocket, new Error('连接超时'), '连接超时')
    })

    // 添加错误处理
    remoteSocket.on('error', (err) => {
        logger.error(`远程服务器连接错误: ${err.message}`)
        logger.error(`错误代码: ${err.code}, 错误类型: ${err.type}`)
        handleError(clientSocket, err, '远程服务器连接错误')
    })

    // 添加连接关闭处理
    remoteSocket.on('close', (hadError) => {
        if (hadError) {
            logger.warn(`远程服务器连接异常关闭: ${target}`)
        } else {
            logger.debug(`远程服务器连接正常关闭: ${target}`)
        }
    })
}

function handleHttpRequest(clientSocket, requestData) {
    // logger.info("处理HTTP请求")

    // 解析HTTP请求头
    const [requestLine, ...headers] = requestData.split('\r\n')
    const [method, path, httpVersion] = requestLine.split(' ')

    // 提取目标地址（从Host头字段中）
    const hostHeader = headers.find((header) => header.startsWith('Host:'))
    if (!hostHeader) {
        handleError(clientSocket, new Error("缺少Host头"), '请求解析')
        return
    }
    const targetAddress = hostHeader.split(' ')[1] // 提取Host值

    // logger.info(`目标地址: ${targetAddress}`)
    
    // 检查域名是否在白名单中
    if (!isDomainInWhitelist(targetAddress)) {
        // logger.info(`域名 ${targetAddress} 不在白名单中,直接连接`)
        
        // 解析请求路径
        const requestPath = path.startsWith('http') ? new URL(path).pathname : path
        
        // 创建请求选项
        const options = {
            hostname: targetAddress,
            port: 443,
            path: requestPath,
            method: method,
            headers: {}
        }
        
        // 解析并设置请求头
        headers.forEach(header => {
            if (header) {
                const [key, value] = header.split(': ')
                if (key && value) {
                    // 保留所有原始请求头
                    options.headers[key] = value
                }
            }
        })
        
        // 确保有必要的请求头
        if (!options.headers['User-Agent']) {
            options.headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        // 发送HTTPS请求
        const req = https.request(options, (res) => {
            // 发送响应状态行
            clientSocket.write(`HTTP/1.1 ${res.statusCode} ${res.statusMessage}\r\n`)
            
            // 发送响应头
            Object.entries(res.headers).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach(v => {
                        clientSocket.write(`${key}: ${v}\r\n`)
                    })
                } else {
                    clientSocket.write(`${key}: ${value}\r\n`)
                }
            })
            clientSocket.write('\r\n')
            
            // 处理响应体
            res.on('data', (chunk) => {
                clientSocket.write(chunk)
            })
            
            res.on('end', () => {
                clientSocket.end()
            })
        })
        
        // 处理请求错误
        req.on('error', (err) => {
            handleError(clientSocket, err, 'HTTPS请求错误')
        })
        
        // 发送请求体
        if (method !== 'GET' && method !== 'HEAD') {
            const body = requestData.split('\r\n\r\n')[1]
            if (body) {
                req.write(body)
            }
        }
        
        req.end()
        return
    }

    logger.info("处理代理的HTTP请求")
    logger.info(`目标地址: ${targetAddress}`)

    // 连接到远程服务器
    const remoteSocket = tls.connect(createTlsConfig(), () => {
        logger.info("已连接到远程代理服务器")
        if (remoteSocket.authorized) {
            logger.debug('TLS认证成功')
        } else {
            handleError(remoteSocket, new Error(`TLS认证失败: ${remoteSocket.authorizationError}`), 'TLS认证')
            return
        }

        // 构造JSON数据
        const jsonData = JSON.stringify({
            type: 'HTTP',
            target: targetAddress,
            payload: requestData
        })

        logger.debug(`转发请求到远程服务器: ${targetAddress}`)
        remoteSocket.write(jsonData)
    })

    // 当远程服务器返回数据时，转发给客户端
    remoteSocket.on('data', (data) => {
        logger.debug(`收到远程服务器响应: ${data.length} 字节`)
        clientSocket.write(data)
    })

    // 处理远程服务器断开连接
    remoteSocket.on('end', () => {
        logger.debug("远程服务器断开连接")
        clientSocket.end()
    })

    // 处理错误
    remoteSocket.on('error', (err) => {
        handleError(clientSocket, err, '远程服务器连接错误')
    })
}

// 启动本地代理服务器
async function startClient() {
    try {
        // 设置退出处理
        setupExitHandlers()
        
        // 设置系统代理
        await setupSystemProxy()
        
        // 启动本地代理服务器
        localServer.listen(config.local.port, () => {
            logger.info(`本地代理服务器启动成功,监听端口: ${config.local.port}`)
            logger.info('客户端已准备就绪，系统代理已自动设置')
        })
        
        // 处理服务器错误
        localServer.on('error', (err) => {
            logger.error(`本地代理服务器错误: ${err.message}`)
            process.exit(1)
        })
        
    } catch (error) {
        logger.error(`启动客户端失败: ${error.message}`)
        process.exit(1)
    }
}

// 启动客户端
startClient()