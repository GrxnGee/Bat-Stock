import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})

export class Payment {

private apiUrl = 'http://localhost:3000/api/payments';

constructor(private http: HttpClient) { }
  generatePromptPayQR(amount: number, orderId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/promptpay`, { amount, orderId });
  }

}
