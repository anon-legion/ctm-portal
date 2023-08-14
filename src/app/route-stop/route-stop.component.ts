import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { HttpStatusCode as StatusCode } from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import {
  BusRoute,
  City,
  Place,
  PlaceTableData,
  RouteStopTableData,
} from '../types';
import { DataService } from '../data.service';
import { toTitleCase } from '../shared/utils';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import TableDataSource from '../shared/table-data-source';

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
    MatAutocompleteModule,
  ],
  templateUrl: './route-stop.component.html',
  styleUrls: ['./route-stop.component.scss'],
})
export class RouteStopComponent implements OnInit, OnDestroy {
  private _sub: Subscription = new Subscription();
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
  routeStopList = new TableDataSource<RouteStopTableData>([]);
  placeOptions: PlaceTableData[] = [];
  filteredPlaceOptions: Observable<PlaceTableData[]> = new Observable();
  url: PathQuerySetter;
  displayedColumns = ['name', 'cityId', 'isActive'];
  nameControl = new FormControl<string | PlaceTableData>('', [
    Validators.required,
    Validators.minLength(3),
  ]);
  distanceControl = new FormControl<number | null>(null, [
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

    if (!cityId && !routeId) {
      this.url.setQueryParams();
    }

    Promise.all([
      this.dataService.getAllCities(),
      this.dataService.getAllBusRoutes(),
    ])
      .then(([cityRes, busRouteRes]) => {
        const cityList = cityRes.data as City[];
        const reqCity = cityList.find(city => city._id === cityId);

        this.allBusRoutes = busRouteRes.data as BusRoute[];
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
      })
      .catch(err =>
        this._snackBar.open(`${err.message}, try again later`, 'Close', {
          duration: 3000,
        })
      );
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
      if (status !== StatusCode.Created) {
        this._snackBar.open('Something went wrong', 'Close', {
          duration: 3000,
        });
        return;
      }
      this._snackBar.open('Success', 'Close', { duration: 3000 });
      // use response data to add place to route stop
      this.routeStopForm.reset({ isActive: true });
    });
  }

  rowOnClick(row: PlaceTableData) {
    console.log(row);
  }

  displayFn(place: PlaceTableData): string {
    return place && place.name ? place.name : '';
  }

  private _filter(name: string): PlaceTableData[] {
    const filterValue = name.toLowerCase();

    return this.placeOptions.filter(place =>
      place.name.toLowerCase().includes(filterValue)
    );
  }

  private _lastCityId = '';
  private _lastRouteId = '';

  ngOnInit() {
    this._sub = this._route.queryParamMap.subscribe(params => {
      const cityId = params.get('cityId');
      const routeId = params.get('routeId');
      console.log(`cityId: ${cityId}`);
      console.log(`routeId: ${routeId}`);

      if (cityId === this.allCity._id && cityId !== this._lastCityId) {
        this.dataService.getAllPlaces().then(res => {
          const { status, data } = res;
          this._lastCityId = cityId;

          if (status !== StatusCode.Ok || !data.length) {
            this.placeOptions = [];
          } else {
            this.placeOptions = data;
          }
        });
      }

      if (
        cityId &&
        cityId !== this.allCity._id &&
        cityId !== this._lastCityId
      ) {
        this.dataService.getPlacesByCityId(cityId).then(res => {
          const { status, data } = res;
          if (status !== StatusCode.Ok || !data.length) {
            this.placeOptions = [];
          } else {
            this.placeOptions = data;
          }
        });
      }

      if (
        routeId &&
        routeId !== this.allRoute._id &&
        routeId !== this._lastRouteId
      ) {
        this.dataService.getRouteStopsByRouteId(routeId).then(res => {
          const { status, data } = res;
          if (status !== StatusCode.Ok || !data.length) {
            this.routeStopList.setData([]);
          } else {
            this.routeStopList.setData(data);
          }
        });
      }

      if (routeId === this.allRoute._id && routeId !== this._lastRouteId) {
        this.dataService.getAllRouteStops().then(res => {
          const { status, data } = res;
          if (status !== StatusCode.Ok || !data.length) {
            this.routeStopList.setData([]);
          } else {
            this.routeStopList.setData(data);
          }
        });
      }
    });

    this.filteredPlaceOptions = this.nameControl.valueChanges.pipe(
      startWith(''),
      map(val => {
        const name = typeof val === 'string' ? val : val?.name;
        return name ? this._filter(name as string) : this.placeOptions.slice();
      })
    );
  }

  ngOnDestroy() {
    this._sub.unsubscribe();
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
