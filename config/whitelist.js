/**
 * 白名单域名配置
 * 当启用白名单模式时，只有这些域名会通过代理
 */

module.exports = {
    // 是否启用白名单模式
    enabled: false,
    
    // 白名单域名列表
    domains: [
        "google.com",
        "*.google.com",
        "vercel.com",
        "*.vercel.com",
        "googleapis.com",
        "*.googleapis.com",
        "amazonaws.com",
        "*.amazonaws.com",
        "gstatic.com",
        "*.gstatic.com",
        "googletagmanager.com",
        "*.googletagmanager.com",
        "google-analytics.com",
        "*.google-analytics.com",
        // anthropic need
        "anthropic.com",
        "*.anthropic.com",
        "sentry.io",
        "*.sentry.io",
        // \ anthropic need
        "youtube.com",
        "*.youtube.com",
        // 下面这个IP不知道是什么，好像geminicli用到，测试一下
        "31.13.94.41",
        "199.96.62.17",
        "104.244.43.208",
        "*.cursor.*",
        "chatgpt.com",
        "*.chatgpt.com",
        "x.com",
        "*.x.com",
        "reddit.com",
        "*.reddit.com",
        "semrush.com",
        "*.semrush.com",
        "bolt.new/",
        "*.bolt.new/",
        "v2ex.com",
        "*.v2ex.com",
        "chatgpt.com",
        "*.chatgpt.com",
        "oaiusercontent.com",
        "*.oaiusercontent.com",
        
        // 测试域名
        'example.com',
        '*.example.com',
        'test.com',
        '*.test.com'
    ],
    
    // 配置说明
    description: {
        enabled: '设置为true启用白名单模式，false为全局代理模式',
        domains: '支持精确匹配和通配符匹配（如 *.example.com）',
        note: '修改配置后需要重启客户端才能生效'
    }
};