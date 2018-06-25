"use strict";
var Papa = require("./papaparse.min.js");
var fs = require('fs');
let path = require('path');
const currentFolder = __dirname;
let BLEServices = require("./BLEServices"); ;

var changeHexToNames = (data) => {
    let preCheck = (data) => {
        var availableMessages = {
            SendIndication: "Send Indication service:",
            SendNotification: "Send Notification service:",
            ReadRequest: "Read request service:",
            ReadResponse: "Read response service:",
            WriteRequest: "Write request service:",
            WriteResponse: "Write response service:",
            SubscribeOnIndication: "Subscribe on indication request service:",
            SubscribeOnNotification: "Subscribe on notification request service:",
            SubscribeOnNotificationAndIndication: "Subscribe on notification and indication request service:",
            IndicationRequest: "Indication request service:",
            NotificationRequest: "Notification request service:",
            UnsubscribeOnIndication: "Unsubscribe on indication request service:",
            UnsubscribeOnNotification: "Unsubscribe on notification request service:",
            UnsubscribeOnNotificationAndIndication: "Unsubscribe on notification and indication request service:",
        };
        for (var msg in availableMessages) {
            if (data.includes(availableMessages[msg])) {
                return true;
            }
        }
        return false;
    }
    let HexFromDecimal = function (number) {
        if (Array.isArray(number)) {
            var resultString = "";
            var tmp = "";
            for (var i = 0; i < number.length; i++) {
                if (number[i].toString(16).length === 1) {
                    var tmp = "0" + number[i].toString(16);
                } else tmp = number[i].toString(16);
                resultString = resultString + tmp + ':';
            }
            return "0x" + resultString.toUpperCase().slice(0, -1);
        }
        return "0x" + number.toString(16).toUpperCase();
    }
    if (preCheck(data)) {
        let parts = data.split(" ");
        let partsHex = [];
        let resultName = [];
        parts.forEach((elem) => {
            return elem.includes("0x") ? partsHex.push(elem) : false;
        });
        for (let service in BLEServices) {
            if (partsHex[0] === HexFromDecimal(BLEServices[service].UUID)) {
                resultName.push(service);
                for (var char in BLEServices[service]) {
                    if (partsHex[1] === HexFromDecimal(BLEServices[service][char])) {
                        resultName.push(char);
                        break;
                    }
                }
                break;
            }
        }
        resultName[0] = !!resultName[0]?resultName[0]:partsHex[0];
        resultName[1] = !!resultName[1]?resultName[1]:partsHex[1];
        return data.substr(0, data.indexOf(":") + 1) + " " + resultName[0] + " charact: " + resultName[1];
    } else {
        return false
    }
};






fs.readdir(currentFolder, (err, files) => {
    console.log("Version 0.1");
    let filesCVS = [];
    const EXTENSION = "csv";
    let folderExist = !!files.find((elem) => {
        return elem === "Parsed"
    });
    !folderExist ? fs.mkdirSync(path.join(__dirname, 'Parsed')) : false; //Create folder if doesn't exist
    files.forEach(file => { //Filter files by extension cvs
        let split = file.split(".");
        if (split[split.length - 1] === EXTENSION) {
            filesCVS.push(file);
        }
    });
    //[name,data]
    var CSVFiltered = [];
    filesCVS.forEach((file) => {
        let data = Papa.parse(fs.readFileSync(__dirname + '/' + file, 'utf8'));
        if (data.data[0][0].includes('TickCount')) { //Check first row and column for TickCount name
            CSVFiltered.push(file);
            CSVFiltered.push(data);
        }
    });
    if (CSVFiltered.length !== 0) {        
        let FindColumn = (data) => { //Find command Column
            let index = 0;
            for (var i = 0; i < data[0].length; i++) {
                if (data[0][i].toString().trim().includes("CMD name") || data[0][i].toString().trim().includes("Name")) {
                    index = i;
                }
            }
            return index;
        }
        for (let dataEl = 1; dataEl <= (CSVFiltered.length / 2); dataEl++) {
            let data = CSVFiltered[(dataEl * 2) - 1];
            let column = FindColumn(data.data);
            for (var row = 1; row < data.data.length; row++) {
                if (!!data.data[row][column]) {
                    data.data[row][column] = changeHexToNames(data.data[row][column]) ? changeHexToNames(data.data[row][column]) : data.data[row][column];
                }
            }
            fs.writeFileSync(__dirname + "/Parsed" + "/" + "Parsed_" + CSVFiltered[(dataEl * 2) - 2], Papa.unparse(data, {
                quotes: false,
                quoteChar: '',
                escapeChar: '',
                delimiter: ",",
                header: true,
                newline: "\r\n"
            }));
        }
    }
    console.log("Done");
});