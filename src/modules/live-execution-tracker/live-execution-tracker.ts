
import {inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';

import {IIdentity} from '@essential-projects/iam_contracts';
import * as bundle from '@process-engine/bpmn-js-custom-bundle';

import {Correlation, CorrelationProcessModel, IManagementApi, TokenHistoryEntry} from '@process-engine/management_api_contracts';

import {ActiveToken} from '@process-engine/kpi_api_contracts';
import {
  defaultBpmnColors,
  IAuthenticationService,
  IBpmnModeler,
  IBpmnXmlSaveOptions,
  ICanvas,
  IColorPickerColor,
  IElementRegistry,
  IEvent,
  IModdleElement,
  IModeling,
  IOverlay,
  IShape,
  NotificationType,
} from '../../contracts/index';
import environment from '../../environment';
import {NotificationService} from '../notification/notification.service';

interface RouteParameters {
  correlationId: string;
  processModelId: string;
}

type TokenHistory = Array<TokenHistoryEntry>;

@inject(Router, 'NotificationService', 'AuthenticationService', 'ManagementApiClientService')
export class LiveExecutionTracker {
  public canvasModel: HTMLElement;

  private _diagramModeler: IBpmnModeler;
  private _diagramViewer: IBpmnModeler;
  private _modeling: IModeling;
  private _elementRegistry: IElementRegistry;
  private _viewerCanvas: ICanvas;
  private _overlay: IOverlay;

  private _router: Router;
  private _notificationService: NotificationService;
  private _authenticationService: IAuthenticationService;
  private _managementApiClient: IManagementApi;

  private _correlationId: string;
  private _processModelId: string;

  private _pollingTimer: NodeJS.Timer;
  private _attached: boolean;
  private _previousElementIdsWithActiveToken: Array<string> = [];
  private _activeTokens: Array<ActiveToken>;

  constructor(router: Router,
              notificationService: NotificationService,
              authenticationService: IAuthenticationService,
              managementApiClient: IManagementApi) {

    this._router = router;
    this._notificationService = notificationService;
    this._authenticationService = authenticationService;
    this._managementApiClient = managementApiClient;
  }

  public activate(routeParameters: RouteParameters): void {
    this._correlationId = routeParameters.correlationId;
    this._processModelId = routeParameters.processModelId;
  }

  public async attached(): Promise<void> {
    this._attached = true;
    this._diagramModeler = new bundle.modeler();
    this._diagramViewer = new bundle.viewer({
      additionalModules:
      [
        bundle.ZoomScrollModule,
        bundle.MoveCanvasModule,
        bundle.MiniMap,
      ],
    });

    this._modeling = this._diagramModeler.get('modeling');
    this._elementRegistry = this._diagramModeler.get('elementRegistry');
    this._viewerCanvas = this._diagramViewer.get('canvas');
    this._overlay = this._diagramViewer.get('overlays');

    this._diagramViewer.attachTo(this.canvasModel);

    const xml: string = await this._getXml(0);
    const colorizedXml: string = await this._colorizeXml(xml);

    await this._importXml(this._diagramViewer, colorizedXml);

    this._viewerCanvas.zoom('fit-viewport');

    this._diagramViewer.on('element.click', this._elementClickHandler);

    this._startPolling();
  }

  public detached(): void {
    this._attached = false;
    this._stopPolling();
  }

  private _elementClickHandler: (event: IEvent) => Promise<void> = async(event: IEvent) => {
    const clickedElement: IShape = event.element;

    const clickedElementIsNotAUserOrManualTask: boolean = clickedElement.type !== 'bpmn:UserTask'
                                                       && clickedElement.type !== 'bpmn:ManualTask';

    if (clickedElementIsNotAUserOrManualTask) {
      return;
    }

    this._handleTask(clickedElement);
  }

  private async _handleTask(element: IShape): Promise<void> {
    const elementHasNoActiveToken: boolean = !this._hasElementActiveToken(element.id);
    if (elementHasNoActiveToken) {
      return;
    }

    this._router.navigateToRoute('task-dynamic-ui', {
      correlationId: this._correlationId,
      processModelId: this._processModelId,
      taskId: element.id,
    });
  }

  private async _colorizeXml(xml: string): Promise<string> {
    await this._importXml(this._diagramModeler, xml);

    this._clearColors();

    const allElements: Array<IShape> = this._elementRegistry.filter((element: IShape): boolean => {
      const elementCanHaveAToken: boolean = element.type !== 'bpmn:SequenceFlow'
                                        && element.type !== 'bpmn:Collaboration'
                                        && element.type !== 'bpmn:Participant'
                                        && element.type !== 'bpmn:Lane'
                                        && element.type !== 'label';

      return elementCanHaveAToken;
    });

    const elementsWithActiveToken: Array<IShape> = await this._getElementsWithActiveToken(allElements);
    const elementsWithTokenHistory: Array<IShape> = await this._getElementsWithTokenHistory(allElements);

    this._previousElementIdsWithActiveToken = elementsWithActiveToken.map((element: IShape) => element.id).sort();

    this._colorizeElements(elementsWithTokenHistory, defaultBpmnColors.green);
    this._colorizeElements(elementsWithActiveToken, defaultBpmnColors.orange);
    this._addOverlaysToUserAndManualTasks(elementsWithActiveToken);

    const colorizedXml: string = await this._exportXml(this._diagramModeler);
    return colorizedXml;
  }

  private _addOverlaysToUserAndManualTasks(elements: Array<IShape>): void {
    const elementIds: Array<string> =  elements.map((element: IShape) => element.id).sort();

    const elementsWithActiveTokenDidNotChange: boolean = elementIds.toString() === this._previousElementIdsWithActiveToken.toString();
    if (elementsWithActiveTokenDidNotChange) {
      return;
    }

    this._overlay.clear();

    for (const element of elements) {
      const clickedElementIsNotAUserOrManualTask: boolean = element.type !== 'bpmn:UserTask'
                                                         && element.type !== 'bpmn:ManualTask';

      if (clickedElementIsNotAUserOrManualTask) {
        continue;
      }

      this._overlay.add(element, {
        position: {
          left: 0,
          top: 0,
        },
        html: `<div class="play-task-button-container"><i class="fas fa-play play-task-button"></i></div>`,
      });
    }
  }

  private async _getElementsWithActiveToken(elements: Array<IShape>): Promise<Array<IShape>> {
    const identity: IIdentity = this._getIdentity();

    this._activeTokens = await this._managementApiClient.getActiveTokensForCorrelationAndProcessModel(identity,
                                                                                                      this._correlationId,
                                                                                                      this._processModelId);

    const elementsWithActiveToken: Array<IShape> = this._activeTokens.map((activeToken: ActiveToken): IShape => {
      const elementWithActiveToken: IShape = elements.find((element: IShape) => {
        return element.id === activeToken.flowNodeId;
      });

      return elementWithActiveToken;
    });

    return elementsWithActiveToken;
  }

  private async _getElementsWithTokenHistory(elements: Array<IShape>): Promise<Array<IShape>> {
    const allTokenHistories: Array<TokenHistory> = await this._managementApiClient.getTokensForCorrelationAndProcessModel(
      this._getIdentity(),
      this._correlationId,
      this._processModelId);

    const elementsWithTokenHistory: Array<IShape> = [];

    for (const tokenHistory of allTokenHistories) {
      const elementFromTokenHistory: IShape = elements.find((element: IShape) => {
        return element.id === tokenHistory[0].flowNodeId;
      });

      const elementWithIncomingElements: Array<IShape> = this._getElementWithIncomingElements(elementFromTokenHistory, allTokenHistories);

      elementsWithTokenHistory.push(...elementWithIncomingElements);
    }

    return elementsWithTokenHistory;
  }

  private _getElementWithIncomingElements(element: IShape,
                                          tokenHistories: Array<TokenHistory>): Array<IShape> {

    const elementWithIncomingElements: Array<IShape> = [];

    const elementHasNoTokenHistory: boolean = !this._hasElementTokenHistory(element.id, tokenHistories);

    if (elementHasNoTokenHistory) {
      return [];
    }

    elementWithIncomingElements.push(element);

    const incomingElementsAsIModdleElement: Array<IModdleElement> = element.businessObject.incoming;

    const elementHasIncomingElements: boolean = incomingElementsAsIModdleElement === undefined;
    if (elementHasIncomingElements) {
      return elementWithIncomingElements;
    }

    for (const incomingElement of incomingElementsAsIModdleElement) {
      const incomingElementAsShape: IShape = this._elementRegistry.get(incomingElement.id);
      const sourceOfIncomingElement: IShape = incomingElementAsShape.source;

      const incomignElementHasNoSource: boolean = sourceOfIncomingElement === undefined;
      if (incomignElementHasNoSource) {
        continue;
      }

      const previousElementIsTask: boolean = sourceOfIncomingElement.type.includes('Task');

      if (previousElementIsTask) {
        const elementHasActiveToken: boolean = this._hasElementActiveToken(sourceOfIncomingElement.id);

        if (elementHasActiveToken) {
          continue;
        }

        elementWithIncomingElements.push(incomingElementAsShape);

      } else {
        elementWithIncomingElements.push(incomingElementAsShape);

        const sourceHasNoTokenHistory: boolean = !this._hasElementTokenHistory(sourceOfIncomingElement.id, tokenHistories);
        if (sourceHasNoTokenHistory) {
          elementWithIncomingElements.push(sourceOfIncomingElement);
        }

        continue;
      }
    }

    return elementWithIncomingElements;
  }

  private _colorizeElements(elements: Array<IShape>, color: IColorPickerColor): void {
    const noElementsToColorize: boolean = elements.length === 0;
    if (noElementsToColorize) {
      return;
    }

    this._modeling.setColor(elements, {
      stroke: color.border,
      fill: color.fill,
    });
  }

  private _hasElementTokenHistory(elementId: string, tokenHistories: Array<TokenHistory>): boolean {

    const tokenHistoryFromFlowNodeInstanceFound: boolean = tokenHistories.find((tokenHistory: TokenHistory) => {
      const tokenHistoryIsFromFlowNodeInstance: boolean = tokenHistory[0].flowNodeId === elementId;

      return tokenHistoryIsFromFlowNodeInstance;
    }) !== undefined;

    return tokenHistoryFromFlowNodeInstanceFound;
  }

  private _hasElementActiveToken(elementId: string): boolean {
    const identity: IIdentity = this._getIdentity();

    const activeTokenForFlowNodeInstance: ActiveToken = this._activeTokens.find((activeToken: ActiveToken) => {
      const activeTokenIsFromFlowNodeInstance: boolean = activeToken.flowNodeId === elementId;

      return activeTokenIsFromFlowNodeInstance;
    });

    return activeTokenForFlowNodeInstance !== undefined;
  }

  private async _getXml(retryCount: number): Promise<string> {
    const identity: IIdentity = this._getIdentity();

    let correlation: Correlation;
    try {
      // This is necessary because the managementApi sometimes throws an error when the correlation is not yet existing.
      correlation = await this._managementApiClient.getCorrelationById(identity, this._correlationId);
    } catch (error) {
      // tslint:disable-next-line no-magic-numbers
      const retriedEnough: boolean = retryCount > 5;
      if (retriedEnough) {
        throw error;
      }

      return this._getXml(retryCount++);
    }

    const processModelFromCorrelation: CorrelationProcessModel = correlation.processModels.find((processModel: CorrelationProcessModel) => {
      const processModelIsSearchedProcessModel: boolean = processModel.name === this._processModelId;

      return processModelIsSearchedProcessModel;
    });

    const xmlFromProcessModel: string = processModelFromCorrelation.xml;

    return xmlFromProcessModel;
  }

  private _clearColors(): void {
    const elementsWithColor: Array<IShape> = this._elementRegistry.filter((element: IShape): boolean => {
      const elementHasFillColor: boolean = element.businessObject.di.fill !== undefined;
      const elementHasBorderColor: boolean = element.businessObject.di.stroke !== undefined;

      const elementHasColor: boolean = elementHasFillColor || elementHasBorderColor;

      return elementHasColor;
    });

    const noElementsWithColor: boolean = elementsWithColor.length === 0;
    if (noElementsWithColor) {
      return;
    }

    this._modeling.setColor(elementsWithColor, {
      stroke: defaultBpmnColors.none.border,
      fill: defaultBpmnColors.none.fill,
    });
  }

  private async _importXml(modeler: IBpmnModeler, xml: string): Promise<void> {
    const xmlIsNotLoaded: boolean = (xml === undefined || xml === null);

    if (xmlIsNotLoaded) {
      const notificationMessage: string = 'The xml could not be loaded. Please try to reopen the Inspect Correlation View.';
      this._notificationService.showNotification(NotificationType.ERROR, notificationMessage);

      return;
    }

    const xmlImportPromise: Promise<void> = new Promise((resolve: Function, reject: Function): void => {
      modeler.importXML(xml, (importXmlError: Error) => {
        if (importXmlError) {
          reject(importXmlError);

          return;
        }
        resolve();
      });
    });

    return xmlImportPromise;
  }

  private async _exportXml(modeler: IBpmnModeler): Promise<string> {
    const saveXmlPromise: Promise<string> = new Promise((resolve: Function, reject: Function): void =>  {
      const xmlSaveOptions: IBpmnXmlSaveOptions = {
        format: true,
      };

      modeler.saveXML(xmlSaveOptions, async(saveXmlError: Error, xml: string) => {
        if (saveXmlError) {
          reject(saveXmlError);

          return;
        }

        resolve(xml);
      });
    });

    return saveXmlPromise;
  }

  private async _startPolling(): Promise<void> {
    this._pollingTimer = setTimeout(async() => {
      const correlationIsStillActive: boolean = await this._isCorrelationStillActive();

      const previousXml: string = await this._exportXml(this._diagramViewer);
      const xml: string = await this._getXml(0);
      const colorizedXml: string = await this._colorizeXml(xml);

      const xmlChanged: boolean = previousXml !== colorizedXml;
      if (xmlChanged) {
        this._importXml(this._diagramViewer, colorizedXml);
      }

      if (correlationIsStillActive && this._attached) {
        this._startPolling();
      }
    }, environment.processengine.liveExecutionTrackerPollingIntervalInMs);
  }

  private _stopPolling(): void {
    clearTimeout(this._pollingTimer);
  }

  private async _isCorrelationStillActive(): Promise<boolean> {
    const identity: IIdentity = this._getIdentity();

    const allActiveCorrelations: Array<Correlation> = await this._managementApiClient.getActiveCorrelations(identity);

    const correlationIsNotActive: boolean = !allActiveCorrelations.some((activeCorrelation: Correlation) => {
      return activeCorrelation.id === this._correlationId;
    });

    if (correlationIsNotActive) {
      this._correlationEnded();
    }

    return !correlationIsNotActive;
 }

  private _correlationEnded(): void {
    this._notificationService.showNotification(NotificationType.INFO, 'Process stopped.');
  }

  private _getIdentity(): IIdentity {
    const accessToken: string = this._authenticationService.getAccessToken();
    const identity: IIdentity = {
      token: accessToken,
    };

    return identity;
  }
}
