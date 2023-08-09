import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatListModule, MatListOption } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
// import { MatTable, MatTableModule } from '@angular/material/table';
import { DataService } from '../data.service';
import { City } from '../types';
import { sortObjArrByProp, toTitleCase } from '../shared/utils';

@Component({
  selector: 'app-city',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatListModule,
    MatDividerModule,
    MatSnackBarModule,
    // MatTableModule,
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

    <!-- TODO: add spinner  -->
    <mat-divider class="width-breakpoint-768"></mat-divider>
    <div class="list-container mt-2 width-breakpoint-768">
      <mat-selection-list
        #cities
        [multiple]="false"
        (selectionChange)="selectionOnChange(cities.selectedOptions.selected)">
        <mat-list-option
          *ngFor="let city of cityList"
          [value]="city._id"
          [selected]="">
          {{ city.name }}
        </mat-list-option>
      </mat-selection-list>
      <!-- <table mat-table [dataSource]="cityList">
        <ng-container matColumnDef="city">
          <th mat-header-cell *matHeaderCellDef>City</th>
          <td mat-cell *matCellDef="let element">{{ element.name }}</td>
        </ng-container>

        <ng-container matColumnDef="is active">
          <th mat-header-cell *matHeaderCellDef>Is Active</th>
          <td mat-cell *matCellDef="let element">{{ element.isActive }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr
          mat-row
          (click)="rowOnClick(row)"
          *matRowDef="let row; columns: displayedColumns"></tr>
      </table> -->
    </div>

    <div
      class="is-flex is-justify-content-space-around mt-4 width-breakpoint-768">
      <button
        mat-raised-button
        color="accent"
        class="uniform-button"
        (click)="editOnClick(selectedCity)">
        Edit
      </button>
      <button
        mat-raised-button
        color="warn"
        class="uniform-button"
        (click)="deleteOnClick(selectedCity)">
        Delete
      </button>
      <button
        mat-raised-button
        color="accent"
        class="uniform-button"
        (click)="navigateTo(selectedCity)">
        Add Routes
      </button>
    </div>
  `,
  styleUrls: ['./city.component.scss'],
})
export class CityComponent {
  title = 'CTM Builder';
  dataService: DataService = inject(DataService);
  cityForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(4)]),
    isActive: new FormControl(true, [Validators.required]),
  });
  isEditMode = false;
  selectedCity = '';
  displayedColumns: string[] = ['city', 'is active'];

  constructor(
    private router: Router,
    private _snackBar: MatSnackBar
  ) {
    this.dataService.getAllCities().then(res => {
      if (res.ok) {
        this.cityList = sortObjArrByProp<City>(res.data, 'name');
      }
    });
  }

  get cityList() {
    return this.dataService.cityList;
  }

  set cityList(value: City[]) {
    this.dataService.cityList = value;
  }

  cityFormOnSubmit() {
    if (!this.cityForm.value.name) return;

    const formData = {
      name: toTitleCase(this.cityForm.value.name),
      isActive: this.cityForm.value.isActive,
    } as City;

    if (this.isEditMode) {
      formData._id = this.selectedCity;
      this.dataService.updateCityById(this.selectedCity, formData).then(res => {
        const { status, data } = res;
        if (status === StatusCode.NotFound) return;
        if (status === StatusCode.Ok) {
          this._snackBar.open('Update success', 'Close', { duration: 3000 });
          const index = this.cityList.findIndex(
            city => city._id === this.selectedCity
          );
          this.cityList[index] = data;
          this.cityList = sortObjArrByProp<City>(this.cityList, 'name');
          this.cityForm.reset({ isActive: true });
          this.isEditMode = false;
        }
      });
      return;
    }

    this.dataService.addNewCity(formData).then(res => {
      const { status, data } = res;
      const control = this.cityForm.get('name');
      if (status === StatusCode.Conflict && control) {
        control.setErrors({ error: 'duplicate' });
        return;
      }
      if (status === StatusCode.Created) {
        this._snackBar.open('New city added', 'Close', { duration: 3000 });
        this.cityList.push(data);
        this.cityList = sortObjArrByProp<City>(this.cityList, 'name');
        this.cityForm.reset({ isActive: true });
      }
    });
  }

  selectionOnChange(selectedOptions: MatListOption[]) {
    const [selectedOption] = selectedOptions;
    this.selectedCity = selectedOption.value;
  }

  deleteOnClick(cityId: string) {
    this.dataService.deleteCityById(cityId).then(res => {
      const { status } = res;
      if (status === StatusCode.Ok) {
        this.cityList = this.cityList.filter(city => city._id !== cityId);
        this.selectedCity = '';
      }
    });
  }

  editOnClick(cityId: string) {
    const cityData = this.cityList.find(city => city._id === cityId);
    if (!cityData) return;
    this.isEditMode = true;
    this.cityForm.setValue({
      name: cityData.name,
      isActive: cityData.isActive ?? true,
    });
  }

  navigateTo(route: string) {
    this.router.navigate(['bus-routes'], {
      queryParams: { cityId: route },
      queryParamsHandling: 'merge',
    });
  }

  // rowOnClick(row: City) {
  //   this.cityForm.setValue({
  //     name: row.name,
  //     isActive: row.isActive ?? true,
  //   });
  // }
}
