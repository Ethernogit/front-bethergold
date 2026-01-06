import { Injectable, Injector } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { LoginService } from '../services/auth/login.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private injector: Injector) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const loginService = this.injector.get(LoginService);
    // Agregar token de autorización si existe
    const authToken = loginService.getAccessToken();

    if (authToken) {
      request = this.addTokenHeader(request, authToken);
    }

    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(request, next);
        }

        return throwError(() => error);
      })
    );
  }

  private addTokenHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
    const loginService = this.injector.get(LoginService);
    let headers = request.headers.set('Authorization', `Bearer ${token}`);

    // Inject Sucursal ID if available
    const currentSucursal = loginService.currentSucursal();
    if (currentSucursal && currentSucursal._id) {
      headers = headers.set('x-sucursal-id', currentSucursal._id);
    } else if (currentSucursal && (currentSucursal as any).id) {
      // Fallback if structure is different
      headers = headers.set('x-sucursal-id', (currentSucursal as any).id);
    }

    return request.clone({ headers });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const loginService = this.injector.get(LoginService);
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return loginService.refreshToken().pipe(
        switchMap((response: any) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(response.data.accessToken);

          return next.handle(this.addTokenHeader(request, response.data.accessToken));
        }),
        catchError((error) => {
          this.isRefreshing = false;
          loginService.logout();
          return throwError(() => error);
        })
      );
    }

    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => next.handle(this.addTokenHeader(request, token)))
    );
  }
}