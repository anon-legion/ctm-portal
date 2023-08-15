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
  PlaceTableData,
  RouteStopTableData,
  RouteStop,
  Place,
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
  private _filter(name: string): PlaceTableData[] {
    const filterValue = name.toLowerCase();

    return this.placeOptions.filter(place =>
      place.name.toLowerCase().includes(filterValue)
    );
  }
  private _sub: Subscription = new Subscription();
  private _lastCityId = '';
  private _lastRouteId = '';
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
  selectedRouteStop: RouteStopTableData['_id'] = '';
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

    this.url.setQueryParams({ routeId: busRoute._id });
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

    const name = nameControl.value;
    const distance = Number(distanceControl.value) as number;

    if (this.isEditMode) {
      const place = name as PlaceTableData;
      const formData = {
        routeId: this.selectedRoute._id,
        placeId: place._id,
        distance,
        isActive: this.isActiveControl.value,
      } as RouteStop;
      this.dataService
        .updateRouteStopById(this.selectedRouteStop, formData)
        .then(res => {
          const { status, data } = res;
          if (status === StatusCode.Ok) {
            this._snackBar.open('Success', 'Close', { duration: 3000 });
            this.routeStopList.updateById(data._id, data);
            this.routeStopForm.reset({ isActive: true });
            this.selectedRouteStop = '';
            this.isEditMode = false;
            nameControl.enable();
            return;
          }
        });
      return;
    }

    if (typeof name === 'string') {
      const formData = {
        cityId: this.selectedCity._id,
        name: toTitleCase(name),
        isActive: this.isActiveControl.value,
      };
      this.dataService.addNewPlace(formData as Place).then(placeRes => {
        const { status, data } = placeRes;
        if (status === StatusCode.Conflict) {
          nameControl.setErrors({ conflict: true });
          this._snackBar.open('Name already exists', 'Close', {
            duration: 3000,
          });
          return;
        }
        if (status !== StatusCode.Created) {
          this._snackBar.open('Something went wrong', 'Close', {
            duration: 3000,
          });
          return;
        }
        this.dataService
          .addNewRouteStop({
            routeId: this.selectedRoute._id,
            placeId: data._id,
            distance,
            isActive: this.isActiveControl.value,
          } as RouteStop)
          .then(routeStopRes => {
            const { status, data } = routeStopRes;
            if (status === StatusCode.Created) {
              this._snackBar.open('Success', 'Close', { duration: 3000 });
              this.routeStopList.push(data);
              this.routeStopForm.reset({ isActive: true });
              return;
            }
          });
      });
    }

    if (typeof name === 'object') {
      const place = name as PlaceTableData;
      const formData = {
        routeId: this.selectedRoute._id,
        placeId: place._id,
        distance,
        isActive: this.isActiveControl.value,
      };
      this.dataService.addNewRouteStop(formData as RouteStop).then(res => {
        const { status, data } = res;
        if (status === StatusCode.Created) {
          this._snackBar.open('Success', 'Close', { duration: 3000 });
          this.routeStopList.push(data);
          this.routeStopForm.reset({ isActive: true });
          return;
        }
      });
    }
  }

  rowOnClick(row: RouteStopTableData) {
    console.log(row);
    const rowId = row._id;
    const rowCityId = row.placeId.cityId._id;
    const rowRouteId = row.routeId;
    const reqCity = this.cityList.find(city => city._id === rowCityId);
    const reqBusRoute = this.allBusRoutes.find(
      route => route._id === rowRouteId
    );
    const nameControl = this.routeStopForm.get('name');

    if (rowId === this.selectedRouteStop) {
      this.selectedRouteStop = '';
      this.isEditMode = false;
      this.routeStopForm.reset({ isActive: true });
      nameControl?.enable();
      return;
    }

    if (reqCity && this.selectedCity !== reqCity) {
      this.selectedCity = reqCity;
    }

    if (reqBusRoute && this.selectedRoute !== reqBusRoute) {
      this.selectedRoute = reqBusRoute;
    }

    const selectedPlace = this.placeOptions.find(
      place => place._id === row.placeId._id
    );

    this.url.setQueryParams({
      cityId: reqCity?._id ?? this.allCity._id,
      routeId: reqBusRoute?._id ?? this.allRoute._id,
    });
    this.isEditMode = true;
    this.selectedRouteStop = rowId;
    this.routeStopForm.setValue({
      name: selectedPlace ?? null,
      distance: row.distance,
      isActive: row.isActive,
    });
    nameControl?.disable();
  }

  displayFn(place: PlaceTableData): string {
    return place && place.name ? place.name : '';
  }

  ngOnInit() {
    this._sub = this._route.queryParamMap.subscribe(params => {
      const cityId = params.get('cityId');
      const routeId = params.get('routeId');

      if (cityId === this.allCity._id && cityId !== this._lastCityId) {
        this.dataService.getAllPlaces().then(res => {
          const { status, data } = res;
          this._lastCityId = cityId;
          this.selectedCity = this.allCity;

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

      if (routeId === this.allRoute._id && routeId !== this._lastRouteId) {
        this.dataService.getAllRouteStops().then(res => {
          const { status, data } = res;
          this.selectedRoute = this.allRoute;

          if (status !== StatusCode.Ok || !data.length) {
            this.routeStopList.setData([]);
          } else {
            this.routeStopList.setData(data);
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
