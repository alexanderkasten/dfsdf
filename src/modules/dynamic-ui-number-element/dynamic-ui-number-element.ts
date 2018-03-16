import {IFormWidgetStringField} from '@process-engine/bpmn-studio_client';
import {bindable} from 'aurelia-framework';

export class DynamicUiNumberElement {

  @bindable()
  public field: IFormWidgetStringField;

  public activate(field: IFormWidgetStringField): void {
    this.field = field;
    if (this.field.value === undefined || this.field.value === null || this.field.value === '') {
      this.field.value = this.field.defaultValue;
    }
  }
}
