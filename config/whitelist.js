/**
 * 白名单域名配置
 * 当启用白名单模式时，只有这些域名会通过代理
 */

module.exports = {
    // 是否启用白名单模式
    enabled: false,
    
    // 白名单域名列表
    domains: [
        // 常用网站
        'google.com',
        '*.google.com',
        'github.com',
        '*.github.com',
        'stackoverflow.com',
        '*.stackoverflow.com',
        
        // 开发工具
        'npmjs.com',
        '*.npmjs.com',
        'pypi.org',
        '*.pypi.org',
        
        // 云服务
        'aws.amazon.com',
        '*.aws.amazon.com',
        'azure.microsoft.com',
        '*.azure.microsoft.com',
        'cloud.google.com',
        '*.cloud.google.com',
        
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