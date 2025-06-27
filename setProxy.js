const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const CONFIG = require('./const');

function writeTempFile(lines) {
  const tmpPath = path.join(os.tmpdir(), `vpn-proxy-${Date.now()}-${Math.random()}.txt`);
  fs.writeFileSync(tmpPath, lines.join('\r\n'), 'utf8');
  return tmpPath;
}

async function setProxy(host, port) {
  if (process.platform === 'darwin') {
    const networks = await getMacAvailableNetworks();
    if (networks.length === 0) {
      throw 'no network';
    }
    return Promise.all(
      networks.map(network => {
        return new Promise((resolve, reject) => {
          exec(`networksetup -setsecurewebproxy "${network}" ${host} ${port}`, error => {
            if (error) {
              reject(null);
            } else {
              resolve(network);
            }
          });
        });
      }),
    );
  } else {
    const regPutValuePath = path.join(CONFIG.REGEDIT_VBS_PATH, 'regPutValue.wsf');
    // 1. ProxyServer
    const proxyServerLines = [
      'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
      'ProxyServer',
      `${host}:${port}`,
      'REG_SZ'
    ];
    const proxyServerFile = writeTempFile(proxyServerLines);
    // 2. ProxyEnable
    const proxyEnableLines = [
      'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
      'ProxyEnable',
      '1',
      'REG_DWORD'
    ];
    const proxyEnableFile = writeTempFile(proxyEnableLines);

    return new Promise((resolve, reject) => {
      exec(`cscript //Nologo "${regPutValuePath}" 32 < "${proxyServerFile}"`, (error) => {
        fs.unlinkSync(proxyServerFile);
        if (error) {
          reject(new Error(`设置代理服务器地址失败: ${error.message}`));
          return;
        }
        exec(`cscript //Nologo "${regPutValuePath}" 32 < "${proxyEnableFile}"`, (error) => {
          fs.unlinkSync(proxyEnableFile);
          if (error) {
            reject(new Error(`启用代理失败: ${error.message}`));
          } else {
            resolve();
          }
        });
      });
    });
  }
}

async function closeProxy() {
  if (process.platform === 'darwin') {
    const networks = await getMacAvailableNetworks();
    if (networks.length === 0) {
      throw 'no network';
    }
    return Promise.all(
      networks.map(network => {
        return new Promise((resolve, reject) => {
          exec(`networksetup -setsecurewebproxystate "${network}" off`, error => {
            if (error) {
              reject(null);
            } else {
              resolve(network);
            }
          });
        });
      }),
    );
  } else {
    const regPutValuePath = path.join(CONFIG.REGEDIT_VBS_PATH, 'regPutValue.wsf');
    // 关闭代理
    const proxyDisableLines = [
      'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
      'ProxyEnable',
      '0',
      'REG_DWORD'
    ];
    const proxyDisableFile = writeTempFile(proxyDisableLines);
    return new Promise((resolve, reject) => {
      exec(`cscript //Nologo "${regPutValuePath}" 32 < "${proxyDisableFile}"`, (error) => {
        fs.unlinkSync(proxyDisableFile);
        if (error) {
          reject(new Error(`禁用代理失败: ${error.message}`));
        } else {
          resolve();
        }
      });
    });
  }
}

function getMacAvailableNetworks() {
  return new Promise((resolve, reject) => {
    exec('networksetup -listallnetworkservices', (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        Promise.all(
          stdout
            .toString()
            .split('\n')
            .map(network => {
              return new Promise(resolve => {
                exec(
                  `networksetup getinfo "${network}" | grep "^IP address:\\s\\d"`,
                  (error, stdout) => {
                    if (error) {
                      resolve(null);
                    } else {
                      resolve(stdout ? network : null);
                    }
                  },
                );
              });
            }),
        ).then(networks => {
          resolve(networks.filter(Boolean));
        });
      }
    });
  });
}

module.exports = {
  setProxy,
  closeProxy
};
