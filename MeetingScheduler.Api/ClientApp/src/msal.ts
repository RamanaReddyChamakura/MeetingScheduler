import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { MsalGuardConfiguration, MsalInterceptor, MsalInterceptorConfiguration, MsalModule, MsalService, MSAL_GUARD_CONFIG, MSAL_INSTANCE, MSAL_INTERCEPTOR_CONFIG } from '@azure/msal-angular';
import { IPublicClientApplication, InteractionType, PublicClientApplication } from '@azure/msal-browser';
import { HTTP_INTERCEPTORS, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';

const clientId = 'e675a906-a13b-4e3d-b053-3fff5fed0d8d'; // Replace with your Azure AD app client ID
const tenantId = '3ca8ff7d-acda-4f42-b8d5-a4f587df7101';

export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      redirectUri: window.location.origin
    },
    cache: { cacheLocation: 'localStorage' }
  });
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return { interactionType: InteractionType.Redirect };
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  // Attach tokens for both relative and absolute API calls during dev
  protectedResourceMap.set('/api', [`api://${clientId}/.default`]);
  protectedResourceMap.set('https://localhost:44344/api', [`api://${clientId}/.default`]);
  protectedResourceMap.set('https://graph.microsoft.com/v1.0/', ['User.Read', 'Calendars.Read', 'Calendars.ReadWrite', 'Places.Read.All']);
  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
}

export const msalProviders: ApplicationConfig['providers'] = [
  importProvidersFrom(MsalModule),
  { provide: MSAL_INSTANCE, useFactory: MSALInstanceFactory },
  { provide: MSAL_GUARD_CONFIG, useFactory: MSALGuardConfigFactory },
  { provide: MSAL_INTERCEPTOR_CONFIG, useFactory: MSALInterceptorConfigFactory },
  { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },
  MsalService
];

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  // MsalInterceptor attaches tokens automatically for protectedResourceMap; pass-through.
  return next(req);
}
