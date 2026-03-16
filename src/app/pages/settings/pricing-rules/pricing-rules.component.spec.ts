import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PricingRulesComponent } from './pricing-rules.component';

describe('PricingRulesComponent', () => {
  let component: PricingRulesComponent;
  let fixture: ComponentFixture<PricingRulesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PricingRulesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PricingRulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
