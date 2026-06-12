import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Promotion {
  id?: number;
  code: string;
  name: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minimumPurchase: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  applicableProductId?: number | null;
  isAutoApply?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PromotionService {
  private apiUrl = environment.apiUrl + '/promotions';

  constructor(private http: HttpClient) { }

  getPromotions(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(this.apiUrl);
  }

  createPromotion(data: Promotion): Observable<Promotion> {
    return this.http.post<Promotion>(this.apiUrl, data);
  }

  updatePromotion(id: number, data: Partial<Promotion>): Observable<Promotion> {
    return this.http.patch<Promotion>(`${this.apiUrl}/${id}`, data);
  }

  deletePromotion(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  validatePromoCode(code: string, cart: any[]): Observable<any> {
    const cartPayload = cart.map(item => ({
      productId: item.id,
      price: item.price,
      quantity: item.selectedQuantity
    }));
    return this.http.post<any>(`${this.apiUrl}/validate`, { code, cart: cartPayload });
  }

  checkAutoPromotion(cart: any[]): Observable<any> {
    const cartPayload = cart.map(item => ({
      productId: item.id,
      price: item.price,
      quantity: item.selectedQuantity
    }));
    return this.http.post<any>(`${this.apiUrl}/auto-apply`, { cart: cartPayload });
  }
}