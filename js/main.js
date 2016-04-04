(function(){


    var attrArray = ["TotWorkers", "DroveAlone", "twoCarpool", "threeCarpool", "fourCarpool", "PublicTrans", "Walked", "Bike", "TaxiMotoOther", "WorkedFromHome", "InState", "InCounty", "OutCounty", "OutState", "TotCommuters", "124", "5", "6", "7", "8", "912", "lt10", "1019", "2029", "3044", "4559", "60plus", "MeanTravel"];
    var motArray = ["DroveAlone", "twoCarpool", "threeCarpool", "fourCarpool", "PublicTrans", "Walked", "Bike", "TaxiMotoOther"];
    var expressed = attrArray[0];

    window.onload = setMap();

    //set up choropleth map
    function setMap(){


        //map frame dimensions
        var width = window.innerWidth * 0.3,
            height = window.innerHeight * 0.4;

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
            .scale(2000)
            .translate([width / 2, height / 2]);

        //path generator
        var path = d3.geo.path()
            .projection(projection);

        //use queue.js to parallelize asynchronous data loading
        d3_queue.queue()
            .defer(d3.csv, "data/CommuterInfoFinal4.csv") //load attributes from csv
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

        for (var i = 0; i < csvData.length; i++){//for each county

            var csvCounty = csvData[i];
            var csvKey = csvCounty.Id2;

            for (var  j = 0; j < minnwisc.length; j++){//pair it with it's corresponding topojson geography

                var props = minnwisc[j].properties;
                var key = props.GEOID;
 
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
            "#ffffcc",
            "#a1dab4",
            "#41b6c4",
            "#2c7fb8",
            "#253494"  
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

        var chartWidth = window.innerWidth ,
            chartHeight = window.innerHeight * 0.5,
            leftPadding = 100,
            rightPadding = 5,
            topBottomPadding = 10,
            chartInnerWidth = chartWidth - leftPadding - rightPadding,
            chartInnerHeight = chartHeight - topBottomPadding * 2,
            translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

        var chart = d3.select("body")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");

        var chartBackground = chart.append("rect")
            .attr("class", "chartBackground")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);

        var yScale = d3.scale.sqrt()
            .range([chartInnerHeight, 0])
            .domain([0,650000]);

        var bars = chart.selectAll(".bars")
            .data(csvData)
            .enter()
            .append("rect")
            .sort(function(a, b){
                return b[expressed]-a[expressed]
            })
            .attr("class", function(d){
                return "bars " + d.Id2;
            })
            .attr("width", chartInnerWidth / csvData.length - 1)
            .attr("x", function(d, i){
                return i * (chartInnerWidth / csvData.length) + leftPadding;
            })
            .attr("height", function(d){
                return chartInnerHeight - yScale(parseFloat(d[expressed]));
            })
            .attr("y", function(d){
                return yScale(parseFloat(d[expressed])) + topBottomPadding;
            })
                .style("fill", function(d){
                return choropleth(d, colorScale);
            });

         var chartTitle = chart.append("text")
            .attr("x", 200)
            .attr("y", 40)
            .attr("class", "chartTitle")
            .text("Number of Variable '" + expressed + "' in each county");

        var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left");

        var axis = chart.append("g")
            .attr("class", "axis")
            .attr("transform", translate)
            .call(yAxis);

        //create frame for chart border
        var chartFrame = chart.append("rect")
            .attr("class", "chartFrame")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);

    };

})();