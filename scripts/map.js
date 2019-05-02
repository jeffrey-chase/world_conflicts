(function(){
	var w = 600;
	var h = 500;

	var minZoom;
	var maxZoom;

    /*$(window).resize(function() 
    {
    	svg
    		.attr("width", $("#map-holder").width())
    		.attr("height", $("#map-holder").height())
        ;

        initiateZoom();
    });*/

  Promise.all([d3.json("https://raw.githubusercontent.com/jeffrey-chase/world_conflicts/master/data/custom.geo.json"),
                d3.json("/data/formatted_data/cname_convert.json"),
                d3.json("/data/formatted_data/country_conflict_sums.json")]).then(

    function(d){

      let json = d[0];
      let cname_convert = d[1];
      let sums = d[2];

      json.features.forEach((d)=>{
        var sum;
        try{
          sum = sums[cname_convert[d.properties.iso_a3].code];
        }
        catch(e){
          console.log(e);
          sum = 0;
        }
        d.properties.num = sum;
      })

      for (var i = 0; i < json.features.length; i++) 
      {
        var polygon = json.features[i].geometry;
        if(polygon.type === "MultiPolygon"){
          var largestSize = 0;
          var largestPolygon;
          for(var j = 0; j < polygon.coordinates.length; j++) { // for every item in coodinates calc size 
            
              var size = turf.area(turf.polygon(polygon.coordinates[j]));


            if (size > largestSize) {
              largestSize = size;
              largestPolygon = polygon.coordinates[j];
            }
              var center = turf.pointOnFeature(turf.polygon(largestPolygon));

          //calc size of largest polygon
          } 
            

        } 
        else { //polygon.type === "Polygon"
          var center = turf.pointOnFeature(turf.polygon(polygon.coordinates));

        }
        json.features[i].properties.center = center
      } 


			var svg = d3
				.select("#conflict-map")
				.append("svg")
				.attr("width", w)
				.attr("height", h)
			;

			var projection = d3
				.geoNaturalEarth1()
				.center([0,10])
				.scale([w/(4)])
//				.translate([h/2,w/2])
			;	

      var color = d3.scaleLinear()
        .domain(d3.extent(json.features, (d) => d.properties.num))
        .range([0,1])
      ;
      //fill attribute to the countries in the d3 append part
      function getColor(d) 
      {
        console.log(d.properties.num);
        return d3.interpolateYlOrRd(color(d.properties.num));
      }

			var path = d3
				.geoPath()
				.projection(projection)
			;

			function zoomed()
			{
				t = d3
					.event
					.transform
				;

				countriesGroup.attr(
					"transform","translate(" + [t.x, t.y] + ")scale(" + t.k + ")"
				)
              countries.attr('stroke-width', strokeWidth/t.k );
              ;
			}

            let strokeWidth = 0.4;
          
			var zoom = d3
				.zoom()
				.on("zoom", zoomed)
			;

			function getTextBox(selection) {
				selection
				.each(function(d) {
					d.bbox = this
					.getBBox();
				});
			}

			function initiateZoom() 
			{
	        	minZoom = Math.max($("#conflict-map").width() / w, $("#conflict-map").height() / h);
	        	maxZoom = 20 * minZoom;
	        	zoom
	        		.scaleExtent([minZoom, maxZoom])
	          		.translateExtent([[0, 0], [w, h]])
	        	;
	        	midX = ($("#conflict-map").width() - minZoom * w) / 2;
	        	midY = ($("#conflict-map").height() - minZoom * h) / 2;
	        	svg.call(zoom.transform, d3.zoomIdentity.translate(midX, midY).scale(minZoom));
	    	}

			let countriesGroup = svg
   				.append("g")
   				.attr("id", "map")
			;

			countriesGroup
   				.append("rect")
   				.attr("x", 0)
   				.attr("y", 0)
   				.attr("width", w)
   				.attr("height", h)
			;

			let countries = countriesGroup
   				.selectAll("path")
   				.data(json.features)
  				.enter()
   				.append("path")
          .style("fill", getColor)
   				.attr("d", path)
   				.attr("id", function(d, i) {
   					return "country" + d.properties.iso_a3;
   				})
   				.attr('stroke', 'white')
                .attr('stroke-width', 0.2)
   				.attr("class", "country")
   				.on("mouseover", function(d, i) {
   					d3.select("#countryLabel" + d.properties.iso_a3).style("display", "block");
   				})
   				.on("mouseout", function(d, i) {
   					d3.select("#countryLabel" + d.properties.iso_a3).style("display", "none");
   				})
   				//.on("click", function(d, i) {
      			//	d3.selectAll(".country").classed("country-on", false);
      			//	d3.select(this).classed("country-on", true);
      			//boxZoom(path.bounds(d), path.centroid(d), 20);
   		//		})
		;

   				let countryLabels = countriesGroup
   					.selectAll("g")
   					.data(json.features)
   					.enter()
   					.append("g")
   					.attr("class", "countryLabel")
   					.attr("id", function(d){
   						return "countryLabel" + d.properties.iso_a3;
   					})
   					.attr("transform", function(d){
   						return (
   							"translate(" + projection([d.properties.center.geometry.coordinates[0], d.properties.center.geometry.coordinates[1]])  + ")"
   							);
   					})
   					.on("mouseover", function(d,i){
   						d3.select(this).style("display", "block");
   					})
   					.on("mouseout", function(d,i){
   						d3.select(this).style("display", "none");
   					})
   					.on("click", function(d, i) {
   						d3.selectAll(".country").classed("country-on", false);
   						d3.select("#country" + d.properties.iso_a3).classed("country-on", true);
              			boxZoom(path.bounds(d), path.centroid(d), 20);
                  });
            	countryLabels
            		.append("text")
            		.attr("class", "countryName")
            		.style("text-anchor", "middle")
            		.attr("dx", 0)
            		.attr("dy", 0)
            		.text(function(d){
            			return d.properties.name
            		})
            		.call(getTextBox);

            	countryLabels
            		.insert("rect", "text")
            		.attr("class", "countryLabelBg")
            		.attr("transform", function(d){
            			return "translate(" + (d.bbox.x - 2) + "," + d.bbox.y + ")";
            		})
            		.attr("width", function(d){
            			return d.bbox.width + 4;
            		})
            		.attr("height", function(d){
            			return d.bbox.height;
            		});


   				
   				svg.call(zoom);
		});




})();























