const tls = require('tls')
const net = require('net')
const fs = require('fs')
const path = require('path')
const logger = require('./utils/logger')

// 测试配置
const SERVER_PORT = 888
const CERT_DIR = path.join(__dirname, 'env')

// 测试用例
const tests = [
  {
    name: '服务器启动测试',
    run: async () => {
      try {
        // 启动服务器
        require('./server')
        logger.info('服务器启动成功')
        return true
      } catch (err) {
        logger.error(`服务器启动失败: ${err.message}`)
        return false
      }
    }
  },
  {
    name: 'TLS连接测试',
    run: async () => {
      return new Promise((resolve) => {
        const options = {
          ca: [fs.readFileSync(path.join(CERT_DIR, 'server-cert.pem'))],
          key: fs.readFileSync(path.join(CERT_DIR, 'client-key.pem')),
          cert: fs.readFileSync(path.join(CERT_DIR, 'client-cert.pem')),
          rejectUnauthorized: true
        }

        const client = tls.connect(SERVER_PORT, options, () => {
          logger.info('TLS连接成功')
          client.end()
          resolve(true)
        })

        client.on('error', (err) => {
          logger.error(`TLS连接失败: ${err.message}`)
          resolve(false)
        })
      })
    }
  },
  {
    name: 'HTTP请求测试',
    run: async () => {
      return new Promise((resolve) => {
        const options = {
          ca: [fs.readFileSync(path.join(CERT_DIR, 'server-cert.pem'))],
          key: fs.readFileSync(path.join(CERT_DIR, 'client-key.pem')),
          cert: fs.readFileSync(path.join(CERT_DIR, 'client-cert.pem')),
          rejectUnauthorized: true
        }

        const client = tls.connect(SERVER_PORT, options, () => {
          const request = {
            type: 'HTTP',
            target: 'www.baidu.com:80',
            payload: 'GET / HTTP/1.1\r\nHost: www.baidu.com\r\n\r\n'
          }
          client.write(JSON.stringify(request))
        })

        let response = ''
        client.on('data', (data) => {
          response += data.toString()
          if (response.includes('HTTP/1.1')) {
            logger.info('HTTP请求成功')
            client.end()
            resolve(true)
          }
        })

        client.on('error', (err) => {
          logger.error(`HTTP请求失败: ${err.message}`)
          resolve(false)
        })

        // 设置超时
        setTimeout(() => {
          logger.error('HTTP请求超时')
          client.end()
          resolve(false)
        }, 5000)
      })
    }
  },
  {
    name: 'HTTPS请求测试',
    run: async () => {
      return new Promise((resolve) => {
        const options = {
          ca: [fs.readFileSync(path.join(CERT_DIR, 'server-cert.pem'))],
          key: fs.readFileSync(path.join(CERT_DIR, 'client-key.pem')),
          cert: fs.readFileSync(path.join(CERT_DIR, 'client-cert.pem')),
          rejectUnauthorized: true
        }

        const client = tls.connect(SERVER_PORT, options, () => {
          const request = {
            type: 'CONNECT',
            target: 'www.baidu.com:443'
          }
          client.write(JSON.stringify(request))
        })

        let response = ''
        client.on('data', (data) => {
          response += data.toString()
          if (response.includes('Connection Established')) {
            logger.info('HTTPS隧道建立成功')
            client.end()
            resolve(true)
          }
        })

        client.on('error', (err) => {
          logger.error(`HTTPS请求失败: ${err.message}`)
          resolve(false)
        })

        // 设置超时
        setTimeout(() => {
          logger.error('HTTPS请求超时')
          client.end()
          resolve(false)
        }, 5000)
      })
    }
  },
  {
    name: '错误处理测试',
    run: async () => {
      return new Promise((resolve) => {
        const options = {
          ca: [fs.readFileSync(path.join(CERT_DIR, 'server-cert.pem'))],
          key: fs.readFileSync(path.join(CERT_DIR, 'client-key.pem')),
          cert: fs.readFileSync(path.join(CERT_DIR, 'client-cert.pem')),
          rejectUnauthorized: true
        }

        const client = tls.connect(SERVER_PORT, options, () => {
          // 发送无效的请求
          client.write('invalid json data')
        })

        client.on('error', (err) => {
          logger.info('错误处理测试成功')
          resolve(true)
        })

        // 设置超时
        setTimeout(() => {
          logger.error('错误处理测试超时')
          client.end()
          resolve(false)
        }, 5000)
      })
    }
  }
]

// 运行测试
async function runTests() {
  logger.info('开始服务器测试...')
  
  let success = 0
  let failed = 0

  for (const test of tests) {
    logger.info(`运行测试: ${test.name}`)
    const result = await test.run()
    if (result) {
      success++
      logger.info(`测试通过: ${test.name}`)
    } else {
      failed++
      logger.error(`测试失败: ${test.name}`)
    }
  }

  logger.info('测试完成!')
  logger.info(`成功: ${success}, 失败: ${failed}`)

  // 清理进程
  process.exit()
}

// 启动测试
runTests()

// 处理进程退出
process.on('SIGINT', () => {
  logger.info('正在关闭测试...')
  process.exit()
}) 