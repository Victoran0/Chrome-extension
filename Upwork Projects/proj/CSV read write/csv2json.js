// const { csvToArray } = require('csvjson/src/helper');
const fs = require('fs')
var csvjson = require('csvjson')
csvFile = fs.readFileSync('./filtered.csv')
const arr = csvFile.toString().split('\n')
// console.log(arr)
var jsonObject = [];
var headers = arr[0].split(',')

// console.log(headers)
for (let i = 1; i < arr.length; i++) {
    var data = arr[i].split(',');
    var object = {}
    for (let j = 0; j < data.length; j++) {
        object[headers[j].trim()] = data[j].trim();
        
    }
    jsonObject.push(object)
}

// const people = [
//     { name: 'joe', age: '41', city: 'dubai', job: 'accountant' },
//     { name: 'allys', age: '21', city: 'kenya', job: 'coder' },
//     { name: 'cole', age: '20', city: 'texas', job: 'laundry' }
// ]
// console.log(JSON.stringify(jsonObject))

// fs.readFile() for reading a json file

const csvData = csvjson.toCSV(people, {headers: 'key'})
fs.writeFile('./employeeData2.csv', csvData, (err) => {
    if (err) {
        console.log(err)
        throw new Error(err)
    }
    console.log('Converted Successfully`')
})