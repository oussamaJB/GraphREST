var express = require('express');
var router = express.Router();

// Using Joi library for input validation
Joi = require('joi');
const schema = Joi.object({
  titre : Joi.string().min(3).required(),
  description : Joi.string().required(),
  condition : Joi.string().required()
});


// We will use in-memory storage in this API
// Our graph will be an array of nodes, each node has a unique ID
let graph = [];
let cur_id=0;

// returns the index of the node with the given ID
function search(node_id){
  for (let i=0;i<graph.length;++i){
    if(graph[i].id===node_id){
      return i;
    }
  }
  return -1;
}

// returns true if expression is a valid condition for a node
function check_condition(expression){
  const tokens = expression.split(' ');
  // only expressions with an odd number of tokens can be valid
  if(tokens.length%2===0&&(tokens.length!==0)) return false;

  for(let i=0;i<tokens.length;++i){
    // tokens at odd positions should be AND/Or, tokens at even positions should be variables
    if(i%2){
      if(tokens[i]!=="AND"&&tokens[i]!=="OR") return false;
    }else{
      if(tokens[i][0]!=='$') return false;
    }
  }
  return true;
}

// Get a node by ID
router.get('/node/:id',(req,res) => {
  const node_index = search(Number(req.params.id));
  if(node_index===-1){
    res.status(404);
    res.send({"error":"le noeud demandé n'existe pas"});
  }else{
    res.status(200);
    res.send(graph[node_index]);
  }
})

// Creates a new node
router.post('/node',(req,res) => {
  let valid = schema.validate(req.body);
  let cond_valid = false;
  // checks if the form is valid
  if(!valid.hasOwnProperty('error')){
    // checks if the condition is valid
    if(check_condition(req.body.condition)){
      // creating the node and adding it to the graph
      const node = {
        id : cur_id++,
        titre: req.body.titre,
        description : req.body.description,
        condition : req.body.condition,
        list_adj : []
      }
      graph.push(node);
      res.status(200);
      res.send(node);
    }else{
      res.status(400);
      res.send({"error" : "invalid condition"});
    }
  }else{
    res.status(400);
    res.send({"error" : valid.error.details[0].message});
  }
})

// Updates an existing node
router.put('/node/:id',(req,res) => {
  const node_index = search(Number(req.params.id));
  // checks if node exists
  if(node_index===-1){
    res.status(404);
    res.send({"error":"le noeud demandé n'existe pas"});
  }else{
    // checks if the data is valid
    let check=true;
    if(req.body.hasOwnProperty('titre')){
      if(req.body.titre.length<3) check=false;
    }
    if(req.body.hasOwnProperty('condition')){
      if(check_condition(req.body.condition)){
        graph[node_index].condition = req.body.condition;
      }else check = false;
    }

    if(check){
      // updates the node
      if(req.body.hasOwnProperty('titre')) graph[node_index].titre = req.body.titre;
      if(req.body.hasOwnProperty('description')) graph[node_index].description = req.body.description;
      if(req.body.hasOwnProperty('condition')) graph[node_index].condition = req.body.condition;
      res.status(200);
      res.send(graph[node_index]);
    }else{
      res.status(400);
      res.send({"error" : "les données entrées ne sont pas valides"});
    }
  }
})

// Deletes a node by ID
router.delete('/node/:id',(req,res) => {
  const node_index = search(Number(req.params.id));
  // checks if node exists
  if(node_index===-1){
    res.status(404);
    res.send({"error" : "le noeud demandé n'existe pas"});
  }else{
    graph.splice(node_index,1);
    res.status(200);
    res.send();
  }
})

// Creates a link from source node to destination node
router.get('/connect/:id_src/:id_dest',(req,res) => {
  const node1_index = search(Number(req.params.id_src));
  const node2_index = search(Number(req.params.id_dest));
  // Verifies that both nodes exist
  if(node1_index===-1||node2_index===-1){
    res.status(400);
    res.send({"error":"l'un des noeuds demandé n'existe pas"});
    // Verifies that the link doesn't exist already
  }else if (graph[node1_index].list_adj.includes(Number(req.params.id_dest))) {
    res.status(400);
    res.send({"error":"un lien entre ces deux noeuds existe déjà"});
  }else{
    // Adds the destination node's ID to the adjacency list of the source node
    graph[node1_index].list_adj.push(Number(req.params.id_dest));
    res.status(200);
    res.send(graph[node1_index]);
  }
})

// Deletes link from source node to destination node
router.delete('/connect/:id_src/:id_dest',(req,res) => {
  const node1_index = search(Number(req.params.id_src));
  const node2_index = search(Number(req.params.id_dest));
  // Verifies the existence of the two nodes
  if(node1_index===-1||node2_index===-1){
    res.status(400);
    res.send({"error":"l'un des noeuds n'existe pas"});
    // Verifies the existence of the link between the two nodes
  }else if(graph[node1_index].list_adj.includes(Number(req.params.id_dest))){
    graph[node1_index].list_adj.splice(graph[node1_index].list_adj.indexOf(Number(req.params.id_dest)),1);
    res.status(200);
    res.send();
  }else{
    res.status(400);
    res.send({"error":"ce lien n'existe pas"});
  }
})

// Returns the shortest path from node 1 to node 2
function shortest_path(node1,node2){
  if(node1===node2) return 0;
  // Since the graph is not weighted, we don't need to use Dijkstra or a similar algorithm
  // We can get the shortest path simply by doing a breadth first search

  // we will put the node to traverse in a queue
  let queue = [];
  queue.push([node1,0]);
  // keeps track of the visited node during graph traversal
  let visited = new Array(graph.length).fill(false);

  while (queue.length!==0){
    let node=graph[queue[0][0]];
    let dist=queue[0][1];
    queue.shift();
    for(let i=0;i<node.list_adj.length;++i){
      // gets the index of the node
      let neighbor = search(node.list_adj[i]);
      // verifies that node exists
      if(neighbor===-1) continue;
      // verifies that node is not visited
      if(visited[neighbor]===false){
        visited[neighbor]=true;
        queue.push([neighbor,dist+1]);
      }
      // returns the distance if  destination is reached
      if(neighbor===node2){
        return dist+1;
      }
    }
  }
  // returns -1 if the destination is never reached
  return -1;
}

// returns the shortest path from source node to destination node
router.get('/shortest-path/:id_src/:id_dest',(req,res) => {
  const node1_index = search(Number(req.params.id_src));
  const node2_index = search(Number(req.params.id_dest));
  // Verifies the existence of the two nodes
  if(node1_index===-1||node2_index===-1){
    res.status(400);
    res.send({"error" : "l'un des noeuds demandés n'existe pas"});
  }else{
    let shortest_path_dist = shortest_path(node1_index,node2_index);
    // Verifies the existence of the path
    if(shortest_path_dist===-1){
      res.status(400);
      res.send({"error" : "il n'existe aucun chemin entre les deux noeuds"});
    }else{
      res.status(200);
      res.send({"distance":shortest_path_dist });
    };

  }
})

// a depth-first search to detect cycles in the graph
function dfs(node,traversed,state,cycles){
  // traversed : list of the nodes traversed until we reached the current node
  // state : describes the state of a node : 0 -> unvisited |  1 -> visited | 2 -> visited but the DFS didn't finish yet
  // cycles : a list of the cycles in the graph

  // checks if DFS is still running on the given node
  if(state[node]===2){
    // since the node is revisited, we discovered a cycle
    let cycle = [graph[node].id];
    // backtracking until we reach the current node
    let cur = traversed.length-1;
    while (traversed[cur]!==node){
      cycle.push(graph[traversed[cur]].id);
      cur--;
    }
    cycle.push(graph[node].id);
    // adding the cycle to the list of cycles
    cycles.push(cycle.reverse());
  }else{
    // if not traversed, the node is unvisited (since we check from visited nodes) and we should initiate a dfs recursively

    // marks the node as currently being traversed
    state[node]=2;
    traversed.push(node);
    // checks adjacent nodes
    for(let i=0;i<graph[node].list_adj.length;++i){
      let node_index = search(graph[node].list_adj[i]);
      if(node_index===-1) continue;
      // if the node is unvisited, recursive dfs call
      if(state[node_index]!==1) dfs(node_index,traversed,state,cycles);
    }
    // pops the node since the dfs is over
    traversed.pop();
    // marks the node as visited
    state[node]=1;
  }

}

// Gets the cycles of the graph
router.get('/cycles',(req,res) => {
  //graph = [{id:5,list_adj: [6,7]},{id:6,list_adj: [7,8]},{id:7,list_adj: [6,8]},{id:8,list_adj: [5,9]},{id:9,list_adj: []}];

  // initializing the nodes as unvisited
  let state = new Array(graph.length).fill(0);
  let traversed = [];
  let cycles = [];
  for(let i=0;i<graph.length;++i){
    if(state[i]===0){
      dfs(i,traversed,state,cycles);
    }
  }
  res.status(200);
  res.send(cycles);
})

module.exports = router;
