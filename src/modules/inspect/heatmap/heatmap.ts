import {bindable, inject} from 'aurelia-framework';

import * as bundle from '@process-engine/bpmn-js-custom-bundle';
import {DataModels} from '@process-engine/management_api_contracts';
import {IDiagram} from '@process-engine/solutionexplorer.contracts';

import {
  IBpmnModeler,
  ICanvas,
  IElementRegistry,
  IOverlayManager,
  ISolutionEntry,
  IViewbox,
} from '../../../contracts/index';

import {IFlowNodeAssociation, IHeatmapService} from './contracts';

@inject('HeatmapService')
export class Heatmap {
  public viewerContainer: HTMLDivElement;
  @bindable() public activeDiagram: IDiagram;
  @bindable() public activeSolutionEntry: ISolutionEntry;

  private heatmapService: IHeatmapService;
  private modeler: IBpmnModeler;
  private viewer: IBpmnModeler;

  constructor(heatmapService: IHeatmapService) {
    this.heatmapService = heatmapService;
  }

  public activeSolutionEntryChanged(newValue: ISolutionEntry): void {
    this.heatmapService.setIdentity(newValue.identity);
  }

  public activeDiagramChanged(): void {
    const attachedViewer: Element = document.getElementsByClassName('bjs-container')[0];

    const viewerContainerIsAttached: boolean =
      this.viewerContainer !== undefined &&
      this.viewerContainer !== null &&
      this.viewerContainer.childElementCount > 1 &&
      attachedViewer !== undefined &&
      attachedViewer !== null;

    if (viewerContainerIsAttached) {
      this.viewerContainer.removeChild(attachedViewer);
    }

    const viewerIsInitialized: boolean = this.viewer !== undefined;
    if (viewerIsInitialized) {
      this.viewer.detach();
      this.viewer.destroy();
    }

    this.initialize();
  }

  public async initialize(): Promise<void> {
    const noActiveDiagram: boolean = this.activeDiagram === undefined;
    if (noActiveDiagram) {
      return;
    }

    const diagramIsNoRemoteDiagram: boolean = !this.activeDiagram.uri.startsWith('http');
    if (diagramIsNoRemoteDiagram) {
      return;
    }

    // eslint-disable-next-line 6river/new-cap
    this.modeler = new bundle.modeler({
      moddleExtensions: {
        camunda: bundle.camundaModdleDescriptor,
      },
    });

    await this.pushXmlToBpmnModeler(this.activeDiagram.xml, this.modeler);

    const elementRegistry: IElementRegistry = this.modeler.get('elementRegistry');
    /*
     * TODO: Refactoring opportunity; HeatmapService could use a fluent API; This is how it would look like:
     * this._heatmapService
     *   .setFlowNodeAssociations(elementRegistry) // -> associations
     *   .setRuntimeInformationForProcessModel(this.processmodelid) // -> flowNodeRuntimeInformation
     *   .getColoredXML(this._modeler) // <- associations, flowNodeRuntimeInformation
     */

    const associations: Array<IFlowNodeAssociation> = await this.heatmapService.getFlowNodeAssociations(
      elementRegistry,
    );

    const flowNodeRuntimeInformation: Array<
      DataModels.Kpi.FlowNodeRuntimeInformation
    > = await this.heatmapService.getRuntimeInformationForProcessModel(this.activeDiagram.id);

    const xml: string = await this.heatmapService.getColoredXML(associations, flowNodeRuntimeInformation, this.modeler);

    // eslint-disable-next-line 6river/new-cap
    this.viewer = new bundle.viewer({
      additionalModules: [bundle.ZoomScrollModule, bundle.MoveCanvasModule, bundle.MiniMap],
    });

    await this.pushXmlToBpmnModeler(xml, this.viewer);

    const overlays: IOverlayManager = this.viewer.get('overlays');

    this.heatmapService.addOverlays(overlays, elementRegistry, this.activeDiagram.id);

    const containerIsPresent: boolean = this.viewerContainer !== null;
    if (containerIsPresent) {
      this.viewer.attachTo(this.viewerContainer);
    }

    this.fitDiagramToViewport();
  }

  private pushXmlToBpmnModeler(xml: string, modeler: IBpmnModeler): Promise<void> {
    return new Promise((resolve: Function, reject: Function): void => {
      modeler.importXML(xml, (importXmlError: Error) => {
        if (importXmlError) {
          reject(importXmlError);
          return;
        }
        resolve();
      });
    });
  }

  private fitDiagramToViewport(): void {
    const canvas: ICanvas = this.viewer.get('canvas');
    const viewbox: IViewbox = canvas.viewbox();
    const diagramIsVisible: boolean = viewbox.height > 0 && viewbox.width > 0;

    if (diagramIsVisible) {
      canvas.zoom('fit-viewport', 'auto');
    }
  }
}
