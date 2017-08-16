import * as x from '@process-engine-js/bpmn-js-custom-bundle';
import {bindable} from 'aurelia-framework';
import {IBpmnModeler, IBpmnModelerConstructor} from '../../contracts';

export class BpmnIo {

  @bindable
  private xml: string;
  private modeler: IBpmnModeler;

  private attached(): void {
    // bundle exposes the viewer / modeler via the BpmnJS variable
    const BpmnModeler: IBpmnModelerConstructor = x;
    this.modeler = new BpmnModeler({
      container: '#canvas',
      propertiesPanel: {
        parent: '#js-properties-panel'
      },
    });

    if (this.xml !== undefined && this.xml !== null) {
      this.modeler.importXML(this.xml, (err: Error) => {
        return 0;
      });
    }
  }

  public xmlChanged(newValue: string, oldValue: string): void {
    if (this.modeler !== undefined && this.modeler !== null) {
      this.modeler.importXML(this.xml, (err: Error) => {
        return 0;
      });
    }
  }

}
