import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {bindable, inject, observable} from 'aurelia-framework';

import {Correlation} from '@process-engine/management_api_contracts';

import {IEventFunction, IShape} from '../../contracts/index';
import environment from '../../environment';
import {IInspectCorrelationService} from './contracts';

interface RouteParameters {
  processModelId: string;
}

@inject('InspectCorrelationService', EventAggregator)
export class InspectCorrelation {
  @bindable() public processModelId: string;
  @bindable() public selectedCorrelation: Correlation;
  @bindable() public inspectPanelFullscreen: boolean = false;
  @observable public bottomPanelHeight: number = 250;
  @observable public tokenViewerWidth: number = 250;

  public correlations: Array<Correlation>;
  public token: string;
  public showInspectPanel: boolean = true;
  public showTokenViewer: boolean = false;
  public bottomPanelResizeDiv: HTMLDivElement;
  public rightPanelResizeDiv: HTMLDivElement;
  public selectedFlowNode: IShape;

  private _inspectCorrelationService: IInspectCorrelationService;
  private _eventAggregator: EventAggregator;
  private _subscriptions: Array<Subscription>;

  constructor(inspectCorrelationService: IInspectCorrelationService,
              eventAggregator: EventAggregator) {

    this._inspectCorrelationService = inspectCorrelationService;
    this._eventAggregator = eventAggregator;
  }

  public async activate(routeParameters: RouteParameters): Promise<void> {
    this.processModelId = routeParameters.processModelId;
  }

  public attached(): void {
    this._eventAggregator.publish(environment.events.statusBar.showInspectViewButtons, true);
    this._eventAggregator.publish(environment.events.navBar.updateProcessName, this.processModelId);
    this._eventAggregator.publish(environment.events.statusBar.showInspectCorrelationButtons, true);

    this._subscriptions = [
      this._eventAggregator.subscribe(environment.events.inspectCorrelation.showInspectPanel, (showInspectPanel: boolean) => {
        this.showInspectPanel = showInspectPanel;
      }),
      this._eventAggregator.subscribe(environment.events.inspectCorrelation.showTokenViewer, (showTokenViewer: boolean) => {
        this.showTokenViewer = showTokenViewer;
      }),
    ];

    this.bottomPanelResizeDiv.addEventListener('mousedown', (mouseDownEvent: Event) => {
      const windowEvent: Event = mouseDownEvent || window.event;
      windowEvent.cancelBubble = true;

      const mousemoveFunction: IEventFunction = (mouseMoveEvent: MouseEvent): void => {
        this.resizeInspectPanel(mouseMoveEvent);
        document.getSelection().empty();
      };

      const mouseUpFunction: IEventFunction = (): void => {
        document.removeEventListener('mousemove', mousemoveFunction);
        document.removeEventListener('mouseup', mouseUpFunction);
      };

      document.addEventListener('mousemove', mousemoveFunction);
      document.addEventListener('mouseup', mouseUpFunction);
    });

    this.rightPanelResizeDiv.addEventListener('mousedown', (mouseDownEvent: Event) => {
      const windowEvent: Event = mouseDownEvent || window.event;
      windowEvent.cancelBubble = true;

      const mousemoveFunction: IEventFunction = (mouseMoveEvent: MouseEvent): void => {
        this.resizeTokenViewer(mouseMoveEvent);
        document.getSelection().empty();
      };

      const mouseUpFunction: IEventFunction = (): void => {
        document.removeEventListener('mousemove', mousemoveFunction);
        document.removeEventListener('mouseup', mouseUpFunction);
      };

      document.addEventListener('mousemove', mousemoveFunction);
      document.addEventListener('mouseup', mouseUpFunction);
    });
  }

  public detached(): void {
    this._eventAggregator.publish(environment.events.statusBar.showInspectViewButtons, false);
    this._eventAggregator.publish(environment.events.statusBar.showInspectCorrelationButtons, false);

    for (const subscription of this._subscriptions) {
      subscription.dispose();
    }
  }

  public async processModelIdChanged(): Promise<void> {
    this.correlations = await this._inspectCorrelationService.getAllCorrelationsForProcessModelId(this.processModelId);
    this._eventAggregator.publish(environment.events.navBar.updateProcessName, this.processModelId);
  }

  public resizeInspectPanel(mouseEvent: MouseEvent): void {
    const mouseYPosition: number = mouseEvent.clientY;

    const menuBarHeight: number = 40;
    const inspectCorrelation: HTMLElement = this.bottomPanelResizeDiv.parentElement.parentElement;
    const inspectPanelHeightWithStatusBar: number = inspectCorrelation.clientHeight + menuBarHeight;

    const minInspectPanelHeight: number = 250;

    const newBottomPanelHeight: number = inspectPanelHeightWithStatusBar - mouseYPosition;

    this.bottomPanelHeight = Math.max(newBottomPanelHeight, minInspectPanelHeight);
  }

  public resizeTokenViewer(mouseEvent: MouseEvent): void {
    const mouseXPosition: number = mouseEvent.clientX;

    const inspectCorrelation: HTMLElement = this.bottomPanelResizeDiv.parentElement.parentElement;
    const minSpaceForDiagramViewer: number = 300;

    const windowWidth: number = window.innerWidth;
    const rightToolbarWidth: number = 36;

    const minTokenViewerWidth: number = 250;
    const maxTokenViewerWidth: number = inspectCorrelation.clientWidth - minSpaceForDiagramViewer;

    const newTokenViewerWidth: number = windowWidth - mouseXPosition - rightToolbarWidth;

    /*
     * This sets the new width of the token viewer to the minimum or maximum width,
     * if the new width is smaller than the minimum or bigger than the maximum width.
     */
    this.tokenViewerWidth = Math.min(maxTokenViewerWidth, Math.max(newTokenViewerWidth, minTokenViewerWidth));
  }
}
