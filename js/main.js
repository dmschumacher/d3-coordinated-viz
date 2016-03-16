/* 575 boilerplate main.js */
window.onload = setMap();

//set up choropleth map
function setMap(){
    //use queue.js to parallelize asynchronous data loading
    d3_queue.queue()
        .defer(d3.csv, "data/CommuterInfo.csv") //load attributes from csv
        .defer(d3.json, "data/MN_Metro_Topo_2.topojson") //load background spatial data //load choropleth spatial data
        .await(callback);

    function callback(error, csvData, metro){
        console.log(error);
        console.log(csvData);
        console.log(metro);

        var mn_met = topojson.feature(metro, metro.objects.MN_Metro_Topo_2)
        console.log(mn_met);
    };
};