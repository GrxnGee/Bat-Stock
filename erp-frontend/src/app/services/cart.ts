import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs'
import { environment } from '../../environments/environment';
import { PaymentData } from '../components/checkout-modal/checkout-modal';

export interface PosProduct {
  id: number;
  name: string;
  price: number;
  quantity: number;
  barcode: string;
  image: string;
}

export interface CartItem extends PosProduct {
  selectedQuantity: number;
}
@Injectable({
  providedIn: 'root',
})

export class CartService {
  products: PosProduct[] = [];
  cart: CartItem[] = [];

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  fetchProducts(): Observable<PosProduct[]> {
    return this.http.get<PosProduct[]>(this.apiUrl+`/products`);
  }

  submitOrder(paymentData: PaymentData): Observable<any> {
    const orderPayload = {
      items: this.cart.map(item => ({
        productId: item.id,
        quantity: item.selectedQuantity,
        price: item.price
      })),
      payment: paymentData,
      totalAmount: this.total
    };

    return this.http.post(this.apiUrl+`/orders`, orderPayload);
  }

  addProduct(product: PosProduct) {
    const existingItem = this.cart.find(item => item.id === product.id);
    if (existingItem) {
      existingItem.selectedQuantity++;
    } else {
      this.cart.push({ ...product, selectedQuantity: 1 });
    }
  }

  increaseQuantity(productId: number) {
    const item = this.cart.find(pro => pro.id === productId);
    if (item) { item.selectedQuantity++; }
  }

  decreaseQuantity(productId: number) {
    const item = this.cart.find(pro => pro.id === productId);
    if (item) {
      if (item.selectedQuantity > 1) {
        item.selectedQuantity--;
      } else {
        this.removeItem(productId);
      }
    }
  }

  removeItem(productId: number) {
    this.cart = this.cart.filter(pro => pro.id !== productId);
  }

  clearCart() {
    this.cart = [];
  }

  get total(): number {
    return this.cart.reduce((sum, item) => sum + item.price * item.selectedQuantity, 0);
  }
}