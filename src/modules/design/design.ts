/**
 * We are disabling this rule here because we need this kind of statement in the
 * functions used in the promise of the modal.
 */

import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {bindable, bindingMode, inject, observable} from 'aurelia-framework';
import {NavigationInstruction, Router, activationStrategy} from 'aurelia-router';

import {IDiagram, ISolution} from '@process-engine/solutionexplorer.contracts';

import {ISolutionEntry, ISolutionService, NotificationType} from '../../contracts/index';
import environment from '../../environment';
import {NotificationService} from '../../services/notification-service/notification.service';
import {DiagramDetail} from './diagram-detail/diagram-detail';

export interface IDesignRouteParameters {
  view?: string;
  diagramName?: string;
  diagramUri?: string;
  solutionUri?: string;
}

type DiagramWithSolution = {
  diagram: IDiagram;
  solutionName: string;
  solutionUri: string;
};

@inject(EventAggregator, 'SolutionService', Router, 'NotificationService')
export class Design {
  @observable() public activeDiagram: IDiagram;
  @bindable() public activeSolutionEntry: ISolutionEntry;
  @bindable() public xmlForDiff: string;
  @bindable({defaultBindingMode: bindingMode.oneWay}) public xml: string;

  public showSelectDiagramModal: boolean = false;
  public showDetail: boolean = true;
  public showXML: boolean = false;
  public showDiff: boolean = false;
  public propertyPanelShown: boolean = false;
  public showPropertyPanelButton: boolean = true;
  public showDiffDestinationButton: boolean = false;
  public design: Design = this;

  public diagramDetail: DiagramDetail;
  public filteredSolutions: Array<ISolution> = [];
  public diagramArray: Array<IDiagram | object> = [];
  public selectedDiagram: DiagramWithSolution;

  private eventAggregator: EventAggregator;
  private notificationService: NotificationService;
  private solutionService: ISolutionService;
  private subscriptions: Array<Subscription>;
  private router: Router;
  private routeView: string;
  private ipcRenderer: any;

  constructor(
    eventAggregator: EventAggregator,
    solutionService: ISolutionService,
    router: Router,
    notificationService: NotificationService,
  ) {
    this.eventAggregator = eventAggregator;
    this.solutionService = solutionService;
    this.router = router;
    this.notificationService = notificationService;
  }

  // TODO: Refactor this function
  // eslint-disable-next-line complexity
  public async activate(routeParameters: IDesignRouteParameters): Promise<void> {
    const solutionIsSet: boolean = routeParameters.solutionUri !== undefined;
    const diagramNameIsSet: boolean = routeParameters.diagramName !== undefined;

    const routerAndInstructionIsNotNull: boolean = this.router !== null && this.router.currentInstruction !== null;

    const diagramNamesAreDifferent: boolean = routerAndInstructionIsNotNull
      ? routeParameters.diagramName !== this.router.currentInstruction.params.diagramName
      : true;

    const diagramUrisAreDifferent: boolean = routerAndInstructionIsNotNull
      ? routeParameters.diagramUri !== this.router.currentInstruction.queryParams.diagramUri ||
        routeParameters.diagramUri === undefined
      : false;

    const solutionIsDifferent: boolean = routerAndInstructionIsNotNull
      ? routeParameters.solutionUri !== this.router.currentInstruction.queryParams.solutionUri
      : true;

    const routeFromOtherView: boolean = routerAndInstructionIsNotNull
      ? this.router.currentInstruction.config.name !== 'design'
      : true;

    const navigateToAnotherDiagram: boolean =
      diagramNamesAreDifferent || diagramUrisAreDifferent || routeFromOtherView || solutionIsDifferent;

    const isRunningInElectron: boolean = Boolean((window as any).nodeRequire);
    if (isRunningInElectron) {
      this.ipcRenderer = (window as any).nodeRequire('electron').ipcRenderer;
    }

    if (solutionIsSet) {
      this.activeSolutionEntry = this.solutionService.getSolutionEntryForUri(routeParameters.solutionUri);

      /**
       * We have to open the solution here again since if we come here after a
       * reload the solution might not be opened yet.
       */
      await this.activeSolutionEntry.service.openSolution(
        this.activeSolutionEntry.uri,
        this.activeSolutionEntry.identity,
      );

      const solutionIsRemote: boolean = this.activeSolutionEntry.uri.startsWith('http');
      if (solutionIsRemote) {
        if (isRunningInElectron) {
          this.ipcRenderer.send('menu_hide-diagram-entries');
        }

        this.eventAggregator.publish(environment.events.configPanel.solutionEntryChanged, this.activeSolutionEntry);
      } else if (isRunningInElectron) {
          this.ipcRenderer.send('menu_show-all-menu-entries');
        }

      const isOpenDiagram: boolean = this.activeSolutionEntry.uri === 'about:open-diagrams';

      if (isOpenDiagram) {
        const persistedDiagrams: Array<IDiagram> = this.solutionService.getOpenDiagrams();

        this.activeDiagram = persistedDiagrams.find((diagram: IDiagram) => {
          return (
            diagram.name === routeParameters.diagramName &&
            (diagram.uri === routeParameters.diagramUri || routeParameters.diagramUri === undefined)
          );
        });
      } else {
        this.activeDiagram = diagramNameIsSet
          ? await this.activeSolutionEntry.service.loadDiagram(routeParameters.diagramName)
          : undefined;
      }

      const diagramNotFound: boolean = this.activeDiagram === undefined;

      if (diagramNotFound) {
        this.router.navigateToRoute('start-page');
        this.notificationService.showNotification(NotificationType.INFO, 'Diagram could not be opened!');
      }

      if (navigateToAnotherDiagram) {
        this.xml = this.activeDiagram.xml;
      }
    }

    const routeViewIsDetail: boolean = routeParameters.view === 'detail';
    const routeViewIsXML: boolean = routeParameters.view === 'xml';
    const routeViewIsDiff: boolean = routeParameters.view === 'diff';
    this.routeView = routeParameters.view;

    if (routeViewIsDetail) {
      this.showDetail = true;
      this.showXML = false;
      this.showDiff = false;
      this.showPropertyPanelButton = true;
      this.showDiffDestinationButton = false;

      this.eventAggregator.publish(environment.events.bpmnio.bindKeyboard);
    } else if (routeViewIsXML) {
      this.showDetail = false;
      this.showXML = true;
      this.showDiff = false;
      this.showDiffDestinationButton = false;
      this.showPropertyPanelButton = false;

      this.eventAggregator.publish(environment.events.bpmnio.unbindKeyboard);
    } else if (routeViewIsDiff) {
      this.eventAggregator.publish(environment.events.bpmnio.unbindKeyboard);
      /**
       * We need to check this, because after a reload the diagramdetail component is not attached yet.
       */
      const diagramDetailIsNotAttached: boolean = this.diagramDetail === undefined;
      if (diagramDetailIsNotAttached) {
        this.xmlForDiff = this.activeDiagram.xml;
        return;
      }

      this.xmlForDiff = await this.diagramDetail.getXML();

      this.showDiffView();
    }

    this.eventAggregator.publish(environment.events.navBar.noValidationError);
  }

  public async attached(): Promise<void> {
    const routeViewIsDiff: boolean = this.routeView === 'diff';
    const routeViewIsXML: boolean = this.routeView === 'xml';

    if (routeViewIsDiff) {
      this.showDiffView();
    }

    if (routeViewIsDiff || routeViewIsXML) {
      this.eventAggregator.publish(environment.events.bpmnio.unbindKeyboard);
    }

    this.subscriptions = [
      this.eventAggregator.subscribe(environment.events.bpmnio.propertyPanelActive, (showPanel: boolean) => {
        this.propertyPanelShown = showPanel;
      }),
    ];

    const isRunningInElectron: boolean = Boolean((window as any).nodeRequire);
    if (isRunningInElectron) {
      this.ipcRenderer.send('menu_show-all-menu-entries');
    }

    this.eventAggregator.publish(environment.events.statusBar.showDiagramViewButtons);
  }

  public detached(): void {
    this.eventAggregator.publish(environment.events.statusBar.hideDiagramViewButtons);
    this.subscriptions.forEach((subscription: Subscription) => subscription.dispose());

    const isRunningInElectron: boolean = Boolean((window as any).nodeRequire);
    if (isRunningInElectron) {
      this.ipcRenderer.send('menu_hide-diagram-entries');
    }
  }

  public determineActivationStrategy(): string {
    return activationStrategy.invokeLifecycle;
  }

  public setDiffDestination(diffDestination: string, diagramName?: string): void {
    this.eventAggregator.publish(environment.events.diffView.setDiffDestination, [diffDestination, diagramName]);

    this.showSelectDiagramModal = false;
  }

  public async openSelectDiagramModal(): Promise<void> {
    this.diagramArray = [];

    const allSolutions: Array<ISolutionEntry> = this.solutionService.getAllSolutionEntries();

    const loadedSolutionPromises: Array<Promise<ISolution>> = allSolutions.map(async (value: ISolutionEntry) => {
      const loadedSolution: ISolution = await value.service.loadSolution();

      return loadedSolution;
    });

    const loadedSolutions: Array<ISolution> = await Promise.all(loadedSolutionPromises);
    this.filteredSolutions = loadedSolutions.filter((solution: ISolution) => {
      return solution.diagrams.length !== 0;
    });

    loadedSolutions.forEach((solution: ISolution) => {
      solution.diagrams.forEach((diagram: IDiagram) => {
        const diagramWithSolutionName: DiagramWithSolution = {
          diagram,
          solutionName: solution.name,
          solutionUri: solution.uri,
        };

        this.diagramArray.push(diagramWithSolutionName);
      });
    });

    const lastSaved: DiagramWithSolution = {
      diagram: this.activeDiagram,
      solutionName: 'Last Saved',
      solutionUri: 'lastSaved',
    };

    this.diagramArray.unshift(lastSaved);

    const openedDiagramIndex: number = this.diagramArray.findIndex((diagram: DiagramWithSolution) => {
      const diagramIsOpenedDiagram: boolean =
        diagram.solutionUri === this.activeSolutionEntry.uri && diagram.diagram.name === this.activeDiagram.name;
      return diagramIsOpenedDiagram;
    });

    this.diagramArray.splice(openedDiagramIndex, 1);

    this.showSelectDiagramModal = true;
  }

  public cancelDialog(): void {
    this.showSelectDiagramModal = false;
  }

  public togglePanel(): void {
    this.eventAggregator.publish(environment.events.bpmnio.togglePropertyPanel);
  }

  public deactivate(): void {
    this.diagramDetail.deactivate();
  }

  public activeDiagramChanged(newValue: IDiagram, oldValue: IDiagram): void {
    const noOldValue: boolean = oldValue === undefined;
    if (noOldValue) {
      return;
    }

    const activeDiagramDidNotChange: boolean = newValue.id === oldValue.id && newValue.uri === oldValue.uri;
    if (activeDiagramDidNotChange) {
      return;
    }

    this.xml = newValue.xml;
    this.xmlForDiff = newValue.xml;
  }

  public get connectedRemoteSolutions(): Array<ISolutionEntry> {
    const remoteSolutions: Array<ISolutionEntry> = this.solutionService.getRemoteSolutionEntries();

    const remoteSolutionsWithoutActive: Array<ISolutionEntry> = remoteSolutions.filter(
      (remoteSolution: ISolutionEntry) => {
        return remoteSolution.uri !== this.activeSolutionEntry.uri && remoteSolution.fontAwesomeIconClass !== 'fa-bolt';
      },
    );

    return remoteSolutionsWithoutActive;
  }

  public get remoteSolutions(): Array<ISolutionEntry> {
    const remoteSolutions: Array<ISolutionEntry> = this.solutionService.getRemoteSolutionEntries();

    const remoteSolutionsWithoutActive: Array<ISolutionEntry> = remoteSolutions.filter(
      (remoteSolution: ISolutionEntry) => {
        return remoteSolution.uri !== this.activeSolutionEntry.uri;
      },
    );

    return remoteSolutionsWithoutActive;
  }

  public get showSaveBeforeDeployModal(): boolean {
    return this.diagramDetail.showSaveBeforeDeployModal;
  }

  public get showRemoteSolutionOnDeployModal(): boolean {
    return this.diagramDetail.showRemoteSolutionOnDeployModal;
  }

  public get showSaveForStartModal(): boolean {
    return this.diagramDetail.showSaveForStartModal;
  }

  public get showStartWithOptionsModal(): boolean {
    return this.diagramDetail.showStartWithOptionsModal;
  }

  public get showStartEventModal(): boolean {
    return this.diagramDetail.showStartEventModal;
  }

  public get diagramHasChanged(): boolean {
    return this.diagramDetail.diagramHasChanged;
  }

  private showDiffView(): void {
    this.showDiff = true;
    this.showDetail = false;
    this.showXML = false;
    this.showPropertyPanelButton = false;
    this.showDiffDestinationButton = true;
  }

  /**
   * This function checks, if the 'Save unsaved changes' Modal can be
   * suppressed.
   *
   * This is the case, if the user basically navigates between the detail,
   * the xml and the diff view, since the current xml will passed between
   * these views.
   *
   * Therefore, the following paths will suppress the modal:
   *  * detail  <-->   xml
   *  * detail  <-->   diff
   *  * diff    <-->   xml
   *
   * @param destinationInstruction The current router instruction which contains
   * the destination router parameters.
   */
  private modalCanBeSuppressed(destinationInstruction: NavigationInstruction): boolean {
    const oldView: string = this.router.currentInstruction.params.view;
    const destinationView: string = destinationInstruction.params.view;

    const navigatingBetween: Function = (routeA: string, routeB: string): boolean =>
      (routeA === oldView || routeA === destinationView) && (routeB === oldView || routeB === destinationView);

    const shouldModalBeSuppressed: boolean =
      navigatingBetween('diff', 'xml') || navigatingBetween('diff', 'detail') || navigatingBetween('xml', 'detail');

    return shouldModalBeSuppressed;
  }
}
