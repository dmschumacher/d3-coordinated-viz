(function(){

//Assign more arrays for each pie chart category
//revamp yScale() to change for each category
//add hover options
//add click options


    var attrArray = ["Id","Id2","Geography","Total Workers","Drove Alone","Two Person Carpool","Three Person Carpool","Four Person Carpool","Public Transportation","Walked","Bike","Taxi, Motorcycle, Other","Worked From Home","Work In State of Residence","InCounty","OutCounty","Work Outside State of Residence","Total Commuters","Left Between 12am and 4am","Left Between 5am","Left Between 6am","Left Between 7am","Left Between 8am","Left Between 9am and 12pm","Less Than 10 Minutes","10-19 Minutes","20-29 Minutes","30-44 Minutes","45-59 Minutes","60 Minutes or more","MeanTravel"];
    var motArray = ["DroveAlone", "twoCarpool", "threeCarpool", "fourCarpool", "PublicTrans", "Walked", "Bike", "TaxiMotoOther"];
    var dropdownArray = ["Means of Transportation to Work", "Worked in State of Residence", "Time Left for Work", "Travel Time to Work"];

    var MotPieChartData = [4389043,381338,60482,40273,146790,170742,42937,49673,256841];
    var expressed = "Total Workers";

    

    var chartWidth = window.innerWidth ,
        chartHeight = window.innerHeight * 0.5,
        leftPadding = 100,
        rightPadding = 5,
        topBottomPadding = 10,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    var yScale = d3.scale.sqrt()
        .range([chartInnerHeight, 0])
        .domain([0, 650000]);

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
            .defer(d3.csv, "data/CommuterInfoFinal5.csv") //load attributes from csv
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

            console.log("Color Scale: " + colorScale);

            setEnumerationUnits(minnwisc, map, path, colorScale);

            createDropdown(csvData);

            setChart(csvData, colorScale);

            setPieChart(MotPieChartData);

            // console.log(minnwisc[0].properties.pie);

        };

    };

    function joinData(minnwisc, csvData){

        for (var i = 0; i < csvData.length; i++){//for each county

            var csvCounty = csvData[i];
            var csvKey = csvCounty.Id2;
            var motData = [csvCounty.DroveAlone, csvCounty.twoCarpool, csvCounty.threeCarpool, csvCounty.fourCarpool, csvCounty.PublicTrans, csvCounty.Walked, csvCounty.Bike, csvCounty.TaxiMotoOther];
            var sowData = [csvCounty.InState, csvCounty.OutState];
            // var depTimeData = [csvCounty.124, "5", "6", "7", "8", "912"]
            
            csvData[i].motData = motData;

            for (var  j = 0; j < minnwisc.length; j++){//pair it with it's corresponding topojson geography

                var props = minnwisc[j].properties;
                var key = props.GEOID;
 
                if (key == csvKey){

                    attrArray.forEach(function(attr){
                        console.log("attr: " + attr);
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
            console.log("True");
            return colorScale(val);
        } else {
            console.log("props:" + props);
            console.log("False");
            return "#CCC";
        };
    };

    function setEnumerationUnits (minnwisc, map, path, colorScale){
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
            // console.log("val: " + val);
            domainArray.push(val);
        };

        colorScale.domain(domainArray);

        return colorScale;

    };

    function setChart(csvData, colorScale){

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
            .attr("width", chartInnerWidth / csvData.length - 1);


        var chartTitle = chart.append("text")
            .attr("x", 200)
            .attr("y", 40)
            .attr("class", "chartTitle")
            .text("Number of Variable " + expressed + " in each county");

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

        updateChart(bars, csvData.length, colorScale);
            

    };

    function createDropdown(csvData){
        //add select element
        var dropdown = d3.select("body")
            .append("select")
            .attr("class", "dropdown")
            .on("change", function(){
            if (this.value == "Means of Transportation to Work" || this.value == "Worked in State of Residence"){
                expressed = "TotWorkers";
            }else{
                expressed  = "TotCommuters";
            }
            changeAttribute(expressed, csvData)
        });

        //add initial option
        var titleOption = dropdown.append("option")
            .attr("class", "titleOption")
            .attr("disabled", "true")
            .text("Select Attribute");

        //add attribute name options
        var attrOptions = dropdown.selectAll("attrOptions")
            .data(dropdownArray)
            .enter()
            .append("option")
            .attr("value", function(d){ return d })
            .text(function(d){ return d });
    };

    function changeAttribute(attribute, csvData){
        //change the expressed attribute
        expressed = attribute;

        //recreate the color scale
        var colorScale = makeColorScale(csvData);

        //recolor enumeration units
        var regions = d3.selectAll(".counties")
            .style("fill", function(d){

                return choropleth(d.properties, colorScale)
            });

        var bars = d3.selectAll(".bars")
        //re-sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        });
        updateChart(bars, csvData.length, colorScale);
         //re-sort, resize, and recolor bars
        
    };

    function updateChart(bars, n, colorScale){
        // console.log("expressed 3: " + expressed);
        bars.attr("x", function(d, i){
            if (d.Id2 != "All"){
                return i * (chartInnerWidth / n) + leftPadding;
            }
            
        })
        .attr("height", function(d){
            return chartInnerHeight - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d){
            console.log("expressed: " + expressed);
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .style("fill", function(d){
            console.log("d: " + d.motData);
            return choropleth(d, colorScale);
        });

        var chartTitle = d3.select(".chartTitle")
            .text("Number of Variable '" + expressed + "' in each county");

         
    }

    function setPieChart(data){
        console.log("Pie chart: " + data);
        var width = 300,
            height = 300,
            radius = Math.min(width, height) / 2;
        var colorRange = ["#0000cc", "#990099", "#ff0000", "#ff6600", "#ffff00" , "#006600", "#663300", "#ff0066"];
        var color = d3.scale.ordinal()
            .range(colorRange);

         // var color = d3.scale.category20c();

        var arc = d3.svg.arc()
            .outerRadius(radius - 10)
            .innerRadius(0);

        var labelArc = d3.svg.arc()
            .outerRadius(radius - 40)
            .innerRadius(radius - 40);

        var pie = d3.layout.pie()
            .sort(null)
            .value(function(d) { 
                console.log("d: " + d);
                return d});

        var svg = d3.select("body").append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("class", "pie")
          .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");


          var g = svg.selectAll(".arc")
              .data(pie(data))
            .enter().append("g")
              .attr("class", "arc");

          g.append("path")
              .attr("d", arc)
              .style("fill", function(d,i) { return color(i); });

    }

})();