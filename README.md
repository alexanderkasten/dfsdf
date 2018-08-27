# BPMN-Studio

BPMN-Studio ist eine Web- und Desktop-Applikation zur Erstellung, Verwaltung,
Ausführung und Auswertung von BPMN-Prozessen.  Es setzt auf dem BPMN.io auf und
den BPMN-Standard 2.x um.

## Was sind die Ziele dieses Projekts?

BPMN-Studio soll es dem Anwender so leicht wie möglich machen BPMN-Diagramme zu
erstellen und zu pflegen.  Des Weiteren kann BPMN-Studio mit einer Workflow
Engine verbunden werden, um diese Diagramme auszuführen.

## Relevante URLs

[ProcessEngine](https://github.com/process-engine/process_engine)
[Dokumentation](https://github.com/process-engine/documentation)
[Minimales Skeleton](https://github.com/process-engine/skeleton)

## Wie kann ich das Projekt aufsetzen?

### Voraussetzungen

* Node `>= 6.1.0`
* Laufende ProcessEngine

### Setup/Installation

**TL;DR**

1. `npm install`
1. `npm run build`
1. `npm run electron-build-<OS>`
1. `npm start` / `npm run start_dev`

**Notizen:**

1. Für `npm run electron-build-<OS>` gilt:

   Für den Platzhalter `<OS>` können folgende Werte eingesetzt werden:

   - `linux` für Linux
   - `macos` für MacOS
   - `windows` für Windows

   Beispiel:

   `npm run electron-build-macos`

**TL;DR Tests**

1. `npm start`
1. `npm run integration-test-init`
1. `npm run integration-test`

## Wie kann ich das Projekt benutzen?

### Installation der Abhängigkeiten

Die Abhängigkeiten werden wie folgt installiert:

```shell
npm install
```

### Benutzung

**Zum bauen:**

```shell
npm run build
```

Dieses Skript baut die Anwendung, das Ergebnis ist produktionsreif.

**Zum starten:**

```shell
npm start
```

Dieses Skript startet die statische Auslieferung der Anwendung auf Port 17290.
Zuerst muss die Anwendung gebaut worden sein.

Es ist möglich einen anderen Port zu spezifizieren:

```shell
npm start -- --port 9000
```

Das startet das BPMN-Studio auf Port 9000.

**Anmerkung**

Der Port muss aus technischen Gründen zwischen 1000 und 65535 liegen.

**Erreichbarkeit**

Es ist möglich eine andere IP-Adresse als 127.0.0.1 zu spezifizieren:

```shell
npm start -- --host 0.0.0.0
```

Damit ist das BPMN Studio auch von außen erreichbar.

**Zum starten (Entwicklung)**

```shell
npm run start_dev
```

Dieses Skript startet die Auslieferung der Anwendung für die Entwicklung.
Bei Änderungen im Quelltext wird die Anwendung neugebaut und der Webbrowser
automatisch neu geladen.

### Electron Applikation

**Zum bauen:**

**Mac:**

```shell
npm run electron-build-macos
```

Nach dem Bauen kann man in dem `dist/mac` Ordner die fertige Applikation finden
und ausführen.

**Windows:**

Vor dem erstmaligen Builden müssen windows-build-tools installiert werden:

```shell
npm install --global --production windows-build-tools
```

Danach kann gebuildet werden:

```shell
npm run electron-build-windows
```

Nach dem Bauen, kann man in dem `dist/` Ordner die Datei `bpmn-studio Setup
<VERSION>.exe` ausführen, um die Applikation zu installieren; `<VERSION>` wird
durch die entsprechende Version ersetzt.

Beispiel:

`dist/bpmn-studio Setup 1.2.1.exe`

**Alternative:**

Die Releases des BPMN-Studios lassen sich alternativ auch
[hier](https://github.com/process-engine/bpmn-studio/releases)
herunterladen.

### Docker image

#### Container bauen

Das Image lässt sich wie folgt bauen:

```shell
docker build --tag bpmn:v0.1 .
```

#### Container bauen mit optionalen Parametern

Es ist möglich, das base image, sowie die Paketversionen anzupassen:

* `node_version`: Base image version mit NodeJS und Alpine Linux

```shell
docker build --build-arg node_version=10-alpine \
             --tag bpmn:v0.1 .
```

#### Container starten

Der Container lässt sich mit folgendem Befehl starten:

```shell
docker run -p 17290:17290 bpmn:v0.1
```

Anschließend lässt sich das BPMN-Studio unter URL `http://localhost:17290` aufrufen.

## End-to-End-Tests

Die End-to-End-Tests werden mit Hilfe des [Protractor Frameworks](https://www.protractortest.org/#/) durchgeführt.

**Hinweis:** Alle Befehle müssen im geklonten Repository ausgeführt werden.

**Hinweis:** Aufgrund eines [Fehlers](https://github.com/process-engine/process_engine_runtime/issues/9) innerhalb der ProcessEngine Runtime, schlagen aktuell einige Tests fehl.

### Vorraussetzungen

Es werden folgende Pakete benötigt:

Allgemein:
* [Java Development Kit](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)
* [Chrome](https://www.google.com/intl/de_ALL/chrome/)

Nur bei lokalen Tests:
* [Process Engine](https://www.npmjs.com/package/@process-engine/process_engine_runtime)

Nur bei lokalen Tests mit Docker:
* Docker

Nur bei CrossBrowserTesting:
* VM oder vergleichbares mit öffentlicher IP
* Docker
* CrossBrowserTesting Account

### Lokale Tests ohne Docker

Initial müssen folgende Befehle in einem Terminal ausgeführt werden:

```shell
npm install
npm run build
```

Der Webservice kann mit folgendem Befehl gestartet werden:

```shell
npm start -- --port=9000
```

Ein weiteres Terminal öffnen und folgenden Befehl eingeben, um die ProcessEngine zu starten:

```shell
process-engine
```

Ein weiteres Terminal öffnen und folgenden Befehl eingeben, um den Selenium Server zu starten:

```shell
npm run integration-test-init
```

Die End-to-End tests können in einem weiteren Terminal mit folgendem Befehl gestartet werden:

```shell
npm run integration-test
```

### Lokale Tests mit Docker

Ein Terminal öffnen und das BPMN-Studio mit folgendem Befehl starten:

```shell
docker run -p 8000:8000 -p 9000:9000 5minds/bpmn-studio-bundle:latest
```

Ein weiteres Terminal öffnen und folgenden Befehl eingeben, um den Selenium Server zu starten:

```shell
npm run integration-test-init
```

Die End-to-End Tests können in einem weiteren Terminal mit folgendem Befehl gestartet werden:

```shell
npm run integration-test
```

### Crossbrowser Tests mit Docker
[<img src="https://crossbrowsertesting.com/design/images/brand/cbt-sb-logo.svg" width="250px">](https://crossbrowsertesting.com)

Initial müssen folgende Umgebungsvariablen gesetzt werden:

```shell
export CB_USER=""           # CrossBrowserTesting E-Mail Adresse
export CB_KEY=""            # CrossBrowserTesting API Key
export aureliaUrl=""        # URL oder IP der VM + Port des BPMN-Studio; z.B.: http://1.1.1.1:9000
export processEngineUrl=""  # URL oder IP der VM + Port der ProcessEngine; z.B.: http://1.1.1.1:8000
```

Ein Terminal öffnen und das BPMN-Studio auf der VM mit folgendem Befehl starten:

```shell
docker run -p 8000:8000 -p 9000:9000 5minds/bpmn-studio-bundle:latest
```

Ein Terminal auf dem lokalen Computer öffnen und mit folgenden Befehl die CrossBrowserTesting Tests starten:

```shell
npm run crossbrowser-test
```



## Shortcut Skripte

Es sind Skripte in der `package.json` vordefiniert, welche
sich durch `npm run <script name>` ausführen lassen.

Die folgenden Skripte, werden in unserem Tooling verwendet:

* `build`

   Baut das Aurelia Bundle.

* `start`

   Startet die BPMN-Studio Webanwendung

* `start_dev`

   Startet die BPMN-Studio Webanwendung und trackt die Quelldatein
   (geänderte Quelltextdatein werden neu transpiliert und die
   Webanwendung wird neu geladen).

* `electron-start-dev`

   Baut das Aurelia Bundle und startet die Electron Anwendung.

* `reset`

   Entfernt alle node_modules, die `package-lock.json` Datei und bereinigt den NPM-Cache.

* `lint`

   Startet `tslint` für das gesamte Projekt.

* `electron-build-macos`

   Baut die Electron-Anwendung für macOS.

* `electron-build-linux`

   Baut die Electron-Anwendung für Linux.

* `electron-build-windows`

   Baut die Electron-Anwendung für Windows.

## Was muss ich sonst noch wissen?

Die Konfiguration liegt unter `aurelia_project/environments/dev|stage|prod.ts`.

# Wen kann ich auf das Projekt ansprechen?

[Christoph Gnip](mailto:christoph.gnip@5minds.de)
[Alexander Kasten](mailto:alexander.kasten@5minds.de)
[Paul Heidenreich](mailto:paul.heidenreich@5minds.de)
