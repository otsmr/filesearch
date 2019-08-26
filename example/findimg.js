const Search = require("../filesearch");
const fs = require("fs");
const execSync = require("child_process").execSync;


const search = new Search();
const html = search
    .match("*2019*") // "2019" im Namen der Datei
    .path(__dirname + "/img")
    .excludefolder([".git", "node_modules"])
    .size(">=1b") // Größer als ein Byte
    // .created(">= 10 Days") // In den letzten 10 Tagen erstellt
    .ext(["png", "jpg"]) // Nur .png und .jpp Dateien
    .kind("picture") // new Search().getKinds()
    .ignore("*_erlin*") // Dateien die zB. Berlin im Namen haben werden aussotiert
    .sync()
    .toHtmlTable()



fs.writeFileSync("result.html", html);
execSync("start " + __dirname + "/result.html");
    
console.log("  ---------------  ");
console.log(search.befehl);