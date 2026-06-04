import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Poscomponent } from './pos';

describe('Poscomponent', () => {
  let component: Poscomponent;
  let fixture: ComponentFixture<Poscomponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Poscomponent],
    }).compileComponents();

    fixture = TestBed.createComponent(Poscomponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
