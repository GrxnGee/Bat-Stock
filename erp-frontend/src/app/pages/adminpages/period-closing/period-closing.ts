import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountingService } from '../../../services/accounting';
import { AuthService } from '../../../services/auth';
import { AlertModalComponent } from '../../../components/alert-modal/alert-modal';

@Component({
  selector: 'app-period-closing',
  standalone: true,
  imports: [CommonModule, AlertModalComponent],
  templateUrl: './period-closing.html',
  styleUrl: './period-closing.css'
})
export class PeriodClosing implements OnInit {
  periodsList: any[] = [];

  isAlertOpen = false;
  alertType = '';
  alertMessage = '';

  targetYear: number | null = null;
  targetMonth: number | null = null;

  monthNames = [
    '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  constructor(
    private accountingService: AccountingService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.generateAndLoadPeriods();
  }

  showAlert(type: string, message: string) {
    this.alertType = type;
    this.alertMessage = message;
    this.isAlertOpen = true;
  }

  generateAndLoadPeriods() {

    const today = new Date();
    this.periodsList = [];

    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      this.periodsList.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        monthName: this.monthNames[d.getMonth() + 1],
        status: 'OPEN',
        closedBy: '-',
        closedAt: null
      });
    }

    this.accountingService.getClosedPeriods().subscribe(closedData => {
      closedData.forEach(dbPeriod => {
        const match = this.periodsList.find(p => p.year === dbPeriod.year && p.month === dbPeriod.month);
        if (match) {
          match.status = dbPeriod.status;
          match.closedBy = dbPeriod.closedBy;
          match.closedAt = dbPeriod.closedAt;
        }
      });
      this.cdr.detectChanges();
    });
  }

  confirmClosePeriod(year: number, month: number, monthName: string) {
    this.targetYear = year;
    this.targetMonth = month;
    this.showAlert('close-period', `🚨 ยืนยันการปิดงวดบัญชีเดือน "${monthName} ${year}" ใช่หรือไม่? \n(เมื่อปิดแล้ว จะไม่สามารถเพิ่ม/แก้ไขรายการของเดือนนี้ได้อีก)`);
  }

  confirmAlertAction() {
    if (this.alertType === 'close-period' && this.targetYear && this.targetMonth) {
      const currentUser = this.authService.getUserName() || 'Admin';

      this.accountingService.closePeriod(this.targetYear, this.targetMonth, currentUser).subscribe({
        next: (res) => {
          this.isAlertOpen = false;
          this.showAlert('payment-success', res.message);
          this.generateAndLoadPeriods();
        },
        error: (err) => {
          this.isAlertOpen = false;
          this.showAlert('error', err.error?.message || 'เกิดข้อผิดพลาดในการปิดงวด');
        }
      });
    } else {
      this.isAlertOpen = false;
    }
  }
}