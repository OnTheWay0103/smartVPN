const fs = require('fs');
const path = require('path');
const configManager = require('../../../../src/shared/config');

describe('ConfigManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should load default configuration', () => {
    const config = configManager.load();
    expect(config).toHaveProperty('client');
    expect(config).toHaveProperty('server');
    expect(config).toHaveProperty('tls');
  });

  test('should get client configuration', () => {
    const clientConfig = configManager.getClientConfig();
    expect(clientConfig).toHaveProperty('local');
    expect(clientConfig).toHaveProperty('whitelist');
    expect(clientConfig.local).toHaveProperty('port');
  });

  test('should get server configuration', () => {
    const serverConfig = configManager.getServerConfig();
    expect(serverConfig).toHaveProperty('remote');
    expect(serverConfig.remote).toHaveProperty('host');
    expect(serverConfig.remote).toHaveProperty('port');
  });

  test('should get TLS configuration', () => {
    const tlsConfig = configManager.getTlsConfig();
    expect(tlsConfig).toHaveProperty('key');
    expect(tlsConfig).toHaveProperty('cert');
    expect(tlsConfig).toHaveProperty('ca');
  });

  test('should get configuration by path', () => {
    const port = configManager.get('client.local.port');
    expect(port).toBeDefined();
    expect(typeof port).toBe('number');
  });

  test('should handle non-existent path', () => {
    const value = configManager.get('nonexistent.path');
    expect(value).toBeUndefined();
  });
});