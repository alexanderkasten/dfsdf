import {inject} from 'aurelia-framework';

import {IIdentity} from '@essential-projects/iam_contracts';
import {ManagementApiClientService} from '@process-engine/management_api_client';
import {ManualTask, ManualTaskList, UserTask, UserTaskList, UserTaskResult} from '@process-engine/management_api_contracts';

import {IDynamicUiService} from '../../contracts';

@inject('ManagementApiClientService')
export class DynamicUiService implements IDynamicUiService {

  private _managementApiClient: ManagementApiClientService;

  constructor(managmentApiClient: ManagementApiClientService) {
    this._managementApiClient = managmentApiClient;
  }

  public finishUserTask(identity: IIdentity,
                        processInstanceId: string,
                        correlationId: string,
                        userTaskInstanceId: string,
                        userTaskResult: UserTaskResult): void {

    this._managementApiClient.finishUserTask(identity,
                                            processInstanceId,
                                            correlationId,
                                            userTaskInstanceId,
                                            userTaskResult);
  }

  public async getUserTaskByCorrelationId(identity: IIdentity,
                                          userTaskId: string,
                                          correlationId: string): Promise<UserTask> {

    const userTaskList: UserTaskList = await this._managementApiClient.getUserTasksForCorrelation(identity, correlationId);

    return  userTaskList.userTasks.find((userTask: UserTask) => {
      return userTask.id === userTaskId;
    });
  }

  public async getUserTaskByProcessModelId(identity: IIdentity,
                                           userTaskId: string,
                                           processModelId: string): Promise<UserTask> {

    const userTaskList: UserTaskList = await this._managementApiClient.getUserTasksForProcessModel(identity, processModelId);

    return  userTaskList.userTasks.find((userTask: UserTask) => {
      return userTask.id === userTaskId;
    });
  }

  public finishManualTask(identity: IIdentity,
                          processInstanceId: string,
                          correlationId: string,
                          manualTaskInstanceId: string): void {

    this._managementApiClient.finishManualTask(identity,
                              processInstanceId,
                              correlationId,
                              manualTaskInstanceId);
  }

  public async getManualTaskByCorrelationId(identity: IIdentity,
                                            manualTaskId: string,
                                            correlationId: string): Promise<ManualTask> {

    const manualTaskList: ManualTaskList = await this._managementApiClient.getManualTasksForCorrelation(identity, correlationId);

    return  manualTaskList.manualTasks.find((manualTask: ManualTask) => {
      return manualTask.id === manualTaskId;
    });
  }

  public async getManualTaskByProcessModelId(identity: IIdentity,
                                             manualTaskId: string,
                                             processModelId: string): Promise<ManualTask> {

    const manualTaskList: ManualTaskList = await this._managementApiClient.getManualTasksForProcessModel(identity, processModelId);

    return manualTaskList.manualTasks.find((manualTask: ManualTask) => {
    return manualTask.id === manualTaskId;
   });
  }
}
