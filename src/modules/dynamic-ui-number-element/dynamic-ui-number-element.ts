import {bindable} from 'aurelia-framework';
import {IEnumFormField} from '../../contracts';

export class DynamicUiNumberElement {

  @bindable() public fieldValue: string;
  public field: IEnumFormField;

  public activate(field: IEnumFormField): void {
    this.field = field;

    const fieldHasNoValue: boolean = this.field.value === undefined
                                  || this.field.value === '';

    if (fieldHasNoValue) {
      this.field.value = this.field.defaultValue;
    }
  }

  public fieldValueChanged(newValue: number): void {
    const validPartsOfValue: Array<string> = /\d+/.exec(`${newValue}`);

    const valueHasNoValidPart: boolean = validPartsOfValue === null;
    if (valueHasNoValidPart) {
      this.fieldValue = undefined;
    } else {
      this.fieldValue = validPartsOfValue[0];
    }

    this.fieldValue = valueHasNoValidPart
                    ? undefined
                    : validPartsOfValue[0];

    this.field.value = this.fieldValue;
  }
}
