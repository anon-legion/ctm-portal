import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatListModule, MatListOption } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../data.service';
import { Place, City } from '../types';
import { sortObjArrByProp, toTitleCase } from '../shared/utils';

@Component({
  selector: 'app-places',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatListModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="is-flex width-breakpoint-768">
      <mat-form-field appearance="outline" color="accent">
        <mat-label>Select a city</mat-label>
        <mat-select
          [(value)]="selectedCity"
          (selectionChange)="selectCityOnChange($event)">
          <mat-option [value]="allCity">All Routes</mat-option>
          <mat-option *ngFor="let city of cityList" [value]="city">
            {{ city.name }}
          </mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <form
      class="container is-flex is-flex-direction-column mb-2 width-breakpoint-768"
      [formGroup]="placeForm">
      <mat-form-field appearance="outline" color="accent">
        <mat-label>Route Name</mat-label>
        <input
          matInput
          type="text"
          formControlName="name"
          class="is-capitalized" />
      </mat-form-field>
      <!-- <mat-form-field>
        <mat-label>Place alias</mat-label>
        <mat-chip-grid
          #chipGrid
          aria-label="Enter aliases"
          formControlName="alias">
          <mat-chip-row
            *ngFor="let keyword of keywords"
            (removed)="removeKeyword(keyword)">
            {{ keyword }}
            <button matChipRemove aria-label="'remove ' + keyword">
              <mat-icon>cancel</mat-icon>
            </button>
          </mat-chip-row>
        </mat-chip-grid>
        <input
          placeholder="New keyword..."
          [matChipInputFor]="chipGrid"
          (matChipInputTokenEnd)="add($event)" />
      </mat-form-field> -->
      <mat-slide-toggle class="mb-2" color="accent" formControlName="isActive">
        {{ placeForm.value.isActive ? 'Active' : 'Inactive' }}
      </mat-slide-toggle>
      <button
        type="button"
        mat-raised-button
        color="primary"
        [disabled]="!placeForm.valid"
        (click)="placeFormOnSubmit()">
        {{ isEditMode ? 'Update' : 'Add' }}
      </button>
    </form>

    <mat-divider class="width-breakpoint-768"></mat-divider>
    <div class="list-container mt-2 width-breakpoint-768">
      <mat-selection-list
        #busRoutes
        [multiple]="false"
        (selectionChange)="
          selectionOnChange(busRoutes.selectedOptions.selected)
        ">
        <mat-list-option
          *ngFor="let route of placeList"
          [value]="route._id"
          [selected]="">
          {{ route.name }}
        </mat-list-option>
      </mat-selection-list>
    </div>

    <div
      class="is-flex is-justify-content-space-around mt-4 width-breakpoint-768">
      <button
        mat-raised-button
        color="accent"
        class="uniform-button"
        (click)="editOnClick(selectedPlace)">
        Edit
      </button>
      <button
        mat-raised-button
        color="warn"
        class="uniform-button"
        (click)="deleteOnClick(selectedPlace)">
        Delete
      </button>
      <button
        mat-raised-button
        color="accent"
        class="uniform-button"
        (click)="navigateTo(selectedPlace)">
        Add Stops
      </button>
    </div>
  `,
  styleUrls: ['./places.component.scss'],
})
export class PlacesComponent {
  route = inject(ActivatedRoute);
  dataService: DataService = inject(DataService);
  placeForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    alias: new FormControl([] as string[]),
    isActive: new FormControl(true, [Validators.required]),
  });
  placeList: Place[] = [];
  selectedPlace = '';
  selectedCity: City = {} as City;
  isEditMode = false;
  allCity: City = {
    _id: 'all',
    name: 'all routes',
    isActive: true,
  };

  constructor(
    private _snackBar: MatSnackBar,
    private router: Router
  ) {}

  get cityList() {
    return this.dataService.cityList;
  }

  placeFormOnSubmit() {
    if (!this.placeForm.value.name) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const formData = {
      cityId: this.selectedCity._id,
      name: toTitleCase(this.placeForm.value.name),
      isActive: this.placeForm.value.isActive,
    } as Place;

    // update place
    if (this.isEditMode) {
      return;
    }

    // add new place
  }

  selectionOnChange(selectedOptions: MatListOption[]) {
    const [selectedOption] = selectedOptions;
    this.selectedPlace = selectedOption.value;
  }

  editOnClick(placeId: string) {
    const placeData = this.placeList.find(place => place._id === placeId);
    if (!placeData) return;
    this.isEditMode = true;
    this.placeForm.setValue({
      name: placeData.name,
      alias: placeData.alias ?? [],
      isActive: placeData.isActive ?? true,
    });
  }

  deleteOnClick(placeId: string) {
    console.log(placeId);
  }

  navigateTo(placeId: string) {
    console.log(placeId);
  }

  selectCityOnChange(e: MatSelectChange) {
    if (e.value === this.allCity) {
      // this.dataService.getAllPlaces().then(res => {
      //   if (res.status === StatusCode.Ok && res.data.length) {
      //     this.placeList = sortObjArrByProp<Place>(
      //       res.data,
      //       'name'
      //     ) as Place[];
      //     this.router.navigate([], {
      //       relativeTo: this.route,
      //     });
      //   } else {
      //     this.placeList = [];
      //   }
      // });
      return;
    }
    const city = e.value as City;
    // this.dataService.getPlaceByCityId(city._id).then(res => {
    //   if (res.status === StatusCode.Ok && res.data.length) {
    //     this.placeList = sortObjArrByProp<Place>(
    //       res.data,
    //       'name'
    //     ) as Place[];
    //     return;
    //   }
    //   this.placeList = [];
    //   this.router.navigate([], {
    //     relativeTo: this.route,
    //     queryParams: { cityId: city._id },
    //     queryParamsHandling: 'merge',
    //   });
    // });
    console.log(city);
  }
}
