module.exports = {
    // 域名白名单配置
    // 支持精确匹配和通配符匹配
    // 例如: 
    // - "google.com" 精确匹配
    // - "*.google.com" 匹配所有google.com的子域名
    domains: [
        // 示例域名
        "google.com",
        "*.google.com",
        "vercel.com",
        "*.vercel.com",
        "googleapis.com",
        "*.googleapis.com",
        "cursor.com",
        "*.cursor.com",
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
        "104.244.43.208"
    ]
} 


// https://www.softether.org/   其它成熟的VPN工具