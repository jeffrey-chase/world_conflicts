(function () {

  window.addEventListener('load', () => {
    // on load, scroll to top
    window.scroll(0, 0);
    
    // add random explosions to the header
    randomExplosions(d3.select('header'));
    
    // Intro section
    let p = document.getElementById("intro");
    
    // Give opacity of zero
    p.style.opacity = 0;
    
    // Function to turn scroll distance into opacity value
    let opacityScale = d3.scaleLinear()
      .domain([0, parseFloat(p.getBoundingClientRect().top)/2])
      .range([1, 0]);

    window.onscroll = function () {
      // get the top of the intro
      let top = parseFloat(p.getBoundingClientRect().top);
      if (top > 0) { // while more than zero
        p.style.opacity = opacityScale(top); // change the opacity based on scroll
      } else {
        p.style.opacity = null; // otherwise, it's done transitioning and reset it
        window.onscroll = null; // delete this listener
      }

    };
  });



  /*
    Makes randomly placed circles that grow in size, change color, 
    decrease in opacity and then disappear as the items background
  */
  function randomExplosions(parent) {
    // Get the width and height of the parent
    let width = parseFloat(window.getComputedStyle(parent.node()).width);
    let height = parseFloat(window.getComputedStyle(parent.node()).height);

    // append an svg of the parent size to the element
    let svg = parent.append('svg')
      .attr('class', 'background') // puts z-index -1, absolute positioning
      .attr('width', width)
      .attr('height', height);


    // Make new circles every 1 second
    setInterval(() => {

      // Make random x, y coordinates and a radius
      let data = d3.range(10).map(() => {
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 60
        }
      });

      // Add the new cirlces
      svg.selectAll('circle').data(data).enter().append('circle')
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y)
        .style('fill', '#cc6633')
        .style('opacity', '1')
        .attr('r', 1)
        .transition()// Make them transition
        .delay((d, i) => i * 200) // delay them from one another
        .duration(3000)  // 3 second transition
        .style('fill', 'red')
        .style('opacity', 0)
        .attr('r', (d) => d.r) // Increase to the random radius
        .ease(d3.easeLinear)
        .on('end', function (e) { // on end, delete this node
          d3.select(this).remove()
        })
    }, 1000);

  }
})();
