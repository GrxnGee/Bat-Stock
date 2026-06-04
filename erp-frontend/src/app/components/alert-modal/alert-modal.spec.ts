import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertModalComponent } from './alert-modal';

describe('AlertModal', () => {
  let component: AlertModalComponent;
  let fixture: ComponentFixture<AlertModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
