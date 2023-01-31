//import { readdir } from '/force_graphs/node_modules/fs';
//require("fs");
//var fs = require('fs');
//console.log('hello jon');
//import * as d3 from "./node_modules/d3/src/index.js";
/*Promise.all([
    d3.json("rgarcia.json"),
    d3.json("dgriffis.json"),
]).then(function(files) {
    // files[0] will contain file1.csv
    // console.log(files[0]);
    // console.log(files[1]);
    let data = files[0];
    files[1].nodes.forEach(elem => data.nodes.push(elem))
    files[1].edges.forEach(elem => data.edges.push(elem))
    console.log(data);
    // files[1] will contain file2.csv
}).catch(function(err) {
    // handle error here
})
*/

var d3_array = [d3.json("./ges_json/acclayt2-json_graph.json"),d3.json("./ges_json/allloyd-json_graph.json")];

Promise.all(d3_array).then(function(files) {
    // files[0] will contain file1.csv
    // console.log(files[0]);
    // console.log(files[1]);
    let data = files[0];
    files[1].nodes.forEach(elem => data.nodes.push(elem))
    files[1].edges.forEach(elem => data.edges.push(elem))
    console.log(data);
    // files[1] will contain file2.csv
}).catch(function(err) {
    // handle error here
})

/*
const testFolder = './ges_json/';


fs.readdir(testFolder, (err, files) => {
  files.forEach(file => {
    console.log(file);
  });
});
*/