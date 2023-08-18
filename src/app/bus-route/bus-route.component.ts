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
import { Subscription } from 'rxjs';
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
import PathQuerySetter from '../shared/path-query-setter';
import TableDataSource from '../shared/table-data-source';
import { toTitleCase } from '../shared/utils';
import { City, BusRoute } from '../types';

function getAllBusRoutes(
  service: DataService,
  routeList: TableDataSource<BusRoute>
) {
  service.getAllBusRoutes().then(res => {
    if (res.status !== StatusCode.Ok || !res.data.length) {
      routeList.setData([]);
      return;
    }
    routeList.setData(res.data);
  });
}

@Component({
  selector: 'app-bus-route',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
  template: `
    <div class="is-flex width-breakpoint-768">
      <mat-form-field appearance="outline" color="accent">
        <mat-label>Select a city</mat-label>
        <mat-select
          [(value)]="selectedCity"
          (selectionChange)="selectCityOnChange($event)"
          [disabled]="isCitySelectDisabled">
          <mat-option [value]="allCity">All Cities</mat-option>
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
      <table mat-table [dataSource]="routeList">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Place</th>
          <td mat-cell *matCellDef="let element">{{ element.name }}</td>
        </ng-container>
        <ng-container matColumnDef="cityId">
          <th mat-header-cell *matHeaderCellDef>City</th>
          <td mat-cell *matCellDef="let element">
            {{ element.cityId?.name || 'n/a' }}
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr
          mat-row
          (click)="rowOnClick(row)"
          [class.selected]="selectedBusRoute === row._id"
          *matRowDef="let row; columns: displayedColumns"></tr>

        <tr class="mat-row" *matNoDataRow>
          <td class="mat-cell" colspan="4">Empty</td>
        </tr>
      </table>
    </div>

    <div
      class="is-flex is-justify-content-space-around mt-4 width-breakpoint-768">
      <button
        mat-raised-button
        color="warn"
        class="uniform-button"
        [disabled]="!selectedBusRoute"
        (click)="deleteOnClick(selectedBusRoute)">
        Delete
      </button>
      <button
        mat-raised-button
        color="accent"
        class="uniform-button"
        [disabled]="!selectedBusRoute"
        (click)="navigateTo(selectedBusRoute)">
        Add Stops
      </button>
    </div>
  `,
  styleUrls: ['./bus-route.component.scss'],
})
export class BusRouteComponent implements OnInit, OnDestroy {
  private _sub: Subscription = new Subscription();
  allCity: City = {
    _id: 'all',
    name: 'all routes',
    isActive: true,
  };
  selectedCity = this.allCity;
  selectedBusRoute: BusRoute['_id'] = '';
  // routeList: BusRoute[] = [];
  routeList = new TableDataSource<BusRoute>([]);
  displayedColumns = ['name', 'cityId'];
  url: PathQuerySetter;

  // form properties
  nameControl = new FormControl('', [
    Validators.required,
    Validators.minLength(3),
  ]);
  isActiveControl = new FormControl(true, [Validators.required]);
  busRouteForm = new FormGroup({
    name: this.nameControl,
    isActive: this.isActiveControl,
  });
  isCitySelectDisabled = false;
  isEditMode = false;

  constructor(
    private _snackBar: MatSnackBar,
    private _router: Router,
    private _route: ActivatedRoute,
    private dataService: DataService
  ) {
    this.url = new PathQuerySetter(this._router, this._route, {
      cityId: 'all',
    });
    const cityId = this._route.snapshot.queryParamMap.get('cityId');

    if (!cityId) {
      this.dataService.getAllCities();
      this.url.setQueryParams();
      return;
    }

    this.dataService.getAllCities().then(res => {
      const cityList = res.data as City[];
      const currentCity = cityList.find(city => city._id === cityId);

      // if cityId is not valid, set allCity and get all routes
      if (!currentCity) {
        this.url.setQueryParams();
        return;
      }

      if (currentCity === this.allCity) return;

      this.selectedCity = currentCity;
    });
  }

  get cityList() {
    return this.dataService.cityList;
  }

  busRouteFormOnSubmit() {
    const nameControl = this.nameControl;
    if (!nameControl || !nameControl.value) return;
    if (this.selectedCity === this.allCity) {
      this._snackBar.open('Please select a city', 'Close', {
        duration: 3000,
      });
      return;
    }

    const formData = {
      cityId: this.selectedCity._id,
      name: toTitleCase(nameControl.value),
      isActive: this.busRouteForm.value.isActive,
    } as BusRoute;

    if (this.isEditMode) {
      this.dataService
        .updateBusRouteById(this.selectedBusRoute, formData)
        .then(res => {
          const { status, data } = res;
          if (status === StatusCode.NotFound) return;
          if (status === StatusCode.Conflict) {
            nameControl.setErrors({ error: 'duplicate' });
            this._snackBar.open('Name already exists', 'Close', {
              duration: 3000,
            });
            return;
          }

          if (status === StatusCode.Ok) {
            this._snackBar.open('Update success', 'Close', { duration: 3000 });
            this.routeList.updateById(data._id, data);
            this.busRouteForm.reset({ isActive: true });
            this.isCitySelectDisabled = false;
            this.isEditMode = false;
            this.selectedBusRoute = '';
          }
        });
      return;
    }

    this.dataService.addNewBusRoute(formData).then(res => {
      const { status, data } = res;

      if (status === StatusCode.Conflict) {
        nameControl.setErrors({ conflict: true });
        this._snackBar.open('Name already exists', 'Close', {
          duration: 3000,
        });
        return;
      }

      if (status === StatusCode.Created) {
        this._snackBar.open('New route added', 'Close', { duration: 3000 });
        this.routeList.push(data);
        this.busRouteForm.reset({ isActive: true });
      }
    });
  }

  // on row click when route is selected for editing
  rowOnClick(row: BusRoute) {
    if (row._id === this.selectedBusRoute) {
      this.busRouteForm.reset({ isActive: true });
      this.url.setQueryParams({ placeId: null });
      this.isCitySelectDisabled = false;
      this.isEditMode = false;
      this.selectedBusRoute = '';
      return;
    }

    const cityId = this._route.snapshot.queryParamMap.get('cityId');
    const routeCity = this.cityList.find(
      city => city._id === (row.cityId as City)._id
    );

    if (!routeCity) return;

    this.isEditMode = true;
    this.isCitySelectDisabled = true;
    this.selectedCity = routeCity;
    this.selectedBusRoute = row._id;
    this.busRouteForm.setValue({
      name: row.name,
      isActive: row.isActive,
    });

    if (cityId !== routeCity?._id) {
      this.url.setQueryParams({ cityId: routeCity?._id });
      // return
    }

    // this.url.setQueryParams({ routeId: row._id })
  }

  deleteOnClick(busRouteId: string) {
    this.dataService.deleteBusRouteById(busRouteId).then(res => {
      const { status } = res;

      if (status === StatusCode.Ok) {
        this.routeList.removeById(busRouteId);
        this._snackBar.open('Deleted', 'Close', {
          duration: 3000,
        });
        this.selectedBusRoute = '';
        this.isCitySelectDisabled = false;
        this.isEditMode = false;
        this.busRouteForm.reset({ isActive: true });
      }
    });
  }

  navigateTo(busRouteId: string) {
    this._router.navigate(['route-stops'], {
      queryParams: {
        routeId: busRouteId,
      },
      queryParamsHandling: 'merge',
    });
  }

  selectCityOnChange(e: MatSelectChange) {
    if (e.value === this.allCity) {
      this.url.setQueryParams();
      return;
    }

    const city = e.value as City;
    this.url.setQueryParams({ cityId: city._id });
  }

  ngOnInit() {
    this._sub = this._route.queryParamMap.subscribe(params => {
      const cityId = params.get('cityId') ?? '';

      if (!cityId || cityId === this.allCity._id) {
        getAllBusRoutes(this.dataService, this.routeList);
        return;
      }

      this.dataService.getRoutesByCityId(cityId).then(res => {
        const { status, data } = res;

        if (status === StatusCode.Ok && data.length) {
          // this.routeList.setData(data);
          this.routeList.setData(data);
        } else {
          // this.placeList.setData([]);
          this.routeList.setData([]);
        }
      });
    });
  }

  ngOnDestroy() {
    this._sub.unsubscribe();
  }
}
