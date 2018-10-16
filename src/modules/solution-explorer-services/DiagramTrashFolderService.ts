/**
 * This service allows getting the folder where deleted diagrams should be
 * written to.
 */
export class DiagramTrashFolderService {

  private _diagramTrashFolder: string | null = null;

  /**
   * Gets the diagram trash folder location on the current platform. This
   * method will ensure that the target folder exists.
   *
   * @return the folder to write deleted diagrams to.
   */
  public getDiagramTrashFolder(): string {
    const notInitialized: boolean = this._diagramTrashFolder === null;
    if (notInitialized) {
      this._initializeDiagramTrashFolder();
    }

    return this._diagramTrashFolder;
  }

  /**
   * Initializes the diagram trash folder.
   */
  private _initializeDiagramTrashFolder(): void {
    const path: any = (window as any).nodeRequire('path');
    const os: any = (window as any).nodeRequire('os');
    const fs: any = (window as any).nodeRequire('fs');

    const homeFolder: string = os.homedir();

    // On macOS we can use the ~/.Trash/ folder.
    const isMacOS: boolean = os.platform() === 'darwin';
    if (isMacOS) {
      const systemTrashFolder: string = path.join(homeFolder, '.Trash');
      this._diagramTrashFolder = systemTrashFolder;

      return;
    }

    // On all other platforms we use the ~/.bpmn-studio/deleted-diagrams/ folder.

    const bpmnStudioFolder: string = path.join(homeFolder, '.bpmn-studio');
    const deletedDiagramsFolder: string = path.join(bpmnStudioFolder, 'deleted-diagrams');

    const bpmnStudioFolderDoesNotExist: boolean = !fs.existsSync(bpmnStudioFolder);
    if (bpmnStudioFolderDoesNotExist) {
      fs.mkdirSync(bpmnStudioFolder);
    }

    const deletedDiagramsFolderDoesNotExist: boolean = !fs.existsSync(deletedDiagramsFolder);
    if (deletedDiagramsFolderDoesNotExist) {
      fs.mkdirSync(deletedDiagramsFolder);
    }

    this._diagramTrashFolder = deletedDiagramsFolder;
  }
}
