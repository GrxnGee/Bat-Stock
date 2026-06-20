import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrderService {
  private apiUrl = environment.apiUrl + '/purchase-orders';

  constructor(private http: HttpClient) { }

  getPOs(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createPO(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  updateStatus(id: number, status: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, { status });
  }

  getAPDebts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ap/debts`);
  }

  markAsPaid(id: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/pay`, {});
  }
}