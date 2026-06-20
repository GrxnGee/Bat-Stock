import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PurchaseOrderService } from '../../../services/purchase-order';
import { SupplierService, Supplier } from '../../../services/supplier';
import { AlertModalComponent } from '../../../components/alert-modal/alert-modal';

@Component({
  selector: 'app-accounts-payable',
  standalone: true,
  imports: [CommonModule, AlertModalComponent],
  templateUrl: './accounts-payable.html',
  styleUrl: './accounts-payable.css'
})
export class AccountsPayableComponent implements OnInit {
  activeTab: 'UNPAID' | 'PAID' = 'UNPAID';

  apDebts: any[] = [];
  unpaidBills: any[] = [];
  paidBills: any[] = [];
  suppliers: Supplier[] = [];

  totalDebtAmount: number = 0;
  overdueAmount: number = 0;
  upcomingAmount: number = 0;

  isAlertOpen = false;
  alertType = '';
  alertMessage = '';
  targetBillId: number | null = null;

  mathAbs = Math.abs;

  constructor(private poService: PurchaseOrderService, private supplierService: SupplierService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.loadSuppliersAndDebts();
  }

  showAlert(type: string, message: string) {
    this.alertType = type;
    this.alertMessage = message;
    this.isAlertOpen = true;
  }

  switchTab(tab: 'UNPAID' | 'PAID') {
    this.activeTab = tab;
  }

  loadSuppliersAndDebts() {
    this.supplierService.getSuppliers().subscribe(sups => {
      this.suppliers = sups;

      this.poService.getAPDebts().subscribe(res => {
        const today = new Date().getTime();

        const mappedDebts = res.map(bill => {
          const sup = this.suppliers.find(s => s.id === bill.supplierId);
          const dueDate = new Date(bill.dueDate).getTime();
          const diffTime = dueDate - today;
          const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          return { ...bill, supplierName: sup?.name || 'ไม่ทราบชื่อ', daysLeft };
        });

        this.paidBills = mappedDebts.filter(b => b.paymentStatus === 'PAID');
        this.unpaidBills = mappedDebts.filter(b => b.paymentStatus === 'UNPAID');

        this.calculateSummaries();
        this.cdr.detectChanges();
      });
    });
  }

  calculateSummaries() {
    this.totalDebtAmount = 0;
    this.overdueAmount = 0;
    this.upcomingAmount = 0;

    this.unpaidBills.forEach(bill => {
      this.totalDebtAmount += Number(bill.totalAmount);
      if (bill.daysLeft < 0) {
        this.overdueAmount += Number(bill.totalAmount);
      } else if (bill.daysLeft <= 7) {
        this.upcomingAmount += Number(bill.totalAmount);
      }
    });
  }


  confirmPayment(id: number, supplierName: string, amount: number) {
    this.targetBillId = id;
    this.showAlert('confirm-receive', `ยืนยันการบันทึกชำระเงินยอด ฿${amount.toLocaleString()} ให้กับ ${supplierName} ใช่หรือไม่?`);
  }


  confirmAlertAction() {


    if (this.alertType === 'confirm-receive' && this.targetBillId) {
      this.poService.markAsPaid(this.targetBillId).subscribe({
        next: (res) => {
          this.isAlertOpen = false;
          this.showAlert('payment-success', res.message);
          this.targetBillId = null;
          this.loadSuppliersAndDebts();
        },
        error: (err) => {
          this.isAlertOpen = false;
          this.showAlert('error', 'เกิดข้อผิดพลาดในการบันทึก');
        }
      });
    } else {
      this.isAlertOpen = false;
    }
  }
}