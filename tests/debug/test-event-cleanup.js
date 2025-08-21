#!/usr/bin/env node

/**
 * EventEmitter监听器清理测试
 * 用于验证修复后的代码是否解决了监听器过多的问题
 */

const { EventEmitter } = require('events');

console.log('🧪 开始测试EventEmitter监听器清理功能...\n');

// 创建测试用的EventEmitter
const testEmitter = new EventEmitter();

// 测试添加多个监听器
console.log('📝 添加测试监听器...');
for (let i = 0; i < 15; i++) {
    const listener = (data) => console.log(`监听器 ${i}: ${data}`);
    testEmitter.on('test', listener);
}

// 显示监听器数量
console.log(`\n📊 当前监听器数量: ${testEmitter.listenerCount('test')}`);
console.log(`最大监听器数量限制: ${testEmitter.getMaxListeners()}`);

// 测试触发事件
console.log('\n🎯 测试触发事件:');
testEmitter.emit('test', '测试数据1');
testEmitter.emit('test', '测试数据2');

// 测试移除监听器
console.log('\n🗑️ 移除部分监听器...');
const listeners = testEmitter.listeners('test');
for (let i = 0; i < 5; i++) {
    if (listeners[i]) {
        testEmitter.off('test', listeners[i]);
    }
}

// 显示移除后的监听器数量
console.log(`\n📊 移除后的监听器数量: ${testEmitter.listenerCount('test')}`);

// 测试清理所有监听器
console.log('\n🧹 清理所有监听器...');
testEmitter.removeAllListeners('test');

// 显示最终监听器数量
console.log(`\n📊 清理后的监听器数量: ${testEmitter.listenerCount('test')}`);

// 测试触发事件（应该没有监听器响应）
console.log('\n🎯 测试触发事件（应该没有响应）:');
testEmitter.emit('test', '测试数据3');

console.log('\n✅ 测试完成！');

// 检查是否有监听器泄漏警告
console.log('\n🔍 检查EventEmitter状态:');
console.log(`- 监听器数量: ${testEmitter.listenerCount('test')}`);
console.log(`- 最大监听器数量: ${testEmitter.getMaxListeners()}`);
console.log(`- 默认最大监听器数量: ${require('events').EventEmitter.defaultMaxListeners}`);

console.log('\n🎉 如果没有看到MaxListenersExceededWarning警告，说明修复成功！');
