(function(){

//Assign more arrays for each pie chart category
//revamp yScale() to change for each category
//add hover options
//add click options
    // var clicked = false;
    var otherClicked = false;

    var motArray = ["Drove Alone", "Carpooled","Public Transportation, Taxi, or Motorcycle","Walked or Biked","Worked From Home"]
    var wisorArray = ["Work In State of Residence", "Work Outside State of Residence"];
    var tlfwArray = ["Left Between 12am and 4am","Left Between 5am and 6am","Left Between 6am and 7am","Left Between 7am and 8am","Left Between 8am and 9am","Left Between 9am and 12pm"];
    var tttwArray = ["Less Than 10 Minutes","Between 10 and 19 Minutes","Between 20 and 29 Minutes","Between 30 and 44 Minutes","Between 45 and 59 Minutes","More than 60 Minutes"];
    var attrArray = ["Id","Id2","Id3","Geography","Total Workers","Drove Alone","Carpooled","Public Transportation, Taxi, or Motorcycle","Walked or Biked","Worked From Home","Work In State of Residence","InCounty","OutCounty","Work Outside State of Residence","Total Commuters","Left Between 12am and 4am","Left Between 5am and 6am","Left Between 6am and 7am","Left Between 7am and 8am","Left Between 8am and 9am","Left Between 9am and 12pm","Less Than 10 Minutes","Between 10 and 19 Minutes","Between 20 and 29 Minutes","Between 30 and 44 Minutes","Between 45 and 59 Minutes","More than 60 Minutes"];


    motColorObj = {"Drove Alone":"#de2d26", "Carpooled":"#3182bd","Public Transportation, Taxi, or Motorcycle":"#756bb1","Walked or Biked":"#31a354","Worked From Home":"#e6550d"};
    wisorColorObj = {"Work In State of Residence":"#3182bd","Work Outside State of Residence":"#756bb1"};
    tlfwColorObj = {"Left Between 12am and 4am":"#de2d26", "Left Between 5am and 6am":"#3182bd","Left Between 6am and 7am":"#756bb1","Left Between 7am and 8am":"#31a354","Left Between 8am and 9am":"#e6550d", "Left Between 9am and 12pm":"#636363"};
    tttwColorObj = {"Less Than 10 Minutes":"#de2d26", "Between 10 and 19 Minutes":"#3182bd","Between 20 and 29 Minutes":"#756bb1","Between 30 and 44 Minutes":"#31a354","Between 45 and 59 Minutes":"#e6550d", "More than 60 Minutes":"#636363"};



    var selectedArray = motArray;
    var selectedColorObj = motColorObj;
    var selectedData = "motData";
    var defaultBar = "Total Workers";


    var dropdownArray = ["Means of Transportation to Work", "Worked in State of Residence", "Time Left for Work", "Travel Time to Work"];

    var defaultColorRange = ["#de2d26","#3182bd","#e6550d","#31a354","#756bb1","#636363"];

    var expressed = "Total Workers";

    // var pC;

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
            console.log(minnwisc);

            var colorScale = makeColorScale(csvData);

            setEnumerationUnits(minnwisc, map, path, colorScale);

            // var header = document.getElementById("content");

            // header.innerHTML = "MN-WI CommuterViz"

            d3.select("body")
                .append("text")
                .attr("class", "title")
                .text("MN-WI CommuterViz");

         
            createDropdown(minnwisc);
            //http://bl.ocks.org/NPashaP/96447623ef4d342ee09b)

        };

    };

   
    function joinData(minnwisc, csvData){
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


            motArray.forEach(function(d){
                motTot += parseFloat(csvCounty[d]);
                motFreq[d] = parseFloat(csvCounty[d]);
            });
            motData["total"] = motTot;
            motData["ID"] = csvCounty.Id3;
            motData["county"] = csvCounty.Geography;
            motData["freq"] = motFreq;


            wisorArray.forEach(function(d){
                wisorTot += parseFloat(csvCounty[d]);
                wisorFreq[d] =  parseFloat(csvCounty[d]);
            });
            wisorData["total"] = wisorTot;
            wisorData["ID"] = csvCounty.Id3;
            wisorData["county"] = csvCounty.Geography;
            wisorData["freq"] = wisorFreq;

            tlfwArray.forEach(function(d){
                tlfwTot += parseFloat(csvCounty[d]);
                tlfwFreq[d] =  parseFloat(csvCounty[d]);
            });
            tlfwData["total"] = tlfwTot;
            tlfwData["ID"] = csvCounty.Id3;
            tlfwData["county"] = csvCounty.Geography;
            tlfwData["freq"] = tlfwFreq;

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

                // props
                var key = props.GEOID;
 
                if (key == csvKey){
                    mw['motData'] = motDataArray;
                    mw['wisorData'] = wisorDataArray;
                    mw['tlfwData'] = tlfwDataArray;
                    mw['tttwData'] = tttwDataArray;

                    props["motFreq"] = motFreq;
                    props["wisorFreq"] = wisorFreq;
                    props["tlfwFreq"] = tlfwFreq;
                    props["tttwFreq"] = tttwFreq;
                    
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

        //add Minnesota and Wisconsin counties to map

        var counties = map.selectAll(".counties")
            .data(minnwisc)
            .enter()
            .append("path")
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

    function makeColorScale(data){


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

    function getColorClasses(color){
        // console.log(color);

        // ["#de2d26","#3182bd","#e6550d","#31a354","#756bb1","#636363"]
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

    function makeColorScale2(data, color){

        var colorClasses = getColorClasses(color);

        var colorScale = d3.scale.quantile()
            .range(colorClasses);

        console.log(data);
        var domainArray = [];
        for (var i = 0; i < data.length; i++){

            var val = parseFloat(data[i][1]);
            domainArray.push(val);
        };

        colorScale.domain(domainArray);

        return colorScale;

    };

    function makeColorScale3(data, color){

        var colorClasses = getColorClasses(color);

        var colorScale = d3.scale.quantile()
            .range(colorClasses);

        console.log(data);
        var domainArray = [];
        for (var i = 0; i < data.length; i++){
            // console.log(data[i]);
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

        var newData;
        d3.selectAll(".counties")
            .attr("test", function(d){
                newData = d[selectedData];
            });

        graphs(newData);
    };


    //When the menu option is changed, graphs should completely reset, data should be recalculated, the selected array should be changed
    function changeAttribute(data, expressed){
        //change the expressed attribute
        console.log(data);
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
      //

        //recreate the color scale
        // console.log(data);
        // console.log(selectedData);
        // console.log(data[selectedData]);
       // var x = data.forEach(function(d){
       //      var y = d[selectedData];
       //     y.forEach(function(e){
       //      return e.total;
       //     })
       //  })
       // console.log(x);
        
        var colorScale = makeColorScale(data, "x");
        //recolor enumeration units
        var counties = d3.selectAll(".counties")
            .style("fill", function(d){
                // console.log(d[selectedData]);
                newData = d[selectedData];
                // console.log(newData);
                return colorScale[newData.total];
            });

     
        d3.select(".barChart").remove();
        d3.select(".pie").remove();
        d3.select(".legend").remove();
        graphs(newData);


        
    };


    //function to highlight enumeration units and bars
    function highlight(props){
        // console.log("Highlight");
        var selectThis;
        if(props.Id2){
            selectThis = ".id" + props.Id2;
        }else{
            selectThis = "." + props[0];
        }
        //change stroke
        // var selected = d3.selectAll(".id" +props.Id2)
        var selected = d3.selectAll(selectThis)
            .style({
                "stroke": "black",
                "stroke-width": "2"
            });

        setLabel(props);
        // updatePieChart(props.motData);
    };

    function dehighlight(props){

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
        // console.log(props);
        var addCommas = d3.format(",");
        var title;
        var val;
        var id;
        var county;

        if(props[0]){
            // console.log("here");

            title = props[3];
            val= addCommas(props[1]);
            id = props[0];
            county = props[2];
            // console.log(title +"," + val + "," + id);
        }else{
            title = expressed;
            val = addCommas(props[expressed]);
            id = props.Id3;
            county = props.NAME + " County";
            // console.log(title +"," + val + "," + id + "," + name);
        }
    //label content
        var labelAttribute = "<h1>" + county +
            "</h1><br><b>" + title +": "+ val+  "</b>";
       
        // labelAttribute = addCommas(labelAttribute);
        //create info label div
        var infolabel = d3.select("body")
            .append("div")
            .attr({
                "class": "infolabel",
                "id": id + "_label"
            })
            .html(labelAttribute);

        // var countyName = infolabel.append("div")
        //     .attr("class", "labelname")
        //     .html(id);
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


    function graphs(fData){

        var barColor = 'steelblue';

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

            console.log(fD);
            var totArray = []
            // fData.forEach(function(d){
            //     totArray.push(d.total);
            // });

            var colorScale = makeColorScale3(fD, "x");
            var counties = d3.selectAll(".counties").transition().duration(500)
                    .style("fill", function(d){
                        // console.log(nD[0][3]);
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
                // .attr("x", function(d) { return x(d[0]); })
                .attr("x", function(d,i){
                    return i * (hGDim.iw / fD.length) + hGDim.l;
                })
                .attr("y", function(d) { 
                    
                    return y(d[1]) + hGDim.t; })
                .attr("width", hGDim.iw / fD.length - 1)
                .attr("height", function(d) { return hGDim.ih - y(d[1]); })
                // .attr('fill',barColor)
                 .style("fill", function(d){
                    return colorScale(d[1]);
                 })
                .on("mouseover",mouseover)// mouseover is defined below.
                .on("mouseout",mouseout)
                .on("mousemove", moveLabel);// mouseout is defined below.

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
                // console.log(d);
                highlight(d);
                // filter for selected state.
                var st = fData.filter(function(s){ return s.ID == d[0];})[0],
                    nD = d3.keys(st.freq).map(function(s){ return {type:s, freq:st.freq[s]};});
                   
                // call update functions of pie-chart and legend.    
                pC.update(nD);
                leg.update(nD);
            }
            
            function mouseout(d){    // utility function to be called on mouseout.
                // reset the pie-chart and legend.    
                dehighlight(d);

                pC.update(tF);
                leg.update(tF);
            }
            
            // create function to update the bars. This will be used by pie-chart.
            hG.update = function(nD, color){
                // console.log(nD[0][3]);
                // console.log(color);


                 var colorScale = makeColorScale2(nD, color);
                 var counties = d3.selectAll(".counties").transition().duration(500)
                    .style("fill", function(d){
                        // console.log(nD[0][3]);
                        return colorScale(d.properties[nD[0][3]]);
                    });

                var max = d3.max(nD, function(d) { return d[1]; });
                max += max * 0.1;
                
                y = d3.scale.sqrt().range([hGDim.ih, 0])
                    .domain([0, max]);
                

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
                        // console.log(d);
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

            var somethingIsClicked = false;
            function click(d){
                
                var thisClicked = d3.select(this).attr("clicked");
                var select = d.data.type;
                 select = select.split(' ').join('');
                 select = select.split(',').join('');

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
                 }else{
                     piesvg.selectAll("path")
                        .attr("clicked", false)
                        .style("opacity", "0.9");

                    somethingIsClicked = false;

                     hG.update(fData.map(function(v){
                        return [v.ID,v.total,v.county,defaultBar];}), barColor); //update barColor to chloropleth

                 }
            }

                  
            // Utility function to be called on mouseover a pie slice.
            function mouseover(d){
                   var select = d.data.type;
                     select = select.split(' ').join('');
                     select = select.split(',').join('');
                     // console.log(select);
                // }
                if(!somethingIsClicked){

                    
                    piesvg.selectAll("." + select)
                        
                        .style("opacity", "0.6");
                    hG.update(fData.map(function(v){ 
                    // console.log(parseFloat(v.freq[d.data.type]));
                    return [v.ID,parseFloat(v.freq[d.data.type]),v.county,d.data.type];}),segColor(d.data.type)); //update segColor to something else
                }else{
                    var tc = d3.select(this).attr("clicked");
                    // console.log(tc);
                    if(tc == "true"){
                        piesvg.selectAll("path")
                            .style("opacity", "0.2");

                        piesvg.selectAll("." + select)
                            .style("opacity", "1");;
                    }else{
                         
                        piesvg.selectAll("." + select)
                            .style("opacity", "0.6");
                    }
                    
                }
                 
                
            }
            //Utility function to be called on mouseout a pie slice.
            function mouseout(d){
                // call the update function of histogram with all data.
                // var thisClicked = d3.select(this).attr("clicked");
                // if(!otherClicked){

                //      var select = d.data.type;
                //         select = select.split(' ').join(".");
                //         piesvg.selectAll("." + select)
                            
                //             .style("opacity", "0.8");
                var select = d.data.type;
                     select = select.split(' ').join('');
                     select = select.split(',').join('');
                if(!somethingIsClicked){
                    piesvg.selectAll("." + select)
                        
                        .style("opacity", "0.9");
                     hG.update(fData.map(function(v){
                    return [v.ID,v.total,v.county,defaultBar];}), barColor); //update barColor to chloropleth
                }else{
                     var tc = d3.select(this).attr("clicked");
                     if(tc == "false"){
                        piesvg.selectAll("." + select)
                            .style("opacity", "0.2");
                     }
                }
               
            }
             d3.selection.prototype.moveToFront = function() {  
              return this.each(function(){
                this.parentNode.appendChild(this);
              });
            };
            
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
            // console.log(selectedArray);
            // console.log(d);
            return {type:d, freq: d3.sum(fData.map(function(t){ return t.freq[d];}))}; 
        });    
        
        // console.log(fData);
        // calculate total frequency by state for all segment.
        var sF = fData.map(function(d){return [d.ID,d.total,d.county,defaultBar]});

        var pC = pieChart(tF), // create the pie-chart.
            leg= legend(tF),// create the legend.
            hG = histoGram(sF);   // create the histogram.

        d3.select("body")
            .append("text")
            .attr("class", "etc")
            .text("Dan Schumacher");
    }



})();