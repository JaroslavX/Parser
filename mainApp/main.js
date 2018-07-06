// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 0, height: 0})
  //mainWindow.setMenu(null);
  const {dialog} = require('electron')
  "use strict";
  var Papa = require("./papaparse.min.js");
  var fs = require('fs');
  let path = require('path');
  let currentFolder = dialog.showOpenDialog({properties: ['openDirectory'],title:"Please select destination folder"});
  currentFolder =currentFolder?currentFolder.toString():process.exit();
  let BLEServices = require("./BLEServices");
  
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
      !folderExist ? fs.mkdirSync(path.join(currentFolder, 'Parsed')) : false; //Create folder if doesn't exist
      files.forEach(file => { //Filter files by extension cvs
          let split = file.split(".");
          if (split[split.length - 1] === EXTENSION) {
              filesCVS.push(file);
          }
      });
      //[name,data]
      var CSVFiltered = [];
      filesCVS.forEach((file) => {
          let data = Papa.parse(fs.readFileSync(currentFolder + '/' + file, 'utf8'));
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
              fs.writeFileSync(currentFolder + "/Parsed" + "/" + "Parsed_" + CSVFiltered[(dataEl * 2) - 2], Papa.unparse(data, {
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
      dialog.showMessageBox({type:"info",message: "Done"});
      mainWindow.close();
  });

//   // Open the DevTools.
//   // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
