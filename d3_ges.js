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
    nodeStrength=-1,
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
    //c(nodes);
    edges = d3.map(edges, (_, i) => ({source: LS[i], target: LT[i]}));
    //c(edges);
    // Compute default domains.
    if (G && nodeGroups === undefined) nodeGroups = d3.sort(G);
    //c(nodeGroups);
    // Construct the scales.
    const color = nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);
    //c(color);
    const forceNode = d3.forceManyBody();
    const forceLink = d3.forceLink(edges).id(({index: i}) => N[i]);
    if (nodeStrength !== undefined) forceNode.strength(nodeStrength);
    if (linkStrength !== undefined) forceLink.strength(linkStrength);
    //c(forceNode);
    const simulation = d3.forceSimulation(nodes)
      .force("link", forceLink)
      .force("charge", forceNode)
      .force("center",  d3.forceCenter())
      .on("tick", ticked);

    const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width/1.5, -height/1.5, width*1.5, height*1.5])
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
    
    function checkBounds(d){
        if (d.x < 0) d.x = 0;
        if (d.x > width) d.x = width;
        if (d.y < 0) d.y = 0;
        if (d.y > width) d.y = height;
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

// gather the data
Promise.all([
    d3.json("./ges_json/acclayt2-json_graph.json"),
    d3.json("./ges_json/allloyd-json_graph.json"),
    d3.json("./ges_json/amdeyonk-json_graph.json"),
    d3.json("./ges_json/amgrunde-json_graph.json"),
    d3.json("./ges_json/anholt-json_graph.json"),
    d3.json("./ges_json/apperson-json_graph.json"),
    d3.json("./ges_json/arbinder-json_graph.json"),
    d3.json("./ges_json/atstepan-json_graph.json"),
    d3.json("./ges_json/auerbach-json_graph.json"),
    d3.json("./ges_json/awhitfi-json_graph.json"),
    d3.json("./ges_json/awmerck-json_graph.json"),
    d3.json("./ges_json/bgg-json_graph.json"),
    d3.json("./ges_json/blnowell-json_graph.json"),
    d3.json("./ges_json/caiglesi-json_graph.json"),
    d3.json("./ges_json/classen-json_graph.json"),
    d3.json("./ges_json/clcummin-json_graph.json"),
    d3.json("./ges_json/cleitsc-json_graph.json"),
    d3.json("./ges_json/cmwilli5-json_graph.json"),
    d3.json("./ges_json/dbrown-json_graph.json"),
    d3.json("./ges_json/dcorcutt-json_graph.json"),
    d3.json("./ges_json/ddreisig-json_graph.json"),
    d3.json("./ges_json/ddstover-json_graph.json"),
    d3.json("./ges_json/dmberube-json_graph.json"),
    d3.json("./ges_json/dpdannel-json_graph.json"),
    d3.json("./ges_json/drotenb-json_graph.json"),
    d3.json("./ges_json/dsjones5-json_graph.json"),
    d3.json("./ges_json/dtward2-json_graph.json"),
    d3.json("./ges_json/dwthread-json_graph.json"),
    d3.json("./ges_json/eapitts-json_graph.json"),
    d3.json("./ges_json/erbanks-json_graph.json"),
    d3.json("./ges_json/fgould-json_graph.json"),
    d3.json("./ges_json/gabackus-json_graph.json"),
    d3.json("./ges_json/gkennedy-json_graph.json"),
    d3.json("./ges_json/glzilnik-json_graph.json"),
    d3.json("./ges_json/godwin-json_graph.json"),
    d3.json("./ges_json/haddad-json_graph.json"),
    d3.json("./ges_json/hbpatisa-json_graph.json"),
    d3.json("./ges_json/hjburrac-json_graph.json"),
    d3.json("./ges_json/hwsedero-json_graph.json"),
    d3.json("./ges_json/jadelbor-json_graph.json"),
    d3.json("./ges_json/jahoppin-json_graph.json"),
    d3.json("./ges_json/jallen-json_graph.json"),
    d3.json("./ges_json/japiedra-json_graph.json"),
    d3.json("./ges_json/jbr-json_graph.json"),
    d3.json("./ges_json/jbrumos-json_graph.json"),
    d3.json("./ges_json/jegoodwi-json_graph.json"),
    d3.json("./ges_json/jfbaltze-json_graph.json"),
    d3.json("./ges_json/jfgzo-json_graph.json"),
    d3.json("./ges_json/jherkert-json_graph.json"),
    d3.json("./ges_json/jholland-json_graph.json"),
    d3.json("./ges_json/jjcisner-json_graph.json"),
    d3.json("./ges_json/jkuzma-json_graph.json"),
    d3.json("./ges_json/jmalonso-json_graph.json"),
    d3.json("./ges_json/jprober2-json_graph.json"),
    d3.json("./ges_json/jrsaah-json_graph.json"),
    d3.json("./ges_json/jswarts-json_graph.json"),
    d3.json("./ges_json/kaharwoo-json_graph.json"),
    d3.json("./ges_json/kdgriege-json_graph.json"),
    d3.json("./ges_json/kimler-json_graph.json"),
    d3.json("./ges_json/kledmist-json_graph.json"),
    d3.json("./ges_json/krgross-json_graph.json"),
    d3.json("./ges_json/kszagack-json_graph.json"),
    d3.json("./ges_json/kzering-json_graph.json"),
    d3.json("./ges_json/lamcgraw-json_graph.json"),
    d3.json("./ges_json/lrivers-json_graph.json"),
    d3.json("./ges_json/lrrawls-json_graph.json"),
    d3.json("./ges_json/lsmills-json_graph.json"),
    d3.json("./ges_json/mahaffey-json_graph.json"),
    d3.json("./ges_json/mbreiski-json_graph.json"),
    d3.json("./ges_json/mdcobb-json_graph.json"),
    d3.json("./ges_json/mdlorenz-json_graph.json"),
    d3.json("./ges_json/mdschulm-json_graph.json"),
    d3.json("./ges_json/meserr-json_graph.json"),
    d3.json("./ges_json/mgjones3-json_graph.json"),
    d3.json("./ges_json/mhreiski-json_graph.json"),
    d3.json("./ges_json/miorizz-json_graph.json"),
    d3.json("./ges_json/mjscott3-json_graph.json"),
    d3.json("./ges_json/mmbooker-json_graph.json"),
    d3.json("./ges_json/mmccord-json_graph.json"),
    d3.json("./ges_json/mnpeters-json_graph.json"),
    d3.json("./ges_json/mroe-json_graph.json"),
    d3.json("./ges_json/msjones2-json_graph.json"),
    d3.json("./ges_json/ndsingh-json_graph.json"),
    d3.json("./ges_json/nmhaenn-json_graph.json"),
    d3.json("./ges_json/phmullig-json_graph.json"),
    d3.json("./ges_json/rbarran-json_graph.json"),
    d3.json("./ges_json/rbrober2-json_graph.json"),
    d3.json("./ges_json/relmkc-json_graph.json"),
    d3.json("./ges_json/rick-json_graph.json"),
    d3.json("./ges_json/rleon-json_graph.json"),
    d3.json("./ges_json/rmberryj-json_graph.json"),
    d3.json("./ges_json/rmkelly-json_graph.json"),
    d3.json("./ges_json/rmrejesu-json_graph.json"),
    d3.json("./ges_json/ross-json_graph.json"),
    d3.json("./ges_json/rpatters-json_graph.json"),
    d3.json("./ges_json/rrdunn-json_graph.json"),
    d3.json("./ges_json/rrellan-json_graph.json"),
    d3.json("./ges_json/rsozzan-json_graph.json"),
    d3.json("./ges_json/rxvaldez-json_graph.json"),
    d3.json("./ges_json/sastauff-json_graph.json"),
    d3.json("./ges_json/shu4-json_graph.json"),
    d3.json("./ges_json/skbarnhi-json_graph.json"),
    d3.json("./ges_json/smk-json_graph.json"),
    d3.json("./ges_json/ssdhole-json_graph.json"),
    d3.json("./ges_json/tdantone-json_graph.json"),
    d3.json("./ges_json/thorne-json_graph.json"),
    d3.json("./ges_json/tkuiken-json_graph.json"),
    d3.json("./ges_json/tvreid-json_graph.json"),
    d3.json("./ges_json/vdublje-json_graph.json"),
    d3.json("./ges_json/waklobas-json_graph.json"),
    d3.json("./ges_json/wjkinsel-json_graph.json"),
    d3.json("./ges_json/wthurman-json_graph.json"),
    d3.json("./ges_json/ycheng20-json_graph.json"),
    d3.json("./ges_json/yencho-json_graph.json"),
    d3.json("./ges_json/yjcardoz-json_graph.json"),
    d3.json("./ges_json/zsbrown2-json_graph.json")
]).then(function(files) {

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
  function removeDuplicates(arr) {
    return arr.filter((item,
        index) => arr.indexOf(item) === index);
  }

  //c(data);
  let data_clean = {};
  data_clean['nodes'] = removeDuplicates(data.nodes);
  data_clean['edges'] = removeDuplicates(data.edges);
  //c(data_clean);
  chart = ForceGraph(data, {
      nodeId: d => d.key,
      nodeGroup: d => d.attributes.department,
      nodeTitle: d => `${d.attributes.name}\n${d.attributes.department}`,
      linkStrokeWidth: l => Math.sqrt(l.attributes.weight),
      width: 1200,
      height: 1200,
      // invalidation // a promise to stop the simulation when the cell is re-run
      
      
    })

  d3.select("body").node().appendChild(chart);
  document.getElementById("title").innerHTML = data.nodes[1].attributes.department;
}