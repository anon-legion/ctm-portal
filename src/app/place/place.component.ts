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
  service.getAllPlaces().then(res => {
    if (res.status !== StatusCode.Ok || !res.data.length) {
      placeList.setData([]);
      return;
    }
    placeList.setData(res.data);
  });
}

@Component({
  selector: 'app-place',
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
  templateUrl: './place.component.html',
  styleUrls: ['./place.component.scss'],
})
export class PlaceComponent {
  route = inject(ActivatedRoute);
  dataService: DataService = inject(DataService);
  nameControl = new FormControl('', [
    Validators.required,
    Validators.minLength(3),
  ]);
  aliasControl = new FormControl([] as string[]);
  isActiveControl = new FormControl(true, [Validators.required]);
  placeForm = new FormGroup({
    name: this.nameControl,
    aliases: this.aliasControl,
    isActive: this.isActiveControl,
  });
  // placeList: Place[] = [];
  placeList = new TableDataSource([]);
  selectedPlace = '';
  selectedCity = {} as City;
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
    if (this.selectedCity === this.allCity) {
      this._snackBar.open('Please select a city', 'Close', { duration: 3000 });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const formData = {
      cityId: this.selectedCity._id,
      name: toTitleCase(this.placeForm.value.name),
      aliases: this.placeForm.value.aliases,
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

  deleteOnClick(placeId: string) {
    this.dataService.deletePlaceById(placeId).then(res => {
      const { status } = res;
      if (status === StatusCode.Ok) {
        this.placeList.removeById(placeId);
        this._snackBar.open('Place deleted successfully', 'close', {
          duration: 3000,
        });
        this.selectedPlace = '';
      }
    });
  }

  navigateTo(placeId: string) {
    console.log(placeId);
  }

  selectCityOnChange(e: MatSelectChange) {
    if (e.value === this.allCity) {
      return;
    }
    const city = e.value as City;
    console.log(city);
  }

  removeKeyword(alias: string) {
    const index = this.aliasControl.value?.indexOf(alias);
    if (index !== undefined && index >= 0) {
      this.aliasControl.value?.splice(index, 1);
    }
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim().toUpperCase();
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
    this.selectedPlace = row._id;
    this.isEditMode = true;
    this.placeForm.setValue({
      name: row.name,
      aliases: row.aliases ?? [],
      isActive: row.isActive ?? true,
    });
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

  removeById(id: string) {
    const filteredData = this._dataStream
      .getValue()
      .filter(place => place._id !== id);
    this._dataStream.next(filteredData);
  }
}
