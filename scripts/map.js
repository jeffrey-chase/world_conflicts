(function () {
  /*
    Function to create the map
  */
  let w = 2000; // width of map
  let h = 750; // height of the map

  let minZoom;
  let maxZoom;

  Promise.all([d3.json("data/custom.geo.json"), // country polygons
                d3.json("data/formatted_data/cname_convert.json"), // country name -> code
                d3.json("data/formatted_data/country_conflict_sums.json")]) // conflicts per country sum
    .then(
      function (d) {

        let json = d[0];
        let cname_convert = d[1];
        let sums = d[2];

        // Adding properties to the original data
        json.features.forEach((d) => {
          let sum;
          try {
            // If it is in the data, get its value
            sum = sums[cname_convert[d.properties.iso_a3].code];
          } catch (e) {
            // Otherwise, it has no conflicts
            sum = 0;
          }
          d.properties.num = sum; // add as property to the data
        })

        // For each country, find the centroid of the largest polygon
        // this will be used as the location to place the label
        for (let i = 0; i < json.features.length; i++) {
          let polygon = json.features[i].geometry;
          let center;
          let size;
          if (polygon.type === "MultiPolygon") {
            let largestSize = 0;
            let largestPolygon;
            for (let j = 0; j < polygon.coordinates.length; j++) { // for every item in coodinates calc size 

              size = turf.area(turf.polygon(polygon.coordinates[j]));


              if (size > largestSize) {
                largestSize = size;
                largestPolygon = polygon.coordinates[j];
              }
              center = turf.pointOnFeature(turf.polygon(largestPolygon));
            }


          } else { //polygon.type === "Polygon"
            center = turf.pointOnFeature(turf.polygon(polygon.coordinates));

          }
          json.features[i].properties.center = center
        }


        // svg to draw the map on
        let svg = d3
          .select("#conflict-map")
          .append("svg")
          .attr("width", w)
          .attr("height", h);

        // Function to handle converting the lat-long coordinates
        // into x, y coordinates on the map
        let projection = d3
          .geoNaturalEarth1() // projection type
          .center([0, 40]) // starting center
          .scale([h / (4)]); // starting scale

        // Color scale that turns the sums into a value between 0 and 1
        let color = d3.scaleLinear()
          .domain(d3.extent(json.features, (d) => d.properties.num))
          .range([0.3, 1]);
        
        
        // Function that turns the above function's output into a color
        // on a yellow, orange, red color scale
        function getColor(d) {;
          return d3.interpolateYlOrRd(color(d.properties.num));
        }

        // Function to make the paths from the country polygons using the projection
        let path = d3
          .geoPath()
          .projection(projection);

        // Function to handle pan and zoom events
        function zoomed() {
          t = d3
            .event
            .transform;

          // Change size and line thickness on zoom
          countriesGroup.attr(
            "transform", "translate(" + [t.x, t.y] + ")scale(" + t.k + ")"
          )
          countries.attr('stroke-width', strokeWidth / t.k);;
        }

        let strokeWidth = 0.4;

        let zoom = d3
          .zoom()
          .on("zoom", zoomed);

        // Gets the bounding box of the text node to calculate the backing rectangle size
        function getTextBox(selection) {
          selection
            .each(function (d) {
              d.bbox = this
                .getBBox();
            });
        }

        // group to hold the countries on the map
        let countriesGroup = svg
          .append("g")
          .attr("id", "map");

        // Add the countries to the map
        let countries = countriesGroup
          .selectAll("path")
          .data(json.features)
          .enter()
          .append("path")
          .style("fill", getColor)
          .attr("d", path)
          .attr("id", function (d, i) {
            return "country" + d.properties.iso_a3;
          })
          .attr('stroke', '#999')
          .attr('stroke-width', 0.4)
          .attr("class", "country")
          .on("mouseover", function (d, i) {
            d3.select("#countryLabel" + d.properties.iso_a3).style("display", "block");
          })
          .on("mouseout", function (d, i) {
            d3.select("#countryLabel" + d.properties.iso_a3).style("display", "none");
          })
        //.on("click", function(d, i) {
        //	d3.selectAll(".country").classed("country-on", false);
        //	d3.select(this).classed("country-on", true);
        //boxZoom(path.bounds(d), path.centroid(d), 20);
        //		})
        ;

        // apppend the country label containers
        let countryLabels = countriesGroup
          .selectAll("g")
          .data(json.features)
          .enter()
          .append("g")
          .attr("class", "countryLabel")
          .attr("id", function (d) {
            return "countryLabel" + d.properties.iso_a3;
          })
          .attr("transform", function (d) {
            return (
              "translate(" + projection([d.properties.center.geometry.coordinates[0], d.properties.center.geometry.coordinates[1]]) + ")"
            );
          })
          .on("mouseover", function (d, i) {
            d3.select(this).style("display", "block");
          })
          .on("mouseout", function (d, i) {
            d3.select(this).style("display", "none");
          })
          .on("click", function (d, i) {
            d3.selectAll(".country").classed("country-on", false);
            d3.select("#country" + d.properties.iso_a3).classed("country-on", true);
            boxZoom(path.bounds(d), path.centroid(d), 20);
          });

        // append the text
        countryLabels
          .append("text")
          .attr("class", "countryName")
          .style("text-anchor", "middle")
          .attr("dx", 0)
          .attr("dy", 0)
          .text(function (d) {
            return d.properties.name
          })
          .call(getTextBox);

        // add the backgrounds
        countryLabels
          .insert("rect", "text")
          .attr("class", "countryLabelBg")
          .attr("transform", function (d) {
            return "translate(" + (d.bbox.x - 2) + "," + d.bbox.y + ")";
          })
          .attr("width", function (d) {
            return d.bbox.width + 4;
          })
          .attr("height", function (d) {
            return d.bbox.height;
          });


        // apply the zoom function
        svg.call(zoom);
      });




})();
