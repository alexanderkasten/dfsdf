import {IHttpClient} from '@essential-projects/http_contracts';
import {SolutionExplorerFileSystemRepository} from '@process-engine/solutionexplorer.repository.filesystem';
import {SolutionExplorerManagementApiRepository} from '@process-engine/solutionexplorer.repository.management_api';
import {SolutionExplorerService} from '@process-engine/solutionexplorer.service';
import {ISolutionExplorerService} from '@process-engine/solutionexplorer.service.contracts';
import {inject} from 'aurelia-framework';

@inject('HttpFetchClient')
export class SolutionExplorerFactoryService {

  private httpClient: IHttpClient;

  constructor(httpClient: IHttpClient) {
    this.httpClient = httpClient;
  }

  public async newFileSystemSolutionExplorer(): Promise<ISolutionExplorerService> {
    const fileSystemrepository: SolutionExplorerFileSystemRepository = new SolutionExplorerFileSystemRepository();
    const createdService: SolutionExplorerService = new SolutionExplorerService(fileSystemrepository);

    return createdService;
  }

  public async newManagementApiSolutionExplorer(): Promise<ISolutionExplorerService> {
    const managementApiRepository: SolutionExplorerManagementApiRepository = new SolutionExplorerManagementApiRepository(this.httpClient);
    const createdService: SolutionExplorerService = new SolutionExplorerService(managementApiRepository);

    return createdService;
  }
}
