import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { SafeTextPipe } from './safe-text.pipe';

/**
 * T11.1 — Unit test example for SafeTextPipe.
 *
 * Demonstrates:
 * - Pipe testing
 * - DomSanitizer mocking
 * - XSS prevention validation
 */
describe('SafeTextPipe', () => {
  let pipe: SafeTextPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SafeTextPipe],
    });
    
    sanitizer = TestBed.inject(DomSanitizer);
    pipe = new SafeTextPipe(sanitizer);
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should sanitize plain text', () => {
    const result = pipe.transform('Hello World');
    expect(result).toBeTruthy();
  });

  it('should remove script tags', () => {
    const malicious = '<script>alert("XSS")</script>Hello';
    const result = pipe.transform(malicious);
    // Result should not contain script tag
    expect(String(result)).not.toContain('<script>');
  });

  it('should remove event handlers', () => {
    const malicious = '<div onclick="alert(\'XSS\')">Click me</div>';
    const result = pipe.transform(malicious);
    expect(String(result)).not.toContain('onclick');
  });

  it('should handle null input', () => {
    const result = pipe.transform(null as any);
    expect(result).toBeTruthy();
  });

  it('should handle undefined input', () => {
    const result = pipe.transform(undefined as any);
    expect(result).toBeTruthy();
  });

  it('should handle empty string', () => {
    const result = pipe.transform('');
    expect(result).toBeTruthy();
  });

  it('should preserve safe HTML entities', () => {
    const text = 'Price: &lt;$100&gt;';
    const result = pipe.transform(text);
    expect(String(result)).toContain('&lt;');
    expect(String(result)).toContain('&gt;');
  });
});
