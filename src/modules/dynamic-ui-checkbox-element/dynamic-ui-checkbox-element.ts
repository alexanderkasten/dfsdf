export class DynamicUiCheckboxElement {
  private label: string;
  private defaultValue: string;
  private id: string;

  private activate(model: any): void {
    this.label = model.label;
    this.defaultValue = model.defaultValue;
    this.id = model.id;
  }
}
