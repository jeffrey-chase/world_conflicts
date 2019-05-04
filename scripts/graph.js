(function () {

  /**
  * Function to make the force directed graph
  */
  let graph = function (data, parent, converter) {

    const width = 1100; // total width of the svg
    const height = 900; // total height of the svg

    
    // Manages the force simulation of the links and nodes
    // that repels disconnected nodes and attracts connected nodes
    // to one another
    let simulation = d3.forceSimulation().alpha(0.5)
      .force('link', d3.forceLink().id((d) => {
        return d.id;
      }).distance(100))
    // Distance increased to show structure
      .force('charge', d3.forceManyBody().strength(-30)) 
    // strength level tuned to show structure
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Svg to hold the graph
    let svg_conflict = parent
      .append('svg')
      .attr('width', width)
      .attr('height', height);


    // Transition sizes of the nodes as they appear
    const startRadius = 0.5; // initial size
    const endRadius = 6; // final size

    
    // Linear scale to turn the number of connections between to countries into 
    // line stroke widths
    const linkSize = d3.scaleLinear()
      .domain(d3.extent(data.links.map((d) => {
        return +d.value
      })))
      .range([2, 7]);

    // wrapper to be passed to d3.append that pulls the correct value from the data
    function getLinkSize(d) {
      return linkSize(+d.value);
    }

    // Function to handle pan and zoom functionality on the graph svg
    svg_conflict.call(
      d3.zoom().on('zoom', () => {
        svg_conflict.selectAll('g.links, g.nodes').attr('transform', d3.event.transform);
      }))


    // Add the links to the graph
    // Links added first so that the nodes are above the nodes in order
    // since svg layers are based on drawing order (no z-index property)
    let links = svg_conflict.append('g')
      .attr('class', 'links')
      .selectAll("path.conflict") // select all of the links
      .data(data.links) // assign the selection to data
      .enter().append('path') // append new links from the data
      .attr('class', 'conflict') // set attributes
      .attr('fill', 'none')
      .attr('stroke-width', getLinkSize)
      .attr('stroke', '#dd8833')
      .style('opacity', 0)

    // Animate the links to show up as the graph loads
    links.transition()
      .style('opacity', 0.7) // opacity from 0 to 0.7
      .attr('stroke', '#ff0000') // color from orange to red
      .delay(function (d, i) { 
      // delay based on index so that not all of them load at the same time
        return i * 15;
      })
      .duration(2000).ease(d3.easeLinear);

    // Append the nodes groups to the diagram
    // that will contain the circle and the text
    let nodes = svg_conflict.append('g')
      .attr('class', 'nodes')
      .selectAll("g.nodes")
      .data(data.nodes)
      .enter().append("g")
      .attr('fill', 'white')
      .style('cursor', 'pointer');

    // Append the node circles 
    let circles = nodes.append('circle')
      .attr('r', startRadius)
      .attr('fill', 'white')
      .attr('stroke', '#80808A')
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      )

    // When hover over a circle, highlight it
    // and de-emphasize the other paths and circles
    circles.on('mouseover', () => {
      svg_conflict.selectAll('path').style('opacity', 0.3);
      svg_conflict.selectAll('circle').style('opacity', 1);

      d3.select(d3.event.target).attr('r', endRadius * 1.5).style('opacity', 1);
    });

    // On mouseout, reset
    circles.on('mouseout', (e) => {
      svg_conflict.selectAll('*').style('opacity', 1);
      d3.select(d3.event.target).attr('r', endRadius).attr('opacity', 1);
    });


    // Cirlces transition the color and size as the graph loads
    circles.transition()
      .attr('fill', '#333344')
      .attr('r', 6)
      .delay(function (d, i) {
        return 15 * i;
      })
      .duration(500);

    
    // Add labels for the nodes
    let labels = nodes.append('text')
      .attr('class', 'graph-labels')
      .text(function (d) {
        try {
          return converter[d.id]['name'];
        } catch (err) {
          return '';
        };
      })
      .attr('x', 10) // offset from the circle
      .attr('y', 3); // offset 

    // 
    function ticked() {
      // connects the links and the nodes to each other 
      // based on the links and nodes data
      links
        .attr("d", function (d) {
          let dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
          //                midx = (dx - dr)/2, midy = (dy - dr)/2;

          return "M" + d.source.x + ', ' + d.source.y +
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

    // Controls the drag events to allow the user to move the nodes around
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


  // Load the data
  Promise.all([
  d3.json('data/formatted_data/ccode_converter.json'), // 0 country code –> name
  d3.json('data/formatted_data/conflicts_primary.json'), // 1 links
  d3.json('data/formatted_data/nodes_primary.json') // 2 nodes
]).then((d) => {
    window.graphShow = false; // has the graph been drawn yet
    let codeConverter = d[0]; // pull the data
    let conflictsPrimary = d[1];
    let countriesPrimary = d[2];
    let parent = d3.select('#conflict-graph'); // parent container for the graph

    // Once the graph is in view, start drawing it
    window.addEventListener('scroll', () => {
      let height = window.innerHeight;
      if (parent.node().getBoundingClientRect().top < height*.9 && !window.graphShow) {
        graph({
          nodes: countriesPrimary,
          links: conflictsPrimary
        }, parent, codeConverter);
        window.graphShow = true;
      }

    })

  });

})();
