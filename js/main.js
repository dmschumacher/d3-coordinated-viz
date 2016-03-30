
window.onload = setMap();

//set up choropleth map
function setMap(){


    //map frame dimensions
    var width = 800,
        height = 600;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on MN  and WI
    var projection = d3.geo.albers()
        .center([0, 46])
        .rotate([93, 0, 0])
        .parallels([40, 55])
        .scale(5000)
        .translate([width / 2, height / 2]);

    //path generator
    var path = d3.geo.path()
        .projection(projection);

    //use queue.js to parallelize asynchronous data loading
    d3_queue.queue()
        .defer(d3.csv, "data/CommuterInfo2.csv") //load attributes from csv
        .defer(d3.json, "data/US_CAN_2.topojson") //load background spatial data
        .defer(d3.json, "data/MN_WI_2.topojson")  //load choropleth spatial data
        .await(callback);

    //callback function
    function callback(error, csvData, uscan, mnwi){

        var uscanada = topojson.feature(uscan, uscan.objects.US_CAN_2); //convert background to geojson feature
        var minnwisc = topojson.feature(mnwi, mnwi.objects.MN_WI_2).features; //convert MN/WI countiies to geojson feature

        //add background to map
        var us_canada = map.append("path")
            .datum(uscanada)
            .attr("class", "us_canada")
            .attr("d", path);

        //add Minnesota and Wisconsin counties to map
        var regions = map.selectAll(".counties")
            .data(minnwisc)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "regions " + d.properties.GEOID;
            })
            .attr("d", path);
    };
};