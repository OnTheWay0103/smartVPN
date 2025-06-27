const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
}

const currentLevel = process.env.LOG_LEVEL || 'INFO'

function formatMessage(level, message) {
    const timestamp = new Date().toISOString()
    return `[${timestamp}] [${level}] ${message}`
}

function log(level, message) {
    if (LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]) {
        console.log(formatMessage(level, message))
    }
}

module.exports = {
    debug: (message) => log('DEBUG', message),
    info: (message) => log('INFO', message),
    warn: (message) => log('WARN', message),
    error: (message) => log('ERROR', message)
} 