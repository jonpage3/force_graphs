

const c = console.log.bind(document);

function ForceGraph ({
    nodes,
    edges
}, {
    nodeId = d => d.key,
    nodeGroup, //maybe something like d.department
    nodeGroups, //an array of ordinal values representing the groups
    nodeTitle, //name
    nodeFill = "currentColor", // node stroke fill (if not using a group color encoding)
    nodeStroke = "#fff", // node stroke color
    nodeStrokeWidth = 1.5, // node stroke width, in pixels
    nodeStrokeOpacity = 1, // node stroke opacity
    nodeRadius = 5, // node radius, in pixels
    nodeStrength = -8,
    linkSource = ({source}) => source, // given d in links, returns a node identifier string
    linkTarget = ({target}) => target, // given d in links, returns a node identifier string
    linkStroke = "#999", // link stroke color
    linkStrokeOpacity = 0.6, // link stroke opacity
    linkStrokeWidth = 1.5, // given d in links, returns a stroke width in pixels
    linkStrokeLinecap = "round", // link stroke linecap
    linkStrength,
    colors = d3.schemeTableau10, // an array of color strings, for the node groups
    width = 640, // outer width, in pixels
    height = 400, // outer height, in pixels
    invalidation // when this promise resolves, stop the simulation

} = {} ) {
    const N = d3.map(nodes, nodeId).map(intern);
    //c(N);
    const LS = d3.map(edges, linkSource).map(intern);
    //c(LS)
    const LT = d3.map(edges, linkTarget).map(intern);
    //c(LT);
    if (nodeTitle === undefined) nodeTitle = (_, i) => N[i];
    const T = nodeTitle == null ? null : d3.map(nodes, nodeTitle);
    //c(T);
    const G = nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);
    //c(G);
    const W = typeof linkStrokeWidth !== "function" ? null : d3.map(edges, linkStrokeWidth);
    const L = typeof linkStroke !== "function" ? null : d3.map(edges, linkStroke);
    //c(W)
    nodes = d3.map(nodes, (_, i) => ({id: N[i]}));
    c(nodes);
    edges = d3.map(edges, (_, i) => ({source: LS[i], target: LT[i]}));
    c(edges);
    // Compute default domains.
    if (G && nodeGroups === undefined) nodeGroups = d3.sort(G);
    c(nodeGroups);
    // Construct the scales.
    const color = nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);
    c(color);
    const forceNode = d3.forceManyBody();
    const forceLink = d3.forceLink(edges).id(({index: i}) => N[i]);
    if (nodeStrength !== undefined) forceNode.strength(nodeStrength);
    if (linkStrength !== undefined) forceLink.strength(linkStrength);

    const simulation = d3.forceSimulation(nodes)
      .force("link", forceLink)
      .force("charge", forceNode)
      .force("center",  d3.forceCenter())
      .on("tick", ticked);

    const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width/4,-height/4, width, height])
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
    
    const edge = svg.append("g")
      .attr("stroke", typeof linkStroke !== "function" ? linkStroke : null)
      .attr("stroke-opacity", linkStrokeOpacity)
      .attr("stroke-width", typeof linkStrokeWidth !== "function" ? linkStrokeWidth : null)
      .attr("stroke-linecap", linkStrokeLinecap)
      .selectAll("line")
      .data(edges)
      .join("line");
    
    const node = svg.append("g")
      .attr("fill", nodeFill)
      .attr("stroke", nodeStroke)
      .attr("stroke-opacity", nodeStrokeOpacity)
      .attr("stroke-width", nodeStrokeWidth)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", nodeRadius)
      .call(drag(simulation));
    
    if (W) edge.attr("stroke-width", ({index: i}) => W[i]);
    if (L) edge.attr("stroke", ({index: i}) => L[i]);
    if (G) node.attr("fill", ({index: i}) => color(G[i]));
    if (T) node.append("title").text(({index: i}) => T[i]);
    if (invalidation != null) invalidation.then(() => simulation.stop());

    function intern(value) {
        return value !== null && typeof value === "object" ? value.valueOf() : value;
      }
    
    function ticked() {
    edge
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
    }

    function drag(simulation) {    
        function dragstarted(event) {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        }
        
        function dragged(event) {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        }
        
        function dragended(event) {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        }
        
        return d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended);
      }

    return Object.assign(svg.node(), {scales: {color}});

}

function removeDuplicates(arr) {
  return arr.filter((item,
      index) => arr.indexOf(item) === index);
}



Promise.all([
    d3.json("xshen5.json"),
    d3.json("agwilso2.json")
]).then(function(files) {
    // files[0] will contain file1.csv
    // console.log(files[0]);
    // console.log(files[1]);
    let data = files[0];

    let i = 1;

    while (i < files.length) {
        files[i].nodes.forEach(elem => data.nodes.push(elem));
        files[i].edges.forEach(elem => data.edges.push(elem));
        i++;
    }
    
    render(data);

}).catch(function(err) {
    // handle error here
})



function render(data) {
    chart = ForceGraph(data, {
        nodeId: d => d.key,
        nodeGroup: d => d.attributes.department,
        nodeTitle: d => `${d.attributes.name}\n${d.attributes.department}`,
        linkStrokeWidth: l => Math.sqrt(l.attributes.weight),
        width: 1500,
        height: 1200,
        // invalidation // a promise to stop the simulation when the cell is re-run
        
        
      })

    d3.select("body").node().appendChild(chart);
    document.getElementById("title").innerHTML = data.nodes[0].attributes.clusters[0];
}