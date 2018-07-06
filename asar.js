var asar = require('asar');
 
var src = 'D:/projects/Test/Test/Test/Papa/Papa/tests/electrontest/mainApp';
var dest = 'name.asar';
 
asar.createPackage(src, dest, function() {
  console.log('done.');
})