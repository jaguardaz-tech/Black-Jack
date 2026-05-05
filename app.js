let mp = { peer:null, conns:[], isHost:false, players:[], turn:0 };
let game = { hands:[], dealer:[], deck:[] };

function createDeck(){
  const suits=['♠','♥','♦','♣'], ranks=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  let d=[];
  for(let s of suits) for(let r of ranks) d.push({s,r});
  return d.sort(()=>Math.random()-0.5);
}

function createRoom(){
  mp.isHost=true;
  mp.peer=new Peer();
  mp.peer.on('open',id=>{
    document.getElementById('info').innerHTML="Code: "+id;
    mp.players.push({id,name:getName()});
  });
  mp.peer.on('connection',c=>{
    mp.conns.push(c);
    c.on('data',d=>handle(d,c));
  });
}

function joinRoom(){
  let code=document.getElementById('code').value;
  mp.peer=new Peer();
  mp.peer.on('open',id=>{
    let c=mp.peer.connect(code);
    mp.conns=[c];
    c.on('open',()=>c.send({type:'join',name:getName()}));
    c.on('data',d=>handle(d,c));
  });
}

function handle(d,c){
  if(d.type==='join' && mp.isHost){
    mp.players.push({name:d.name});
    broadcast({type:'players',players:mp.players});
  }
  if(d.type==='players'){
    mp.players=d.players;
    startGame();
  }
  if(d.type==='action' && mp.isHost){
    if(d.action==='hit'){
      game.hands[mp.turn].push(draw());
    } else {
      mp.turn++;
    }
    sync();
  }
  if(d.type==='state'){
    game=d.game;
    render();
  }
}

function broadcast(msg){ mp.conns.forEach(c=>c.send(msg)); }

function startGame(){
  document.getElementById('menu').style.display='none';
  document.getElementById('game').style.display='block';
  game.deck=createDeck();
  game.hands=mp.players.map(()=>[draw(),draw()]);
  render();
}

function draw(){ return game.deck.pop(); }

function render(){
  document.getElementById('players').innerHTML=mp.players.map(p=>p.name).join(", ");
  let t=document.getElementById('table'); t.innerHTML="";
  game.hands.forEach((h,i)=>{
    let d=document.createElement('div');
    d.innerHTML="Player "+(i+1)+": "+h.map(c=>c.r+c.s).join(" ");
    t.appendChild(d);
  });
}

function sendAction(a){
  if(mp.isHost){
    handle({type:'action',action:a});
  } else {
    mp.conns[0].send({type:'action',action:a});
  }
}

function sync(){
  broadcast({type:'state',game});
  render();
}

function getName(){ return document.getElementById('name').value || "Player"; }
