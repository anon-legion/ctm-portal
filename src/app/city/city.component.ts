import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
import {
  MatListModule,
  MatListOption,
  MatSelectionListChange,
} from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { DataService } from '../data.service';
import { City } from '../types';
import { SelectionModel } from '@angular/cdk/collections';

function sortCityArr(cities: City[]): City[] {
  const ascending = cities.sort((a, b) => a.name.localeCompare(b.name));
  return ascending;
}

function toTitleCase(text: string) {
  return text.toLowerCase().replace(/\b./g, a => a.toUpperCase());
}

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
  ],
  template: `
    <form
      class="container is-flex is-flex-direction-column p-1 mb-2 width-breakpoint-768"
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
        Add
      </button>
    </form>
    <mat-divider class="width-breakpoint-768"></mat-divider>
    <div class="list-container mt-2 width-breakpoint-768">
      <mat-selection-list
        #cities
        [multiple]="false"
        (selectionChange)="selectionOnChange(cities.selectedOptions.selected)">
        <mat-list-option *ngFor="let city of cityList" [value]="city._id">
          {{ city.name }}
        </mat-list-option>
      </mat-selection-list>
    </div>
    <div
      class="is-flex is-justify-content-space-around mt-4 width-breakpoint-768">
      <button mat-raised-button color="accent" class="uniform-button">
        Edit
      </button>
      <button mat-raised-button color="warn" class="uniform-button">
        Delete
      </button>
      <button mat-raised-button color="accent" class="uniform-button">
        Add Routes
      </button>
    </div>
  `,
  styleUrls: ['./city.component.scss'],
})
export class CityComponent {
  title = 'CTM Builder';
  dataService: DataService = inject(DataService);
  cityList: City[] = [];
  cityForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(4)]),
    isActive: new FormControl(true, [Validators.required]),
  });
  isEditMode = false;

  constructor() {
    this.dataService.getAllCities().then(res => {
      console.log(res);
      this.cityList = sortCityArr(res);
    });
  }

  // TODO: Add edit mode, and Delete city

  cityFormOnSubmit() {
    if (!this.cityForm.value.name) return;
    // TODO: add spinner and handle errors

    const formData = {
      name: toTitleCase(this.cityForm.value.name),
      isActive: this.cityForm.value.isActive,
    } as City;

    this.dataService.addNewCity(formData).then(res => {
      const { status, data } = res;
      if (status === StatusCode.Conflict) {
        for (const key in data) {
          const control = this.cityForm.get(key);
          if (!data[key as keyof typeof data] || !control) continue;
          control.setErrors({ error: 'duplicate' });
        }
        return;
      }
      if (status === StatusCode.Created) {
        this.cityList.push(data);
        this.cityList = sortCityArr(this.cityList);
        this.cityForm.reset({ isActive: true });
      }
    });
  }

  selectionOnChange(selectedOptions: MatListOption[]) {
    const [selectedOption] = selectedOptions;
    console.log(selectedOption.value);
  }
}
