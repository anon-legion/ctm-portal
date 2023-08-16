import { ActivatedRoute, Router } from '@angular/router';

class PathQuerySetter {
  constructor(
    private _router: Router,
    private _route: ActivatedRoute,
    private _defaultQueryParams: Record<string, string> = {
      cityId: 'all',
      routeId: 'all',
    }
  ) {}

  // call method with no arguments to set query params to default
  setQueryParams(
    queryParams: Record<string, string> = { ...this._defaultQueryParams }
  ) {
    this._router.navigate([], {
      relativeTo: this._route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }
}

export default PathQuerySetter;
