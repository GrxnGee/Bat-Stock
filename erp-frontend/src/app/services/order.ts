import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs'
import { environment } from '../../environments/environment';

export interface Order {
  id: number;
  orderNumber: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})

export class OrderService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getOrders(): Observable<Order[]> {
    return this.http.get<any>(this.apiUrl + `/orders`).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        else if (response && Array.isArray(response.data)) {
          return response.data;
        }
        return [];
      })
    );
  }

  generatePromptPayQr(amount: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/orders/promptpay`, { amount });
  }

  checkPaymentStatus(chargeId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/orders/promptpay/${chargeId}`);
  }

}
