(function () {
  let parent = d3.select('#timeline');

  d3.csv('data/raw_data/ucdp-prio-acd-181.csv').then(function (d) {
    d.forEach((d) => {
      d.startDate = new Date(d.start_date) || new Date(d.year);
      d.endDate = new Date(d.end_date) || new Date(d.year);
      d.year = +d.year;
    });

    d = d.sort((d1, d2) => d1.startDate > d2.startDate);
    console.log(d);

    let nested = d3.nest()
      .key((d) => +d.year)
      .sortKeys(d3.ascending)
      .rollup((d) => {
        console.log(d);
        return {
          major: d.filter((e) => e.intensity_level === "2"),
          minor: d.filter((e) => e.intensity_level === "1")
        };
      })
      .entries(d);

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

    let svg = parent.append('svg')
      .attr('width', width)
      .attr('height', height);


    let points = svg.selectAll('circle.conflicts');

    nested.forEach((el) => {
      console.log(el);
      let year = +el.key;
      let conflicts = el.values;

      points.data(el.value.minor).enter().append('circle')
        .attr('class', 'conflicts')
        .attr('r', 0.1)
        .attr('fill', 'white')
        .style('opacity', (d) => d.intensity_level === '2' ? 1.0 : 0.7)
        .attr('cx', xScale(year))
        .attr('cy', height+20)
        .transition()
        .delay((d, i) => {
          return (year - 1946) * 90 + i * 2;
        })
        .duration(2000)
        .style('fill', (d) => d.intensity_level === '2' ? '#ff0000' : '#660000')
        .style('stroke', (d) => d.intensity_level === '2' ? '' : '#ff0000')
        .attr('r', (d) => d.intensity_level === '2' ? 5 : 3)
        .attr('cy', (d, i) => {
          return yScaleMinor(i);
        })
        .ease(d3.easePoly);

      points.data(el.value.major).enter().append('circle')
        .attr('class', 'conflicts')
        .attr('r', 0.1)
        .attr('fill', 'white')
        .attr('cx', xScale(year))
        .attr('cy', -10)
        .transition()
        .delay((d, i) => {
          return (year - 1946) * 90 + i * 2;
        })
        .duration(2000)
        .style('fill', (d) => d.intensity_level === '2' ? '#ff0000' : '#660000')
        .style('stroke', (d) => d.intensity_level === '2' ? '' : '#ff0000')
        .style('opacity', (d) => d.intensity_level === '2' ? 1.0 : 0.7)
        .attr('r', (d) => d.intensity_level === '2' ? 5 : 3)
        .attr('cy', (d, i) => {
          return yScaleMajor(i);
        })
        .ease(d3.easePoly);
      //        .ease(d3.easeBounceOut);
      //        .ease(d3.easeCubicInOut);
    });

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


  });
})();
