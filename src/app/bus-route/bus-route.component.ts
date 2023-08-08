import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpStatusCode as StatusCode } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatListModule, MatListOption } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../data.service';
import { City, BusRoute } from '../types';
import { sortObjArrByProp, toTitleCase } from '../shared/utils';

function getAllBusRoutes(service: DataService, routeList: BusRoute[]) {
  // reassign the reference to the array to update the view
  function setRouteList(newList: BusRoute[]) {
    routeList.length = 0;
    routeList.push(...newList);
  }

  service.getAllBusRoutes().then(res => {
    if (res.status !== StatusCode.Ok || !res.data.length) {
      setRouteList([]);
      return;
    }
    setRouteList(sortObjArrByProp<BusRoute>(res.data, 'name') as BusRoute[]);
  });
}

@Component({
  selector: 'app-bus-route',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatListModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="is-flex width-breakpoint-768">
      <mat-form-field appearance="outline" color="accent">
        <mat-label>Select a city</mat-label>
        <mat-select
          [(value)]="selectedCity"
          (selectionChange)="selectCityOnChange($event)">
          <mat-option [value]="allCity">All Routes</mat-option>
          <mat-option *ngFor="let city of cityList" [value]="city">
            {{ city.name }}
          </mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <form
      class="container is-flex is-flex-direction-column mb-2 width-breakpoint-768"
      [formGroup]="busRouteForm">
      <mat-form-field appearance="outline" color="accent">
        <mat-label>Route Name</mat-label>
        <input
          matInput
          type="text"
          formControlName="name"
          class="is-capitalized" />
      </mat-form-field>
      <mat-slide-toggle class="mb-2" color="accent" formControlName="isActive">
        {{ busRouteForm.value.isActive ? 'Active' : 'Inactive' }}
      </mat-slide-toggle>
      <button
        type="button"
        mat-raised-button
        color="primary"
        [disabled]="!busRouteForm.valid"
        (click)="busRouteFormOnSubmit()">
        {{ isEditMode ? 'Update' : 'Add' }}
      </button>
    </form>

    <mat-divider class="width-breakpoint-768"></mat-divider>
    <div class="list-container mt-2 width-breakpoint-768">
      <mat-selection-list
        #busRoutes
        [multiple]="false"
        (selectionChange)="
          selectionOnChange(busRoutes.selectedOptions.selected)
        ">
        <mat-list-option
          *ngFor="let route of routeList"
          [value]="route._id"
          [selected]="">
          {{ route.name }}
        </mat-list-option>
      </mat-selection-list>
    </div>

    <div
      class="is-flex is-justify-content-space-around mt-4 width-breakpoint-768">
      <button
        mat-raised-button
        color="accent"
        class="uniform-button"
        (click)="editOnClick(selectedBusRoute)">
        Edit
      </button>
      <button
        mat-raised-button
        color="warn"
        class="uniform-button"
        (click)="deleteOnClick(selectedBusRoute)">
        Delete
      </button>
      <button
        mat-raised-button
        color="accent"
        class="uniform-button"
        (click)="navigateTo(selectedBusRoute)">
        Add Stops
      </button>
    </div>
  `,
  styleUrls: ['./bus-route.component.scss'],
})
export class BusRouteComponent {
  route = inject(ActivatedRoute);
  dataService: DataService = inject(DataService);
  busRouteForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    isActive: new FormControl(true, [Validators.required]),
  });
  routeList: BusRoute[] = [];
  selectedBusRoute = '';
  selectedCity: City = {} as City;
  isEditMode = false;
  allCity: City = {
    _id: 'all',
    name: 'all routes',
  };

  constructor(
    private _snackBar: MatSnackBar,
    private router: Router
  ) {
    const cityId = this.route.snapshot.queryParamMap.get('cityId');

    if (!cityId) {
      this.selectedCity = this.allCity;
      this.dataService.getAllCities();
      // get all bus routes and assign to routeList
      getAllBusRoutes(this.dataService, this.routeList);
      return;
    }

    this.dataService.getAllCities().then(res => {
      const cityList = res.data as City[];
      const currentCity = cityList.find(city => city._id === cityId);

      // if cityId is not valid, set allCity and get all routes
      if (!currentCity) {
        this.selectedCity = this.allCity;
        // get all bus routes and assign to routeList
        getAllBusRoutes(this.dataService, this.routeList);
        // navigate to the same route without query params
        this.router.navigate([], {
          relativeTo: this.route,
        });
        return;
      }
      this.selectedCity = currentCity;
    });

    this.dataService.getRoutesByCityId(cityId).then(res => {
      if (res.status !== StatusCode.Ok) {
        this.selectedCity = this.allCity;
        getAllBusRoutes(this.dataService, this.routeList);
        return;
      }
      this.routeList = sortObjArrByProp<BusRoute>(
        res.data,
        'name'
      ) as BusRoute[];
    });
  }

  get cityList() {
    return this.dataService.cityList;
  }

  busRouteFormOnSubmit() {
    if (!this.busRouteForm.value.name) return;

    const formData = {
      cityId: this.selectedCity._id,
      name: toTitleCase(this.busRouteForm.value.name),
      isActive: this.busRouteForm.value.isActive,
    } as BusRoute;

    if (this.isEditMode) {
      formData._id = this.selectedBusRoute;
      this.dataService
        .updateBusRouteById(this.selectedBusRoute, formData)
        .then(res => {
          const { status, data } = res;
          if (status === StatusCode.NotFound) return;
          if (status === StatusCode.Ok) {
            this._snackBar.open('Update success', 'Close', { duration: 2500 });
            const updatedRouteList = this.routeList.filter(
              route => route._id !== this.selectedBusRoute
            );
            updatedRouteList.push(data);
            this.routeList = sortObjArrByProp<BusRoute>(
              updatedRouteList,
              'name'
            );
            this.busRouteForm.reset({ isActive: true });
            this.isEditMode = false;
          }
        });
      return;
    }

    this.dataService.addNewBusRoute(formData).then(res => {
      const { status, data } = res;
      if (status === StatusCode.Conflict) {
        const control = this.busRouteForm.get('name');
        if (!control) return;
        control.setErrors({ error: 'duplicate' });
        return;
      }
      if (status === StatusCode.Created) {
        this.routeList.push(data);
        this.routeList = sortObjArrByProp<BusRoute>(this.routeList, 'name');
        this.busRouteForm.reset({ isActive: true });
      }
    });
  }

  selectionOnChange(selectedOptions: MatListOption[]) {
    const [selectedOption] = selectedOptions;
    this.selectedBusRoute = selectedOption.value;
  }

  editOnClick(busRouteId: string) {
    const busRouteData = this.routeList.find(route => route._id === busRouteId);
    if (!busRouteData) return;
    this.isEditMode = true;
    this.busRouteForm.setValue({
      name: busRouteData.name,
      isActive: busRouteData.isActive ?? true,
    });
  }

  deleteOnClick(busRouteId: string) {
    this.dataService.deleteBusRouteById(busRouteId).then(res => {
      const { status } = res;
      if (status === StatusCode.Ok) {
        this.routeList = this.routeList.filter(
          route => route._id !== busRouteId
        );
        this.selectedBusRoute = '';
      }
    });
  }

  navigateTo(busRouteId: string) {
    console.log(busRouteId);
  }

  selectCityOnChange(e: MatSelectChange) {
    if (e.value === this.allCity) {
      this.dataService.getAllBusRoutes().then(res => {
        if (res.status === StatusCode.Ok && res.data.length) {
          this.routeList = sortObjArrByProp<BusRoute>(
            res.data,
            'name'
          ) as BusRoute[];
          this.router.navigate([], {
            relativeTo: this.route,
          });
        } else {
          this.routeList = [];
        }
      });
      return;
    }
    const city = e.value as City;
    this.dataService.getRoutesByCityId(city._id).then(res => {
      if (res.status === StatusCode.Ok && res.data.length) {
        this.routeList = sortObjArrByProp<BusRoute>(
          res.data,
          'name'
        ) as BusRoute[];
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { cityId: city._id },
          queryParamsHandling: 'merge',
        });
        return;
      }
      this.routeList = [];
    });
  }
}
