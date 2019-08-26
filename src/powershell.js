"use strict";
const {spawnSync, spawn} = require('child_process');
const fs = require("fs");
const path = require("path");

module.exports = new class {

    admin (befehl) {
        return this.run(`Start-Process powershell -WindowStyle Minimized -Verb runAs -ArgumentList \\\"${befehl}\\\"`);
    }

    run (befehl) {
        try {
            return spawnSync("powershell.exe", [befehl], { encoding : 'utf8' }).stdout;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    runAsync (befehl, call) {
        try {
            const search = spawn("powershell.exe", [befehl], { encoding : 'utf8' });

            search.on('close', code => {
                if (code === 0) {
                    call();
                } else {
                   call(false);
                }
            });

            search.stderr.on('data', (data) => {
                call(false);
            });
        } catch (error) {
            console.log(error);
            call(false);
        }
    }

    _getJSONBefehl (befehl, params, fileNumber) {

        const file = path.join(__dirname, "/tmp."+fileNumber+".json");
        if (params.length > 0) {
            befehl += ` | Select-Object -Property ${params.join(", ")}`
            befehl += ` | ConvertTo-Json`
            befehl += ` | Out-File '${file}' -Encoding UTF8` // stupid endcoding
        }
        
        return befehl;
    }
    
    _getJSONResult (fileNumber) {
        
        try {
            const file = path.join(__dirname, "/tmp."+fileNumber+".json");

            let data = fs.readFileSync(file).toString();
            fs.unlinkSync(file);
            data = data.substr(1); // Bug Fix: '﻿' Encoding
            if (data === "") return [];
            const match = data.match(/:(.*?)"(.*?)"(.*?)"(.*?)"(.*?),/g);

            if (match) for (const item of match) {
                let part = item.substr(1).slice(0, -2).trim();
                if (part[0] === '"') part = part.substr(1);
                part = part.replace(/\"/g, '"').replace(/"/g, '\\"');
                data = data.replace(item, `:  "${part}",`)
            }
            
            return JSON.parse(data);
        } catch (error) {
            console.log(error);
            return [];
        }

    }

    getJSONAsync (befehl, params = [], call) {
        const fileNumber = parseInt(String(Math.random()).replace(".", ""));
        befehl = this._getJSONBefehl(befehl, params, fileNumber);
        this.runAsync(befehl, (res) => {
            call(this._getJSONResult(fileNumber));
        })
    }
    
    getJSON (befehl, params = []) {
        const fileNumber = parseInt(String(Math.random()).replace(".", ""));
        befehl = this._getJSONBefehl(befehl, params, fileNumber);
        this.run(befehl);
    
        return this._getJSONResult(fileNumber);

    }

}