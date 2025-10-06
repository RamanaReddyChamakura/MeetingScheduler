import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { MsalGuardConfiguration, MsalInterceptor, MsalInterceptorConfiguration, MsalModule, MsalService, MSAL_GUARD_CONFIG, MSAL_INSTANCE, MSAL_INTERCEPTOR_CONFIG } from '@azure/msal-angular';
import { IPublicClientApplication, InteractionType, PublicClientApplication } from '@azure/msal-browser';
import { HTTP_INTERCEPTORS, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';

const clientId = 'YOUR_SPA_CLIENT_ID';
const tenantId = 'YOUR_TENANT_ID';

export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      redirectUri: 'http://localhost:4200'
    },
    cache: { cacheLocation: 'localStorage' }
  });
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return { interactionType: InteractionType.Redirect };
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  protectedResourceMap.set(`/api/`, ['api://YOUR_API_APP_ID_URI/user_impersonation']);
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
