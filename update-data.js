import fs from 'node:fs/promises';

const CLUB_SLUG = process.env.CLUB_SLUG || 'and-chess-for-all-1';
const CONTACT = process.env.CHESS_API_CONTACT || 'And Chess For All website maintainer';
const API = 'https://api.chess.com/pub';
const headers = { 'User-Agent': CONTACT, 'Accept': 'application/json' };

async function getJson(url){
  const res = await fetch(url, { headers });
  if(!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

function flattenMembers(data){
  const buckets = ['weekly','monthly','all_time','inactive'];
  const seen = new Map();
  for(const bucket of buckets){
    const arr = data[bucket] || [];
    for(const m of arr){
      const username = m.username || m.name;
      if(username && !seen.has(username.toLowerCase())){
        seen.set(username.toLowerCase(), { username, joined: m.joined ? new Date(m.joined*1000).toLocaleDateString('en-US') : '' });
      }
    }
  }
  return [...seen.values()].sort((a,b)=>a.username.localeCompare(b.username));
}

async function getStats(username){
  try{
    const stats = await getJson(`${API}/player/${encodeURIComponent(username)}/stats`);
    return {
      rapid: stats.chess_rapid?.last?.rating ?? null,
      blitz: stats.chess_blitz?.last?.rating ?? null,
      daily: stats.chess_daily?.last?.rating ?? null
    };
  }catch(e){
    return { rapid:null, blitz:null, daily:null };
  }
}

function matchEvents(matches){
  const out = [];
  for(const group of ['registered','in_progress','finished']){
    for(const m of matches[group] || []){
      out.push({
        name: m.name || m.title || 'Club Match',
        status: group.replace('_',' '),
        description: m.opponent ? `Opponent: ${m.opponent}` : 'Chess.com club match',
        url: m.url || m['@id'] || ''
      });
    }
  }
  return out.slice(0,12);
}

async function main(){
  const memberData = await getJson(`${API}/club/${CLUB_SLUG}/members`);
  const members = flattenMembers(memberData);
  for(let i=0; i<members.length; i++){
    members[i].ratings = await getStats(members[i].username);
    await new Promise(r => setTimeout(r, 250));
  }
  let events = [];
  try{
    const matchData = await getJson(`${API}/club/${CLUB_SLUG}/matches`);
    events = matchEvents(matchData);
  }catch(e){ events = []; }

  const data = { updatedAt: new Date().toISOString(), memberCount: members.length, events, leaderboards: { members } };
  await fs.mkdir('data', { recursive: true });
  await fs.writeFile('data/club-data.json', JSON.stringify(data, null, 2));
}

main().catch(err => { console.error(err); process.exit(1); });
