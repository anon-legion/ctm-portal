import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaceComponent } from './place.component';

describe('PlacesComponent', () => {
  let component: PlaceComponent;
  let fixture: ComponentFixture<PlaceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PlaceComponent],
    });
    fixture = TestBed.createComponent(PlaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
