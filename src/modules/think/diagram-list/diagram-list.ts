import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {bindable, inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';

import {IDiagram, ISolution} from '@process-engine/solutionexplorer.contracts';

import {AuthenticationStateEvent, ISolutionEntry} from '../../../contracts/index';
import environment from '../../../environment';

@inject(EventAggregator, Router)
export class DiagramList {

  public allDiagrams: Array<IDiagram>;
  @bindable() public activeSolutionEntry: ISolutionEntry;

  private _eventAggregator: EventAggregator;
  private _router: Router;
  private _subscriptions: Array<Subscription>;
  private _getProcessesIntervalId: number;

  constructor(eventAggregator: EventAggregator,
              router: Router) {
    this._eventAggregator = eventAggregator;
    this._router = router;
  }

  public attached(): void {

    this._updateDiagramList();

    this._getProcessesIntervalId = window.setInterval(() => {
      this._updateDiagramList();
      // tslint:disable-next-line
    }, environment.processengine.processDefListPollingIntervalInMs);

    this._subscriptions = [
      this._eventAggregator.subscribe(AuthenticationStateEvent.LOGIN, () => {
        this._updateDiagramList();
      }),
      this._eventAggregator.subscribe(AuthenticationStateEvent.LOGOUT, () => {
        this._updateDiagramList();
      }),
    ];
  }

  public detached(): void {
    clearInterval(this._getProcessesIntervalId);
    for (const subscription of this._subscriptions) {
      subscription.dispose();
    }
  }

  public showDetails(diagramName: string): void {

    this._router.navigateToRoute('design', {
      diagramName: diagramName,
      solutionUri: this.activeSolutionEntry.uri,
      view: 'detail',
    });
  }

  private async _updateDiagramList(): Promise<void> {
    const solution: ISolution = await this.activeSolutionEntry.service.loadSolution();
    this.allDiagrams = solution.diagrams;
  }
}
