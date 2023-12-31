import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpStatusCode as StatusCode } from '@angular/common/http';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { DataService } from '../data.service';
import download from '../shared/download';
import PathQuerySetter from '../shared/path-query-setter';
import TableDataSource from '../shared/table-data-source';
import { toTitleCase } from '../shared/utils';
import {
  BusRoute,
  City,
  PlaceTd,
  RouteStopTd,
  RouteStop,
  Place,
} from '../types';

function nameControlSetter(
  placeOptions: PlaceTd[],
  nameControl: FormControl,
  placeId: Place['_id']
) {
  const selectedPlace = placeOptions.find(place => place._id === placeId);
  // trigger autocomplete to update options
  nameControl.setValue(' ');

  if (selectedPlace) {
    nameControl.setValue(selectedPlace);
    return;
  }
  nameControl.setValue('');
}

@Component({
  selector: 'app-route-stop',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTableModule,
  ],
  templateUrl: './route-stop.component.html',
  styleUrls: ['./route-stop.component.scss'],
})
export class RouteStopComponent implements OnInit, OnDestroy {
  private _filter(name: string): PlaceTd[] {
    const filterRegex = new RegExp(name, 'i');
    return this.placeOptions.filter(place => filterRegex.test(place.name));
  }
  private _sub: Subscription = new Subscription();
  private _lastCityId = '';
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
  routeStopList = new TableDataSource<RouteStopTd>([]);
  selectedRouteStop: RouteStopTd['_id'] = '';
  placeOptions: PlaceTd[] = [];
  filteredPlaceOptions: Observable<PlaceTd[]> = new Observable();
  displayedColumns = ['name', 'distance', 'cityId'];
  url: PathQuerySetter;

  // form properties
  nameControl = new FormControl<string | PlaceTd>('', [
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

    // set query parameters to default 'all' if none are provided
    if (!cityId && !routeId) {
      this.url.setQueryParams();
    }

    Promise.all([
      this.dataService.getAllCities(),
      this.dataService.getAllBusRoutes(),
    ])
      .then(([cityRes, busRouteRes]) => {
        const allCity = cityRes.data as City[];
        const reqCity = allCity.find(city => city._id === cityId);

        this.allBusRoutes = busRouteRes.data as BusRoute[];
        const reqBusRoute = this.allBusRoutes.find(
          route => route._id === routeId
        );
        const busRouteCity = allCity.find(
          city => city._id === (reqBusRoute?.cityId as City)?._id
        );

        // set query parameters to default 'all' if provided params are invalid
        if (!reqBusRoute && !reqCity) {
          this.url.setQueryParams();
        }

        // ignore cityId if routeId is valid
        if (reqBusRoute && busRouteCity) {
          this.url.setQueryParams({
            cityId: busRouteCity._id,
            routeId: reqBusRoute._id,
          });
          this.selectedRoute = reqBusRoute;
          this.selectedCity = busRouteCity;
        }

        // set selected city to cityId if routeId is invalid or not provided
        if (reqCity && !reqBusRoute) {
          this.url.setQueryParams({
            cityId: reqCity._id,
            routeId: this.allRoute._id,
          });
          this.selectedCity = reqCity;
          this.selectedRoute = this.allRoute;
        }

        // update cityRouteList based on selected city
        this.cityRouteList = this.allBusRoutes.filter(busRoute =>
          this.selectedCity === this.allCity
            ? true
            : (busRoute.cityId as City)._id === this.selectedCity._id
        );
      })
      .catch(err => {
        this._snackBar.open(`${err.message}, try again later`, 'Close', {
          duration: 3000,
        });
      });
  }

  get cityList() {
    return this.dataService.cityList;
  }

  setEditMode(
    isEditMode: boolean,
    editRouteStop: RouteStop['_id'] = '',
    formVals: Record<string, boolean | string | number | PlaceTd> = {
      isActive: true,
    },
    nameControl = this.nameControl
  ) {
    this.isEditMode = isEditMode;
    this.selectedRouteStop = editRouteStop;

    if (!isEditMode) {
      nameControl.enable();
      this.routeStopForm.reset(formVals);
      return;
    }

    nameControl.disable();
    setTimeout(() => {
      this.routeStopForm.reset(formVals);
    }, 300);
  }

  editRouteStop(selectedRouteStop: RouteStop['_id'], data: RouteStop) {
    this.dataService.updateRouteStopById(selectedRouteStop, data).then(res => {
      const { status, data } = res;

      if (status === StatusCode.NotFound) return;

      if (status === StatusCode.Ok) {
        this._snackBar.open('Success', 'Close', { duration: 3000 });
        this.routeStopList.updateById(data._id, data);
        this.setEditMode(false);
        return;
      }
    });
  }

  addRouteStop(data: RouteStop) {
    this.dataService.addNewRouteStop(data).then(res => {
      const { status, data } = res;

      if (status === StatusCode.Created) {
        this._snackBar.open('Success', 'Close', { duration: 3000 });
        this.routeStopList.push(data);
        this.routeStopForm.reset({ isActive: true });
        return;
      }
    });
  }

  addNewPlaceAsRouteStop(
    placeData: Place,
    formData: Record<string, string | number | boolean>,
    nameControl: FormControl
  ) {
    this.dataService.addNewPlace(placeData).then(placeRes => {
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

      this.placeOptions.push(data);
      const routeStopData = { ...formData, placeId: data._id } as RouteStop;
      this.addRouteStop(routeStopData);
    });
  }

  routeStopFormOnSubmit() {
    const nameControl = this.nameControl;
    const distanceControl = this.distanceControl;

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
    const distance = Number(distanceControl.value);
    const formData = {
      routeId: this.selectedRoute._id,
      distance,
      isActive: this.isActiveControl.value ?? true,
    };

    if (this.isEditMode) {
      const place = name as PlaceTd;
      const routeStopData = { ...formData, placeId: place._id } as RouteStop;

      this.editRouteStop(this.selectedRouteStop, routeStopData);
      return;
    }

    if (typeof name === 'object') {
      const place = name as PlaceTd;
      const routeStopData = { ...formData, placeId: place._id } as RouteStop;

      this.addRouteStop(routeStopData);
      return;
    }

    if (typeof name === 'string') {
      const placeData = {
        cityId: this.selectedCity._id,
        name: toTitleCase(name),
        isActive: this.isActiveControl.value,
      } as Place;

      this.addNewPlaceAsRouteStop(placeData, formData, nameControl);
    }
  }

  selectCityOnChange(e: MatSelectChange) {
    const city = e.value as City;

    this.url.setQueryParams({ cityId: city._id });

    if (city === this.allCity) {
      this.cityRouteList = [...this.allBusRoutes];
      return;
    }

    this.cityRouteList = this.allBusRoutes.filter(
      busRoute => (busRoute.cityId as City)._id === city._id
    );

    // if selected route is not in the city, set route to 'all'
    if (this.selectedRoute.cityId !== city._id) {
      this.url.setQueryParams({ cityId: city._id, routeId: this.allRoute._id });
      this.selectedRoute = this.allRoute;
    }
  }

  selectRouteOnChange(e: MatSelectChange) {
    const busRoute = e.value as BusRoute;
    this.url.setQueryParams({ routeId: busRoute._id });
  }

  rowOnClick(row: RouteStopTd) {
    // const nameControl = this.routeStopForm.get('name');
    const rowId = row._id;

    // deselect row if already selected
    if (rowId === this.selectedRouteStop) {
      this.setEditMode(false);
      return;
    }

    const rowCityId = row.placeId.cityId._id;
    const rowRouteId = row.routeId;
    const reqCity = this.cityList.find(city => city._id === rowCityId);
    const reqBusRoute = this.allBusRoutes.find(
      route => route._id === rowRouteId
    );

    // set selected city
    if (reqCity && this.selectedCity !== reqCity) {
      this.selectedCity = reqCity;
    }

    // set selected route
    if (reqBusRoute && this.selectedRoute !== reqBusRoute) {
      this.selectedRoute = reqBusRoute;
    }

    // get place name from autocomplete options to fix FormControl.setValue() input bug with autcomplete
    const selectedPlace = this.placeOptions.find(
      place => place._id === row.placeId._id
    );

    this.url.setQueryParams({
      cityId: reqCity?._id ?? this.allCity._id,
      routeId: reqBusRoute?._id ?? this.allRoute._id,
    });
    this.setEditMode(true, rowId, {
      name: selectedPlace ?? '',
      distance: row.distance,
      isActive: row.isActive,
    });
  }

  deleteOnClick(placeId: RouteStop['_id']) {
    // const nameControl = this.routeStopForm.get('name');
    this.dataService.deleteRouteStopById(placeId).then(res => {
      const { status } = res;

      if (status === StatusCode.Ok) {
        this.routeStopList.removeById(placeId);
        this._snackBar.open('Deleted', 'Close', {
          duration: 3000,
        });
        this.setEditMode(false);
      }
    });
  }

  navigateTo(cityId: string, routeStopId: string) {
    const routeStop = this.routeStopList.findById(routeStopId);
    this._router.navigate(['places'], {
      queryParams: {
        cityId,
        placeId: routeStop?.placeId._id,
      },
      queryParamsHandling: 'merge',
    });
  }

  editOrDlOnClick(cityId: string, routeStopId: string) {
    if (this.isEditMode) {
      this.navigateTo(cityId, routeStopId);
      return;
    }

    download(this.routeStopList.value, 'route-stops');
  }

  // helper function for autocomplete to parse object to string
  displayFn(place: PlaceTd): string {
    return place && place.name ? place.name : '';
  }

  ngOnInit() {
    this._sub = this._route.queryParamMap.subscribe(params => {
      const cityId = params.get('cityId') ?? '';
      const routeId = params.get('routeId') ?? '';
      const placeId = params.get('placeId') ?? '';

      if (cityId === this.allCity._id && cityId !== this._lastCityId) {
        this.dataService.getAllPlaces().then(res => {
          const { status, data } = res;
          this._lastCityId = cityId;

          if (status !== StatusCode.Ok || !data.length) {
            this.placeOptions = [];
          } else {
            this.placeOptions = data;
          }

          nameControlSetter(this.placeOptions, this.nameControl, placeId);
        });
      }

      if (
        cityId &&
        cityId !== this.allCity._id &&
        cityId !== this._lastCityId
      ) {
        this.dataService.getPlacesByCityId(cityId).then(res => {
          const { status, data } = res;
          this._lastCityId = cityId;

          if (status !== StatusCode.Ok || !data.length) {
            this.placeOptions = [];
          } else {
            this.placeOptions = data;
          }

          nameControlSetter(this.placeOptions, this.nameControl, placeId);
        });
      }

      if (routeId === this.allRoute._id) {
        this.dataService.getAllRouteStops().then(res => {
          const { status, data } = res;

          if (status !== StatusCode.Ok || !data.length) {
            this.routeStopList.setData([]);
          } else {
            // set routeStopList data based on cityId
            const filteredRouteStops = data.filter(routeStop =>
              cityId === this.allCity._id
                ? true
                : routeStop.placeId.cityId._id === cityId
            );
            this.routeStopList.setData(filteredRouteStops);
          }
        });
      }

      if (routeId && routeId !== this.allRoute._id) {
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

    // update autocomplete options based on input using _filter function
    this.filteredPlaceOptions = this.nameControl.valueChanges.pipe(
      startWith(''),
      map(val => {
        const name = typeof val === 'string' ? val : val?.name;
        return name ? this._filter(name as string) : [...this.placeOptions];
      })
    );

    // prevent non-numeric characters in distance input
    const distanceInput = document.querySelector(
      'input[formControlName="distance"]'
    );
    distanceInput?.addEventListener('input', (event: Event) => {
      const input = event.target as HTMLInputElement;
      input.value =
        input.value.replace(/[^\d.]/g, '').match(/^(\d+)?(\.\d{0,2})?/)?.[0] ||
        '';
    });
  }

  ngOnDestroy() {
    this._sub.unsubscribe();
  }
}
