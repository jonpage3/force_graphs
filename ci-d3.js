$(document).ready(function () {
  $("#external").hide();
  $("#inactive").hide();
  $("#force").hide();
  $("#external").attr('value','data-selected');
  $("#force").attr("value","graph-selected");

var unit_name = document.getElementById('unit_name').textContent;

const c = console.log.bind(document);

function ForceGraph ({
    nodes,
    edges
}, {
    nodeId = d => d.key,
    nodeGroup, //maybe something like d.department
    nodeGroups, //an array of ordinal values representing the groups
    nodeTitle, //name
    nodeKey,
    nodeFill = "currentColor", // node stroke fill (if not using a group color encoding)
    nodeStroke = "#fff", // node stroke color
    nodeStrokeWidth = 1.5, // node stroke width, in pixels
    nodeStrokeOpacity = 1, // node stroke opacity
    nodeRadius = 5, // node radius, in pixels
    nodeStrength,
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


    d3.selectAll("svg").remove();

    const N = d3.map(nodes, nodeId).map(intern);
    //c(N);
    const LS = d3.map(edges, linkSource).map(intern);
    //c(LS)
    const LT = d3.map(edges, linkTarget).map(intern);
    //c(LT);
    if (nodeTitle === undefined) nodeTitle = (_, i) => N[i];
    const T = nodeTitle == null ? null : d3.map(nodes, nodeTitle);
    //c(T);
    const K = nodeKey == null ? null : d3.map(nodes, nodeKey);
    //c(K);
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


    const simulation = d3.forceSimulation(nodes)
      .force("link", forceLink)
      .force("charge", forceNode)
      .force("center",  d3.forceCenter())
      .on("tick", ticked);

    const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width/2,-height/2, width, height*1.2])
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
      .attr("r", nodeRadius);
      //.call(drag(simulation));

    if (W) edge.attr("stroke-width", ({index: i}) => W[i]);
    if (L) edge.attr("stroke", ({index: i}) => L[i]);
    if (G) node.attr("fill", ({index: i}) => color(G[i]));
    if (T) node.append("title").text(({index: i}) => T[i]);
    if (K) node.attr("key",({index: i}) => K[i]);
    if (invalidation != null) invalidation.then(() => simulation.stop());

    // Add the highlighting functionality
    node
      .on('mouseover', function (d) {
        var source_id = d3.select(this).attr("key");
        target_array = [];
        edges.forEach(function(i) {
          if (i.source.id == source_id || i.target.id == source_id) {
            target_array.push(i.target.id);
            target_array.push(i.source.id);
          }
        })
        node.attr('fill', function(d) {
          if (target_array.includes(d.id)) {
            return color(G[nodes.indexOf(d)]);
        }
        else {
          return "#B8B8B8";
        }})
    
        d3.select(this).attr('fill', ({index: i}) => color(G[i]))
        edge
          .attr('stroke', function (edge_d) { 
            return edge_d.source.id === source_id || edge_d.target.id === source_id ? '#69b3b2' : '#b8b8b8';
          })
          .attr('stroke-width', function (edge_d) { 
            return edge_d.source.id === source_id || edge_d.target.id === source_id ? 4 : 1;
          })
      })
      .on('mouseout', function (d) {
        node.attr('fill', ({index: i}) => color(G[i]))
        edge
          .attr('stroke', typeof linkStroke !== "function" ? linkStroke : nullck)
          .style('stroke-width', typeof linkStrokeWidth !== "function" ? linkStrokeWidth : null)
      })

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

// function for displaying Circular graphs 

function CircularGraph ({
  nodes, 
  edges
}, {
  nodeId = d => d.key,
  nodeGroup, //maybe something like d.department
  nodeGroups, //an array of ordinal values representing the groups
  nodeTitle, //name
  nodeKey,
  nodeFill = "currentColor", // node stroke fill (if not using a group color encoding)
  nodeStroke = "#fff", // node stroke color
  nodeStrokeWidth = 1.5, // node stroke width, in pixels
  nodeStrokeOpacity = 1, // node stroke opacity
  nodeRadius = 5, // node radius, in pixels
  nodeStrength,
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
} = {}) {

  d3.selectAll("svg").remove();
  
  //c(nodes);
  //c(edges);
  
  const N = d3.map(nodes, nodeId).map(intern);
  
  const LS = d3.map(edges, linkSource).map(intern);

  const LT = d3.map(edges, linkTarget).map(intern);

  const T = nodeTitle == null ? null : d3.map(nodes, nodeTitle);

  const angleSlice = Math.PI*2 / nodes.length;

  const K = nodeKey == null ? null : d3.map(nodes, nodeKey);

  const G = nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);

  const W = typeof linkStrokeWidth !== "function" ? null : d3.map(edges, linkStrokeWidth);
  const L = typeof linkStroke !== "function" ? null : d3.map(edges, linkStroke);
  
  nodes = d3.map(nodes, (_, i) => ({id: N[i]}));
  edges = d3.map(edges, (_, i) => ({source: LS[i], target: LT[i]}));
  //c(nodes);
  //c(edges);
  // Compute default domains.
  if (G && nodeGroups === undefined) nodeGroups = d3.sort(G);
  const color = nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);

  const forceLink = d3.forceLink(edges).id(({index: i}) => N[i]);


  const simulation = d3.forceSimulation(nodes)
      .force("link", forceLink)
      //.force("charge", forceNode)
      .force("center",  d3.forceCenter())
      .on("tick", ticked);

  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width/2,-height/2, width, height*1.2])
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  
  const outer_circle = svg.append("circle")
      //.attr("height",height*.8)
      //.attr("width",width*.8)
      .attr("r",height/2)
      .attr("cx",width/10)
      .attr("cy",height/10)
      .attr("stroke","grey")
      .attr("stroke-width",30)
      .attr("fill","white");
  
  const edge = svg.append("g")
      .attr("transform","translate(120,80)")
      .attr("stroke", typeof linkStroke !== "function" ? linkStroke : null)
      .attr("stroke-opacity", linkStrokeOpacity)
      .attr("stroke-width", typeof linkStrokeWidth !== "function" ? linkStrokeWidth : null)
      .attr("stroke-linecap", linkStrokeLinecap)
      .selectAll("line")
      .data(edges)
      .join("line");

    const node = svg.append("g")
      .attr("transform","translate(120,80)")
      .attr("fill", nodeFill)
      .attr("stroke", nodeStroke)
      .attr("stroke-opacity", nodeStrokeOpacity)
      .attr("stroke-width", nodeStrokeWidth)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", nodeRadius);

    if (G) node.attr("fill", ({index: i}) => color(G[i]));
    if (T) node.append("title").text(({index: i}) => T[i]);
    if (K) node.attr("key",({index: i}) => K[i]);

    // Add the highlighting functionality
    node
      .on('mouseover', function (d) {
        var source_id = d3.select(this).attr("key");
        target_array = [];
        edges.forEach(function(i) {
          if (i.source.id == source_id || i.target.id == source_id) {
            target_array.push(i.target.id);
            target_array.push(i.source.id);
          }
        })
        node.attr('fill', function(d) {
          if (target_array.includes(d.id)) {
            return color(G[nodes.indexOf(d)])
        }
        else {
          return "#B8B8B8";
        }})

        d3.select(this).attr('fill', ({index: i}) => color(G[i]))
        // Highlight the edges
        edge
          .attr('stroke', function (edge_d) { 
            return edge_d.source.id === source_id || edge_d.target.id === source_id ? '#69b3b2' : '#b8b8b8';
          })
          .attr('stroke-width', function (edge_d) { 
            return edge_d.source.id === source_id || edge_d.target.id === source_id ? 4 : 1;
          })
      })
      .on('mouseout', function (d) {
        node.attr('fill', ({index: i}) => color(G[i]))
        edge
          .attr('stroke', typeof linkStroke !== "function" ? linkStroke : nullck)
          .style('stroke-width', typeof linkStrokeWidth !== "function" ? linkStrokeWidth : null)
      })
      

    function ticked() {
      edge
          .attr("x1", d => ((height/2)) * Math.cos(angleSlice*nodes.indexOf(d.source)))
          .attr("y1", d => ((height/2)) * Math.sin(angleSlice*nodes.indexOf(d.source)))
          .attr("x2", d => ((height/2)) * Math.cos(angleSlice*nodes.indexOf(d.target)))
          .attr("y2", d => ((height/2)) * Math.sin(angleSlice*nodes.indexOf(d.target)));
      
      node
          .attr("cx", d => ((height/2)) * Math.cos(angleSlice*nodes.indexOf(d)))
          .attr("cy", d => ((height/2)) * Math.sin(angleSlice*nodes.indexOf(d)));
    }

  return Object.assign(svg.node());
  
}

// Load Data
Promise.all([
    d3.json("./aif_json/rgarcia-json_graph.json"),
    d3.json("./aif_json/czhou-json_graph.json"),
    d3.json("./aif_json/dgriffis-json_graph.json"),
    d3.json("./aif_json/fastevie-json_graph.json"),
    d3.json("./aif_json/docsem-json_graph.json"),
    d3.json("./aif_json/2405-json_graph.json"),
    d3.json("./aif_json/3092-json_graph.json"),
    d3.json("./aif_json/3407-json_graph.json"),
    d3.json("./aif_json/3782-json_graph.json"),
    d3.json("./aif_json/3963-json_graph.json"),
    d3.json("./aif_json/4796-json_graph.json"),
    d3.json("./aif_json/6000-json_graph.json"),
    d3.json("./aif_json/6309-json_graph.json")

]).then(function(files) {
    // files[0] will contain file1.csv
    // console.log(files[0]);
    // console.log(files[1]);
    const data = files[0];
    /*files[1].nodes.forEach(elem => data.nodes.push(elem));
    files[1].edges.forEach(elem => data.edges.push(elem));
    files[2].nodes.forEach(elem => data.nodes.push(elem));*/
    let i = 1;

    while (i < files.length) {
        files[i].nodes.forEach(elem => data.nodes.push(elem));
        files[i].edges.forEach(elem => data.edges.push(elem));
        i++;
    }
    
    render(data,null,"force");
    
    // buttons that control 
    // the filtering and layouts
    // filter button logic
    $("#ncstate").click(function (e) {
      $("button[type='filter']").attr('value','')
      $(this).hide();
      $(this).attr('value','data-selected');
      $("#inactive").hide();
      $("#external").show();
      $('#unit').show();
      $("#active").show()

      $("button").each(function(){
        if ($(this).attr('value') === "graph-selected") {
          var graph_sel = $(this).attr('id');
          render(data,"ncstate",graph_sel);
        };
      })

    });

    $("#external").click (function(e) {
      $("button[type='filter']").attr('value','')
      $(this).hide();
      $(this).attr('value','data-selected');
      $("#inactive").hide();
      $("#ncstate").show();
      $("#unit").show();
      $("#active").show()
      
      $("button").each(function(){
        if ($(this).attr('value') === "graph-selected") {
          var graph_sel = $(this).attr('id');
          render(data,null,graph_sel);
        };
      })
    })

    $('#unit').click (function(e) {
      $("button[type='filter']").attr('value','')
      $(this).hide();
      $(this).attr('value','data-selected');
      $("#inactive").hide();
      $("#ncstate").show();
      $("#external").show();
      $("#active").show()
     
      $("button").each(function(){
        if ($(this).attr('value') === "graph-selected") {
          var graph_sel = $(this).attr('id');
          render(data,"unit",graph_sel);
        };
      })
    })

    $('#active').click (function(e) {
      $("button[type='filter']").attr('value','')
      $(this).hide();
      $(this).attr('value','data-selected');
      $("#external").hide();
      $("#ncstate").show();
      $("#inactive").show();
      $("#unit").show();
      
      $("button").each(function(){
        if ($(this).attr('value') === "graph-selected") {
          var graph_sel = $(this).attr('id');
          render(data,"active",graph_sel);
        };
      })
    })

    $("#inactive").click (function(e) {
      $("button[type='filter']").attr('value','')
      $(this).hide();
      $(this).attr('value','data-selected');
      $("#external").hide();
      $("#ncstate").show();
      $("#active").show();
      $("#unit").show();
      
      $("button").each(function(){
        if ($(this).attr('value') === "graph-selected") {
          var graph_sel = $(this).attr('id');
          render(data,null,graph_sel);
        };
      })
    })
    
    //layout button logic
    $("#circular").click (function(e) {
      $("button[type=layout]").attr("value","");
      $(this).hide();
      $("#force").show();
      $(this).attr('value','graph-selected');
      // insert some logic here about using the value selected
      $("button").each(function(){
        if ($(this).attr('value') === "data-selected") {
          var data_sel = $(this).attr('id');
          render(data,data_sel,"circular");
        };
      })

    })

    $("#force").click (function(e) {
      $("button[type=layout]").attr("value","");
      $(this).hide();
      $("#circular").show();
      $(this).attr('value','graph-selected');

      // insert some logic here about to determin which id has data-selected value
      //render(data,null,"force");
      $("button").each(function(){
        if ($(this).attr('value') === "data-selected") {
          var data_sel = $(this).attr('id');
          render(data,data_sel,"force");
        };
      })
    })

  }).catch(function(err) {
    // handle error here
})



function render(data,filter,layout) {

  function getUniqueListBy(arr, key) {
    return [...new Map(arr.map(item => [item[key], item])).values()]
  }

  //DATA FILTERING
  // filter array
  let data_filtered = {nodes: [], edges: []};

  if (filter == "ncstate") {
    data.nodes.forEach(function(i)
    {
      //c(i);
      if (i.attributes["ncsu?"]){
        data_filtered.nodes.push(i);
      }
    })
    // needs refactoring but just trying to implement basics
    // method of checking targets are ncsu as well
    let ncsu_uids = [];
    data_filtered.nodes.forEach(function(d) {ncsu_uids.push(d.key);});
    
    data_filtered['edges'] = data.edges.filter(edge => ncsu_uids.includes(edge.target) && ncsu_uids.includes(edge.source));
    /*
    data.edges.forEach(function(i)
    {
      //c(i);
      if (i.attributes["ncsu?"] && ncsu_uids.includes(i.target)){
        data_filtered.edges.push(i);
      }
    })*/
    
  }
  else if (filter == "unit") {
    //grab the nodes
    data.nodes.forEach(function(i)
    {
      //c(i);
      if (i.attributes["ncsu_affiliations"] && i.attributes['ncsu_affiliations'].length > 0 && i.attributes['ncsu_affiliations'].includes(unit_name)){
        data_filtered.nodes.push(i);
      }
    })
    //grab the edges
    // needs refactoring but just trying to implement basics
    // method of checking targets are ncsu as well
    let ncsu_uids = [];
    data_filtered.nodes.forEach(function(d) {ncsu_uids.push(d.key);});

    data_filtered['edges'] = data.edges.filter(edge => ncsu_uids.includes(edge.target) && ncsu_uids.includes(edge.source));

  }
  else if (filter == "active") {
    //grab the nodes
    data.nodes.forEach(function(i)
    {
      //c(i);
      if (i.attributes["active?"]){
        data_filtered.nodes.push(i);
      }
    })

    //grab the edges
    // needs refactoring but just trying to implement basics
    // method of checking targets are ncsu as well
    let ncsu_uids = [];
    data_filtered.nodes.forEach(function(d) {ncsu_uids.push(d.key);});

    //data_filtered['edges'] = getFilteredEdges(data.edges,ncsu_uids);

    data_filtered['edges'] = data.edges.filter(edge => ncsu_uids.includes(edge.target) && ncsu_uids.includes(edge.source));

  }
  else {
    data_filtered = data;
  };
  
  // remove duplicates
  var data_clean = {};
  data_clean['nodes'] = getUniqueListBy(data_filtered.nodes,'key');
  data_clean['edges'] = data_filtered.edges;
  

  // LAYOUT

  if (layout == "force") {
    
    var chart = ForceGraph(data_clean, {
      nodeId: d => d.key,
      nodeGroup: d => d.attributes.department,
      nodeTitle: d => `${d.attributes.name}\n${d.attributes.department}`,
      nodeKey: d => `${d.key}`,
      linkStrokeWidth: l => Math.sqrt(l.attributes.weight),
      width: 1200,
      height: 800
      
    })
  }
  else if (layout == "circular") {
    var chart = CircularGraph(data_clean,{
      nodeId: d => d.key,
      nodeGroup: d => d.attributes.department,
      nodeTitle: d => `${d.attributes.name}\n${d.attributes.department}`,
      nodeKey: d => `${d.key}`,
      linkStrokeWidth: l => Math.sqrt(l.attributes.weight),
      width: 1200,
      height: 800
    })
  }

  d3.select("#vis").node().appendChild(chart);
  
}

function intern(value) {
  return value !== null && typeof value === "object" ? value.valueOf() : value;
}

});