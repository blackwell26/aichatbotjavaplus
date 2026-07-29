import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';
import { ApiGatewayService } from '../services/api-gateway.service';
import { of } from 'rxjs';

/**
 * T11.2 — Integration test example for authentication flow.
 *
 * Demonstrates:
 * - Testing multiple services together
 * - HTTP request/response testing
 * - Router navigation testing
 * - Token storage integration
 */
describe('Authentication Integration', () => {
  let authService: AuthService;
  let tokenStorage: TokenStorageService;
  let httpMock: HttpTestingController;
  let router: Router;
  let gateway: ApiGatewayService;

  const mockLoginResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
    user: {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      roles: ['CUSTOMER'],
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        TokenStorageService,
        ApiGatewayService,
        {
          provide: Router,
          useValue: {
            navigate: vi.fn(),
            url: '/',
          },
        },
      ],
    });

    authService = TestBed.inject(AuthService);
    tokenStorage = TestBed.inject(TokenStorageService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    gateway = TestBed.inject(ApiGatewayService);

    // Clear storage before each test
    tokenStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Login Flow', () => {
    it('should complete full login flow successfully', (done) => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Start login
      authService.login(credentials).subscribe({
        next: (response) => {
          // Verify response
          expect(response).toEqual(mockLoginResponse);

          // Verify tokens are stored
          expect(tokenStorage.getAccessToken()).toBe(mockLoginResponse.accessToken);
          expect(tokenStorage.getRefreshToken()).toBe(mockLoginResponse.refreshToken);

          // Verify user is authenticated
          expect(authService.isAuthenticated()).toBe(true);

          // Verify current user is set
          authService.currentUser$.subscribe((user) => {
            expect(user).toEqual(mockLoginResponse.user);
            done();
          });
        },
        error: done.fail,
      });

      // Expect HTTP request
      const req = httpMock.expectOne(gateway.url('auth/login'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);

      // Respond with mock data
      req.flush(mockLoginResponse);
    });

    it('should handle login failure correctly', (done) => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      authService.login(credentials).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          // Verify error handling
          expect(error.status).toBe(401);

          // Verify no tokens stored
          expect(tokenStorage.getAccessToken()).toBeNull();
          expect(tokenStorage.getRefreshToken()).toBeNull();

          // Verify user is not authenticated
          expect(authService.isAuthenticated()).toBe(false);

          done();
        },
      });

      const req = httpMock.expectOne(gateway.url('auth/login'));
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('Token Refresh Flow', () => {
    beforeEach(() => {
      // Set up initial tokens
      tokenStorage.setAccessToken(mockLoginResponse.accessToken);
      tokenStorage.setRefreshToken(mockLoginResponse.refreshToken);
    });

    it('should refresh token successfully', (done) => {
      const newTokenResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      };

      authService.refreshToken().subscribe({
        next: (response) => {
          // Verify new tokens are stored
          expect(tokenStorage.getAccessToken()).toBe(newTokenResponse.accessToken);
          expect(tokenStorage.getRefreshToken()).toBe(newTokenResponse.refreshToken);

          // Verify still authenticated
          expect(authService.isAuthenticated()).toBe(true);

          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(gateway.url('auth/refresh'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        refreshToken: mockLoginResponse.refreshToken,
      });

      req.flush(newTokenResponse);
    });

    it('should logout on refresh token failure', (done) => {
      authService.refreshToken().subscribe({
        next: () => done.fail('Should have failed'),
        error: () => {
          // Verify tokens are cleared
          expect(tokenStorage.getAccessToken()).toBeNull();
          expect(tokenStorage.getRefreshToken()).toBeNull();

          // Verify user is logged out
          expect(authService.isAuthenticated()).toBe(false);

          // Verify navigation to login
          expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);

          done();
        },
      });

      const req = httpMock.expectOne(gateway.url('auth/refresh'));
      req.flush({ message: 'Invalid refresh token' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('Logout Flow', () => {
    beforeEach(() => {
      // Set up authenticated state
      tokenStorage.setAccessToken(mockLoginResponse.accessToken);
      tokenStorage.setRefreshToken(mockLoginResponse.refreshToken);
    });

    it('should complete full logout flow', (done) => {
      authService.logout().subscribe({
        next: () => {
          // Verify tokens are cleared
          expect(tokenStorage.getAccessToken()).toBeNull();
          expect(tokenStorage.getRefreshToken()).toBeNull();

          // Verify user is not authenticated
          expect(authService.isAuthenticated()).toBe(false);

          // Verify current user is cleared
          authService.currentUser$.subscribe((user) => {
            expect(user).toBeNull();
          });

          // Verify navigation to login
          expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);

          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(gateway.url('auth/logout'));
      expect(req.request.method).toBe('POST');
      req.flush({});
    });
  });

  describe('Protected Resource Access', () => {
    it('should include auth token in requests', (done) => {
      tokenStorage.setAccessToken(mockLoginResponse.accessToken);

      // Make a protected request (example)
      authService.getCurrentUser().subscribe({
        next: () => {
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(gateway.url('auth/me'));
      expect(req.request.headers.get('Authorization')).toBe(
        `Bearer ${mockLoginResponse.accessToken}`
      );
      req.flush(mockLoginResponse.user);
    });

    it('should redirect to login when not authenticated', () => {
      // Clear tokens
      tokenStorage.clear();

      // Attempt to access protected resource
      expect(authService.isAuthenticated()).toBe(false);

      // Guard should redirect
      // (This would be tested in guard integration tests)
    });
  });
});
