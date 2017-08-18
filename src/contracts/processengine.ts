import {IProcessDefEntity} from '@process-engine-js/process_engine_contracts';

export interface IProcessEngineRepository {
  getProcesses(limit: number, offset: number): Promise<IPagination<IProcessDefEntity>>;
  startProcess(process: IProcessDefEntity): Promise<any>;
  getInstances(processKey: string): Promise<Array<IProcessDefEntity>>;
  getProcessbyID(processKey: string): Promise<IProcessDefEntity>;
  updateProcessDef(processDef: IProcessDefEntity, xml: string): Promise<any>;
}

export interface IProcessEngineService {
  getProcesses(limit: number, offset: number): Promise<IPagination<IProcessDefEntity>>;
  startProcess(process: IProcessDefEntity): Promise<any>;
  getInstances(processKey: string): Promise<Array<IProcessDefEntity>>;
  getProcessbyID(processKey: string): Promise<IProcessDefEntity>;
  updateProcessDef(processDef: IProcessDefEntity, xml: string): Promise<any>;
}

export interface IPagination<T> {
  count: number;
  offset: number;
  limit: number;
  data: Array<T>;
}

export interface IMessageBusService {
}

// process engine does not provide an interface
export interface IUserTaskEntityExtensions {
  formFields: Array<{
    id: string;
    label: string;
    type: 'long' | 'boolean' | 'date' | 'enum' | 'string' | 'custom_type';
  }>;
}

export type WidgetType = 'textbox' | 'checkbox' | 'dropdown' | 'label' | 'form';
export type FormFieldType = 'textbox' | 'checkbox' | 'dropdown';

export interface IWidget {
  uiName: string;
  type: WidgetType;
}

export interface IFormWidget extends IWidget {
  fields: Array<IFormField>;
}

export interface IFormField {
  id: string;
  label: string;
  type: FormFieldType;
  defaultValue: string;
}
