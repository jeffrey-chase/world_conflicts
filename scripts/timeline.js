(function () {
  let parent = d3.select('#timeline');

  Promise.all([
    d3.csv('data/raw_data/ucdp-prio-acd-181.csv'),
    d3.json('data/formatted_data/ccode_converter.json')
  ]).then(function (d) {
    let conflicts = d[0];
    let converter = d[1];

    conflicts.forEach((d) => {
      d.startDate = new Date(d.start_date) || new Date(d.year);
      d.endDate = new Date(d.end_date) || new Date(d.year);
      d.year = +d.year;
      d.actors = [];
      d.gwno_a.split(',').forEach((e) => d.actors.push(e));
      d.gwno_a_2nd.split(',').forEach((e) => d.actors.push(e));
      d.gwno_b.split(',').forEach((e) => d.actors.push(e));
      d.gwno_b_2nd.split(',').forEach((e) => d.actors.push(e));
    });

    conflicts = conflicts.sort((d1, d2) => d1.startDate > d2.startDate);

    let nested = d3.nest()
      .key((d) => +d.year)
      .sortKeys(d3.ascending)
      .rollup((d) => {
        return {
          major: d.filter((e) => e.intensity_level === "2"),
          minor: d.filter((e) => e.intensity_level === "1")
        };
      })
      .entries(conflicts);

    console.log(nested);

    let width = 1000;
    let height = 600;

    let xScale = d3.scaleLinear()
      .domain(d3.extent(nested, (d) => d.key))
      .range([100, width - 100]);

    let yScaleMinor = d3.scaleLinear()
      .domain([0, d3.max(nested, (d) => d.value.minor.length)])
      .range([height - 300, height - 5]);

    let yScaleMajor = d3.scaleLinear()
      .domain([d3.max(nested, (d) => d.value.major.length), 0])
      .range([10, height - 350]);


    let infoContainer = parent.append('div')
      .attr('id', 'timeline-story')



    let svg = parent.append('svg')
      .attr('width', width)
      .attr('height', height);


    let points = svg.selectAll('circle.conflicts');

    nested.forEach((el) => {
      let year = +el.key;
      let conflicts = el.values;


      points.data(el.value.minor).enter().append('circle')
        .attr('class', 'conflicts')
        .attr('r', 0.1)
        .style('fill', (d) => d.intensity_level === '2' ? '#ff0000' : '#660000')
        .style('opacity', (d) => d.intensity_level === '2' ? 1.0 : 0.7)
        .attr('cx', xScale(year))
        .attr('cy', height + 20)
        .transition()
        .delay((d, i) => {
          return (year - 1946) * 90 + i * 2;
        })
        .duration(2000)
        .style('stroke', (d) => d.intensity_level === '2' ? '' : '#ff0000')
        .attr('r', (d) => d.intensity_level === '2' ? 5 : 3)
        .attr('cy', (d, i) => {
          return yScaleMinor(i);
        })
        .ease(d3.easePoly);

      points.data(el.value.major).enter().append('circle')
        .attr('class', 'conflicts')
        .attr('r', 0.1)
        .style('fill', (d) => d.intensity_level === '2' ? '#ff0000' : '#660000')
        .attr('cx', xScale(year))
        .attr('cy', -10)
        .transition()
        .delay((d, i) => {
          return (year - 1946) * 90 + i * 2;
        })
        .duration(2000)
        .style('opacity', (d) => d.intensity_level === '2' ? 1.0 : 0.7)
        .attr('r', (d) => d.intensity_level === '2' ? 5 : 3)
        .attr('cy', (d, i) => {
          return yScaleMajor(i);
        })
        .ease(d3.easePoly);
      //        .ease(d3.easeBounceOut);
      //        .ease(d3.easeCubicInOut);


    });
    svg.selectAll('circle.conflicts')
      .on('mouseover', infoShower);

    function infoShower(d) {
      d3.select('.infoshow').classed('infoshow', false);
      d3.select(this).classed('infoshow', true);
      let container = parent.select('#timeline-story');
      


      let filter = /(^gwno)|(actors)|(Date$)|(version)|(region)|(_id$)|(^ep)|(^cumul)|(prec)|(2$)/

      container.selectAll("*").remove();
      
      container
        .append('h4')
        .text('Conflict Info');
      
      let list = container.append('dl');
      for (let i in d) {
        if (!i.match(filter)) {
          list
            .append('dt')
            .text(i.replace(/_/gi, ' '));

          list.append('dd')
            .text(d[i]);
        }

      }
    }

    let axis = svg.append('g').attr('class', 'axis');

    axis.append('line')
      .attr('class', 'axisline')
      .attr('x1', 20)
      .attr('x2', width - 100)
      .attr('y1', 275)
      .attr('y2', 275)
      .attr('stroke', 'white');

    tickData = d3.range(1945, 2017, 5);

    let ticks = axis.selectAll('line.ticks')
      .data(tickData).enter()
      .append('g')

    ticks
      .append('line')
      .attr('class', 'ticks')
      .attr('x1', xScale)
      .attr('x2', xScale)
      .attr('y1', 270)
      .attr('y2', 280)
      .style('stroke', 'white');

    ticks
      .append('text')
      .text((d) => d)
      .attr('x', xScale)
      .attr('y', 270)
      .style('fill', 'white')
      .style('text-anchor', 'end');


    let countries = [];

    for (let i in converter) {
      countries.push({
        name: converter[i]['name'],
        code: i
      });
    }

    console.log(countries);

    d3.select('#country-search')
      .on('input', function (e) {
        let input = this.value;
        let list = input === '' ? [] : regexListMatch(input, countries, 'name').slice(0, 20);

        let listContainer = d3.select('#search-matches').select('ul')

        listContainer.selectAll('li').remove();

        svg.selectAll('circle')
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

        listContainer.selectAll('li').data(list).enter().append('li')
          .text((d) => d.name)
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


  function regexListMatch(search, list, column) {
    let re = new RegExp('' + search + '', 'gi');
    console.log(re);

    let matches = list.filter((e) => re.test(e[column]));
    console.log(matches);
    return matches;
  }
})();
