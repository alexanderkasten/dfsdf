import {IShape} from '@process-engine/bpmn-elements_contracts';

import {IDiagramState, IDiagramStateList, IDiagramStateListEntry} from '../../contracts';

export class OpenDiagramStateService {
  public saveDiagramState(
    uri: string,
    xml: string,
    location: any,
    selectedElements: Array<IShape>,
    isChanged: boolean,
  ): void {
    const diagramState: IDiagramState = {
      data: {
        xml: xml,
      },
      metaData: {
        location: location,
        selectedElements: selectedElements,
        isChanged: isChanged,
      },
    };

    const key: string = this.getLocalStorageKeyByUri(uri);
    const value: string = JSON.stringify(diagramState);

    window.localStorage.setItem(key, value);
  }

  public updateDiagramState(uri: string, diagramState: IDiagramState): void {
    const key: string = this.getLocalStorageKeyByUri(uri);
    const value: string = JSON.stringify(diagramState);

    window.localStorage.setItem(key, value);
  }

  public loadDiagramState(uri: string): IDiagramState | null {
    const key: string = this.getLocalStorageKeyByUri(uri);

    const dataFromLocalStorage: string = window.localStorage.getItem(key);

    const noDataFound: boolean = dataFromLocalStorage === null;
    if (noDataFound) {
      return null;
    }

    const diagramState: IDiagramState = JSON.parse(dataFromLocalStorage);

    return diagramState;
  }

  public loadDiagramStateForAllDiagrams(): IDiagramStateList {
    const diagramStateList: IDiagramStateList = [];

    const uriForAllExistingDiagramStates: Array<string> = this.getUrisForAllDiagramStates();

    for (const uri of uriForAllExistingDiagramStates) {
      const diagramState: IDiagramState = this.loadDiagramState(uri);

      const diagramStateListEntry: IDiagramStateListEntry = {
        uri: uri,
        diagramState: diagramState,
      };

      diagramStateList.push(diagramStateListEntry);
    }

    return diagramStateList;
  }

  public deleteDiagramState(uri: string): void {
    const key: string = this.getLocalStorageKeyByUri(uri);

    window.localStorage.removeItem(key);
  }

  private getUrisForAllDiagramStates(): Array<string> {
    const allLocalStorageKeys: Array<string> = Object.keys(localStorage);
    const localStorageKeysForAllDiagramStates: Array<string> = allLocalStorageKeys.filter((key: string) => {
      return key.startsWith(this.getLocalStorageKeyByUri(''));
    });

    const urisForAllDiagramStates: Array<string> = localStorageKeysForAllDiagramStates.map(
      (localStorageKey: string) => {
        return localStorageKey.replace(this.getLocalStorageKeyByUri(''), '');
      },
    );

    return urisForAllDiagramStates;
  }

  private getLocalStorageKeyByUri(uri: string): string {
    return `Open Diagram: ${uri}`;
  }
}
