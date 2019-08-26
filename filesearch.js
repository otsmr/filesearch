const path = require("path");
const moment = require("moment");
const powershell = require("./src/powershell");
const parseargv = require('./src/parseargv');

const property = [
    "Name",
    "SIZE",
    "displaySize",
    "AUTHOR",
    "ITEMTYPE",
    "ITEMTYPETEXT",
    "DATEACCESSED",
    "DATECREATED",
    "DATEIMPORTED",
    "DATEMODIFIED",
    "FILEEXTENSION",
    "FILENAME",
    "FILEOWNER",
    "ITEMNAME",
    "FULLNAME",
    "FileAttributes",
    "TITLE",
    "KIND",
    "HitCount",
    "Rank",
    "KINDTEXT",
    "AlbumArtist",
    "AlbumID",
    "AlbumTitle",
    "Artist",
    "Genre"
];

class Search {

    constructor(options) {

        this._searchQuery = "";
        this._filter = [];

    
        for (const opt in options) {
            if (!options.hasOwnProperty(opt)) continue;
            if (typeof this[opt] === "function") {
                this[opt](options[opt]);
            }
        }
    }

    get befehl() {

        let run = this._searchQuery;
        if (this._filter.length > 0) {
            run += " -Filter " + this._filter.join(", ");

        }
        const modulPath = path.join(__dirname, "scripts", "getindexitem.ps1").replace(/\\/, "/");
        return `.'${modulPath}'; Get-IndexedItem ` + run;

    }

    _getFromPowershell(query) {
        return powershell.getJSON(query, property);
    }

    _formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    
    _parseTime(expression) {

        const normalise = (name) => {

            return { 
                hours: 'hours', hour: 'hours', h: 'hours',
                days: 'days', d: 'days', day: 'days',
                minutes: 'minutes', m: 'minutes', minute: 'minutes', min: 'minutes', mins: 'minutes'
            }[name];

        }

        const parse = (expression) => {
            const matches = new RegExp('(<=|<|>|==?)?\s*(.*?)\s*([a-z]*)?\s*$').exec(expression);

            return {
                value: parseInt(matches[2] || 0),
                operator: matches[1] || '=',
                unit: normalise(matches[3] || 'days')
            }
        }

        const parts = parse(expression);
        const timeFromNow = moment().subtract(parts.value, parts.unit).format();
        // const timeFromNow = moment().subtract(parts.value, parts.unit).valueOf();

        return `${parts.operator} '${timeFromNow}'`;

    }

    _time(expression, column) {
        this._filter.push(`"System.${column} ` + this._parseTime(expression) + "\"");
        return this;
    }

    _parseSize(expression) {

        const sizes = {
            bytes: 'b',
            kiloBytes: 'k',
            megaBytes: 'm',
            gigaBytes: 'g',
            teraBytes: 't'
        }

        const isDefined = (value) => { return value !== undefined; }

        const parse = (expression) => {
            const matches = new RegExp('(<=|>=|<|>|==?)?\s*(.*?)\s*([kmgt])?b?\s*$').exec(expression);

            return {
                value: isDefined(matches[2]) ? parseInt(matches[2]) : 0,
                operator: matches[1] || '=',
                unit: matches[3] || sizes.bytes
            }
        }

        const magnify = (value, unit) => {
            if (unit === sizes.kiloBytes) return (value *= 1024);
            if (unit === sizes.megaBytes) return (value *= 1024 * 1024);
            if (unit === sizes.gigaBytes) return (value *= 1024 * 1024 * 1024);
            if (unit === sizes.teraBytes) return (value *= 1024 * 1024 * 1024 * 1024);

            return value;
        }

        const parts = parse(expression);
        const magnifiedValue = magnify(parts.value, parts.unit);

        return `${parts.operator} ${magnifiedValue}`;

    }

    _search() {

        let json = this._getFromPowershell(this.befehl);

        if (!json) return false;
        if (!json.length && json.length !== 0) json = [json];
        let res = [];

        for (const item of json) {

            for (let key in item) {
                if (["DATEACCESSED", "DATEIMPORTED", "DATEMODIFIED", "DATECREATED"].indexOf(key) > -1) {
                    try {
                        item[key] = item[key].replace("/Date(", "").replace(")/", "");
                    } catch (error) { }
                }
                if (key.toLowerCase() !== key) {
                    item[key.toLowerCase()] = item[key];
                    delete item[key];
                }
            }

            if (item.size) item.displaysize = this._formatBytes(item.size);

            res.push(item);
        }
        return res;
    }



    match(match, type = "System.FileName", like = true) {
        if (match.match(/[0-9]/g)) {
            match = `'${match}'`
        }
        match = match.replace(/\*/g, "%")
            .replace(/_/g, "\_")
            .replace(/ /g, "_")
            .replace(/[^0-9a-zA-Z'äüöÖÄÜß_.%_]/g, "");
        this._filter.push(`"${type} ${(!like) ? "NOT " : ""} LIKE ${match}"`);
        return this;
    }

    path(paths) {
        paths = paths.replace(/\\/, "/")
        this._searchQuery += ` -path '${paths}'`
        return this;
    }

    recurse() {
        this._searchQuery += " -recurse"
        return this;
    }

    ext(types) {
        if (typeof types === "string") {
            this.match(`.${types}`, "System.FileExtension");
        } else {
            let query = `"(System.FileExtension LIKE '.${types.join("' OR System.FileExtension LIKE '.")}')"`;
            this._filter.push(query);
        }
        return this;
    }

    kind(kind) {

        if (typeof kind === "string") {
            this.match(`${kind}`, "System.Kind");
        } else {
            let query = `"(System.Kind LIKE '${kind.join("' OR System.Kind LIKE '")}')"`;
            this._filter.push(query);
        }
        return this;
    }

    noMatch(match, type = "System.FileName") {
        return this.match(match, type, false);
    }

    ignore(name) {
        if (typeof name === "string") name = [name];
        for (const n of name) {
            this.noMatch(n);
        }
        return this;
    }

    contain(match) {
        return this.match(`%${match}%`, "autosummary");
    }

    excludefolder(name) {
        if (typeof name === "string") name = [name];
        for (const folder of name) {
            this.noMatch(`%/${folder}/%`, "System.ItemUrl");
        }
        return this;
    }

    size(expression) {
        this._filter.push(`'System.Size ` + this._parseSize(expression) + "'");
        return this;
    }

    accessed(query) {
        return this._time(query, "DateAccessed");
    }
    imported(query) {
        return this._time(query, "DateImported");
    }
    modified(query) {
        return this._time(query, "DateModified");
    }
    created(query) {
        return this._time(query, "DateCreated");
    }

    isEmpty() {
        this.size("<=0b")
    }






    getKinds() {
        this._searchQuery = " -Value 'kind'";
        let kinds = [];
        for (const item of this._search()) {
            kinds.push(item.kind);
        }
        return kinds;
    }

    sync() {
        let match = this._search();
        if (!match.length && match.length !== 0) match = [match];
        this._result = match;
        return this;
    }

    
    searchByArgs(args) {
        args = args.trim()
        if (args[0] !== "-") args = "-match " + args;
        if (args.indexOf("--kinds") > -1) return this.getKinds();
        args = parseargv(args);
        if (!args.match) {
            return console.log("-match is required");
        }
        const options = [
            { arg: "path", alias: "p" },
            { arg: "ext", alias: "e", multiple: true },
            { arg: "kind", alias: "k", multiple: true },
            { arg: "size", alias: "s" },
            { arg: "contain", alias: "c" },
            { arg: "recurse" },
            { arg: "created" },
            { arg: "accessed" },
            { arg: "imported" },
            { arg: "modified" },
            { arg: "isEmpty" },
            { arg: "match" },
            { arg: "ignore", alias: "i", multiple: true },
            { arg: "excludefolder", multiple: true }
        ]

        if (args.nr && !args.noRecurse) args.noRecurse = args.nr;
        if (!args.noRecurse) args.recurse = true;

        for (const opt of options) {

            if (opt.alias && args[opt.alias] && !args[opt.arg]) args[opt.arg] = args[opt.alias];

            
            if (args[opt.arg]) {
                if (args[opt.arg][0]=== "\"") args[opt.arg] = args[opt.arg].replace(/"/g, "");
                if (opt.multiple) {
                    if (args[opt.arg].indexOf(",") > -1) args[opt.arg] = args[opt.arg].split(",")
                }
                this[opt.arg](args[opt.arg]);
            }

        }

        this.sync();
        return this;

    }

    each(call) {
        if (this._result.length > 0) {
            for (const file of this._result) {
                call(file);
            }
        }
    }

    toHtmlTable() {

        if (this._result.length === 0) return "";

        let thead = "";
        let tbody = "";
        for (const key of Object.keys(this._result[0])) {
            thead += `<th scope='col'>${key}</th>`;
        }

        for (const item of this._result) {
            tbody += "<tr>";
            for (const key in item) {
                if (item.hasOwnProperty(key)) {
                    tbody += "<td>" + item[key] + "</td>";
                }
            }
            tbody += "</tr>";
        }

        return ` <table border="1"> <thead> <tr>${thead}</tr> </thead> <tbody> ${tbody} </tbody> </table> `

    }

    toJSON() {
        return this._result;
    }

}


module.exports = Search;
// const options = {
//     excludefolder: [
//         "node_modules",
//         ".git",
//         ".vscode",
//         "AppData",
//         "MicrosoftEdgeBackups",
//     ]
// }

// const args = '"Hack*" -path "c:/users/tom/"'
// const search = new Search(options).getKinds();

// console.log(search);

// process.exit()
// const fs = require("fs");
// let result = search.searchByArgs(args).toHtmlTable();
// fs.writeFileSync("result.html", result);
// const execSync = require("child_process").execSync;
// execSync("start " + __dirname + "/result.html");



// console.log("  ---------------  ");
// console.log(search.befehl);