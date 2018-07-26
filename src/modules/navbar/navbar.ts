import {EventAggregator} from 'aurelia-event-aggregator';
import {bindable, inject} from 'aurelia-framework';
import {RouteConfig, Router} from 'aurelia-router';
import {IEventFunction, IProcessDefEntity} from '../../contracts';
import environment from '../../environment';

@inject(Router, EventAggregator)
export class NavBar {
  private _router: Router;
  private _eventAggregator: EventAggregator;

  @bindable() public showSolutionExplorer: boolean;
  public process: IProcessDefEntity;
  public diagramInfo: HTMLElement;
  public dropdown: HTMLElement;
  public showTools: boolean = false;
  public showStartButton: boolean = false;
  public disableSaveButton: boolean = false;

  constructor(router: Router, eventAggregator: EventAggregator) {
    this._router = router;
    this._eventAggregator = eventAggregator;
  }

  public attached(): void {

    document.addEventListener('click', this.dropdownClickListener);

    const processSolutionExplorerHideState: string = window.localStorage.getItem('processSolutionExplorerHideState');
    const wasProcessSolutionExplorerVisible: boolean = processSolutionExplorerHideState === 'show';
    this.showSolutionExplorer = wasProcessSolutionExplorerVisible;

    this._eventAggregator.subscribe('router:navigation:complete', () => {
      this._dertermineActiveRoute();
    });

    this._eventAggregator.subscribe(environment.events.navBar.showTools, (process: IProcessDefEntity) => {
      this.showTools = true;
      this.process = process;
    });

    this._eventAggregator.subscribe(environment.events.navBar.hideTools, () => {
      this.showTools = false;
    });

    this._eventAggregator.subscribe(environment.events.navBar.updateProcess, (process: IProcessDefEntity) => {
      this.process = process;
    });

    this._eventAggregator.subscribe(environment.events.navBar.disableSaveButton, () => {
      this.disableSaveButton = true;
    });

    this._eventAggregator.subscribe(environment.events.navBar.enableSaveButton, () => {
      this.disableSaveButton = false;
    });

    this._eventAggregator.subscribe(environment.events.navBar.showStartButton, () => {
      this.showStartButton = true;
    });

    this._eventAggregator.subscribe(environment.events.navBar.hideStartButton, () => {
      this.showStartButton = false;
    });
  }

  public detached(): void {
    document.removeEventListener('click', this.dropdownClickListener);
  }

  public isRouteActive(routeName: string): boolean {
    return this._router.currentInstruction.config.name === routeName;
  }

  public navigateBack(): void {
    this._router.navigateBack();
  }

  public toggleSolutionExplorer(): void {
    this.showSolutionExplorer = !this.showSolutionExplorer;
  }

  public saveDiagram(): void {
    if (!this.disableSaveButton) {
      this._eventAggregator.publish(environment.events.processDefDetail.saveDiagram);
    }
  }

  public printDiagram(): void {
    this._eventAggregator.publish(environment.events.processDefDetail.printDiagram);
  }

  public exportDiagram(exportAs: string): void {
    this._eventAggregator.publish(`${environment.events.processDefDetail.exportDiagramAs}:${exportAs}`, this.process);
  }

  public startProcess(): void {
    this._eventAggregator.publish(environment.events.processDefDetail.startProcess);
  }

  /**
   * Checks if the user clicked inside of the dropdown, to prevent it from
   * closing in that case.
   *
   * @param event: Mouse event
   */
  public dropdownClickListener: IEventFunction =  (event: MouseEvent): void => {
    const eventTarget: Node = event.target as Node;

    const hasNavbarNoPreviousDropdown: boolean = this.dropdown === undefined || this.dropdown === null;

    if (hasNavbarNoPreviousDropdown) {
      return;
    }

    const dropdownWasClicked: boolean = this.dropdown.contains(eventTarget);
    if (dropdownWasClicked) {
      this.diagramInfo.className += ' open';
    }
  }

  private _isRouteActive(routeTitle: string): boolean {
    if (this._router.currentInstruction.config.title === routeTitle) {
      return true;
    }
    return false;
  }

}
