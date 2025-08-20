// 测试环境设置
process.env.NODE_ENV = 'test';

// 全局测试工具
const logger = require('../src/shared/utils/logger');

// 在测试中禁用日志输出
logger.debug = () => {};
logger.info = () => {};
logger.warn = () => {};
logger.error = () => {};