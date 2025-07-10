const net = require('net')
const tls = require('tls')
const fs = require('fs')
const path = require('path')
const logger = require('../lib/utils/logger')

// 加载配置文件
let config
try {
  config = require('../config/config')
} catch (error) {
  logger.error('无法加载配置文件: ' + error.message)
  logger.error('请确保 config/config.js 文件存在且格式正确')
  process.exit(1)
}

// 从配置文件获取端口，如果没有则使用默认值
const SERVER_PORT = config.remote?.port || 443

logger.info(`使用端口: ${SERVER_PORT} (从配置文件读取)`)

// 连接管理
const activeConnections = new Set()
let connectionCount = 0

// 监控连接状态
function logConnectionStats() {
  logger.info(`活跃连接数: ${activeConnections.size}, 总连接数: ${connectionCount}`)
}

// 定期清理断开的连接
setInterval(() => {
  const beforeSize = activeConnections.size
  for (const conn of activeConnections) {
    if (conn.destroyed || conn.closed) {
      activeConnections.delete(conn)
    }
  }
  const afterSize = activeConnections.size
  if (beforeSize !== afterSize) {
    logger.info(`清理了 ${beforeSize - afterSize} 个断开的连接`)
  }
}, 30000) // 每30秒清理一次

// 定期输出连接统计
setInterval(logConnectionStats, 60000) // 每分钟输出一次

// 证书文件路径
const CERT_DIR = path.join(__dirname, '../certs')
const requiredCertFiles = [
  'server-key.pem',
  'server-cert.pem',
  'client-cert.pem'
]

// 检查证书文件是否存在
for (const certFile of requiredCertFiles) {
  const certPath = path.join(CERT_DIR, certFile)
  if (!fs.existsSync(certPath)) {
    logger.error(`证书文件 ${certFile} 在 ${CERT_DIR} 目录中不存在!`)
    logger.error('请先运行以下命令生成证书:')
    logger.error('openssl req -newkey rsa:4096 -nodes -keyout server-key.pem -out server.csr -config openssl.cnf')
    logger.error('openssl x509 -req -in server.csr -signkey server-key.pem -out server-cert.pem -extensions req_ext -extfile openssl.cnf -days 365')
    process.exit(1)
  }
}

// 创建一个TLS服务器
const server = tls.createServer({
  key: fs.readFileSync(path.join(CERT_DIR, 'server-key.pem')),
  cert: fs.readFileSync(path.join(CERT_DIR, 'server-cert.pem')),
  requestCert: true,
  rejectUnauthorized: true,
  ca: [fs.readFileSync(path.join(CERT_DIR, 'client-cert.pem'))],
  // 添加安全选项
  minVersion: 'TLSv1.2',
  ciphers: 'HIGH:!aNULL:!MD5'
}, (socket) => {
  connectionCount++
  activeConnections.add(socket)
  
  logger.info(`客户端连接: ${socket.remoteAddress}:${socket.remotePort} (连接 #${connectionCount})`)
  
  if (!socket.authorized) {
    logger.warn(`客户端认证失败: ${socket.authorizationError}`)
    socket.end('576')
    activeConnections.delete(socket)
    return
  }

  // 设置超时
  socket.setTimeout(30000) // 30秒超时
  
  let clientData = Buffer.alloc(0)

  // 监听客户端发送的数据
  socket.on('data', (data) => {
    try {
      // 使用Buffer来累积数据
      clientData = Buffer.concat([clientData, data])

      // 检查是否接收到完整的JSON数据
      const dataStr = clientData.toString()
      if (!dataStr.endsWith('}')) return

      // 解析JSON数据
      const jsonData = JSON.parse(dataStr)
      const { type, target, payload } = jsonData

      if (!type || !target) {
        throw new Error('无效的请求格式')
      }

      if (type === 'CONNECT') {
        handleHttpsRequest(socket, target)
      } else if (type === 'HTTP') {
        handleHttpRequest(socket, target, payload)
      } else {
        throw new Error('未知的请求类型')
      }

      // 清空缓存
      clientData = Buffer.alloc(0)
    } catch (err) {
      logger.error(`数据解析错误: ${err.message}`)
      socket.end()
    }
  })

  // 处理超时
  socket.on('timeout', () => {
    logger.warn(`连接超时: ${socket.remoteAddress}:${socket.remotePort}`)
    socket.end()
  })

  // 处理客户端断开连接
  socket.on('end', () => {
    logger.info(`客户端断开连接: ${socket.remoteAddress}:${socket.remotePort}`)
    activeConnections.delete(socket)
  })

  // 处理错误
  socket.on('error', (err) => {
    logger.error(`客户端错误: ${err.message}`)
    activeConnections.delete(socket)
  })

  // 处理连接关闭
  socket.on('close', (hadError) => {
    if (hadError) {
      logger.warn(`连接异常关闭: ${socket.remoteAddress}:${socket.remotePort}`)
    }
    activeConnections.delete(socket)
  })
})

/**
 * 处理HTTPS请求（CONNECT方法）
 */
function handleHttpsRequest(socket, target) {
  logger.info(`处理HTTPS请求: ${target}`)

  // 解析目标地址和端口
  const [host, port = 443] = target.split(':')

  // 连接到目标服务器
  const targetSocket = net.connect({ 
    host, 
    port,
    timeout: 10000 // 10秒连接超时
  }, () => {
    logger.info(`HTTPS隧道建立: ${target}`)
    socket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
    
    // 双向转发数据
    socket.pipe(targetSocket)
    targetSocket.pipe(socket)
    
    // 添加连接管理
    activeConnections.add(targetSocket)
  })

  // 处理目标服务器断开连接
  targetSocket.on('end', () => {
    logger.info(`HTTPS隧道关闭: ${target}`)
    socket.end()
    activeConnections.delete(targetSocket)
  })

  // 处理错误
  targetSocket.on('error', (err) => {
    logger.error(`HTTPS目标错误: ${err.message}`)
    socket.end()
    activeConnections.delete(targetSocket)
  })

  // 处理超时
  targetSocket.on('timeout', () => {
    logger.warn(`HTTPS连接超时: ${target}`)
    targetSocket.end()
    socket.end()
    activeConnections.delete(targetSocket)
  })

  // 处理连接关闭
  targetSocket.on('close', (hadError) => {
    if (hadError) {
      logger.warn(`HTTPS目标连接异常关闭: ${target}`)
    }
    activeConnections.delete(targetSocket)
  })
}

/**
* 处理HTTP请求
*/
function handleHttpRequest(socket, target, payload) {
  logger.info(`处理HTTP请求: ${target}`)

  // 解析目标地址和端口
  const [host, port = 80] = target.split(':')

  // 连接到目标服务器
  const targetSocket = net.connect({ 
    host, 
    port,
    timeout: 10000 // 10秒连接超时
  }, () => {
    logger.info(`HTTP连接建立: ${target}`)
    targetSocket.write(payload)
    
    // 添加连接管理
    activeConnections.add(targetSocket)
  })

  // 当目标服务器返回数据时，转发给客户端
  targetSocket.on('data', (data) => {
    socket.write(data)
  })

  // 处理目标服务器断开连接
  targetSocket.on('end', () => {
    logger.info(`HTTP连接关闭: ${target}`)
    socket.end()
    activeConnections.delete(targetSocket)
  })

  // 处理错误
  targetSocket.on('error', (err) => {
    logger.error(`HTTP目标错误: ${err.message}`)
    socket.end()
    activeConnections.delete(targetSocket)
  })

  // 处理超时
  targetSocket.on('timeout', () => {
    logger.warn(`HTTP连接超时: ${target}`)
    targetSocket.end()
    socket.end()
    activeConnections.delete(targetSocket)
  })

  // 处理连接关闭
  targetSocket.on('close', (hadError) => {
    if (hadError) {
      logger.warn(`HTTP目标连接异常关闭: ${target}`)
    }
    activeConnections.delete(targetSocket)
  })
}

// 启动服务器
server.listen(SERVER_PORT, () => {
  logger.info(`服务器启动成功，监听端口: ${SERVER_PORT}`)
})

// 内存监控
setInterval(() => {
  const memUsage = process.memoryUsage()
  const memUsageMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024)
  }
  
  logger.info(`内存使用: RSS=${memUsageMB.rss}MB, Heap=${memUsageMB.heapUsed}/${memUsageMB.heapTotal}MB, External=${memUsageMB.external}MB`)
  
  // 如果内存使用过高，记录警告
  if (memUsageMB.rss > 2000) { // 2000MB
    logger.warn(`内存使用较高: ${memUsageMB.rss}MB`)
  }
}, 600000) // 每10分钟输出一次

// 优雅关闭
function gracefulShutdown(signal) {
  logger.info(`收到信号 ${signal}，开始优雅关闭...`)
  
  // 关闭服务器，停止接受新连接
  server.close(() => {
    logger.info('服务器已停止接受新连接')
    
    // 关闭所有活跃连接
    const connectionCount = activeConnections.size
    logger.info(`正在关闭 ${connectionCount} 个活跃连接...`)
    
    for (const conn of activeConnections) {
      try {
        conn.destroy()
      } catch (err) {
        logger.error(`关闭连接时出错: ${err.message}`)
      }
    }
    
    logger.info('所有连接已关闭，进程退出')
    process.exit(0)
  })
  
  // 如果10秒内没有完成关闭，强制退出
  setTimeout(() => {
    logger.error('优雅关闭超时，强制退出')
    process.exit(1)
  }, 10000)
}

// 监听退出信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  logger.error(`未捕获的异常: ${err.message}`)
  logger.error(`堆栈跟踪: ${err.stack}`)
  
  // 记录连接状态
  logger.error(`当前活跃连接数: ${activeConnections.size}`)
  
  // 不要立即退出，给一些时间记录日志
  setTimeout(() => {
    process.exit(1)
  }, 1000)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`未处理的Promise拒绝: ${reason}`)
  logger.error(`Promise: ${promise}`)
})

// 定期检查进程健康状态
setInterval(() => {
  const uptime = process.uptime()
  const memUsage = process.memoryUsage()
  
  logger.info(`进程运行时间: ${Math.round(uptime)}秒, 内存: ${Math.round(memUsage.rss / 1024 / 1024)}MB`)
}, 1200000) // 每20分钟检查一次

/*
openssl req -newkey rsa:4096 -nodes -keyout server-key.pem -out server.csr -config openssl.cnf
openssl x509 -req -in server.csr -signkey server-key.pem -out server-cert.pem -extensions req_ext -extfile openssl.cnf -days 365
*/