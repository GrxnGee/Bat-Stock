import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface LoginResponse {
  success: boolean;
  access_token: string;
  user: {
    id: number;
    name: string;
    role: 'SUPER_ADMIN' | 'MASTER' | 'CASHIER' | 'STOCK_ADMIN';
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl + '/auth';

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap(res => {
        if (res.success && res.access_token) {
          localStorage.setItem('access_token', res.access_token);
          localStorage.setItem('user_info', JSON.stringify(res.user));
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getUserRole(): string | null {
    const userJson = localStorage.getItem('user_info');
    if (!userJson) return null;
    const user = JSON.parse(userJson);
    return user.role;
  }

  getUserName(): string {
    const userJson = localStorage.getItem('user_info');
    if (!userJson) return 'พนักงาน';
    const user = JSON.parse(userJson);
    return user.name;
  }
}