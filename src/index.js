#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// 解析命令行参数
const args = process.argv.slice(2);
const command = args[0];

// 显示帮助信息
function showHelp() {
  console.log(`
SmartVPN - 智能代理系统

使用方法:
  smartvpn client [options]    启动客户端
  smartvpn server [options]    启动服务端
  smartvpn help                显示帮助信息

客户端选项:
  --white                      启用白名单模式（仅代理白名单中的域名）

示例:
  smartvpn client              # 启动客户端（全局代理模式）
  smartvpn client --white      # 启动客户端（白名单模式）
  smartvpn server              # 启动服务端

更多信息请查看 README.md
`);
}

// 启动客户端
function startClient() {
  const clientArgs = args.slice(1); // 移除 'client' 参数
  const clientPath = path.join(__dirname, 'client.js');
  
  const child = spawn('node', [clientPath, ...clientArgs], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  child.on('error', (error) => {
    console.error(`启动客户端失败: ${error.message}`);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code);
  });
}

// 启动服务端
function startServer() {
  const serverArgs = args.slice(1); // 移除 'server' 参数
  const serverPath = path.join(__dirname, 'server.js');
  
  const child = spawn('node', [serverPath, ...serverArgs], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  child.on('error', (error) => {
    console.error(`启动服务端失败: ${error.message}`);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code);
  });
}

// 主程序逻辑
switch (command) {
  case 'client':
    startClient();
    break;
  case 'server':
    startServer();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    if (!command) {
      console.log('错误: 请指定要启动的程序 (client 或 server)');
      console.log('使用 "smartvpn help" 查看帮助信息');
      process.exit(1);
    } else {
      console.log(`错误: 未知命令 "${command}"`);
      console.log('使用 "smartvpn help" 查看帮助信息');
      process.exit(1);
    }
} 