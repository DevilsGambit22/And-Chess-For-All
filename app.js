const GOAL = 1000;
const dataUrl = 'data/club-data.json';
const fallback = { updatedAt: null, memberCount: 26, events: [], leaderboards: { rapid: [], blitz: [], daily: [], members: [] } };
let clubData = fallback;
let currentBoard = 'rapid';

function setText(id, text){ const el=document.getElementById(id); if(el) el.textContent=text; }
function ratingFor(player, board){ return player?.ratings?.[board] ?? player?.[board] ?? null; }
function playerName(p){ return p.username || p.name || 'Unknown'; }
function profileLink(username){ return `https://www.chess.com/member/${encodeURIComponent(username)}`; }

async function loadData(){
  try{
    const res = await fetch(dataUrl, {cache:'no-store'});
    if(!res.ok) throw new Error('No data file yet');
    clubData = await res.json();
  }catch(err){
    clubData = fallback;
  }
  renderMemberGoal();
  renderEvents();
  renderLeaderboard(currentBoard);
}

function renderMemberGoal(){
  const count = clubData.memberCount || clubData.leaderboards?.members?.length || 26;
  const pct = Math.min(100, (count/GOAL)*100);
  setText('member-count-label', `${count} / ${GOAL}`);
  const bar = document.getElementById('member-progress');
  if(bar) bar.style.width = `${pct}%`;
  setText('last-updated', clubData.updatedAt ? `Last updated: ${new Date(clubData.updatedAt).toLocaleString()}` : 'Showing starter data until the updater runs.');
}

function renderEvents(){
  const wrap = document.getElementById('events-list');
  if(!wrap) return;
  const events = clubData.events || [];
  if(!events.length){
    wrap.innerHTML = `<article class="card"><h3>Club Events</h3><p>No public club matches/events found yet. Use the buttons above to check Chess.com directly.</p></article>`;
    return;
  }
  wrap.innerHTML = events.map(e => `<article class="card"><h3>${e.name || 'Club Event'}</h3><p>${e.status || ''}</p><p>${e.description || ''}</p>${e.url ? `<a class="btn primary" href="${e.url}" target="_blank">View on Chess.com</a>` : ''}</article>`).join('');
}

function renderLeaderboard(board){
  const head = document.getElementById('leaderboard-head');
  const body = document.getElementById('leaderboard-body');
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.board === board));
  const members = clubData.leaderboards?.members || [];
  let rows = [];
  if(board === 'members'){
    head.innerHTML = '<tr><th>#</th><th>Player</th><th>Joined</th><th>Rapid</th><th>Blitz</th><th>Daily</th></tr>';
    rows = members.map((p,i)=>`<tr><td>${i+1}</td><td><a href="${profileLink(playerName(p))}" target="_blank">${playerName(p)}</a></td><td>${p.joined || ''}</td><td>${ratingFor(p,'rapid') ?? '-'}</td><td>${ratingFor(p,'blitz') ?? '-'}</td><td>${ratingFor(p,'daily') ?? '-'}</td></tr>`);
  }else{
    const ranked = [...members].filter(p => ratingFor(p, board)).sort((a,b)=>(ratingFor(b, board)||0)-(ratingFor(a, board)||0));
    head.innerHTML = `<tr><th>#</th><th>Player</th><th>${board[0].toUpperCase()+board.slice(1)} Elo</th><th>Joined</th></tr>`;
    rows = ranked.map((p,i)=>`<tr><td>${i+1}</td><td><a href="${profileLink(playerName(p))}" target="_blank">${playerName(p)}</a></td><td>${ratingFor(p, board)}</td><td>${p.joined || ''}</td></tr>`);
  }
  body.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="6">No rating data yet. The GitHub updater will fill this in.</td></tr>';
}

document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => { currentBoard = btn.dataset.board; renderLeaderboard(currentBoard); }));
loadData();
