(function () {





  //  let labSimulation = d3.forceSimulation().alpha(0.5)
  //    .force('link', d3.forceLink().id((d) => {
  //      return d.id;
  //    }))
  //    .force('charge', d3.forceManyBody().strength(-15))
  //    .force('center', d3.forceCenter(width / 2, height / 2))

  let graph = function (data, parent, converter) {

    const width = 900;
    const height = 500;

    let simulation = d3.forceSimulation().alpha(1)
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

    const linkSize = d3.scaleLog()
      .domain(d3.extent(data.links.map((d) => {
        return +d.value
      })))
      .range([2, 7]);

    const nodeColor = d3.scaleLog()
      .domain(d3.extent(data.links.map((d) => {
        return +d.value
      })))
      .range([0, 1]);

    function getLinkColor(d) {
      return d3.interpolatePlasma(linkColor(+d.value));
    }

    function getLinkSize(d) {
      return linkSize(+d.value);
    }




    //  let links = svg_conflict.append('g')
    //    .attr('class', 'links')
    //    .selectAll("path.conflict")
    //    .data(conflicts)
    //    .enter().append('path')
    //    .attr('class', 'conflict')
    //    .attr('fill', 'none')
    //    .attr('stroke-width', getLinkSize)
    //    .attr('stroke', '#ff9999')
    //    .style('opacity', 0)


    svg_conflict.call(
      d3.zoom().on('zoom', () => {
        svg_conflict.selectAll('g.links, g.nodes').attr('transform', d3.event.transform);
      }))


    let links = svg_conflict.append('g')
      .attr('class', 'links')
      .selectAll("line.conflict")
      .data(data.links)
      .enter().append('line')
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
      svg_conflict.selectAll('line').style('opacity', 0.5);
      svg_conflict.selectAll('circle').style('opacity', 0.8);

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
          console.log(converter[d.id]['name']);
          return converter[d.id]['name'];
        } catch (err) {
          return '';
        };
      })
      .attr('x', 10)
      .attr('y', 3);

    function ticked() {
      //    links
      //      .attr("d", function (d) {
      //        let dx = d.target.x - d.source.x,
      //          dy = d.target.y - d.source.y,
      //          dr = Math.sqrt(dx * dx + dy * dy);
      //        return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
      //      });

      links
        .attr("x1", function (d) {
          return d.source.x;
        })
        .attr("y1", function (d) {
          return d.source.y;
        })
        .attr("x2", function (d) {
          return d.target.x;
        })
        .attr("y2", function (d) {
          return d.target.y;
        });



      nodes
        .attr("transform", function (d) {
          //        d.x = Math.max(5, Math.min(width - 5, d.x));
          //        d.y = Math.max(5, Math.min(height - 5, d.y))
          return "translate(" + d.x + "," + d.y + ")";
        })
    }
    simulation.nodes(data.nodes).on('tick', ticked);
    simulation.force('link').links(data.links);


    function dragstarted() {
      if (!d3.event.active) simulation.alphaTarget(1).restart();
      d3.event.subject.fx = d3.event.subject.x;
      d3.event.subject.fy = d3.event.subject.y;
      simulation.force('charge', d3.forceManyBody().strength(-20))
    }

    function dragged(d) {
      d3.event.subject.fx = d3.event.x;
      d3.event.subject.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d3.event.subject.fx = null;
      d3.event.subject.fy = null;
      simulation.force('charge', d3.forceManyBody().strength(-30))
    }

  };


  Promise.all([
  d3.json('../data/formatted_data/alliances.json'),
  d3.json('../data/formatted_data/ccode_converter.json'),
  d3.json('../data/formatted_data/conflicts.json'),
  d3.json('../data/formatted_data/nodes.json'),
  d3.json('../data/formatted_data/combined_links.json')
]).then((d) => {
    let alliances = d[0];
    let codeConverter = d[1];
    let conflicts = d[2];
    let countries = d[3];
    let allLinks = d[4]

    graph({
      nodes: countries,
      links: conflicts
    }, d3.select('#conflict-graph'), codeConverter);
  });

})();
