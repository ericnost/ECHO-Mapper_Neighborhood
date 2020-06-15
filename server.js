require('dotenv').config()

var express = require("express");

var app =  express();

// view engine setup
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('view cache', false);
app.use('/public/images/', express.static('./public/images'));
app.use(express.static('node_modules'))
var bodyParser=require("body-parser"); 
app.use(bodyParser.urlencoded({
  extended: true
}));

const { Client, Query } = require('pg')
// var conString = "postgres://"+process.env.DB_USER+":"+process.env.DB_PASS+"@"+process.env.DB_HOST+"/"+process.env.DB_TABLE; // Your Database Connection

var conString = "postgres://postgres:**************@localhost:****************";

var zoom = 13
var lat = 43
var lng = -89.5

app.get('/', function (req, res) {
	//This is the initial query.
	var db_query = `SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json(( "FAC_NAME", "FAC_COMPLIANCE_STATUS", "fac_compliance", "FEC_NUMBER_OF_CASES" )) As properties FROM exporter042020 As lg WHERE ST_PointInsideCircle(lg.geom,`+lng+`,`+lat+`, .05)) As f) As fc`;
	//ST_Point_Inside_Circle(lg.geom,"+lat+","+lng+",8000)
    var client = new Client(conString);
    var result=""
    client.connect();
    var query = client.query(new Query(db_query));
    query.on("row", function (row, result) {
        result.addRow(row);
    });
    query.on("end", function (result) {
      var result = result.rows[0].row_to_json;
    	res.render('index', { 
        clat:lat, clng:lng, data:result, zoom: zoom
      });
    });

});

app.post('/map', function (req, res) {
    //These are follow-up queries.
	var db_query = `SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json(( "FAC_NAME", "FAC_COMPLIANCE_STATUS", "fac_compliance", "FEC_NUMBER_OF_CASES" )) As properties FROM exporter042020 As lg WHERE ST_PointInsideCircle(lg.geom,`+req.body.lng+`,`+req.body.lat+`, .05)) As f) As fc`;

	var client = new Client(conString);
    var result=""
    client.connect();
    var query = client.query(new Query(db_query));
    query.on("row", function (row, result) {
        result.addRow(row);
    });
    query.on("end", function (result) {
      var result = result.rows[0].row_to_json;
      res.send(result)
    });

});

app.listen(8080);
console.log('8080 is the magic port');