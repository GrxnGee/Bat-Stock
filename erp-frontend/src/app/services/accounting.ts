import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccountingService {
  private apiUrl = environment.apiUrl + '/accounting';

  constructor(private http: HttpClient) { }

  getStatement(year: number, month: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/statement?year=${year}&month=${month}`);
  }

  getClosedPeriods(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/periods`);
  }

  closePeriod(year: number, month: number, closedBy: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/periods/close`, { year, month, closedBy });
  }
}