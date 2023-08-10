import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { BusRoute, City } from '../types';
import { DataService } from '../data.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-route-stop',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatSelectModule],
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
  `,
  styleUrls: ['./route-stop.component.scss'],
})
export class RouteStopComponent {
  selectedCity = {} as City;
  selectedRoute = {} as BusRoute;
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
  allBusRoutes: BusRoute[] = [];
  cityRouteList: BusRoute[] = [];

  constructor(
    private _router: Router,
    private _route: ActivatedRoute,
    public dataService: DataService
  ) {
    dataService.getAllCities();
    dataService.getAllBusRoutes().then(res => {
      this.allBusRoutes = res.data as BusRoute[];
    });
    const cityId = this._route.snapshot.queryParamMap.get('cityId');
    const routeId = this._route.snapshot.queryParamMap.get('routeId');

    if (!cityId && !routeId) {
      this._router.navigate([], {
        relativeTo: this._route,
        queryParams: { cityId: 'all', routeId: 'all' },
        queryParamsHandling: 'merge',
      });
      this.selectedCity = this.allCity;
      this.cityRouteList = [...this.allBusRoutes];
      this.selectedRoute = this.allRoute;
      return;
    }

    const reqCity = this.cityList.find(city => city._id === cityId);
    const reqBusRoute = this.allBusRoutes.find(
      busRoute => busRoute._id === routeId
    );

    if (cityId && reqCity) {
      this.selectedCity = reqCity;
      this._router.navigate([], {
        relativeTo: this._route,
        queryParams: { cityId: reqCity._id },
        queryParamsHandling: 'merge',
      });
    }

    // if routeId only, find cityId

    // if both, find cityId and routeId
  }

  get cityList() {
    return this.dataService.cityList;
  }

  selectCityOnChange(e: MatSelectChange) {
    const city = e.value as City;

    this._router.navigate([], {
      relativeTo: this._route,
      queryParams: { cityId: city._id },
      queryParamsHandling: 'merge',
    });

    if (city === this.allCity) {
      this.cityRouteList = [...this.allBusRoutes];
      return;
    }

    this.cityRouteList = this.allBusRoutes.filter(
      busRoute => busRoute.cityId === city._id
    );
  }

  selectRouteOnChange(e: MatSelectChange) {
    const busRoute = e.value as BusRoute;

    this._router.navigate([], {
      relativeTo: this._route,
      queryParams: { routeId: busRoute._id },
      queryParamsHandling: 'merge',
    });
  }
}
