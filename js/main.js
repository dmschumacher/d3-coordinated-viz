(function(){


    var attrArray = ["CarAlone","Carpool","Public","WalkedOrBiked","TaxiMotorOther","WorkedAtHome","InState","InCounty","OutCounty","OutState","Time"];
    var expressed = attrArray[0];
    console.log("Attribute: " + expressed);

    window.onload = setMap();

    //set up choropleth map
    function setMap(){


        //map frame dimensions
        var width = window.innerWidth * 0.5,
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
            .defer(d3.csv, "data/CommuterInfoFinal.csv") //load attributes from csv
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


            minnwisc = joinData(minnwisc, csvData);

            var colorScale = makeColorScale(csvData);

            setEnumerationUnits(minnwisc, map, path, colorScale);

            setChart(csvData, colorScale);
        };


    };

    function joinData(minnwisc, csvData){

        for (var i = 0; i < csvData.length; i++){

            var csvCounty = csvData[i];
            var csvKey = csvCounty.Id2;

            for (var  j = 0; j < minnwisc.length; j++){



                var props = minnwisc[j].properties;
                var key = props.GEOID;
                // console.log("csvKey = " + csvKey);
                // console.log("key = " + key);
                // console.log();

                if (key == csvKey){
                    attrArray.forEach(function(attr){
                        var val = parseFloat(csvCounty[attr]);
                        props[attr] = val;

                    })
                }
            }

        }

        return minnwisc;
    };

    function choropleth(props, colorScale){
        //make sure attribute value is a number
        var val = parseFloat(props[expressed]);
        //if attribute value exists, assign a color; otherwise assign gray
        if (val && val != NaN){
            return colorScale(val);
        } else {
            return "#CCC";
        };
    };

    function setEnumerationUnits (minnwisc, map, path, colorScale){
        console.log("here");
        //add Minnesota and Wisconsin counties to map
        var regions = map.selectAll(".counties")
            .data(minnwisc)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "counties " + d.properties.GEOID;
            })
            .attr("d", path)
            .style("fill", function(d){
                return choropleth(d.properties, colorScale);
            });
    };

    function makeColorScale(data){
        var colorClasses = [
            "#f6eff7",
            "#bdc9e1",
            "#67a9cf",
            "#1c9099",
            "#016c59"
        ];

        var colorScale = d3.scale.quantile()
            .range(colorClasses);

        var domainArray = [];
        for (var i = 0; i < data.length; i++){
            var val = parseFloat(data[i][expressed]);
            domainArray.push(val);
        };

        colorScale.domain(domainArray);

        return colorScale;

    };

    function setChart(csvData, colorScale){
        var chartWidth = window.innerWidth * 0.425;
        var chartHeight = 460;

        var chart = d3.select("body")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");

        var yScale = d3.scale.linear()
            .range([0, chartHeight])
            .domain([0,105]);

        var bars = chart.selectAll(".bars")
            .data(csvData)
            .enter()
            .append("rect")
            .sort(function(a, b){
                return a[expressed]-b[expressed]
            })
            .attr("class", function(d){
                return "bars " + d.Id2;
            })
            .attr("width", chartWidth / csvData.length - 1)
            .attr("x", function(d, i){
                return i * (chartWidth / csvData.length);
            })
            .attr("height", function(d){
            return yScale(parseFloat(d[expressed]));
            })
            .attr("y", function(d){
                return chartHeight - yScale(parseFloat(d[expressed]));
            })
                .style("fill", function(d){
                return choropleth(d, colorScale);
            });

    };

})();