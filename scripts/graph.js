(function () {

  let graph = function (data, parent, converter) {
    
    const width = 1100;
    const height = 900;

    let simulation = d3.forceSimulation().alpha(0.5)
      .force('link', d3.forceLink().id((d) => {
        return d.id;
      }).distance(100))
      .force('charge', d3.forceManyBody().strength(-30))
      .force('center', d3.forceCenter(width / 2, height / 2));
    
    let svg_conflict = parent
      .append('svg')
      .attr('width', width)
      .attr('height', height);


    const startRadius = 0.5;
    const endRadius = 6;

    const linkSize = d3.scaleLinear()
      .domain(d3.extent(data.links.map((d) => {
        return +d.value
      })))
      .range([2, 7]);

    const nodeColor = d3.scaleLog()
      .domain(d3.extent(data.links.map((d) => {
        return +d.value
      })))
      .range([0, 1]);

    function getLinkSize(d) {
      return linkSize(+d.value);
    }


    svg_conflict.call(
      d3.zoom().on('zoom', () => {
        svg_conflict.selectAll('g.links, g.nodes').attr('transform', d3.event.transform);
      }))


    let links = svg_conflict.append('g')
      .attr('class', 'links')
      .selectAll("path.conflict")
      .data(data.links)
      .enter().append('path')
      .attr('class', 'conflict')
      .attr('fill', 'none')
      .attr('stroke-width', getLinkSize)
      .attr('stroke', '#dd8833')
      .style('opacity', 0)

    links.transition()
      .style('opacity', 0.7)
      .attr('stroke', '#ff0000')
      .delay(function (d, i) {
        return i * 15;
      })
      .duration(2000).ease(d3.easeLinear);

    let nodes = svg_conflict.append('g')
      .attr('class', 'nodes')
      .selectAll("g.nodes")
      .data(data.nodes)
      .enter().append("g")
      .attr('fill', 'white')
      .style('cursor', 'pointer');

    let circles = nodes.append('circle')
      .attr('r', startRadius)
      .attr('fill', 'white')
      .attr('stroke', '#80808A')
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      )

    circles.on('mouseover', () => {
      svg_conflict.selectAll('path').style('opacity', 0.3);
      svg_conflict.selectAll('circle').style('opacity', 1);

      d3.select(d3.event.target).attr('r', endRadius * 1.5).style('opacity', 1);
    });

    circles.on('mouseout', (e) => {
      svg_conflict.selectAll('*').style('opacity', 1);
      d3.select(d3.event.target).attr('r', endRadius).attr('opacity', 1);
    });


    circles.transition()
      .attr('fill', '#333344')
      .attr('r', 6)
      .delay(function (d, i) {
        return 15 * i;
      })
      .duration(500);

    let labels = nodes.append('text')
      .attr('class', 'graph-labels')
      .text(function (d) {
        try {
           ;
          return converter[d.id]['name'];
        } catch (err) {
          return '';
        };
      })
      .attr('x', 10)
      .attr('y', 3);

    function ticked() {
          links
            .attr("d", function (d) {
              let dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy);
//                midx = (dx - dr)/2, midy = (dy - dr)/2;
            
              return "M" + d.source.x  + ', ' + d.source.y +
                " l " + dx + ', ' + dy;
//              return "M" + d.source.x + ", " + d.source.y + 
//                " s " + midx + ", " + midy + ' ' + dx + ', ' + dy;
            });
//
//      links
//        .attr("x1", function (d) {
//          return d.source.x;
//        })
//        .attr("y1", function (d) {
//          return d.source.y;
//        })
//        .attr("x2", function (d) {
//          return d.target.x;
//        })
//        .attr("y2", function (d) {
//          return d.target.y;
//        });



      nodes
        .attr("transform", function (d) {
//                  d.x = Math.max(5, Math.min(width - 5, d.x));
//                  d.y = Math.max(5, Math.min(height - 5, d.y))
          return "translate(" + d.x + "," + d.y + ")";
        })
    }
    simulation.nodes(data.nodes).on('tick', ticked);
    simulation.force('link').links(data.links);


    function dragstarted() {
      if (!d3.event.active) simulation.alphaTarget(0.5).restart();
      d3.event.subject.fx = d3.event.subject.x;
      d3.event.subject.fy = d3.event.subject.y;
      simulation.force('charge', d3.forceManyBody().strength(1))
    }

    function dragged(d) {
      d3.event.subject.fx = d3.event.x;
      d3.event.subject.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d3.event.subject.fx = null;
      d3.event.subject.fy = null;
      simulation.force('charge', d3.forceManyBody().strength(-10))
    }

  };


  Promise.all([
  d3.json('data/formatted_data/alliances_all.json'),  // 0
  d3.json('data/formatted_data/alliances_primary.json'),  // 1
  d3.json('data/formatted_data/ccode_converter.json'),  // 2
  d3.json('data/formatted_data/conflicts_all.json'),  // 3
  d3.json('data/formatted_data/conflicts_primary.json'),  // 4
  d3.json('data/formatted_data/nodes_all.json'),  // 5
  d3.json('data/formatted_data/nodes_primary.json') // 6
]).then((d) => {
    let alliancesAll = d[0];
    let alliancesPrimary = d[1];
    let codeConverter = d[2];
    let conflictsAll = d[3];
    let conflictsPrimary = d[4];
    let countriesAll = d[5];
    let countriesPrimary = d[6];

    graph({
      nodes: countriesPrimary,
      links: conflictsPrimary
    }, d3.select('#conflict-graph'), codeConverter);
  });

})();
