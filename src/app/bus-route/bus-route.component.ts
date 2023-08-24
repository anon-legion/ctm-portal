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
import download from '../shared/download';
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
          [disabled]="isEditMode">
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
      <div
        class="is-flex is-justify-content-space-between is-align-items-center width-breakpoint-768">
        <mat-slide-toggle
          class="mb-2"
          color="accent"
          formControlName="isActive">
          Is Active
        </mat-slide-toggle>
        <mat-slide-toggle
          class="mb-2"
          color="accent"
          formControlName="isSymmetric">
          Is Symmetric
        </mat-slide-toggle>
        <mat-slide-toggle class="mb-2" color="accent" formControlName="hasPath">
          Has Path
        </mat-slide-toggle>
        <mat-form-field appearance="outline" color="accent">
          <mat-label>Weight</mat-label>
          <input
            matInput
            type="text"
            (keydown)="weightOnKeyDown($event)"
            (ngModelChange)="weightOnChange($event)"
            formControlName="weight"
            pattern="^[0-9]+(.[0-9]{1,2})?$" />
        </mat-form-field>
      </div>
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
        (click)="addOrDlOnClick(selectedBusRoute)">
        {{ isEditMode ? 'Add Stops' : 'Download' }}
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
  routeList = new TableDataSource<BusRoute>([]);
  displayedColumns = ['name', 'cityId'];
  url: PathQuerySetter;

  // form properties
  nameControl = new FormControl('', [
    Validators.required,
    Validators.minLength(3),
  ]);
  isActiveControl = new FormControl<boolean>(true, [Validators.required]);
  isSymmetricControl = new FormControl<boolean>(false, [Validators.required]);
  hasPathControl = new FormControl<boolean>(false, [Validators.required]);
  weightControl = new FormControl<number | null>(null, [Validators.min(0)]);
  busRouteForm = new FormGroup({
    name: this.nameControl,
    isActive: this.isActiveControl,
    isSymmetric: this.isSymmetricControl,
    hasPath: this.hasPathControl,
    weight: this.weightControl,
  });
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

  setEditMode(
    isEditMode: boolean,
    selectedBusRoute: BusRoute['_id'] = '',
    formVals: Record<string, boolean | string | number> = {
      isActive: true,
    }
  ) {
    this.isEditMode = isEditMode;
    this.selectedBusRoute = selectedBusRoute;
    this.busRouteForm.reset(formVals);
  }

  editBusRoute(
    routeId: BusRoute['_id'],
    data: BusRoute,
    nameControl: FormControl
  ) {
    this.dataService.updateBusRouteById(routeId, data).then(res => {
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
        this.setEditMode(false);
      }
    });
  }

  addBusRoute(data: BusRoute, nameControl: FormControl) {
    this.dataService.addNewBusRoute(data).then(res => {
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

  busRouteFormOnSubmit() {
    const nameControl = this.nameControl;

    if (!nameControl || !nameControl.value) return;
    if (this.selectedCity === this.allCity) {
      this._snackBar.open('Please select a city', 'Close', {
        duration: 3000,
      });
      return;
    }

    const weight = this.weightControl.value ? +this.weightControl.value : 0;
    const formData = {
      ...this.busRouteForm.value,
      cityId: this.selectedCity._id,
      name: toTitleCase(nameControl.value),
      weight,
    } as BusRoute;

    // update bus route
    if (this.isEditMode) {
      this.editBusRoute(this.selectedBusRoute, formData, nameControl);
      return;
    }

    // add new bus route
    this.addBusRoute(formData, nameControl);
  }

  // on row click when route is selected for editing
  rowOnClick(row: BusRoute) {
    if (row._id === this.selectedBusRoute) {
      this.setEditMode(false);
      return;
    }

    const cityId = this._route.snapshot.queryParamMap.get('cityId');
    const routeCity = this.cityList.find(
      city => city._id === (row.cityId as City)._id
    );

    if (!routeCity) return;

    this.setEditMode(true, row._id, {
      name: row.name,
      isActive: row.isActive,
      isSymmetric: row.isSymmetric ?? false,
      hasPath: row.hasPath ?? false,
      weight: row.weight ?? '',
    });
    this.selectedCity = routeCity;

    if (cityId !== routeCity?._id) {
      this.url.setQueryParams({ cityId: routeCity?._id });
    }
  }

  deleteOnClick(busRouteId: string) {
    this.dataService.deleteBusRouteById(busRouteId).then(res => {
      const { status } = res;

      if (status === StatusCode.Ok) {
        this.routeList.removeById(busRouteId);
        this._snackBar.open('Deleted', 'Close', {
          duration: 3000,
        });
        this.setEditMode(false);
      }
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

  navigateTo(busRouteId: string) {
    this._router.navigate(['route-stops'], {
      queryParams: {
        routeId: busRouteId,
      },
      queryParamsHandling: 'merge',
    });
  }

  addOrDlOnClick(busRouteId: string) {
    if (this.isEditMode) {
      this.navigateTo(busRouteId);
      return;
    }

    download(this.routeList.value, 'routes');
  }

  weightOnKeyDown(e: KeyboardEvent) {
    const { key } = e;
    const pattern = /[0-9]/;

    if (
      !pattern.test(key) &&
      key !== 'Backspace' &&
      !(e.ctrlKey && key === 'v')
    ) {
      // invalid character, prevent input
      e.preventDefault();
    }
  }

  weightOnChange(e: Event) {
    const input = +e;

    if (input === this.weightControl.value || Number.isNaN(input)) return;

    this.weightControl.setValue(Math.max(0, input));
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
