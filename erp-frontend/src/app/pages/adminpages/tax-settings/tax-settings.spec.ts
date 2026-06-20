import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxSettings } from './tax-settings';

describe('TaxSettings', () => {
  let component: TaxSettings;
  let fixture: ComponentFixture<TaxSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaxSettings],
    }).compileComponents();

    fixture = TestBed.createComponent(TaxSettings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
