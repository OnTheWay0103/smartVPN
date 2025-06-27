const net = require('net')
const tls = require('tls')
const fs = require('fs')
const path = require('path')
const logger = require('./utils/logger')

// 配置远程服务器的监听端口
const SERVER_PORT = 888 //443

// 证书文件路径
const CERT_DIR = path.join(__dirname, 'env')
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
  logger.info(`客户端连接: ${socket.remoteAddress}:${socket.remotePort}`)
  
  if (!socket.authorized) {
    logger.warn(`客户端认证失败: ${socket.authorizationError}`)
    socket.end('576')
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
    logger.warn('连接超时')
    socket.end()
  })

  // 处理客户端断开连接
  socket.on('end', () => {
    logger.info(`客户端断开连接: ${socket.remoteAddress}:${socket.remotePort}`)
  })

  // 处理错误
  socket.on('error', (err) => {
    logger.error(`客户端错误: ${err.message}`)
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
    socket.pipe(targetSocket)
    targetSocket.pipe(socket)
  })

  // 处理目标服务器断开连接
  targetSocket.on('end', () => {
    logger.info(`HTTPS隧道关闭: ${target}`)
    socket.end()
  })

  // 处理错误
  targetSocket.on('error', (err) => {
    logger.error(`HTTPS目标错误: ${err.message}`)
    socket.end()
  })

  // 处理超时
  targetSocket.on('timeout', () => {
    logger.warn(`HTTPS连接超时: ${target}`)
    targetSocket.end()
    socket.end()
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
  })

  // 当目标服务器返回数据时，转发给客户端
  targetSocket.on('data', (data) => {
    socket.write(data)
  })

  // 处理目标服务器断开连接
  targetSocket.on('end', () => {
    logger.info(`HTTP连接关闭: ${target}`)
    socket.end()
  })

  // 处理错误
  targetSocket.on('error', (err) => {
    logger.error(`HTTP目标错误: ${err.message}`)
    socket.end()
  })

  // 处理超时
  targetSocket.on('timeout', () => {
    logger.warn(`HTTP连接超时: ${target}`)
    targetSocket.end()
    socket.end()
  })
}

// 启动服务器
server.listen(SERVER_PORT, () => {
  logger.info(`服务器启动成功，监听端口: ${SERVER_PORT}`)
})

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  logger.error(`未捕获的异常: ${err.message}`)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`未处理的Promise拒绝: ${reason}`)
})

/*
openssl req -newkey rsa:4096 -nodes -keyout server-key.pem -out server.csr -config openssl.cnf
openssl x509 -req -in server.csr -signkey server-key.pem -out server-cert.pem -extensions req_ext -extfile openssl.cnf -days 365
*/