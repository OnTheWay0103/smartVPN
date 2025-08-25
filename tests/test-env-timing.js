#!/usr/bin/env node

console.log('=== 环境变量时机测试 ===');
console.log('1. 脚本开始时的 NODE_ENV:', process.env.NODE_ENV);

// 模拟立即加载的模块
const immediateModule = (() => {
    console.log('2. 立即执行模块加载');
    const env = process.env.NODE_ENV || 'default';
    console.log('3. 立即模块中的 env:', env);
    console.log('4. 立即模块中的 process.env.NODE_ENV:', process.env.NODE_ENV);
    return { env };
})();

console.log('5. 立即模块加载完成:', immediateModule);

// 模拟延迟加载的模块
setTimeout(() => {
    console.log('6. 延迟模块加载');
    const env = process.env.NODE_ENV || 'default';
    console.log('7. 延迟模块中的 env:', env);
    console.log('8. 延迟模块中的 process.env.NODE_ENV:', process.env.NODE_ENV);
}, 100);

console.log('9. 主脚本继续执行');
console.log('10. 主脚本中的 NODE_ENV:', process.env.NODE_ENV); 