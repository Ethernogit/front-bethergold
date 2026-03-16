import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsignmentSettlementComponent } from './consignment-settlement.component';

describe('ConsignmentSettlementComponent', () => {
  let component: ConsignmentSettlementComponent;
  let fixture: ComponentFixture<ConsignmentSettlementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsignmentSettlementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsignmentSettlementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
