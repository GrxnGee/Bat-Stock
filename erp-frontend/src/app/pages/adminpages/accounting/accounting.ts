import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountingService } from '../../../services/accounting';

@Component({
  selector: 'app-accounting',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './accounting.html',
  styleUrl: './accounting.css'
})
export class AccountingComponent implements OnInit {
  selectedYear: number = new Date().getFullYear();
  selectedMonth: number = new Date().getMonth() + 1;
  
  years: number[] = [this.selectedYear - 1, this.selectedYear, this.selectedYear + 1];
  months = [
    { value: 1, label: 'มกราคม' }, { value: 2, label: 'กุมภาพันธ์' }, { value: 3, label: 'มีนาคม' },
    { value: 4, label: 'เมษายน' }, { value: 5, label: 'พฤษภาคม' }, { value: 6, label: 'มิถุนายน' },
    { value: 7, label: 'กรกฎาคม' }, { value: 8, label: 'สิงหาคม' }, { value: 9, label: 'กันยายน' },
    { value: 10, label: 'ตุลาคม' }, { value: 11, label: 'พฤศจิกายน' }, { value: 12, label: 'ธันวาคม' }
  ];

  statementData: any = {
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    transactions: []
  };

  isLoading = false;

  constructor(private accountingService: AccountingService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadStatement();
  }

  loadStatement() {
    this.isLoading = true;
    this.accountingService.getStatement(this.selectedYear, this.selectedMonth).subscribe({
      next: (res) => {
        this.statementData = res;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}