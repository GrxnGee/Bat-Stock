import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Salehistory } from './salehistory';

describe('Salehistory', () => {
  let component: Salehistory;
  let fixture: ComponentFixture<Salehistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Salehistory],
    }).compileComponents();

    fixture = TestBed.createComponent(Salehistory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
