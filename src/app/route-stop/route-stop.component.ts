import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { HttpStatusCode as StatusCode } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { BusRoute, City, Place, PlaceTableData } from '../types';
import { DataService } from '../data.service';
import { toTitleCase } from '../shared/utils';

@Component({
  selector: 'app-route-stop',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDividerModule,
    MatTableModule,
    MatSlideToggleModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  template: `
    <div
      class="is-flex is-justify-content-space-between width-breakpoint-768"
      style="gap: 1rem">
      <mat-form-field appearance="outline" color="accent">
        <mat-label>Select a city</mat-label>
        <mat-select
          [(value)]="selectedCity"
          (selectionChange)="selectCityOnChange($event)">
          <mat-option [value]="allCity">All Cities</mat-option>
          <mat-option *ngFor="let city of cityList" [value]="city">
            {{ city.name }}
          </mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field
        appearance="outline"
        color="accent"
        class="is-flex-grow-1">
        <mat-label>Select a route</mat-label>
        <mat-select
          [(value)]="selectedRoute"
          (selectionChange)="selectRouteOnChange($event)">
          <mat-option [value]="allRoute">All Routes</mat-option>
          <mat-option *ngFor="let route of cityRouteList" [value]="route">
            {{ route.name }}
          </mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <form
      class="container is-flex is-flex-direction-column mb-2 width-breakpoint-768"
      [formGroup]="routeStopForm">
      <mat-form-field appearance="outline" color="accent">
        <mat-label>Place Name</mat-label>
        <input
          matInput
          type="text"
          formControlName="name"
          class="is-capitalized" />
      </mat-form-field>
      <div
        class="is-flex is-justify-content-space-between is-align-items-center">
        <mat-slide-toggle
          class="mb-2"
          color="accent"
          formControlName="isActive">
          {{ routeStopForm.value.isActive ? 'Active' : 'Inactive' }}
        </mat-slide-toggle>
        <mat-form-field appearance="outline" color="accent">
          <mat-label>Distance</mat-label>
          <input
            matInput
            type="text"
            formControlName="distance"
            pattern="^[0-9]*$" />
        </mat-form-field>
      </div>
      <button
        type="button"
        mat-raised-button
        color="primary"
        [disabled]="!routeStopForm.valid"
        (click)="routeStopFormOnSubmit()">
        {{ isEditMode ? 'Update' : 'Add' }}
      </button>
    </form>

    <mat-divider class="width-breakpoint-768"></mat-divider>
    <div class="list-container mt-2 width-breakpoint-768">
      <table mat-table [dataSource]="routeStopList">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Place</th>
          <td mat-cell *matCellDef="let element">{{ element.name }}</td>
        </ng-container>
        <ng-container matColumnDef="cityId">
          <th mat-header-cell *matHeaderCellDef>City</th>
          <td mat-cell *matCellDef="let element">{{ element.cityId.name }}</td>
        </ng-container>
        <ng-container matColumnDef="isActive">
          <th mat-header-cell *matHeaderCellDef>Active</th>
          <td mat-cell *matCellDef="let element">{{ element.isActive }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr
          mat-row
          (click)="rowOnClick(row)"
          *matRowDef="let row; columns: displayedColumns"></tr>
      </table>
    </div>
  `,
  styleUrls: ['./route-stop.component.scss'],
})
export class RouteStopComponent {
  allCity: City = {
    _id: 'all',
    name: 'all places',
    isActive: true,
  };
  allRoute: BusRoute = {
    _id: 'all',
    cityId: this.allCity._id,
    name: 'all routes',
    isActive: true,
  };
  selectedCity = this.allCity;
  selectedRoute = this.allRoute;
  allBusRoutes: BusRoute[] = [];
  cityRouteList: BusRoute[] = [];
  url: PathQuerySetter;
  routeStopList: PlaceTableData[] = [];
  displayedColumns = ['name', 'cityId', 'isActive'];
  nameControl = new FormControl('', [
    Validators.required,
    Validators.minLength(3),
  ]);
  distanceControl = new FormControl(null, [
    Validators.required,
    Validators.min(0),
  ]);
  isActiveControl = new FormControl(true, [Validators.required]);
  routeStopForm = new FormGroup({
    name: this.nameControl,
    distance: this.distanceControl,
    isActive: this.isActiveControl,
  });
  isEditMode = false;
  isNewPlace = false;

  constructor(
    private _router: Router,
    private _route: ActivatedRoute,
    private _snackBar: MatSnackBar,
    public dataService: DataService
  ) {
    this.url = new PathQuerySetter(this._router, this._route);
    const cityId = this._route.snapshot.queryParamMap.get('cityId');
    const routeId = this._route.snapshot.queryParamMap.get('routeId');

    if (
      (!cityId && !routeId) ||
      (cityId === this.allCity._id && routeId === this.allRoute._id)
    ) {
      this.url.setQueryParams();
    }

    dataService.getAllCities().then(res => {
      const cityList = res.data as City[];
      const reqCity = cityList.find(city => city._id === cityId);

      dataService.getAllBusRoutes().then(res => {
        this.allBusRoutes = res.data as BusRoute[];
        const reqBusRoute = this.allBusRoutes.find(
          route => route._id === routeId
        );
        const busRouteCity = cityList.find(
          city => city._id === reqBusRoute?.cityId
        );

        // if all query params are invalid
        if (!reqBusRoute && !reqCity) {
          this.url.setQueryParams();
        }

        if (reqBusRoute && busRouteCity) {
          this.url.setQueryParams({
            cityId: busRouteCity._id,
            routeId: reqBusRoute._id,
          });
          this.selectedRoute = reqBusRoute;
          this.selectedCity = busRouteCity;
        }

        if (reqCity && !reqBusRoute) {
          this.url.setQueryParams({
            cityId: reqCity._id,
            routeId: this.allRoute._id,
          });
          this.selectedCity = reqCity;
          this.selectedRoute = this.allRoute;
        }

        this.cityRouteList = this.allBusRoutes.filter(busRoute =>
          this.selectedCity === this.allCity
            ? true
            : busRoute.cityId === this.selectedCity._id
        );
      });
    });
  }

  get cityList() {
    return this.dataService.cityList;
  }

  selectCityOnChange(e: MatSelectChange) {
    const city = e.value as City;

    this.url.setQueryParams({ cityId: city._id });

    if (city === this.allCity) {
      this.cityRouteList = [...this.allBusRoutes];
      return;
    }

    this.cityRouteList = this.allBusRoutes.filter(
      busRoute => busRoute.cityId === city._id
    );

    if (this.selectedRoute.cityId !== city._id) {
      this.url.setQueryParams({ cityId: city._id, routeId: this.allRoute._id });
      this.selectedRoute = this.allRoute;
    }
  }

  selectRouteOnChange(e: MatSelectChange) {
    const busRoute = e.value as BusRoute;

    this._router.navigate([], {
      relativeTo: this._route,
      queryParams: { routeId: busRoute._id },
      queryParamsHandling: 'merge',
    });
  }

  routeStopFormOnSubmit() {
    console.log(this.routeStopForm.value);
    const nameControl = this.routeStopForm.get('name');
    const distanceControl = this.routeStopForm.get('distance');
    if (
      !nameControl ||
      !distanceControl ||
      !nameControl.value ||
      !distanceControl.value
    )
      return;
    if (
      this.selectedCity === this.allCity ||
      this.selectedRoute === this.allRoute
    ) {
      this._snackBar.open('Select city and route', 'Close', { duration: 3000 });
      return;
    }

    const name = nameControl.value as string;
    const distance = Number(distanceControl.value) as number;
    const formData = {
      cityId: this.selectedCity._id,
      name: toTitleCase(name),
      aliases: [],
      isActive: this.isActiveControl.value,
    } as Place;

    this.dataService.addNewPlace(formData).then(res => {
      const { status, data } = res;
      if (status === StatusCode.Conflict) {
        nameControl.setErrors({ conflict: true });
        this._snackBar.open('Name already exists', 'Close', { duration: 3000 });
        return;
      }
      if (status === StatusCode.Created) {
        this._snackBar.open('Success', 'Close', { duration: 3000 });
        // push new place to routeStopList
        this.routeStopForm.reset({ isActive: true });
        return;
      }
      this._snackBar.open('Something went wrong', 'Close', { duration: 3000 });
    });
  }

  rowOnClick(row: PlaceTableData) {
    console.log(row);
  }
}

class PathQuerySetter {
  constructor(
    private _router: Router,
    private _route: ActivatedRoute
  ) {}

  setQueryParams(
    queryParams: Record<string, string> = { cityId: 'all', routeId: 'all' }
  ) {
    this._router.navigate([], {
      relativeTo: this._route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }
}
