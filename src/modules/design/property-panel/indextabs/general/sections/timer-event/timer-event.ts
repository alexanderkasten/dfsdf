import {EventAggregator} from 'aurelia-event-aggregator';
import {inject} from 'aurelia-framework';

import {IEventElement, IModdleElement, IShape, ITimerEventElement} from '@process-engine/bpmn-elements_contracts';

import {
  IBpmnModdle,
  IPageModel,
  ISection,
} from '../../../../../../../contracts';
import environment from '../../../../../../../environment';

enum TimerType {
  Date,
  Duration,
  Cycle,
}

@inject(EventAggregator)
export class TimerEventSection implements ISection {

  public path: string = '/sections/timer-event/timer-event';
  public canHandleElement: boolean = false;
  public timerElement: IModdleElement;
  public TimerType: typeof TimerType = TimerType;
  public timerType: TimerType;

  private _businessObjInPanel: ITimerEventElement;
  private _moddle: IBpmnModdle;
  private _eventAggregator: EventAggregator;

  constructor(eventAggregator?: EventAggregator) {
    this._eventAggregator = eventAggregator;
  }

  public activate(model: IPageModel): void {
    this._businessObjInPanel = model.elementInPanel.businessObject as ITimerEventElement;

    this._moddle = model.modeler.get('moddle');
    this.timerElement = this._getTimerElement();

    this._init();
  }

  public isSuitableForElement(element: IShape): boolean {
    const elementHasNoBusinessObject: boolean = element === undefined || element.businessObject === undefined;

    if (elementHasNoBusinessObject) {
      return false;
    }

    const eventElement: IEventElement = element.businessObject as IEventElement;

    const elementIsTimerEvent: boolean = eventElement.eventDefinitions !== undefined
                                      && eventElement.eventDefinitions[0] !== undefined
                                      && eventElement.eventDefinitions[0].$type === 'bpmn:TimerEventDefinition';

    return elementIsTimerEvent;
  }

  public updateTimerType(): void {
    const moddleElement: IModdleElement = this._moddle.create('bpmn:FormalExpression', {body: this.timerElement.body});

    const timerDefinitionIsDate: boolean = this.timerType === TimerType.Date;
    const timerDefinitionIsDuration: boolean = this.timerType === TimerType.Duration;
    const timerDefinitionIsCycle: boolean = this.timerType === TimerType.Cycle;

    let timerTypeObject: Object;

    if (timerDefinitionIsDate) {
      timerTypeObject = {
        timeDate: moddleElement,
      };
    } else if (timerDefinitionIsCycle) {
      timerTypeObject = {
        timeCycle: moddleElement,
      };
    } else if (timerDefinitionIsDuration) {
      timerTypeObject = {
        timeDuration: moddleElement,
      };
    } else {
      timerTypeObject = {};
    }

    delete this._businessObjInPanel.eventDefinitions[0].timeCycle;
    delete this._businessObjInPanel.eventDefinitions[0].timeDuration;
    delete this._businessObjInPanel.eventDefinitions[0].timeDate;

    Object.assign(this._businessObjInPanel.eventDefinitions[0], timerTypeObject);
    this.timerElement.body = '';
    this._publishDiagramChange();
  }

  public updateTimerDefinition(): void {
    const timeElement: IModdleElement = this._getTimerElement();
    timeElement.body = this.timerElement.body;
    this._publishDiagramChange();
  }

  private _init(): void {
    const {timeDate, timeDuration, timeCycle} = this._businessObjInPanel.eventDefinitions[0];

    if ((timeDate === undefined)
        && (timeDuration === undefined)
        && (timeCycle === undefined)) {
      return;
    }

    if (timeCycle !== undefined) {
      this.timerType = TimerType.Cycle;
      return;
    }

    if (timeDuration !== undefined) {
      this.timerType = TimerType.Duration;
      return;
    }

    if (timeDate !== undefined) {
      this.timerType = TimerType.Date;
      return;
    }
  }

  private _getTimerElement(): IModdleElement {
    const {timeDuration, timeDate, timeCycle} = this._businessObjInPanel.eventDefinitions[0];

    if (timeDuration !== undefined) {
       return timeDuration;
    }
    if (timeDate !== undefined) {
      return timeDate;
    }
    if (timeCycle !== undefined) {
      return timeCycle;
    }

    const timerEventDefinition: IModdleElement = this._moddle.create('bpmn:FormalExpression', {body: ''});
    return timerEventDefinition;
  }

  private _publishDiagramChange(): void {
    this._eventAggregator.publish(environment.events.diagramChange);
  }

}
