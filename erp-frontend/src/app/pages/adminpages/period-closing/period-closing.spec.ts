import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeriodClosing } from './period-closing';

describe('PeriodClosing', () => {
  let component: PeriodClosing;
  let fixture: ComponentFixture<PeriodClosing>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeriodClosing],
    }).compileComponents();

    fixture = TestBed.createComponent(PeriodClosing);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
