(function () {

  window.addEventListener('load', () => {
    window.scroll(0, 0);
    randomExplosions(d3.select('header'));
    let p = document.getElementById("intro");
    p.style.opacity = 0;
    
    let opacityScale = d3.scaleLinear()
      .domain([0, parseFloat(p.getBoundingClientRect().top)/2])
      .range([1, 0]);

    window.onscroll = function () {
      let top = parseFloat(p.getBoundingClientRect().top);
      if (top > 0) {
        p.style.opacity = opacityScale(top);
      } else {
        p.style.opacity = null;
        window.onscroll = null;
      }

    };
  });




  function randomExplosions(parent) {
    let width = parseFloat(window.getComputedStyle(parent.node()).width);
    let height = parseFloat(window.getComputedStyle(parent.node()).height);


    let svg = parent.append('svg')
      .attr('class', 'background')
      .attr('width', width)
      .attr('height', height);


    setInterval(() => {

      let data = d3.range(10).map(() => {
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 60
        }
      });

      svg.selectAll('circle').data(data).enter().append('circle')
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y)
        .style('fill', '#cc6633')
        .style('opacity', '1')
        .attr('r', 1)
        .transition()
        .delay((d, i) => i * 200)
        .duration(3000)
        .style('fill', 'red')
        .style('opacity', 0)
        .attr('r', (d) => d.r)
        .ease(d3.easeLinear)
        .on('end', function (e) {
          d3.select(this).remove()
        })
    }, 1000);

  }
})();
