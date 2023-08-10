import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RouteStopComponent } from './route-stop.component';

describe('RouteStopComponent', () => {
  let component: RouteStopComponent;
  let fixture: ComponentFixture<RouteStopComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouteStopComponent]
    });
    fixture = TestBed.createComponent(RouteStopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
