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
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { DataService } from '../data.service';
import { Place, City } from '../types';
import { sortObjArrByProp, toTitleCase } from '../shared/utils';
import { DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject } from 'rxjs';

function getAllPlaces(service: DataService, placeList: TableDataSource) {
  // reassign the reference to the array to update the view
  // function setPlaceList(newList: Place[]) {
  //   placeList.length = 0;
  //   placeList.push(...newList);
  // }

  service.getAllPlaces().then(res => {
    if (res.status !== StatusCode.Ok || !res.data.length) {
      placeList.setData([]);
      return;
    }
    const sortedResponse = sortObjArrByProp<Place>(res.data, 'name') as Place[];
    placeList.setData(sortedResponse);
  });
}

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
    MatChipsModule,
    MatTableModule,
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
        <mat-label>Place Name</mat-label>
        <input
          matInput
          type="text"
          formControlName="name"
          class="is-capitalized" />
      </mat-form-field>
      <mat-form-field appearance="outline" color="accent">
        <mat-label>Place alias</mat-label>
        <mat-chip-grid
          #chipGrid
          aria-label="Enter aliases"
          formControlName="aliases">
          <mat-chip-row
            *ngFor="let alias of aliasControl.value"
            (removed)="removeKeyword(alias)">
            {{ alias }}
            <button matChipRemove aria-label="'remove ' + keyword">
              <mat-icon>cancel</mat-icon>
            </button>
          </mat-chip-row>
        </mat-chip-grid>
        <input
          placeholder="New keyword..."
          [matChipInputFor]="chipGrid"
          (matChipInputTokenEnd)="add($event)" />
      </mat-form-field>
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
      <!-- <mat-selection-list
        #places
        [multiple]="false"
        (selectionChange)="selectionOnChange(places.selectedOptions.selected)">
        <mat-list-option
          *ngFor="let place of placeList"
          [value]="place._id"
          [selected]="">
          {{ place.name }}
        </mat-list-option>
      </mat-selection-list> -->

      <table mat-table [dataSource]="placeList">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Place</th>
          <td mat-cell *matCellDef="let element">{{ element.name }}</td>
        </ng-container>

        <ng-container matColumnDef="cityId">
          <th mat-header-cell *matHeaderCellDef>City</th>
          <td mat-cell *matCellDef="let element">{{ element.cityId }}</td>
        </ng-container>

        <ng-container matColumnDef="isActive">
          <th mat-header-cell *matHeaderCellDef>Active</th>
          <td mat-cell *matCellDef="let element">{{ element.isActive }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr
          mat-row
          (click)="rowOnClick(row)"
          *matRowDef="let row; columns: displayedColumns"></tr>
      </table>
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
  nameControl = new FormControl('', [
    Validators.required,
    Validators.minLength(3),
  ]);
  aliasControl = new FormControl(['foo', 'bar', 'baz'] as string[]);
  isActiveControl = new FormControl(true, [Validators.required]);
  placeForm = new FormGroup({
    name: this.nameControl,
    aliases: this.aliasControl,
    isActive: this.isActiveControl,
  });
  // placeList: Place[] = [];
  placeList = new TableDataSource([]);
  selectedPlace = '';
  selectedCity: City = {} as City;
  isEditMode = false;
  allCity: City = {
    _id: 'all',
    name: 'all places',
    isActive: true,
  };
  displayedColumns = ['name', 'cityId', 'isActive'];

  constructor(
    private _snackBar: MatSnackBar,
    private router: Router
  ) {
    const cityId = this.route.snapshot.queryParamMap.get('cityId');
    // this.dataService.getAllCities();

    if (!cityId) {
      this.selectedCity = this.allCity;
      this.dataService.getAllCities();
      // get all places and assign to placeList
      getAllPlaces(this.dataService, this.placeList);
      // this.dataService.getAllPlaces().then(res => {
      //   this.placeList = res.data;
      // });
    }
  }

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
    this.dataService.addNewPlace(formData).then(res => {
      const { status, data } = res;
      const control = this.placeForm.get('name');
      if (status === StatusCode.Conflict && control) {
        control.setErrors({ error: 'duplicate' });
        return;
      }
      if (status === StatusCode.Created) {
        this._snackBar.open('Place added successfully', 'close', {
          duration: 3000,
        });
        this.placeList.push(data);
        this.placeForm.reset({ isActive: true });
      }
    });
  }

  selectionOnChange(selectedOptions: MatListOption[]) {
    const [selectedOption] = selectedOptions;
    this.selectedPlace = selectedOption.value;
  }

  editOnClick(placeId: string) {
    const placeData = this.placeList.findById(placeId);
    // const placeData = this.placeList.find(place => place._id === placeId);
    if (!placeData) return;
    this.isEditMode = true;
    this.placeForm.setValue({
      name: placeData.name,
      aliases: placeData.alias ?? [],
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

  removeKeyword(alias: string) {
    const index = this.aliasControl.value?.indexOf(alias);
    if (index !== undefined && index >= 0) {
      this.aliasControl.value?.splice(index, 1);
    }
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    const filteredAlias = this.aliasControl.value?.filter(
      alias => alias !== value
    );

    // Add alias
    if (value && filteredAlias) {
      filteredAlias?.push(value);
      this.aliasControl.setValue(filteredAlias);
    }

    // Clear the input value
    event.chipInput.clear();
  }

  rowOnClick(row: Place) {
    console.log(row);
  }
}

class TableDataSource extends DataSource<Place> {
  private _dataStream = new BehaviorSubject<Place[]>([]);

  constructor(initialData: Place[]) {
    super();
    this.setData(initialData);
  }

  connect(): Observable<Place[]> {
    return this._dataStream;
  }

  disconnect(): void {
    this._dataStream.complete();
  }

  setData(data: Place[]) {
    const sortedData = sortObjArrByProp<Place>(data, 'name');
    this._dataStream.next(sortedData);
  }

  push(data: Place) {
    const sortedData = sortObjArrByProp<Place>(
      [...this._dataStream.getValue(), data],
      'name'
    );
    this._dataStream.next(sortedData);
  }

  findById(id: string) {
    return this._dataStream.getValue().find(place => place._id === id);
  }
}
