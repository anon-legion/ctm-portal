import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpStatusCode as StatusCode } from '@angular/common/http';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { DataService } from '../data.service';
import download from '../shared/download';
import lngLatValidator from '../shared/lng-lat-validator';
import TableDataSource from '../shared/table-data-source';
import { toLngLat, toTitleCase } from '../shared/utils';
import { City } from '../types';

@Component({
  selector: 'app-city',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTableModule,
  ],
  template: `
    <form
      class="container is-flex is-flex-direction-column mb-2 width-breakpoint-768"
      [formGroup]="cityForm">
      <mat-form-field appearance="outline" color="accent">
        <mat-label>City Name</mat-label>
        <input
          matInput
          type="text"
          formControlName="name"
          class="is-capitalized" />
        <mat-error *ngIf="cityForm.get('name')?.invalid">
          Name already exists
        </mat-error>
      </mat-form-field>
      <div
        class="is-flex is-justify-content-space-between is-align-items-center width-breakpoint-768">
        <mat-slide-toggle
          class="mb-2"
          color="accent"
          formControlName="isActive">
          Is Active
          <!-- {{ cityForm.value.isActive ? 'Active' : 'Inactive' }} -->
        </mat-slide-toggle>
        <mat-form-field appearance="outline" color="accent">
          <mat-label>Code</mat-label>
          <input matInput type="text" formControlName="code" />
        </mat-form-field>
        <mat-form-field appearance="outline" color="accent">
          <mat-label>Center</mat-label>
          <input matInput type="text" formControlName="center" />
        </mat-form-field>
        <mat-form-field appearance="outline" color="accent">
          <mat-label>Zoom</mat-label>
          <input
            matInput
            type="text"
            (keydown)="zoomOnKeyDown($event)"
            (ngModelChange)="zoomOnChange($event)"
            formControlName="zoom"
            pattern="^[0-9]+(.[0-9]{1,2})?$" />
        </mat-form-field>
      </div>
      <button
        type="button"
        mat-raised-button
        color="primary"
        [disabled]="!cityForm.valid"
        (click)="cityFormOnSubmit()">
        {{ isEditMode ? 'Update' : 'Add' }}
      </button>
    </form>

    <mat-divider class="width-breakpoint-768"></mat-divider>
    <div class="list-container mt-2 width-breakpoint-768">
      <table mat-table [dataSource]="cityListTd">
        <ng-container matColumnDef="city">
          <th mat-header-cell *matHeaderCellDef>City</th>
          <td mat-cell *matCellDef="let element">{{ element.name }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr
          mat-row
          (click)="rowOnClick(row)"
          [class.selected]="selectedCity === row._id"
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
        [disabled]="!selectedCity"
        (click)="deleteOnClick(selectedCity)">
        Delete
      </button>
      <button
        mat-raised-button
        color="accent"
        class="uniform-button"
        (click)="addOrDlOnClick(selectedCity)">
        {{ isEditMode ? 'Add Routes' : 'Download' }}
      </button>
    </div>
  `,
  styleUrls: ['./city.component.scss'],
})
export class CityComponent {
  selectedCity: City['_id'] = '';
  cityListTd = new TableDataSource<City>([]);
  displayedColumns = ['city'];

  // form properties
  nameControl = new FormControl('', [
    Validators.required,
    Validators.minLength(4),
  ]);
  isActiveControl = new FormControl(true, [Validators.required]);
  codeControl = new FormControl<string>('', [
    Validators.required,
    Validators.minLength(3),
  ]);
  centerControl = new FormControl<string>('', [lngLatValidator]);
  zoomControl = new FormControl<number | null>(null, [
    Validators.min(0),
    Validators.max(22),
  ]);
  cityForm = new FormGroup({
    name: this.nameControl,
    isActive: this.isActiveControl,
    code: this.codeControl,
    center: this.centerControl,
    zoom: this.zoomControl,
  });
  isEditMode = false;

  constructor(
    private _snackBar: MatSnackBar,
    private _router: Router,
    private dataService: DataService
  ) {
    this.dataService.getAllCities().then(res => {
      if (res.ok) {
        this.cityListTd.setData(this.cityList);
      }
    });
  }

  get cityList() {
    return this.dataService.cityList;
  }

  setEditMode(
    isEditMode: boolean,
    selectedCity: City['_id'] = '',
    formVals: Record<string, boolean | string | number> = {
      isActive: true,
    }
  ) {
    this.isEditMode = isEditMode;
    this.selectedCity = selectedCity;
    this.cityForm.reset(formVals);
  }

  editCity(cityId: City['_id'], data: City, nameControl: FormControl) {
    this.dataService.updateCityById(cityId, data).then(res => {
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
        this.cityListTd.updateById(data._id, data);
        this.setEditMode(false);
      }
    });
  }

  addCity(data: City, nameControl: FormControl) {
    this.dataService.addNewCity(data).then(res => {
      const { status, data } = res;

      if (status === StatusCode.Conflict) {
        nameControl.setErrors({ error: 'duplicate' });
        this._snackBar.open('Name already exists', 'Close', {
          duration: 3000,
        });
        return;
      }

      if (status === StatusCode.Created) {
        this._snackBar.open('New city added', 'Close', { duration: 3000 });
        this.cityListTd.push(data);
        this.cityForm.reset({ isActive: true });
      }
    });
  }

  cityFormOnSubmit() {
    const nameControl = this.nameControl;

    if (!nameControl || !nameControl.value) return;

    const center = this.centerControl.value
      ? toLngLat(this.centerControl.value)
      : null;
    const zoom = this.zoomControl.value ? +this.zoomControl.value : null;
    const formData = {
      ...this.cityForm.value,
      center,
      zoom,
      name: toTitleCase(nameControl.value),
    } as City;

    // update city
    if (this.isEditMode) {
      this.editCity(this.selectedCity, formData, nameControl);
      return;
    }

    // add new city
    this.addCity(formData, nameControl);
  }

  deleteOnClick(cityId: string) {
    this.dataService.deleteCityById(cityId).then(res => {
      const { status } = res;

      if (status === StatusCode.Ok) {
        this.cityListTd.removeById(cityId);
        this._snackBar.open('Deleted', 'Close', {
          duration: 3000,
        });
        this.setEditMode(false);
      }
    });
  }

  rowOnClick(row: City) {
    if (row._id === this.selectedCity) {
      this.setEditMode(false);
      return;
    }

    this.setEditMode(true, row._id, {
      name: row.name,
      isActive: row.isActive,
      code: row.code ?? '',
      center: row.center?.join(', ') ?? '',
      zoom: row.zoom ?? '',
    });
  }

  navigateTo(cityId: string) {
    this._router.navigate(['bus-routes'], {
      queryParams: { cityId },
      queryParamsHandling: 'merge',
    });
  }

  addOrDlOnClick(cityId: string) {
    if (this.isEditMode) {
      this.navigateTo(cityId);
      return;
    }

    download(this.cityList, 'cities');
  }

  zoomOnKeyDown(e: KeyboardEvent) {
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

  zoomOnChange(e: Event) {
    const input = +e;

    if (input === this.zoomControl.value || Number.isNaN(input)) return;

    this.zoomControl.setValue(Math.max(0, Math.min(22, input)));
  }
}
