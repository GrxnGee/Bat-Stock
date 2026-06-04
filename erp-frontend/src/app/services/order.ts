import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs'

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

  private apiUrl = 'http://localhost:3000/api/orders';

  constructor(private http: HttpClient) {}

  getOrders(): Observable<Order[]> {
    return this.http.get<any>(this.apiUrl).pipe(
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

}
