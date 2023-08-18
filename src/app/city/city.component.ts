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
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { DataService } from '../data.service';
import TableDataSource from '../shared/table-data-source';
import { toTitleCase } from '../shared/utils';
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
    MatIconModule,
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
        <button
          *ngIf="cityForm.value.name"
          matSuffix
          mat-icon-button
          aria-label="Clear"
          (click)="cityForm.get('name')?.reset('')">
          <mat-icon>close</mat-icon>
        </button>
      </mat-form-field>
      <mat-slide-toggle class="mb-2" color="accent" formControlName="isActive">
        {{ cityForm.value.isActive ? 'Active' : 'Inactive' }}
      </mat-slide-toggle>
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
        [disabled]="!selectedCity"
        (click)="navigateTo(selectedCity)">
        Add Routes
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
  cityForm = new FormGroup({
    name: this.nameControl,
    isActive: this.isActiveControl,
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

  cityFormOnSubmit() {
    const nameControl = this.nameControl;
    if (!nameControl || !nameControl.value) return;

    const formData = {
      name: toTitleCase(nameControl.value),
      isActive: this.cityForm.value.isActive,
    } as City;

    if (this.isEditMode) {
      this.dataService.updateCityById(this.selectedCity, formData).then(res => {
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
          this.cityForm.reset({ isActive: true });
          this.isEditMode = false;
          this.selectedCity = '';
        }
      });
      return;
    }

    this.dataService.addNewCity(formData).then(res => {
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

  deleteOnClick(cityId: string) {
    this.dataService.deleteCityById(cityId).then(res => {
      const { status } = res;

      if (status === StatusCode.Ok) {
        this.cityListTd.removeById(cityId);
        this._snackBar.open('Deleted', 'Close', {
          duration: 3000,
        });
        this.selectedCity = '';
        this.isEditMode = false;
      }
    });
  }

  rowOnClick(row: City) {
    console.log(row);
    if (row._id === this.selectedCity) {
      this.cityForm.reset({ isActive: true });
      this.isEditMode = false;
      this.selectedCity = '';
      return;
    }

    this.isEditMode = true;
    this.selectedCity = row._id;
    this.cityForm.setValue({
      name: row.name,
      isActive: row.isActive,
    });
  }

  navigateTo(cityId: string) {
    this._router.navigate(['bus-routes'], {
      queryParams: { cityId },
      queryParamsHandling: 'merge',
    });
  }
}
