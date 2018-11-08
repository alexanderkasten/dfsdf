import {bindable, inject} from 'aurelia-framework';

import {Correlation, TokenHistoryEntry} from '@process-engine/management_api_contracts';
import {IShape} from '../../../../contracts';
import {IInspectCorrelationService, IPayloadEntry, IPayloadEntryValue, IRawTokenEntry, ITokenEntry} from '../../contracts';

@inject('InspectCorrelationService')
export class TokenViewer {
  @bindable() public correlation: Correlation;
  @bindable() public processModelId: string;
  @bindable() public flowNode: IShape;
  @bindable() public token: string;
  @bindable() public showBeautifiedToken: boolean = true;
  public tokenEntries: Array<ITokenEntry> = [];
  public showTokenEntries: boolean = false;
  public firstElementSelected: boolean = false;
  public shouldShowFlowNodeId: boolean = false;
  public rawTokenEntries: Array<IRawTokenEntry>;

  private _inspectCorrelationService: IInspectCorrelationService;

  constructor(inspectCorrelationService: IInspectCorrelationService) {
    this._inspectCorrelationService = inspectCorrelationService;
  }

  public correlationChanged(): void {
    const correlationWasInitiallyOpened: boolean = this.flowNode === undefined;
    if (correlationWasInitiallyOpened) {
      return;
    }

    const flowNodeIsSequenceFlow: boolean = this.flowNode.type === 'bpmn:SequenceFlow';
    if (flowNodeIsSequenceFlow) {
      this.shouldShowFlowNodeId = false;
      this.showTokenEntries = false;
      this.tokenEntries = [];
      this.rawTokenEntries = [];

      return;
    }

    this._updateFlowNode();
  }

  public flowNodeChanged(newFlowNode: IShape): Promise<void> {
    const flowNodeIsSequenceFlow: boolean = newFlowNode.type === 'bpmn:SequenceFlow';
    if (flowNodeIsSequenceFlow) {
      this.shouldShowFlowNodeId = false;
      this.showTokenEntries = false;
      this.tokenEntries = [];
      this.rawTokenEntries = [];

      return;
    }

    this._updateFlowNode();
  }
  private async _updateFlowNode(): Promise<void> {
    this.firstElementSelected = true;
    this.tokenEntries = [];

    const correlationIsNotSelected: boolean = this.correlation === undefined;
    if (correlationIsNotSelected) {
      this.tokenEntries = undefined;
      this.rawTokenEntries = undefined;
      this.showTokenEntries = false;
      this.shouldShowFlowNodeId = false;

      return;
    }

    const tokenHistoryEntries: Array<TokenHistoryEntry> = await this._inspectCorrelationService
      .getTokenForFlowNodeInstance(this.processModelId, this.correlation.id, this.flowNode.id);

    this.tokenEntries = this._getBeautifiedTokenEntriesForFlowNode(tokenHistoryEntries);
    this.rawTokenEntries = this._getRawTokenEntriesForFlowNode(tokenHistoryEntries);

    this.showTokenEntries = this.tokenEntries.length > 0;
    this.shouldShowFlowNodeId = this.tokenEntries.length > 0;
  }

  private _getRawTokenEntriesForFlowNode(tokenHistoryEntries: Array<TokenHistoryEntry>): Array<IRawTokenEntry> {
    const tokenEntries: Array<IRawTokenEntry> = [];

    const elementHasNoToken: boolean = tokenHistoryEntries === undefined;
    if (elementHasNoToken) {
      return tokenEntries;
    }

    tokenHistoryEntries.forEach((historyEntry: TokenHistoryEntry, index: number) => {
      // tslint:disable-next-line no-magic-numbers
      const payloadAsString: string = JSON.stringify(historyEntry.payload, null, 2);

      const tokenEntry: IRawTokenEntry = {
        entryNr: index,
        eventType: historyEntry.tokenEventType,
        createdAt: historyEntry.createdAt,
        payload: payloadAsString,
      };

      tokenEntries.push(tokenEntry);
    });
    
    return tokenEntries;
  }

  private _getBeautifiedTokenEntriesForFlowNode(tokenHistoryEntries: Array<TokenHistoryEntry>): Array<ITokenEntry> {
    const tokenEntries: Array<ITokenEntry> = [];

    const elementHasNoToken: boolean = tokenHistoryEntries === undefined;
    if (elementHasNoToken) {
      return tokenEntries;
    }

    tokenHistoryEntries.forEach((historyEntry: TokenHistoryEntry, index: number) => {
      const historyEntryPayload: any = historyEntry.payload;

      const historyEntryHasNoPayload: boolean = historyEntryPayload === undefined;
      if (historyEntryHasNoPayload) {
        return;
      }

      const tokenEntryPayload: Array<IPayloadEntry> = this._convertHistoryEntryPayloadToTokenEntryPayload(historyEntryPayload);

      const tokenEntry: ITokenEntry = {
        entryNr: index,
        eventType: historyEntry.tokenEventType,
        createdAt: historyEntry.createdAt,
        payload: tokenEntryPayload,
      };

      tokenEntries.push(tokenEntry);
    });

    return tokenEntries;
  }

  private _convertHistoryEntryPayloadToTokenEntryPayload(tokenEntryPayload: any): Array<IPayloadEntry> {
    const formattedTokenEntryPayload: Array<IPayloadEntry> = [];

    const payloadIsNotAnObjectOrArray: boolean = typeof tokenEntryPayload !== 'object';
    if (payloadIsNotAnObjectOrArray) {
      const payloadEntry: IPayloadEntry = this._getPayloadEntryForNonObject(tokenEntryPayload);

      formattedTokenEntryPayload.push(payloadEntry);
    } else {
      const payloadEntries: Array<IPayloadEntry> = this._getAllPayloadEntriesForObject(tokenEntryPayload);

      formattedTokenEntryPayload.push(...payloadEntries);
    }

    return formattedTokenEntryPayload;
  }

  private _getAllPayloadEntriesForObject(payload: any): Array<IPayloadEntry> {
    const payloadEntries: Array<IPayloadEntry> = [];

    for (const loadIndex in payload) {
      const currentLoad: any = payload[loadIndex];

      const payloadEntry: IPayloadEntry = this._getPayloadEntryForObject(currentLoad, loadIndex);

      payloadEntries.push(payloadEntry);
    }

    return payloadEntries;
  }

  private _getPayloadEntryForObject(load: any, loadName: string): IPayloadEntry {
    const payloadEntry: IPayloadEntry = {
      name: loadName,
      values: [],
    };

    const entryIsNotAnObject: boolean = typeof load !== 'object';
    if (entryIsNotAnObject) {
      const payloadEntryValues: Array<IPayloadEntryValue> = this._getPayloadEntryValuesForNonObject(load);

      payloadEntry.values = payloadEntryValues;
    } else {
      const payloadEntryValues: Array<IPayloadEntryValue> = this._getPayloadEntryValuesForObject(load);

      payloadEntry.values = payloadEntryValues;
    }

    return payloadEntry;
  }

  private _getPayloadEntryValuesForObject(payload: any): Array<IPayloadEntryValue> {
    const payloadEntryValues: Array<IPayloadEntryValue> = [];

    for (const entryIndex in payload) {
      // tslint:disable-next-line no-magic-numbers
      const payloadEntryValue: string = JSON.stringify(payload[entryIndex], null, 2);

      payloadEntryValues.push({
        title: entryIndex,
        value:  payloadEntryValue,
      });
    }

    return payloadEntryValues;
  }

  private _getPayloadEntryForNonObject(payload: any): IPayloadEntry {
    const payloadEntryValues: any = this._getPayloadEntryValuesForNonObject(payload);

    const payloadEntry: IPayloadEntry = {
      values: payloadEntryValues,
    };

    return payloadEntry;
  }

  private _getPayloadEntryValuesForNonObject(payload: any): Array<IPayloadEntryValue> {
    const payloadIsString: boolean = typeof payload === 'string';

    const payloadEntryValue: string = payloadIsString
                                  ? `"${payload}"`
                                  : payload.toString();

    const payloadEntryValues: Array<IPayloadEntryValue> = [
      { value: payloadEntryValue },
    ];

    return payloadEntryValues;
  }
}
