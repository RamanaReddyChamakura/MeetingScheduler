import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';

export const canActivateAdmin: CanActivateFn = () => {
  const http = inject(HttpClient);
  const router = inject(Router);
  const apiBase = 'https://localhost:5001';
  return http.get<{ isAdmin: boolean }>(`${apiBase}/api/admin/am-i-admin`).pipe(
    map(r => r.isAdmin ? true : router.createUrlTree(['/'])),
    catchError(() => of(router.createUrlTree(['/'])))
  );
};
