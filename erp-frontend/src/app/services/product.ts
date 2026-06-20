import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs'
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})

@Injectable({
  providedIn: 'root',
})
export class ProductService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getProducts(): Observable<any> {
    return this.http.get(this.apiUrl+`/products`);
  }

  getSmartSuggestions(): Observable<any> {
    return this.http.get(this.apiUrl + `/products/suggestions/smart-reorder`);
  }

  createProduct(productData: any): Observable<any> {
    return this.http.post(this.apiUrl + `/products`, productData);
  }

  updateProduct(id: number, productData: any): Observable<any> {
    return this.http.patch(this.apiUrl+`/products/${id}`, productData);
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(this.apiUrl+`/products/${id}`);
  }
  

}
