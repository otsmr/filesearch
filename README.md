
# Windows: schnell Dateien und Ordner finden
[![LICENSE][license-image]][license-url]

[license-url]: https://github.com/otsmr/filesearch/blob/master/LICENSE
[license-image]: https://img.shields.io/github/license/otsmr/filesearch 


Mithilfe des SYSTEMINDEX von Windows und der Powershell in Sekundenschnelle Dateien und Ordner finden.

## Getestet unter
+ Windows 10
+ Windows 7
+ Powershell 5

## Getting start

```
npm i --save filesearch-windows
```

```javascript

const Search = require("filesearch-windows");
const search = new Search();

```

### Suchen
```javascript

search
    .match("*2019*") // "2019" im Namen der Datei
    .path("C:\\users\\tom") // Pfad
    .excludefolder([".git", "node_modules"]) // Ordner ignorieren
    .size(">=1m") // Größer als ein MegaByte
    .created(">= 10 Days") // In den letzten 10 Tagen erstellt
    .ext([".png", ".jpg"]) // Nur .png und .jpg Dateien
    .kind("picture") // Verfügbar: new Search().getKinds()
    .ignore("*_erlin*") // Dateien die zB. Berlin oder berlin im Namen haben werden aussotiert


// Suche starten
const result = search.sync().toJSON();

// ODER

search.async((instanz, data) =>  {
    const json = instanz.toJSON();
    console.log(json);
})

```

### Mit Argumenten *[Mehr unter .searchByArgs](#SearchByArgs)*
```javascript

const args = '"*2019*" -path "C:\\users\\tom" -size ">=1m" -excludefolder .git,node_modules -created ">= 10 Days" -ext png -ext jpg -kind pictures -ignore "*_berlin*"'

// Suche starten
const result = search.searchByArgs(args).sync().toJSON();

// ODER

const result = search.searchByArgs(args).async((instanz, data) =>  {
    const json = instanz.toJSON();
    console.log(json);
})

```


### Datei-/Ordnerarten
```javascript
console.log(new Search().getKinds());

// Ergebniss
[ 
    'communication',
    'contact',
    'document',
    'folder',
    'link',
    'music',
    'picture',
    'program',
    'searchfolder',
    'video' 
]
```

# Methoden


## Suchinstanz erstellen
```javascript
const search = new Search();

// Mit Optionen

const defaultOptions = {
    excludefolder: [
        "node_modules",
        ".git",
        "AppData"
    ],
    size: "> 0b" // Keine leeren Dateien
}
const search = new Search(defaultOptions);

```

### **[.searchByArgs(String)](#SearchByArgs)**
### **.sync()**
```javascript
search.sync()
```
Suche starten

### **.async()**
```javascript
search.async(Function (instanz))
```
Suche async starten

### **.toHtmlTable()**
```javascript
search.sync().toHtmlTable();
```
Ergebniss als HTML-Tabelle zurückgeben 

### **.toJSON()**
```javascript
search.sync().toJSON();
```
Ergebniss als Array zurückgeben 


### **.match(String: pattern)**
```javascript
search.match("*2019*")
```
Findet Dateien/Ordner, dessen Name dem Pattern entspricht  

### **.noMatch(String: pattern)**
```javascript
search.noMatch("*2018*")
```
Filtert Dateien/Ordner, dessen Name dem Pattern entspricht  


### **.path(String: Pfad)**
```javascript
search.path("C:\users\tom")
```
Ordner, in dem gesucht werden soll

### **.recurse()**
```javascript
search.recurse()
```
Ordner soll rekursiv durchsucht werden


### **.ext(String/Array)**
```javascript
search.ext("png")
search.ext(["png", "jpg"])
```
Nach Dateiendungen filtern


### **.kind(String/Array)**
```javascript
search.kind("document")
search.kind(["document", "picture"])
```
Nach [Datei-/Ordnertyp](#Datei-/Ordnerarten) filtern


### **.contain(String: pattern)**
```javascript
search.contain("Tom")
```
Findet Dateien, dessen Inhalt zum Pattern passt

### **.excludefolder(String/Array)**
```javascript
search.excludefolder("node_modules")
search.excludefolder(["node_modules", ".git"])
```
Ignoriert die angegebenen Ordner

### **.size(String)**
```javascript
search.size(">=5m") // größer gleich 5 Megabyte
search.size(">5m") // größer 5 Megabyte
search.size("<=5m") // kleiner gleich 5 Megabyte
search.size("=5m") // gleich 5 Megabyte
```
+ Bytes: b  
+ Kilobyte: k  
+ Megabyte: m  
+ Gigabyte: g  
+ Terabyte: t  

Filtert Dateien, die der angegebenen Größe entsprechen


### **.isEmpty()**
```javascript
search.isEmpty()
```
Filtert nach leeren Dateien

### **.accessed(String), .imported(String), .modified(String), .created(String)**
```javascript
search.created(">= 10 min") // Erstellt in den letzten 10 Minuten
search.modified(">= 10 days") // Geändert in den letzten 10 Tagen
```
+ Stunden: h, hours, hour  
+ Tage: d, days, day   
+ Minuten: m, minutes, minute, min, mins  


## SearchByArgs
### **.searchByArgs(String:args)**

#### Standalone  
**-kinds** *Gibt die vorhandenen Typen zurück*  
   
#### Dateisuche    
| Parameter | Type | Default | Beschreibung |
|---|---|---|---|
|-match, [amAnfang]  | String (required) |                               | Name
| -path, -p          | String            | Default: *__dirname*          | Suchpfad
| -ext, -e           | String (Multiple) | Kein Punkt, also "png" nicht ".png"                             | Dateiendung filtern
| -ignore, -i        | String (Multiple) |                               | Dateien ignorieren  
| -kind, -k          | String            |                               | Dateityp: documents,... Liste: -kinds  
| -contain, -c       | String            |                               | Inhalt der Datei
| -size, -s          | String            | <,<=,=,=>,> Number(b,k,m,g,t) | bytes (b), kiloBytes (k), megaBytes (m), gigaBytes (g), teraBytes (t)  
| -noRecurse -nr     |                   |                               | Nur im angegebenen Pfad suchen
| -isEmpty           |                   |                               | Leere Dateien
| -excludefolder     | String (Multiple) | Default: node_modules,.git    | Ordner ignorieren
| **Zeit**           | String            | <,<=,=,=>,> Number(h,d,m)     | Hours (h), Days (d), Minutes (m) 
| -accessed          |||     
| -imported          ||| 
| -modified          || -modified >= 10 min | Geändert in den letzten 10 Minuten   
| -created           || -created >= 5 days  | Erstellt in den letzten 5 Tagen


## Möglichkeiten  
### Multiple
**-ext json -ext html** *oder* **-ext json,html** 
### Platzhalter
| expression | Syntax | und Beschreibung
|---|---|---|
| Ein einzelnes Zeichen | _ | Entspricht einem beliebigen einzelnen Zeichen. |
| Kein, ein oder mehrere Zeichen | * | Entspricht keinem, einem oder mehreren Zeichen. Beispiel: new* entspricht einem beliebigen Text mit der Buchstabenfolge "new", z. B. newfile.txt. |


# Credits

**Get-IndexedItem [PowerShell Script]**

+ MICROSOFT LIMITED PUBLIC LICENSE version 1.1

https://gallery.technet.microsoft.com/scriptcenter/Get-IndexedItem-PowerShell-5bca2dae

# License

MIT (c) tsmr
