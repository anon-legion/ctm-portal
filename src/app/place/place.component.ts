import { Component, OnDestroy, OnInit } from '@angular/core';
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
import { Place, City, PlaceTableData } from '../types';
import { sortObjArrByProp, toTitleCase } from '../shared/utils';
import { DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';

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
export class PlaceComponent implements OnInit, OnDestroy {
  private _sub: Subscription = new Subscription();
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
  selectedPlace: Place['_id'] = '';
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
    private _router: Router,
    private _route: ActivatedRoute,
    public dataService: DataService
  ) {
    const cityId = this._route.snapshot.queryParamMap.get('cityId');
    // this.dataService.getAllCities();

    if (!cityId) {
      this.selectedCity = this.allCity;
      this.dataService.getAllCities();
      // get all places and assign to placeList
      getAllPlaces(this.dataService, this.placeList);
      return;
    }

    this.dataService.getAllCities().then(res => {
      const cityList = res.data as City[];
      const currentCity = cityList.find(city => city._id === cityId);

      // if cityId is not valid, set allCity and get all places
      if (!currentCity) {
        this.selectedCity = this.allCity;
        getAllPlaces(this.dataService, this.placeList);
        this._router.navigate([], {
          relativeTo: this._route,
        });
        return;
      }

      this.selectedCity = currentCity;

      this.dataService.getPlacesByCityId(cityId).then(res => {
        if (res.status === StatusCode.Ok && res.data.length) {
          this.placeList.setData(res.data);
          return;
        }
        this.placeList.setData([]);
      });
    });
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
      this.dataService
        .updatePlaceById(this.selectedPlace, formData)
        .then(res => {
          const { status, data } = res;
          if (status === StatusCode.NotFound) return;
          if (status === StatusCode.Ok) {
            this._snackBar.open('Update success', 'Close', { duration: 3000 });
            this.placeList.updateById(data._id, data);
            this.placeForm.reset({ isActive: true });
            this.isEditMode = false;
            this.selectedPlace = '';
          }
        });
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
      // get all places and assign to placeList
      getAllPlaces(this.dataService, this.placeList);
      // set path to /place
      this._router.navigate([], {
        relativeTo: this._route,
      });
      return;
    }

    const city = e.value as City;

    this._router.navigate([], {
      relativeTo: this._route,
      queryParams: { cityId: city._id },
      queryParamsHandling: 'merge',
    });
  }

  removeKeyword(alias: string) {
    const index = this.aliasControl.value?.indexOf(alias);

    if (index !== undefined && index >= 0) {
      this.aliasControl.value?.splice(index, 1);
    }
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim().toUpperCase();
    const flattenedValue = value.replace(/[^a-zA-Z0-9]/g, '');
    const filteredAlias = this.aliasControl.value?.filter(
      alias =>
        alias.toUpperCase().replace(/[^a-zA-Z0-9]/g, '') !== flattenedValue
    );

    // Add alias
    if (value && filteredAlias) {
      filteredAlias?.push(value);
      this.aliasControl.setValue(filteredAlias);
    }

    // Clear the input value
    event.chipInput.clear();
  }

  rowOnClick(row: PlaceTableData) {
    if (row._id === this.selectedPlace) {
      this.selectedPlace = '';
      this.isEditMode = false;
      this.placeForm.reset({ isActive: true });
      return;
    }

    const cityId = this._route.snapshot.queryParamMap.get('cityId');
    const placeCity = this.cityList.find(city => city._id === row.cityId._id);

    if (!placeCity) return;

    if (cityId !== placeCity?._id) {
      this._router.navigate([], {
        queryParams: { cityId: placeCity?._id },
      });
    }

    this.isEditMode = true;
    this.selectedCity = placeCity;
    this.selectedPlace = row._id;
    this.placeForm.setValue({
      name: row.name,
      aliases: row.aliases ?? [],
      isActive: row.isActive ?? true,
    });
  }

  ngOnInit() {
    this._sub = this._route.queryParamMap.subscribe(params => {
      const cityId = params.get('cityId') || '';
      if (!cityId) {
        getAllPlaces(this.dataService, this.placeList);
        return;
      }
      this.dataService.getPlacesByCityId(cityId).then(res => {
        const { status, data } = res;
        if (status === StatusCode.Ok) {
          this.placeList.setData(data);
          return;
        }
        this.placeList.setData([]);
      });
    });
  }

  ngOnDestroy() {
    this._sub.unsubscribe();
  }
}

class TableDataSource extends DataSource<PlaceTableData> {
  private _dataStream = new BehaviorSubject<PlaceTableData[]>([]);

  constructor(initialData: PlaceTableData[]) {
    super();
    this.setData(initialData);
  }

  connect(): Observable<PlaceTableData[]> {
    return this._dataStream;
  }

  disconnect(): void {
    this._dataStream.complete();
  }

  setData(data: PlaceTableData[]) {
    const sortedData = sortObjArrByProp<PlaceTableData>(data, 'name');
    this._dataStream.next(sortedData);
  }

  push(data: PlaceTableData) {
    const sortedData = sortObjArrByProp<PlaceTableData>(
      [...this._dataStream.getValue(), data],
      'name'
    );
    this._dataStream.next(sortedData);
  }

  findById(id: PlaceTableData['_id']) {
    return this._dataStream.getValue().find(place => place._id === id);
  }

  removeById(id: PlaceTableData['_id']) {
    const filteredData = this._dataStream
      .getValue()
      .filter(place => place._id !== id);
    this._dataStream.next(filteredData);
  }

  updateById(id: PlaceTableData['_id'], data: PlaceTableData) {
    const updatedData = this._dataStream
      .getValue()
      .map(place => (place._id === id ? data : place));
    this._dataStream.next(updatedData);
  }
}
