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
      .entries(d);

    console.log(nested);

    let width = 1000;
    let height = 600;

    let xScale = d3.scaleLinear()
      .domain(d3.extent(nested, (d) => d.key))
      .range([10, width - 10]);

    let yScale = d3.scaleLinear()
      .domain([ d3.max(nested, (d) => d.values.length), 0])
      .range([40, height - 20]);

    let svg = parent.append('svg')
      .attr('width', width)
      .attr('height', height);

    let points = svg.selectAll('circle.conflicts');

    nested.forEach((el) => {
      console.log(el);
      let year = +el.key;
      let conflicts = el.values;

      points.data(el.values).enter().append('circle')
        .attr('class', 'circle')
        .attr('cx', xScale(year))
        .attr('cy', (d, i) => {
          return yScale(i);
        })
        .attr('r', (d) => d.intensity_level === '2' ? 5 : 3)
        .style('fill', (d) => d.intensity_level === '2' ? '#ff0000' : '#ff0000')
        .style('opacity', (d) => d.intensity_level === '2' ? 1.0 : 0.3);
    });


    //      .attr('y', (d)=>yScale(+d.values[]));



  });

})();
