import {HttpClient} from 'aurelia-fetch-client';
import {inject} from 'aurelia-framework';
import {
  IAuthenticationRepository,
  IIdentity,
  ILoginResult,
  ILogoutResult,
} from '../../contracts';
import environment from '../../environment';
import {throwOnErrorResponse} from '../../resources/http-repository-tools';

const HTTP_CODE_OK: number = 200;

@inject(HttpClient)
export class AuthenticationRepository implements IAuthenticationRepository {

  private _http: HttpClient;

  constructor(http: HttpClient) {
    this._http = http;
  }

  public async login(username: string, password: string): Promise<ILoginResult> {
    const options: RequestInit = {
      method: 'post',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    };

    const url: string = `${environment.processengine.routes.iam}/login`;
    const response: Response = await this._http.fetch(url, options);

    return throwOnErrorResponse<ILoginResult>(response);
  }

  public async logout(): Promise<ILogoutResult> {
    const url: string = `${environment.processengine.routes.iam}/logout`;
    const response: Response = await this._http.fetch(url, { method: 'get' });

    return throwOnErrorResponse<ILogoutResult>(response);
  }

  public async getIdentity(token: string): Promise<IIdentity> {
    const url: string = `${environment.processengine.routes.iam}/getidentity`;
    const options: RequestInit = {
      method: 'get',
      headers: new Headers({
        Authorization: `Barear: ${token}`,
      }),
    };
    const response: Response = await this._http.fetch(url, options);

    return throwOnErrorResponse<IIdentity>(response);
  }
}
