import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CityRouteComponent } from './city-route.component';

describe('CityDetailComponent', () => {
  let component: CityRouteComponent;
  let fixture: ComponentFixture<CityRouteComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CityRouteComponent],
    });
    fixture = TestBed.createComponent(CityRouteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
