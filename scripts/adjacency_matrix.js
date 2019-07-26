(function () {
  let parent = d3.select('#adj-matrix');

  let width = 1100,
    height = 1100;

  let folder = 'data/formatted_data/';

  function adjMatrixMaker(nodes, links, converter, adjMatrix, colors) {
    parent.select('svg').remove();

    let svg = parent.append('svg')
      .attr('height', height)
      .attr('width', width);

    nodes = nodes.filter((d) => converter.hasOwnProperty(d.id));
    let nodePositions = {}

    nodes.forEach((d, i) => {
      nodePositions[d.id] = i;
    })


    let xScale = d3.scaleLinear()
      .domain([0, nodes.length])
      .range([200, width])

    let yScale = d3.scaleLinear()
      .domain([0, nodes.length])
      .range([200, height]);



    let colorScale = d3.scaleSqrt()
      .domain([1, d3.max(links, (d) => d.value)])
      .range(colors);

    let cellSize = 900 / nodes.length;

    svg.append('g').selectAll('rect.grid')
      .data(nodes).enter()
      .append('rect')
      .attr('class', 'grid')
      .attr('y', (d) => yScale(nodePositions[d.id]) - cellSize / 2)
      .attr('x', 195)
      .attr('width', height - 195)
      .attr('height', cellSize)
      .attr('stroke-width', 0.2)
      .attr('stroke', '#333');


    svg.append('g').selectAll('rect.grid')
      .data(nodes).enter()
      .append('rect')
      .attr('class', 'grid')
      .attr('x', (d) => xScale(nodePositions[d.id]) - cellSize / 2)
      .attr('y', 195)
      .attr('height', height - 195)
      .attr('width', cellSize)
      .attr('stroke', '#333')
      .attr('stroke-width', 0.2)
      .attr('fill', 'none');

    svg.append('g').selectAll('rect.cells')
      .data(links).enter()
      .append('rect')
      .attr('class', 'cells')
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('stroke', 'black')
      .attr('x', (d, i) => {
        let index = nodePositions[d.source];
        let value = xScale(index) - cellSize / 2;
        return isNaN(value) ? -200 : value;
      })
      .attr('y', (d, i) => {

        let index = nodePositions[d.target];
        let value = yScale(index) - cellSize / 2;
        return isNaN(value) ? -200 : value;

      })
      .attr('fill', 'black')
      .transition().delay((d, i) => 100 + i).duration(2000)
      .attr('fill', (d) => {
        try {
          value = adjMatrix[d.source][d.target];
          return colorScale(value)
        } catch (e) {
          return 'none';
        }
      });

    svg.append('g').selectAll('rect.cells')
      .data(links).enter()
      .append('rect')
      .attr('class', 'cells')
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('stroke', 'black')
      .attr('x', (d, i) => {
        let index = nodePositions[d.target];
        let value = xScale(index) - cellSize / 2;
        return isNaN(value) ? -200 : value;
      })
      .attr('y', (d, i) => {
        let index = nodePositions[d.source];
        let value = yScale(index) - cellSize / 2;
        return isNaN(value) ? -200 : value;
      })
      .attr('fill', 'black')
      .transition().delay((d, i) => 100 + i).duration(2000)
      .attr('fill', (d) => {
        try {
          let value = adjMatrix[d.source][d.target];
          return colorScale(value);
        } catch (e) {
          return 'none';
        }
      });

    svg.append('g').selectAll('text.xlabel')
      .data(nodes).enter()
      .append('text')
      .attr('class', 'xlabel')
      .attr('x', (d) => xScale(nodePositions[d.id]))
      .attr('y', 180)
      .attr('alignment-baseline', 'central')
      .attr('text-anchor', 'start')
      .attr('fill', 'white')
      .style('font-size', '8pt')
      .attr('transform', (d) => 'rotate(270,' + xScale(nodePositions[d.id]) + ', 180)')
      .text((d) => {
        try {
          return converter[d.id]['name'];
        } catch (e) {
          return '';
        }
      });


    svg.append('g').selectAll('text.ylabel')
      .data(nodes).enter()
      .append('text')
      .attr('class', 'xlabel')
      .attr('y', (d) => xScale(nodePositions[d.id]))
      .attr('x', 180)
      .attr('alignment-baseline', 'central')
      .attr('text-anchor', 'end')
      .attr('fill', 'white')
      .style('font-size', '8pt')
      .text((d) => {
        try {
          return converter[d.id]['name'];
        } catch (e) {
          return '';
        }
      });

    svg.append('g').append("line")
      .attr('x1', 190)
      .attr('x2', width)
      .attr('y1', 190)
      .attr('y2', 190)
      .attr('stroke', '#999')
      .attr('stroke-width', 1)
      .attr('class', 'xaxis');

    svg.append('g').append("line")
      .attr('x1', 190)
      .attr('x2', 190)
      .attr('y1', 190)
      .attr('y2', height)
      .attr('stroke', '#999')
      .attr('stroke-width', 1)
      .attr('class', 'yaxis');

    svg.on('mouseover', function (d) {
      var coordinates = d3.mouse(this);
      var x = coordinates[0];
      var y = coordinates[1];
      if (x >= 191 && y >= 191) {
        svg.select('line.xaxis')
          .attr('y1', y)
          .attr('y2', y);
        svg.select('line.yaxis')
          .attr('x1', x)
          .attr('x2', x);
      } else {
        svg.select('line.xaxis')
          .attr('y1', 190)
          .attr('y2', 190);
        svg.select('line.yaxis')
          .attr('x1', 190)
          .attr('x2', 190);
      }

    });

    svg.on('mouseout', function (d) {
      svg.select('line.xaxis')
        .attr('y1', 190)
        .attr('y2', 190);
      svg.select('line.yaxis')
        .attr('x1', 190)
        .attr('x2', 190);

    });
  }




  Promise.all([
    d3.json(folder + 'nodes_all.json'),
    d3.json(folder + 'conflicts_all.json'),
    d3.json(folder + 'alliances_all.json'),
    d3.json(folder + 'ccode_converter.json'),
    d3.json(folder + 'conflict_adjacency_matrix.json'),
    d3.json(folder + 'alliance_adjacency_matrix.json')
  ]).then((d) => {
    let nodes = d[0];
    let linksConflicts = d[1];
    let linksAlliances = d[2];
    let converter = d[3];
    let adjMatrixConflicts = d[4];
    let adjMatrixAlliances = d[5];


    let buttonContainer = parent.append('div').attr('id', 'adj-matrix-switches')

    let conflictButton = buttonContainer.append('button')
      .attr('id', 'conflicts-adj-matrix-switch')
      .attr('class', 'adj-matrix-switch')
      .text('Conflicts  ')
      .on('click', () => {
        allianceButton.classed('selected', false)
        conflictButton.classed('selected', true);

        adjMatrixMaker(nodes,
          linksConflicts,
          converter,
          adjMatrixConflicts,
                       ['#ff9999', '#ff0000']);
      });


    let allianceButton = buttonContainer.append('button')
      .attr('id', 'alliances-adj-matrix-switch')
      .attr('class', 'adj-matrix-switch')
      .text('Alliances')
      .on('click', () => {
        conflictButton.classed('selected', false)
        allianceButton.classed('selected', true);

        adjMatrixMaker(nodes,
          linksAlliances,
          converter,
          adjMatrixAlliances,
                       ['#77cc77', '#00cc00']);

      });
    
        conflictButton.dispatch('click');

  });

})();
