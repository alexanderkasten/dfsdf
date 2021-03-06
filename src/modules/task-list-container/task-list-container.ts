import {inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';

import {ForbiddenError, UnauthorizedError, isError} from '@essential-projects/errors_ts';
import {IManagementApi} from '@process-engine/management_api_contracts';

import {IIdentity} from '@essential-projects/iam_contracts';
import {ISolutionEntry, ISolutionService, NotificationType} from '../../contracts/index';
import {NotificationService} from '../../services/notification-service/notification.service';
import {TaskList} from '../inspect/task-list/task-list';

interface ITaskListRouteParameters {
  processModelId?: string;
  correlationId?: string;
  solutionUri?: string;
}

@inject('NotificationService', Router, 'ManagementApiClientService', 'SolutionService')
export class TaskListContainer {
  public showTaskList: boolean = false;
  public taskList: TaskList;

  private routeParameters: ITaskListRouteParameters;
  private notificationService: NotificationService;
  private router: Router;
  private managementApiService: IManagementApi;
  private solutionService: ISolutionService;

  constructor(
    notificationService: NotificationService,
    router: Router,
    managementApiService: IManagementApi,
    solutionService: ISolutionService,
  ) {
    this.notificationService = notificationService;
    this.router = router;
    this.managementApiService = managementApiService;
    this.solutionService = solutionService;
  }

  public async canActivate(): Promise<boolean> {
    const solutionUriIsSet: boolean =
      this.router.currentInstruction !== null &&
      this.router.currentInstruction !== undefined &&
      this.router.currentInstruction.queryParams.solutionUri !== null &&
      this.router.currentInstruction.queryParams.solutionUri !== undefined;

    const activeSolutionUri: string = solutionUriIsSet
      ? this.router.currentInstruction.queryParams.solutionUri
      : window.localStorage.getItem('InternalProcessEngineRoute');

    const activeSolutionEntry: ISolutionEntry = this.solutionService.getSolutionEntryForUri(activeSolutionUri);

    const hasNoClaimsForTaskList: boolean = !(await this.hasClaimsForTaskList(activeSolutionEntry.identity));

    if (hasNoClaimsForTaskList) {
      this.notificationService.showNotification(
        NotificationType.ERROR,
        "You don't have the permission to use the inspect features.",
      );
      this.router.navigateToRoute('start-page');

      return false;
    }

    this.showTaskList = !hasNoClaimsForTaskList;

    return true;
  }

  public activate(routeParameters: ITaskListRouteParameters): void {
    this.routeParameters = routeParameters;
  }

  public attached(): void {
    this.taskList.initializeTaskList(this.routeParameters);
  }

  private async hasClaimsForTaskList(identity: IIdentity): Promise<boolean> {
    try {
      // TODO: Refactor; this is not how we want to do our claim checks.
      // Talk to Sebastian or Christoph first.

      await this.managementApiService.getProcessModels(identity);
      await this.managementApiService.getActiveCorrelations(identity);
    } catch (error) {
      const errorIsForbiddenError: boolean = isError(error, ForbiddenError);
      const errorIsUnauthorizedError: boolean = isError(error, UnauthorizedError);

      if (errorIsForbiddenError || errorIsUnauthorizedError) {
        return false;
      }
    }

    return true;
  }
}
