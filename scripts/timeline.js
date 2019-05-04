(function () {
  /*
    Creates the timeline at the beginning of the page
  */
  let parent = d3.select('#timeline'); // parent to hold the chart
  window.timeLine = false; // has the chart been drawn? 

  window.addEventListener('scroll', () => {
    // once the chart is in view, start drawing it
    let height = window.innerHeight;
    if (parent.node().getBoundingClientRect().top < height*0.9 && !window.timeLine) {
      Promise.all([
    d3.csv('data/formatted_data/country_conflicts.csv'),// info on conflicts
    d3.json('data/formatted_data/ccode_converter.json')// countries of the world and codes
  ]).then(function (d) {
        let conflicts = d[0];
        let converter = d[1];

        // Update the data
        conflicts.forEach((d) => {
          d.startDate = new Date(d.start_date2) || new Date(d.year); // format date
          d.endDate = new Date(d.end_date) || new Date(d.year);
          d.year = +d.year; // string to number
          d.actors = []; // array to store the actors in each conflict
          d.gwno_a.split(',').forEach((e) => d.actors.push(e)); // add actors
          d.gwno_a_2nd.split(',').forEach((e) => d.actors.push(e));
          d.gwno_b.split(',').forEach((e) => d.actors.push(e));
          d.gwno_b_2nd.split(',').forEach((e) => d.actors.push(e));
        });

        // sort by date order
        conflicts = conflicts.sort((d1, d2) => d1.startDate > d2.startDate);

        // Nest the data by year
        let nested = d3.nest()
          .key((d) => +d.year)
          .sortKeys(d3.ascending) // sort in order
          .rollup((d) => {
            return {
              // separate in to list of major and minor conflicts
              major: d.filter((e) => e.intensity_level === "2: War"), 
              minor: d.filter((e) => e.intensity_level === "1: Minor Conflict")
            };
          }).sortValues((a,b)=> a.startDate > b.startDate)
          .entries(conflicts);

        let width = 1000; // width of the graph
        let height = 600; // height of the graph

        // Functions to turn values into x and y coordinates
        
        let xScale = d3.scaleLinear()
          .domain(d3.extent(nested, (d) => d.key))
          .range([100, width - 100]);

        let yScaleMinor = d3.scaleLinear()
          .domain([0, d3.max(nested, (d) => d.value.minor.length)])
          .range([height - 300, height - 5]);

        let yScaleMajor = d3.scaleLinear()
          .domain([d3.max(nested, (d) => d.value.major.length), 0])
          .range([10, height - 350]);


        // Container to hold the detail information
        let infoContainer = parent.append('div')
          .attr('id', 'timeline-story')


        // svg to draw the chart on 
        let svg = parent.append('svg')
          .attr('width', width)
          .attr('height', height);

        // Points selector
        let points = svg.selectAll('circle.conflicts');

        // For each year in the dataset
        nested.forEach((el) => {
          let year = +el.key;
          let conflicts = el.values;

          // Add the points for the minor conflicts
          points.data(el.value.minor).enter().append('circle')
            .attr('class', 'conflicts')
            .attr('r', 0.1)
            .style('fill', '#660000')
            .style('opacity', 0.7)
            .attr('cx', xScale(year))
            .attr('cy', height + 20)
            .transition() // start of transition properties
            .delay((d, i) => {
            // delay based on column and row value
              return (year - 1946) * 90 + i * 2;
            })
            .duration(2000)
            .style('stroke', '#ff0000')
            .attr('r', 3)
            .attr('cy', (d, i) => {
              return yScaleMinor(i);
            })
            .ease(d3.easePoly);

          // Add the major conflicts points
          points.data(el.value.major).enter().append('circle')
            .attr('class', 'conflicts')
            .attr('r', 0.1)
            .style('fill', '#ff0000')
            .attr('cx', xScale(year))
            .attr('cy', -10)
            .transition()
            .delay((d, i) => {
              return (year - 1946) * 90 + i * 2;
            })
            .duration(2000)
            .style('opacity', 1)
            .attr('r', 5)
            .attr('cy', (d, i) => {
              return yScaleMajor(i);
            })
            .ease(d3.easePoly);
          //        .ease(d3.easeBounceOut);
          //        .ease(d3.easeCubicInOut);


        });
        
        // Add the event to show the detailed information 
        svg.selectAll('circle.conflicts')
          .on('mouseover', infoShower);

        
        function infoShower(d) {
          // element that was hovered is hightlight and others are dehighlighted
          d3.select('.infoshow').classed('infoshow', false);
          d3.select(this).classed('infoshow', true);
          let container = parent.select('#timeline-story');

          // Filter out unneccessary variables that match this pattern
          let filter = /(^gwno)|(actors)|(Date$)|(version)|(region)|(_id$)|(^ep)|(^cumul)|(prec)|(2$)/

          // remove previous info
          container.selectAll("*").remove();

          // add header
          container
            .append('h4')
            .text('Conflict Info');

          // add the key value pairs
          let list = container.append('dl');
          for (let i in d) {
            if (!i.match(filter) && i !== '') {
              list
                .append('dt')
                .text(i.replace(/_/gi, ' '));

              list.append('dd')
                .text(d[i]);
            }

          }
        }

        // Add axis to the graph
        let axis = svg.append('g').attr('class', 'axis');

        // append the line
        axis.append('line')
          .attr('class', 'axisline')
          .attr('x1', 20)
          .attr('x2', width - 100)
          .attr('y1', 275)
          .attr('y2', 275)
          .attr('stroke', 'white');

        // Data for the ticks 1945 -> 2017, by 5
        tickData = d3.range(1945, 2017, 5);

        // Add the tick groups
        let ticks = axis.selectAll('line.ticks')
          .data(tickData).enter()
          .append('g')

        // add the tick lines
        ticks
          .append('line')
          .attr('class', 'ticks')
          .attr('x1', xScale)
          .attr('x2', xScale)
          .attr('y1', 270)
          .attr('y2', 280)
          .style('stroke', 'white');

        // add the tick label
        ticks
          .append('text')
          .text((d) => d)
          .attr('x', xScale)
          .attr('y', 270)
          .style('fill', 'white')
          .style('text-anchor', 'end');

        let labels = svg.append('g').attr('class', 'labels')

        // Add the area labels for major and minor conflicts on y axis
        labels
          .append('text')
          .text('Major Conflicts')
          .attr('x', 50)
          .attr('y', 250)
          .style('font-size', '1.1em')
          .style('text-anchor', 'start')
          .attr('transform', 'rotate(270, 50, 250)');

        labels
          .append('text')
          .text('Minor Conflicts')
          .attr('x', 50)
          .attr('y', 290)
          .style('font-size', '1.1em')
          .style('font-weight', 'bold')
          .style('text-anchor', 'end')
          .attr('transform', 'rotate(270, 50, ' + (290) + ')');

        // List of all the countries 
        let countries = [];

        for (let i in converter) {
          countries.push({
            name: converter[i]['name'],
            code: i
          });
        }
        
        // Add the search bar functionality
        d3.select('#country-search')
          .on('input', function (e) { // on input change

            let input = this.value; // text they input
          
            // list of the first 20 countries that match what they typed
            let list = input === '' ? [] : regexListMatch(input, countries, 'name').slice(0, 20);

            // List container to hold items
            let listContainer = d3.select('#search-matches').select('ul')

            // Remove what is in there currently
            listContainer.selectAll('li').remove();

            // highlight the countries that have those countries in the dropdown involved
            svg.selectAll('circle')
              // apply highlight class based on the function
              .classed('highlight', function (d) {
                for (let i in list) {
                  for (let j in d.actors) {
                    if (list[i]['code'] == d.actors[j]) {
                      return true;
                    }
                  }
                }
                return false;
              })

          // add the countries to the dropdown list
            listContainer.selectAll('li').data(list).enter().append('li')
              .text((d) => d.name)
          // when clicked, highlight in the map and set the search bar to that country name
              .on('click', function (d) {
                let selected = d.code;
                document.getElementById('country-search').value = this.textContent;

                svg.selectAll('circle')
                  .classed('highlight', function (d) {
                    let codes = d.actors;
                    for (let i in codes) {
                      if (codes[i] == selected) {
                        return true;
                      }
                    }
                    return false;
                  });

                listContainer.selectAll('*').remove();
              });
          })

      });
      window.timeLine = true; // don't redraw the chart
    }
  });

  // returns the items of the list that match the regular expression text
  function regexListMatch(search, list, column) {
    let re = new RegExp('' + search + '', 'gi');;

    let matches = list.filter((e) => re.test(e[column]));;
    return matches;
  }
})();
