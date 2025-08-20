const DomainFilter = require('../../../../src/client/whitelist/domain-filter');

// 模拟配置
jest.mock('../../../../src/shared/config', () => ({
  getClientConfig: jest.fn(() => ({
    whitelist: {
      enabled: true,
      domains: [
        'google.com',
        '*.google.com',
        'test.example.com'
      ]
    }
  }))
}));

describe('DomainFilter', () => {
  let domainFilter;

  beforeEach(() => {
    domainFilter = new DomainFilter();
  });

  describe('isDomainInWhitelist', () => {
    test('should return true for exact domain match', () => {
      expect(domainFilter.isDomainInWhitelist('google.com')).toBe(true);
    });

    test('should return true for wildcard subdomain match', () => {
      expect(domainFilter.isDomainInWhitelist('subdomain.google.com')).toBe(true);
      expect(domainFilter.isDomainInWhitelist('www.google.com')).toBe(true);
    });

    test('should return false for non-matching domain', () => {
      expect(domainFilter.isDomainInWhitelist('facebook.com')).toBe(false);
    });

    test('should handle port numbers correctly', () => {
      expect(domainFilter.isDomainInWhitelist('google.com:443')).toBe(true);
    });

    test('should return true when whitelist is disabled', () => {
      const DomainFilterDisabled = require('../../../../src/client/whitelist/domain-filter');
      jest.mock('../../../../src/shared/config', () => ({
        getClientConfig: jest.fn(() => ({
          whitelist: {
            enabled: false,
            domains: []
          }
        }))
      }));
      
      const disabledFilter = new DomainFilterDisabled();
      expect(disabledFilter.isDomainInWhitelist('anydomain.com')).toBe(true);
    });
  });

  describe('whitelist management', () => {
    test('should add domain to whitelist', () => {
      domainFilter.addDomain('newdomain.com');
      expect(domainFilter.getWhitelist()).toContain('newdomain.com');
    });

    test('should remove domain from whitelist', () => {
      domainFilter.removeDomain('google.com');
      expect(domainFilter.getWhitelist()).not.toContain('google.com');
    });

    test('should reload whitelist', () => {
      const initialLength = domainFilter.getWhitelist().length;
      domainFilter.reload();
      expect(domainFilter.getWhitelist().length).toBe(initialLength);
    });
  });
});