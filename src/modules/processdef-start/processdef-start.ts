import {BpmnStudioClient, IUserTaskConfig} from '@process-engine/bpmn-studio_client';
import {IProcessDefEntity} from '@process-engine/process_engine_contracts';
import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {computedFrom, inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import * as toastr from 'toastr';
import {AuthenticationStateEvent, IProcessEngineService} from '../../contracts/index';
import {DynamicUiWrapper} from '../dynamic-ui-wrapper/dynamic-ui-wrapper';

@inject('ProcessEngineService', EventAggregator, Router, 'BpmnStudioClient')
export class ProcessDefStart {
  public solutionExplorerIsShown: boolean = false;

  private processEngineService: IProcessEngineService;
  private eventAggregator: EventAggregator;
  private dynamicUiWrapper: DynamicUiWrapper;
  private subscriptions: Array<Subscription>;
  private processDefId: string;
  private _process: IProcessDefEntity;
  private router: Router;
  private bpmnStudioClient: BpmnStudioClient;

  constructor(processEngineService: IProcessEngineService,
              eventAggregator: EventAggregator,
              router: Router,
              bpmnStudioClient: BpmnStudioClient) {
    this.processEngineService = processEngineService;
    this.eventAggregator = eventAggregator;
    this.router = router;
    this.bpmnStudioClient = bpmnStudioClient;
  }

  private async activate(routeParameters: {processDefId: string}): Promise<void> {
    this.processDefId = routeParameters.processDefId;
    await this.refreshProcess();
    this.startProcess();

    this.subscriptions = [
      this.eventAggregator.subscribe(AuthenticationStateEvent.LOGIN, () => {
        this.refreshProcess();
      }),
      this.eventAggregator.subscribe(AuthenticationStateEvent.LOGOUT, () => {
        this.refreshProcess();
      }),
      this.eventAggregator.subscribe('render-dynamic-ui', (message: IUserTaskConfig) => {
        this.dynamicUiWrapper.currentConfig = message;
      }),
      this.eventAggregator.subscribe('closed-process', (message: any) => {
        this.router.navigateToRoute('processdef-list', { page: 1 });
      }),
    ];
  }

  public detached(): void {
    for (const subscription of this.subscriptions) {
      subscription.dispose();
    }
  }

  private async refreshProcess(): Promise<void> {
    try {
      this._process = await this.processEngineService.getProcessDefById(this.processDefId);
    } catch (error) {
      toastr.error(`Failed to refresh process: ${error.message}`);
      throw error;
    }
  }

  @computedFrom('_process')
  public get process(): IProcessDefEntity {
    return this._process;
  }

  public startProcess(): void {
    this.bpmnStudioClient.startProcessByKey(this.process.key);
  }

  public toggleSolutionExplorer(): void {
    this.solutionExplorerIsShown = !this.solutionExplorerIsShown;
  }
}
