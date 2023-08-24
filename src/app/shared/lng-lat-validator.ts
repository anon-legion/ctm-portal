import { AbstractControl, ValidationErrors } from '@angular/forms';

function lngLatValidator(control: AbstractControl): ValidationErrors | null {
  if (control.value === null) return null;

  // remove opening and closing bracket pairs
  // remove all whitespaces
  const normalizedValue = control.value
    .replace(/^([[(])(.*)([\])])$/, '$2')
    .replaceAll(/\s+/g, '')
    .split(',');
  const lngLatRegex = /^-?\d{1,3}\.\d{6,}$/;
  const isValid = normalizedValue.every(
    (val: string, index: number, arr: string[]) => {
      if (arr.length !== 2) return false;
      // check if lng is valid coordinate range -180 to 180
      if (index === 0) return lngLatRegex.test(val) && Math.abs(+val) <= 180;
      // check if lat is valid coordinate range -90 to 90
      if (index === 1) return lngLatRegex.test(val) && Math.abs(+val) <= 90;

      return false;
    }
  );

  return isValid || normalizedValue[0] === ''
    ? null
    : { invalidLngLat: { value: control.value } };
}

export default lngLatValidator;
