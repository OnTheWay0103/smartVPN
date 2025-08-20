#!/usr/bin/env node

/**
 * SmartVPN 安装脚本
 * 自动化项目设置过程
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🚀 SmartVPN 安装脚本启动...\n')

// 检查 Node.js 版本
function checkNodeVersion() {
  const version = process.version
  const major = parseInt(version.slice(1).split('.')[0])
  
  if (major < 12) {
    console.error('❌ 错误: 需要 Node.js 12.0 或更高版本')
    console.error(`当前版本: ${version}`)
    process.exit(1)
  }
  
  console.log(`✅ Node.js 版本检查通过: ${version}`)
}

// 创建必要的目录
function createDirectories() {
  const dirs = [
    'logs',
    'scripts'
  ]
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`📁 创建目录: ${dir}`)
    }
  })
}

// 检查配置文件
function checkConfig() {
  const configPath = path.join('env', 'config.js')
  const examplePath = path.join('env', 'config.example.js')
  
  if (!fs.existsSync(configPath)) {
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, configPath)
      console.log('📝 已创建配置文件模板: env/config.js')
      console.log('⚠️  请编辑 env/config.js 文件，配置您的服务器信息')
    } else {
      console.error('❌ 配置文件模板不存在: env/config.example.js')
    }
  } else {
    console.log('✅ 配置文件已存在: env/config.js')
  }
}

// 检查证书文件
function checkCertificates() {
  const certDir = 'env'
  const requiredCerts = [
    'server-key.pem',
    'server-cert.pem',
    'client-key.pem',
    'client-cert.pem'
  ]
  
  const missingCerts = requiredCerts.filter(cert => {
    return !fs.existsSync(path.join(certDir, cert))
  })
  
  if (missingCerts.length > 0) {
    console.log('⚠️  缺少证书文件:')
    missingCerts.forEach(cert => console.log(`   - ${cert}`))
    console.log('\n📋 请运行以下命令生成证书:')
    console.log('   npm run cert:generate')
    console.log('   或手动执行:')
    console.log('   cd env')
    console.log('   openssl req -newkey rsa:4096 -nodes -keyout server-key.pem -out server.csr -config openssl.cnf')
    console.log('   openssl x509 -req -in server.csr -signkey server-key.pem -out server-cert.pem -extensions req_ext -extfile openssl.cnf -days 365')
    console.log('   openssl req -newkey rsa:4096 -nodes -keyout client-key.pem -out client.csr -config openssl.cnf')
    console.log('   openssl x509 -req -in client.csr -signkey client-key.pem -out client-cert.pem -extensions req_ext -extfile openssl.cnf -days 365')
  } else {
    console.log('✅ 所有证书文件已存在')
  }
}

// 安装依赖
function installDependencies() {
  try {
    console.log('📦 安装依赖包...')
    execSync('npm install', { stdio: 'inherit' })
    console.log('✅ 依赖安装完成')
  } catch (error) {
    console.error('❌ 依赖安装失败:', error.message)
    process.exit(1)
  }
}

// 检查操作系统
function checkOS() {
  const platform = process.platform
  if (platform === 'win32') {
    console.log('✅ 检测到 Windows 系统')
  } else if (platform === 'darwin') {
    console.log('✅ 检测到 macOS 系统')
  } else {
    console.warn('⚠️  检测到不支持的平台:', platform)
    console.warn('   目前仅支持 Windows 和 macOS')
  }
}

// 显示使用说明
function showUsage() {
  console.log('\n🎉 安装完成！\n')
  console.log('📖 使用说明:')
  console.log('   1. 编辑 env/config.js 配置文件')
  console.log('   2. 生成 TLS 证书: npm run cert:generate')
  console.log('   3. 启动服务端: npm run server')
  console.log('   4. 启动客户端: npm start')
  console.log('\n📚 更多信息请查看 README.md')
  console.log('🐛 遇到问题请查看故障排除指南')
}

// 主函数
function main() {
  try {
    checkNodeVersion()
    checkOS()
    createDirectories()
    checkConfig()
    checkCertificates()
    installDependencies()
    showUsage()
  } catch (error) {
    console.error('❌ 安装过程中发生错误:', error.message)
    process.exit(1)
  }
}

// 运行安装脚本
if (require.main === module) {
  main()
}

module.exports = {
  checkNodeVersion,
  createDirectories,
  checkConfig,
  checkCertificates,
  installDependencies,
  checkOS
} 