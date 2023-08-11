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

  constructor(
    private _router: Router,
    private _route: ActivatedRoute,
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
