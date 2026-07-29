import { TestBed } from '@angular/core/testing';
import { ApiGatewayService } from './api-gateway.service';

/**
 * T11.1 — Unit test example for ApiGatewayService.
 *
 * Demonstrates:
 * - Service testing
 * - URL building logic
 * - Gateway URL validation
 */
describe('ApiGatewayService', () => {
  let service: ApiGatewayService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiGatewayService],
    });
    service = TestBed.inject(ApiGatewayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('url()', () => {
    it('should build URL from single segment', () => {
      const url = service.url('products');
      expect(url).toContain('/products');
    });

    it('should build URL from multiple segments', () => {
      const url = service.url('orders', '123', 'tracking');
      expect(url).toContain('/orders/123/tracking');
    });

    it('should handle leading slashes', () => {
      const url = service.url('/products');
      expect(url).toContain('/products');
      expect(url).not.toContain('//products');
    });

    it('should handle trailing slashes', () => {
      const url = service.url('products/');
      expect(url).toContain('/products');
      expect(url).not.toMatch(/\/products\/$/);
    });

    it('should handle numeric segments', () => {
      const url = service.url('orders', 123);
      expect(url).toContain('/orders/123');
    });

    it('should filter empty segments', () => {
      const url = service.url('products', '', 'list');
      expect(url).toContain('/products/list');
      expect(url).not.toContain('//');
    });

    it('should return base URL when no segments provided', () => {
      const url = service.url();
      expect(url).toBe(service.baseUrl);
    });
  });

  describe('isGatewayUrl()', () => {
    it('should return true for gateway URLs', () => {
      const url = service.url('products');
      expect(service.isGatewayUrl(url)).toBe(true);
    });

    it('should return false for external URLs', () => {
      expect(service.isGatewayUrl('https://example.com/api')).toBe(false);
    });

    it('should return false for relative URLs', () => {
      expect(service.isGatewayUrl('/some/path')).toBe(false);
    });
  });
});
