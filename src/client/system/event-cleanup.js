const logger = require('../../shared/utils/logger');

/**
 * EventCleanup - 事件监听器清理工具
 * 用于防止EventEmitter监听器泄漏和内存问题
 */
class EventCleanup {
    constructor() {
        this.trackedEmitters = new Map();
        this.trackedListeners = new Map();
    }

    /**
     * 安全地添加事件监听器
     * @param {EventEmitter} emitter - 事件发射器
     * @param {string} event - 事件名称
     * @param {Function} listener - 监听器函数
     * @param {string} context - 上下文标识
     */
    safeAddListener(emitter, event, listener, context = 'unknown') {
        if (!emitter || !emitter.on) {
            logger.warn(`尝试在无效的emitter上添加监听器: ${context}`);
            return;
        }

        // 检查监听器数量
        const currentCount = emitter.listenerCount(event);
        if (currentCount >= 15) {
            logger.warn(`事件 ${event} 的监听器数量过多 (${currentCount})，来自: ${context}`);
        }

        // 添加监听器
        emitter.on(event, listener);

        // 跟踪监听器
        const key = `${emitter.constructor.name}-${event}`;
        if (!this.trackedListeners.has(key)) {
            this.trackedListeners.set(key, new Set());
        }
        this.trackedListeners.get(key).add(listener);

        // 跟踪emitter
        if (!this.trackedEmitters.has(emitter)) {
            this.trackedEmitters.set(emitter, new Set());
        }
        this.trackedEmitters.get(emitter).add(event);
    }

    /**
     * 安全地移除事件监听器
     * @param {EventEmitter} emitter - 事件发射器
     * @param {string} event - 事件名称
     * @param {Function} listener - 监听器函数
     */
    safeRemoveListener(emitter, event, listener) {
        if (!emitter || !emitter.off) {
            return;
        }

        emitter.off(event, listener);

        // 更新跟踪信息
        const key = `${emitter.constructor.name}-${event}`;
        if (this.trackedListeners.has(key)) {
            this.trackedListeners.get(key).delete(listener);
            if (this.trackedListeners.get(key).size === 0) {
                this.trackedListeners.delete(key);
            }
        }
    }

    /**
     * 清理特定emitter的所有监听器
     * @param {EventEmitter} emitter - 事件发射器
     */
    cleanupEmitter(emitter) {
        if (!emitter || !this.trackedEmitters.has(emitter)) {
            return;
        }

        const events = this.trackedEmitters.get(emitter);
        for (const event of events) {
            emitter.removeAllListeners(event);
        }

        this.trackedEmitters.delete(emitter);
    }

    /**
     * 清理所有跟踪的监听器
     */
    cleanupAll() {
        for (const [emitter, events] of this.trackedEmitters) {
            for (const event of events) {
                emitter.removeAllListeners(event);
            }
        }

        this.trackedEmitters.clear();
        this.trackedListeners.clear();
        logger.info('所有事件监听器已清理');
    }

    /**
     * 获取监听器统计信息
     */
    getStats() {
        const stats = {
            totalEmitters: this.trackedEmitters.size,
            totalEvents: 0,
            totalListeners: 0
        };

        for (const [emitter, events] of this.trackedEmitters) {
            stats.totalEvents += events.size;
            for (const event of events) {
                stats.totalListeners += emitter.listenerCount(event);
            }
        }

        return stats;
    }

    /**
     * 打印监听器统计信息
     */
    printStats() {
        const stats = this.getStats();
        logger.info(`事件监听器统计: ${stats.totalEmitters} 个emitter, ${stats.totalEvents} 个事件, ${stats.totalListeners} 个监听器`);
    }
}

module.exports = EventCleanup;
