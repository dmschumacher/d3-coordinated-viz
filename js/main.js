/////////////////////////////////////////////////////////
//Author: Dan Schumacher
//MN-WI CommuterVis
//webpage for comparing various commuting statistics
//in Wisconsin and Minnesota by county
//
//

(function(){

    //variety of global variables

    //arrays of each of the attributes specific to each of the dropdown menu topics
    var motArray = ["Drove Alone", "Carpooled","Public Transportation, Taxi, or Motorcycle","Walked or Biked","Worked From Home"]
    var wisorArray = ["Work In State of Residence", "Work Outside State of Residence"];
    var tlfwArray = ["Left Between 12am and 4am","Left Between 5am and 6am","Left Between 6am and 7am","Left Between 7am and 8am","Left Between 8am and 9am","Left Between 9am and 12pm"];
    var tttwArray = ["Less Than 10 Minutes","Between 10 and 19 Minutes","Between 20 and 29 Minutes","Between 30 and 44 Minutes","Between 45 and 59 Minutes","More than 60 Minutes"];
    var attrArray = ["Id","Id2","Id3","Geography","Total Workers","Drove Alone","Carpooled","Public Transportation, Taxi, or Motorcycle","Walked or Biked","Worked From Home","Work In State of Residence","InCounty","OutCounty","Work Outside State of Residence","Total Commuters","Left Between 12am and 4am","Left Between 5am and 6am","Left Between 6am and 7am","Left Between 7am and 8am","Left Between 8am and 9am","Left Between 9am and 12pm","Less Than 10 Minutes","Between 10 and 19 Minutes","Between 20 and 29 Minutes","Between 30 and 44 Minutes","Between 45 and 59 Minutes","More than 60 Minutes"];

    //objects for  assigning colors to each attribute in the pie chart
    motColorObj = {"Drove Alone":"#de2d26", "Carpooled":"#3182bd","Public Transportation, Taxi, or Motorcycle":"#756bb1","Walked or Biked":"#31a354","Worked From Home":"#e6550d"};
    wisorColorObj = {"Work In State of Residence":"#3182bd","Work Outside State of Residence":"#756bb1"};
    tlfwColorObj = {"Left Between 12am and 4am":"#de2d26", "Left Between 5am and 6am":"#3182bd","Left Between 6am and 7am":"#756bb1","Left Between 7am and 8am":"#31a354","Left Between 8am and 9am":"#e6550d", "Left Between 9am and 12pm":"#636363"};
    tttwColorObj = {"Less Than 10 Minutes":"#de2d26", "Between 10 and 19 Minutes":"#3182bd","Between 20 and 29 Minutes":"#756bb1","Between 30 and 44 Minutes":"#31a354","Between 45 and 59 Minutes":"#e6550d", "More than 60 Minutes":"#636363"};

    //default values for the graphs on load
    var selectedArray = motArray;
    var selectedColorObj = motColorObj;
    var selectedData = "motData";
    var defaultBar = "Total Workers";

    //array of values for the dropdown menu
    var dropdownArray = ["Means of Transportation to Work", "Worked in State of Residence", "Time Left for Work", "Travel Time to Work"];

    //default
    var expressed = "Total Workers";

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
            .defer(d3.csv, "data/CommuterInfoFinal7.csv") //load attributes from csv
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

            d3.select("body")
                .append("text")
                .attr("class", "title")
                .text("MN-WI CommuterViz");

         
            createDropdown(minnwisc);

        };

    };

   
    function joinData(minnwisc, csvData){
        //create separate arrays for the data for each of the dropdown menu items
        var motDataArray = [];
        var wisorDataArray = [];
        var tlfwDataArray = [];
        var tttwDataArray = [];

        for (var i = 0; i < csvData.length; i++){//for each county

            var csvCounty = csvData[i];
            var csvKey = csvCounty.Id2;

            var motFreq = new Object();
            var motData = new Object();
            var wisorFreq = new Object();
            var wisorData = new Object();
            var tlfwFreq = new Object();
            var tlfwData = new Object();
            var tttwFreq = new Object();
            var tttwData = new Object();

            var motTot = 0;
            var wisorTot = 0;
            var tlfwTot = 0;
            var tttwTot = 0;

            //for each of the dropdown types get a variety 
            //of info and put it into a new object

            //Means of Transportation
            motArray.forEach(function(d){
                motTot += parseFloat(csvCounty[d]);
                motFreq[d] = parseFloat(csvCounty[d]);
            });
            motData["total"] = motTot;
            motData["ID"] = csvCounty.Id3;
            motData["county"] = csvCounty.Geography;
            motData["freq"] = motFreq;

            //Worked In State or Residence
            wisorArray.forEach(function(d){
                wisorTot += parseFloat(csvCounty[d]);
                wisorFreq[d] =  parseFloat(csvCounty[d]);
            });
            wisorData["total"] = wisorTot;
            wisorData["ID"] = csvCounty.Id3;
            wisorData["county"] = csvCounty.Geography;
            wisorData["freq"] = wisorFreq;

            //Time Left for work
            tlfwArray.forEach(function(d){
                tlfwTot += parseFloat(csvCounty[d]);
                tlfwFreq[d] =  parseFloat(csvCounty[d]);
            });
            tlfwData["total"] = tlfwTot;
            tlfwData["ID"] = csvCounty.Id3;
            tlfwData["county"] = csvCounty.Geography;
            tlfwData["freq"] = tlfwFreq;

            //Travel Time to Work
            tttwArray.forEach(function(d){
                tttwTot += parseFloat(csvCounty[d]);
                tttwFreq[d] =  parseFloat(csvCounty[d]);
            });
            tttwData["total"] = tttwTot;
            tttwData["ID"] = csvCounty.Id3;
            tttwData["county"] = csvCounty.Geography;
            tttwData["freq"] = tttwFreq;

            motDataArray.push(motData);
            wisorDataArray.push(wisorData);
            tlfwDataArray.push(tlfwData);
            tttwDataArray.push(tttwData);


            for (var  j = 0; j < minnwisc.length; j++){//pair it with it's corresponding topojson geography

                var props = minnwisc[j].properties;
                var mw = minnwisc[j];

                var key = props.GEOID;
 
                if (key == csvKey){
                    mw['motData'] = motDataArray;
                    mw['wisorData'] = wisorDataArray;
                    mw['tlfwData'] = tlfwDataArray;
                    mw['tttwData'] = tttwDataArray;
                    
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

    //add Minnesota and Wisconsin counties to map
    function setEnumerationUnits (minnwisc, map, path, colorScale){

        var counties = map.selectAll(".counties")
            .data(minnwisc)
            .enter()
            .append("path")
            //d3 had a problem with using a number to access certain things, 
            //so I added "id" to the county code in a lot of places
            .attr("class", function(d){
                var Id3 = "id" + d.properties.GEOID;
                return "counties " + Id3;
            })
            .attr("d", path)
            .style("fill", function(d){
                return choropleth(d.properties, colorScale);
            })
            .on("mouseover", function(d){
                highlight(d.properties);
            })
             .on("mouseout", function(d){
                dehighlight(d.properties);
            })
             .on("mousemove", moveLabel);

        var desc = counties.append("desc")
            .text('{"stroke": "#000", "stroke-width": "0.5px"}');
    };

    //for intial map from csv
    function makeColorScale(data){

        // default colorScale
        var colorClasses = colorbrewer.PuBuGn[5];

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

    //get the color scheme depending on the pie slice color
    function getColorClasses(color){
        var colorClasses;

        if (color == "#de2d26"){
            colorClasses = colorbrewer.Reds[5];
        }else if(color == "#3182bd"){
            colorClasses = colorbrewer.Blues[5];
        }else if(color == "#e6550d"){
            colorClasses = colorbrewer.Oranges[5];
        }else if(color == "#31a354"){
            colorClasses = colorbrewer.Greens[5];
        }else if(color == "#756bb1"){
            colorClasses = colorbrewer.Purples[5];
        }else if(color == "#636363"){       
            colorClasses = colorbrewer.Greys[5];    
        }else{
            colorClasses = colorbrewer.PuBuGn[5];
        }
        return colorClasses;
    }

    //Make a new color scale for when the pie chart is
    ///hovered and or clicked
    function makeColorScale2(data, color){

        var colorClasses = getColorClasses(color);

        var colorScale = d3.scale.quantile()
            .range(colorClasses);

        var domainArray = [];
        for (var i = 0; i < data.length; i++){

            var val = parseFloat(data[i][1]);
            domainArray.push(val);
        };

        colorScale.domain(domainArray);

        return colorScale;

    };

    //Make new color scale when the dropdown menu changes
    function makeColorScale3(data, color){

        var colorClasses = getColorClasses(color);

        var colorScale = d3.scale.quantile()
            .range(colorClasses);

        var domainArray = [];
        for (var i = 0; i < data.length; i++){
            var val = parseFloat(data[i][1]);
            domainArray.push(val);
        };

        colorScale.domain(domainArray);

        return colorScale;

    };

    
    function createDropdown(data){
        //add select element
        var dropdown = d3.select("body")
            .append("select")
            .attr("class", "dropdown")
            .on("change", function(){
                changeAttribute(data, this.value);
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

        //retrieves selected data for each county
        var getData;
        data.forEach(function(d){
            getData = d[selectedData];
        })

        //graph the selected data
        graphs(getData);
    };

    //when dropdown menu changes, reset everything
    function changeAttribute(data, expressed){
        //change the expressed attribute
        var newData;
        
        if (expressed == "Worked in State of Residence"){
            selectedColorObj = wisorColorObj;
            selectedArray = wisorArray;
            selectedData = "wisorData";
            defaultBar = "Total Workers";
        }else if (expressed == "Means of Transportation to Work"){
            selectedColorObj = motColorObj;
             selectedData = "motData";
             selectedArray = motArray;
             defaultBar = "Total Workers";
        }else if (expressed == "Time Left for Work"){
            selectedColorObj = tlfwColorObj;
            selectedArray = tlfwArray;
             selectedData = "tlfwData";
             defaultBar = "Total Commuters";
        }else if (expressed == "Travel Time to Work"){
            selectedColorObj = tttwColorObj;
            selectedArray = tttwArray;
             selectedData = "tttwData";
             defaultBar = "Total Commuters";
        }
        
        //retrieves selected data for each county
        var getData;
        data.forEach(function(d){
            getData = d[selectedData];
        })

        //remove old charts
        d3.select(".barChart").remove();
        d3.select(".pie").remove();
        d3.select(".legend").remove();
        d3.select(".etc").remove();

        //graph selected data
        graphs(getData);

        
    };


    //function to highlight enumeration units and bars
    function highlight(props){

        //Ids were stored in different forms on the map
        // and the barchart
        var selectThis;
        if(props.Id2){
            selectThis = ".id" + props.Id2;
        }else{
            selectThis = "." + props[0];
        }
        //change stroke
        var selected = d3.selectAll(selectThis)
            .style({
                "stroke": "black",
                "stroke-width": "2"
            });

        setLabel(props);
    };

    function dehighlight(props){

        //Ids were stored in different forms on the map
        // and the barchart
        var selectThis;
        if(props.Id2){
            selectThis = ".id" + props.Id2;
        }else{
            selectThis = "." + props[0];
        }
        var selected = d3.selectAll(selectThis)
            .style({
                "stroke": function(){
                    return getStyle(this, "stroke")
                },
                "stroke-width": function(){
                    return getStyle(this, "stroke-width")
                }
            });

        function getStyle(element, styleName){
            var styleText = d3.select(element)
                .select("desc")
                .text();

            var styleObject = JSON.parse(styleText);

            return styleObject[styleName];
        };

        d3.select(".infolabel")
            .remove();
    };

    function setLabel(props){
        
        //Ids were stored in different forms on the map
        // and the barchart
        var addCommas = d3.format(",");
        var title;
        var val;
        var id;
        var county;

        if(props[0]){

            title = props[3];
            val= addCommas(props[1]);
            id = props[0];
            county = props[2];

        }else{
            title = expressed;
            val = addCommas(props[expressed]);
            id = props.Id3;
            county = props.NAME + " County";
        }
    //label content
        var labelAttribute = "<h1>" + county +
            "</h1><br><b>" + title +": "+ val+  "</b>";

        //create info label div
        var infolabel = d3.select("body")
            .append("div")
            .attr({
                "class": "infolabel",
                "id": id + "_label"
            })
            .html(labelAttribute);

    };

    //function to move info label with mouse
    function moveLabel(){
        //get width of label
        var labelWidth = d3.select(".infolabel")
            .node()
            .getBoundingClientRect()
            .width;

        //use coordinates of mousemove event to set label coordinates
        var x1 = d3.event.clientX + 10,
            y1 = d3.event.clientY - 75,
            x2 = d3.event.clientX - labelWidth - 10,
            y2 = d3.event.clientY + 25;

        //horizontal label coordinate, testing for overflow
        var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
        //vertical label coordinate, testing for overflow
        var y = d3.event.clientY < 75 ? y2 : y1; 

        d3.select(".infolabel")
            .style({
                "left": x + "px",
                "top": y + "px"
            });
    };

    //master grpahs function that made it easier to coordinate visualization
    //Huge props to (http://bl.ocks.org/NPashaP/96447623ef4d342ee09b) for
    //inspiration and a lot of the code
    function graphs(fData){

        //get the color corresponding to each attribute
        function segColor(c){ 
            return selectedColorObj[c]; 
        }
        
        // function to handle histogram.
        function histoGram(fD){
            var hG={},    hGDim = {t: 10, r: 30, l: 30};
            hGDim.w = window.innerWidth * 0.90, 
            hGDim.h = window.innerHeight * 0.5,
            hGDim.iw = hGDim.w - hGDim.l - hGDim.r,
            hGDim.ih = hGDim.h - hGDim.t * 2.5,
            translate = "translate(" + hGDim.l + "," + hGDim.t +")";

            //recolor maps
            var colorScale = makeColorScale3(fD, "x");
            var counties = d3.selectAll(".counties").transition().duration(500)
                    .style("fill", function(d){
                        return colorScale(d.properties[fD[0][3]]);
                    });
                
            //create svg for histogram.
            var hGsvg = d3.selectAll('body').append("svg")
            .attr("class", "barChart")
                .attr("width", hGDim.w)
                .attr("height", hGDim.h).append("g")
                .attr("transform", translate);

            var chartBackground = hGsvg.append("rect")
                .attr("class", "chartBackground")
                .attr("width", hGDim.iw)
                .attr("height", hGDim.ih)
                .attr("transform", translate);

             var chartFrame = hGsvg.append("rect")
                .attr("class", "chartFrame")
                .attr("width", hGDim.iw)
                .attr("height", hGDim.ih)
                .attr("transform", translate);

            //get the max of the data for the domain of the y axis.
            //had to add 10% so make sure d3 didn't round off too low
             var max = d3.max(fD, function(d) { return d[1]; });
                max += max * 0.1;
         
            // Create function for y-axis map.
            var y = d3.scale.sqrt().range([hGDim.ih, 0])
                    .domain([0, max]);

            // Create bars for histogram to contain rectangles and freq labels.
            var bars = hGsvg.selectAll(".bar")
                .data(fD)
                .enter()
                .append("g")
                .attr("class", function(d){
                    return "bars " + d[0];
                });
            
            //create the rectangles.
            bars.append("rect")
                .attr("x", function(d,i){
                    return i * (hGDim.iw / fD.length) + hGDim.l;
                })
                .attr("y", function(d) { 
                    
                    return y(d[1]) + hGDim.t; })
                .attr("width", hGDim.iw / fD.length - 1)
                .attr("height", function(d) { return hGDim.ih - y(d[1]); })
                 .style("fill", function(d){
                    return colorScale(d[1]);
                 })
                .on("mouseover",mouseover)
                .on("mouseout",mouseout)
                .on("mousemove", moveLabel);

            var desc = bars.append("desc")
                .text('{"stroke": "none", "stroke-width": "0px"}');

             var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");

            var axis = hGsvg.append("g")
                .attr("class", "axis")
                .attr("transform", translate)
                .call(yAxis);
                
            
            function mouseover(d){  // utility function to be called on mouseover.
                
                //highlight the bar and county on hover
                highlight(d);

                // filter for selected state.
                var st = fData.filter(function(s){ return s.ID == d[0];})[0],
                    nD = d3.keys(st.freq).map(function(s){ return {type:s, freq:st.freq[s]};});
                   
                // call update functions of pie-chart and legend.    
                pC.update(nD);
                leg.update(nD);
            }
            
            function mouseout(d){    // utility function to be called on mouseout.
                  
                //dehighlight bar and county
                dehighlight(d);

                // reset the pie-chart and legend.  
                pC.update(tF);
                leg.update(tF);
            }
            
            // create function to update the bars. This will be used by pie-chart.
            hG.update = function(nD, color){
                //make new color scale for bars when update is called
                 var colorScale = makeColorScale2(nD, color);
                 var counties = d3.selectAll(".counties").transition().duration(500)
                    .style("fill", function(d){
                        return colorScale(d.properties[nD[0][3]]);
                    });

                //get the max of the data for the domain of the y axis.
                //had to add 10% so make sure d3 didn't round off too low
                var max = d3.max(nD, function(d) { return d[1]; });
                max += max * 0.1;
                
                //redefine y based on new max value
                y = d3.scale.sqrt().range([hGDim.ih, 0])
                    .domain([0, max]);

                //create new y axis
                var yAxis = d3.svg.axis()
                    .scale(y)
                    .orient("left");

                hGsvg.selectAll("g.axis")
                    .transition().duration(1000)
                    .call(yAxis);
                
                // Attach the new data to the bars.
                var bars = hGsvg.selectAll(".bars").data(nD);
                
                // transition the height and color of rectangles.
                bars.select("rect").transition().duration(500)
                    .attr("y", function(d) {return y(d[1]) + hGDim.t; })
                    .attr("height", function(d) { return hGDim.ih - y(d[1]); })
                    .style("fill", function(d,i){
                        return colorScale(d[1]);
                     });
          
            }        
            return hG;
        }
        
        // function to handle pieChart.
        function pieChart(pD){
            var pC ={},    pieDim ={w:250, h: 250};
            pieDim.r = Math.min(pieDim.w, pieDim.h) / 2;
                    
            // create svg for pie chart.
            var piesvg = d3.select("body").append("svg")
                .attr("class", "pie")
                .attr("width", pieDim.w).attr("height", pieDim.h).append("g")
                .attr("transform", "translate("+pieDim.w/2+","+pieDim.h/2+")");

            //add instructions to the middle of the donut
            piesvg.append("text")
               .attr("text-anchor", "middle")
               .style("font", "sans-serif")
               .text("Click on a Slice!");

            
            // create function to draw the arcs of the pie slices.
            var arc = d3.svg.arc()
                .outerRadius(pieDim.r - 10)
                .innerRadius(pieDim.r - 50);

            // create a function to compute the pie slice angles.
            var pie = d3.layout.pie().sort(null).value(function(d) { return d.freq; });

            // Draw the pie slices.
            piesvg.selectAll("path").data(pie(pD)).enter().append("path").attr("d", arc)
                .each(function(d) { this._current = d; })

                .style("fill", function(d) { return segColor(d.data.type); })//update segColor to something else
                .attr("class", function(d) { 

                    var select = d.data.type;
                    select = select.split(' ').join('');
                    select = select.split(',').join('');
                     return select; })
                .attr("clicked", false)
                .on("mouseover",mouseover)
                .on("mouseout",mouseout)
                .on("click",click);

            // create function to update pie-chart. This will be used by histogram.
            pC.update = function(nD){
                piesvg.selectAll("path").data(pie(nD)).transition().duration(500)
                    .attrTween("d", arcTween);
            } 

            //if something on the pie chart has a click holding
            var somethingIsClicked = false;

            function click(d){
                
                var thisClicked = d3.select(this).attr("clicked");
                var select = d.data.type;
                 select = select.split(' ').join('');
                 select = select.split(',').join('');

                //if this slice isn't clicked set other slices to a lower opacity, and set this one to max opacity,
                //then update the barchart
                if (thisClicked == "false"){
                    piesvg.selectAll("path")
                        .attr("clicked", false)
                        .style("opacity", "0.2");

                    piesvg.selectAll("." + select)
                        .attr("clicked", true)
                        .style("opacity", "1");;

                    hG.update(fData.map(function(v){ 
                    // var val = 
                    return [v.ID,parseFloat(v.freq[d.data.type]),v.county,d.data.type];}),segColor(d.data.type));

                    somethingIsClicked = true;

                //if this slice is already clicked reset all slices to standard opacity,
                //then update the barchart
                 }else{
                     piesvg.selectAll("path")
                        .attr("clicked", false)
                        .style("opacity", "0.9");

                    somethingIsClicked = false;

                     hG.update(fData.map(function(v){
                        return [v.ID,v.total,v.county,defaultBar];}), "default"); //update barColor to chloropleth

                 }
            }
    
            // Utility function to be called on mouseover a pie slice.
            function mouseover(d){
                   var select = d.data.type;
                     select = select.split(' ').join('');
                     select = select.split(',').join('');

                //if nother on the chart has been clicked yet, set lower opacity on hover,
                //then update
                if(!somethingIsClicked){

                    piesvg.selectAll("." + select)
                        .style("opacity", "0.6");

                    hG.update(fData.map(function(v){ 
                    return [v.ID,parseFloat(v.freq[d.data.type]),v.county,d.data.type];}),segColor(d.data.type)); //update segColor to something else
                
                //if it has been clicked already
                }else{

                    var tc = d3.select(this).attr("clicked");
                    
                    //and this has been clicked keep everything the same
                    if(tc == "true"){

                        piesvg.selectAll("path")
                            .style("opacity", "0.2");

                        piesvg.selectAll("." + select)
                            .style("opacity", "1");;
                    
                    //if this is not the clicked slice change the opacity
                    }else{
                         
                        piesvg.selectAll("." + select)
                            .style("opacity", "0.6");
                    }
                    
                }
                 
                
            }
            //Utility function to be called on mouseout a pie slice.
            function mouseout(d){
               
                var select = d.data.type;
                 select = select.split(' ').join('');
                 select = select.split(',').join('');

                 //if nothin is clicked when leaving slice, restyle all to normal opacity,
                 //and update bar char to standard chart
                if(!somethingIsClicked){
                    piesvg.selectAll("." + select)
                        .style("opacity", "0.9");

                     hG.update(fData.map(function(v){
                    return [v.ID,v.total,v.county,defaultBar];}), "default"); 

                //if something is clicked and it isn't this one restore it to light opacity
                }else{
                     var tc = d3.select(this).attr("clicked");
                     if(tc == "false"){
                        piesvg.selectAll("." + select)
                            .style("opacity", "0.2");
                     }
                }
               
            }
            
            // Animating the pie-slice requiring a custom function which specifies
            // how the intermediate paths should be drawn.
            function arcTween(a) {
                var i = d3.interpolate(this._current, a);
                this._current = i(0);
                return function(t) { return arc(i(t));    };
            }    
            return pC;
        }
        
        // function to handle legend.
        function legend(lD){
            var leg = {};
                
            // create table for legend.
            var legend = d3.select("body").append("table").attr('class','legend');
            
            // create one row per segment.
            var tr = legend.append("tbody").selectAll("tr").data(lD).enter().append("tr");
                
            // create the first column for each segment.
            tr.append("td").append("svg").attr("width", '16').attr("height", '16').append("rect")
                .attr("width", '16').attr("height", '16')
                .attr("fill",function(d){ return segColor(d.type); });
                
            // create the second column for each segment.
            tr.append("td").text(function(d){ return d.type;});

            // create the third column for each segment.
            tr.append("td").attr("class",'legendFreq')
                .text(function(d){ return d3.format(",")(d.freq);});

            // create the fourth column for each segment.
            tr.append("td").attr("class",'legendPerc')
                .text(function(d){ return getLegend(d,lD);});

            // Utility function to be used to update the legend.
            leg.update = function(nD){
                // update the data attached to the row elements.
                var l = legend.select("tbody").selectAll("tr").data(nD);

                // update the frequencies.
                l.select(".legendFreq").transition().duration(500).text(function(d){ return d3.format(",")(d.freq);});

                // update the percentage column.
                l.select(".legendPerc").transition().duration(500).text(function(d){ return getLegend(d,nD);});        
            }
            
            function getLegend(d,aD){ // Utility function to compute percentage.
                return d3.format("%")(d.freq/d3.sum(aD.map(function(v){ return v.freq; })));
            }

            return leg;
        }
        
        // calculate total frequency by segment for all state.
        var tF =  selectedArray.map(function(d){ 
            return {type:d, freq: d3.sum(fData.map(function(t){ return t.freq[d];}))}; 
        });    
        
        var sF = fData.map(function(d){return [d.ID,d.total,d.county,defaultBar]});

        var pC = pieChart(tF), // create the pie-chart.
            leg= legend(tF),// create the legend.
            hG = histoGram(sF);   // create the histogram.

        //adding name +sources
        d3.select("body")
            .append("div")
            .attr("class", "etc")
            .html("Dan Schumacher. 575 Lab2. Sources and Inspirations: naturalearthdata.com, census.gov, d3js.org, bl.ocks.org (especially http://bl.ocks.org/NPashaP -> Dashboard)");
    }


})();