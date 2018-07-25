import {IHttpClient} from '@essential-projects/http_contracts';
import {ExternalAccessor, ManagementApiClientService} from '@process-engine/management_api_client';
import {EventAggregator} from 'aurelia-event-aggregator';
import {FrameworkConfiguration} from 'aurelia-framework';
import environment from '../../environment';
import {HttpClientProxy} from './HttpClientProxy';

export async function configure(config: FrameworkConfiguration): Promise<void> {

  const httpClient: IHttpClient = config.container.get('HttpFetchClient');

  const urlPrefix: string = `${environment.bpmnStudioClient.baseRoute}/`;
  const proxiedHttpClient: HttpClientProxy = new HttpClientProxy(httpClient, urlPrefix);

  const clientService: ManagementApiClientService = createManagementApiClient(proxiedHttpClient);

  // register event to change url prefix
  const eventAggregator: EventAggregator = config.container.get(EventAggregator);
  eventAggregator.subscribe(environment.events.configPanel.processEngineRouteChanged, (newUrlPrefix: string) => {
    proxiedHttpClient.setUrlPrefix(`${newUrlPrefix}/`);
  });

  config.container.registerInstance('ManagementApiClientService', clientService);
}

function createManagementApiClient(httpClient: IHttpClient): ManagementApiClientService {

  const externalAccessor: ExternalAccessor = new ExternalAccessor(httpClient);

  return new ManagementApiClientService(externalAccessor);
}
