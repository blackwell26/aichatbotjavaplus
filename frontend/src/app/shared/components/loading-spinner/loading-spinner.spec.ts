import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingSpinnerComponent } from './loading-spinner';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * T11.1 — Unit test example for LoadingSpinnerComponent.
 *
 * Demonstrates:
 * - Component testing
 * - Input property testing
 * - Material component integration
 * - Accessibility attributes
 */
describe('LoadingSpinnerComponent', () => {
  let component: LoadingSpinnerComponent;
  let fixture: ComponentFixture<LoadingSpinnerComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinnerComponent, MatProgressSpinnerModule],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingSpinnerComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render mat-spinner', () => {
    const spinner = compiled.querySelector('mat-spinner');
    expect(spinner).toBeTruthy();
  });

  it('should apply default diameter', () => {
    const spinner = compiled.querySelector('mat-spinner');
    expect(spinner?.getAttribute('diameter')).toBe('48');
  });

  it('should apply custom diameter', () => {
    component.diameter = 64;
    fixture.detectChanges();
    
    const spinner = compiled.querySelector('mat-spinner');
    expect(spinner?.getAttribute('diameter')).toBe('64');
  });

  it('should have aria-label for accessibility', () => {
    const spinner = compiled.querySelector('mat-spinner');
    expect(spinner?.getAttribute('aria-label')).toBeTruthy();
  });

  it('should apply custom aria-label', () => {
    component.ariaLabel = 'Loading products';
    fixture.detectChanges();
    
    const spinner = compiled.querySelector('mat-spinner');
    expect(spinner?.getAttribute('aria-label')).toBe('Loading products');
  });

  it('should center spinner in container', () => {
    const container = compiled.querySelector('.loading-spinner');
    expect(container).toBeTruthy();
    
    const styles = window.getComputedStyle(container!);
    expect(styles.display).toBe('flex');
    expect(styles.justifyContent).toBe('center');
    expect(styles.alignItems).toBe('center');
  });

  it('should apply minimum height', () => {
    const container = compiled.querySelector('.loading-spinner');
    const styles = window.getComputedStyle(container!);
    expect(styles.minHeight).toBeTruthy();
  });
});
