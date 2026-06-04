import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaleHistoryDetail } from './sale-history-detail';

describe('SaleHistoryDetail', () => {
  let component: SaleHistoryDetail;
  let fixture: ComponentFixture<SaleHistoryDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaleHistoryDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(SaleHistoryDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
