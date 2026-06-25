export const CHARACTERS = [
  {
    id: 'lorie', name: 'Lorie', color: '#e74c3c', hat: '#c0392b',
    role: 'villain', desc: 'The Saboteur',
    skill: 'SABOTAGE', skillName: 'Sabotage', skillDesc: 'Cut electricity — halts all task progress (E to kill when near someone)',
    skillCooldown: 1,
  },
  {
    id: 'aella', name: 'Aella', color: '#8e44ad', hat: '#6c3483',
    role: 'crewmate', desc: 'The Judge',
    skill: 'INSTANT_REVIEW', skillName: 'Emergency Review', skillDesc: 'Call a review without finding a body',
    skillCooldown: 3,
  },
  {
    id: 'josh', name: 'Josh', color: '#e67e22', hat: '#ca6f1e',
    role: 'crewmate', desc: 'The Scanner',
    skill: 'SCAN', skillName: 'Scan', skillDesc: 'Scan a player — 3 scans confirm Lorie',
    skillCooldown: 1,
  },
  {
    id: 'ysa', name: 'Ysa', color: '#27ae60', hat: '#1e8449',
    role: 'crewmate', desc: 'The Swift',
    skill: 'FAST_TASK', skillName: 'Turbo Mode', skillDesc: 'Boost current room task progress',
    skillCooldown: 2,
  },
  {
    id: 'kai', name: 'Kai', color: '#f39c12', hat: '#d68910',
    role: 'double_agent', desc: 'Double Agent',
    skill: 'CHOOSE_SIDE', skillName: 'Allegiance', skillDesc: 'Choose to ally with Lorie or crewmates',
    skillCooldown: 0,
  },
  {
    id: 'yuki', name: 'Yuki', color: '#1abc9c', hat: '#148f77',
    role: 'crewmate', desc: 'The Watcher',
    skill: 'CCTV', skillName: 'CCTV', skillDesc: 'View a room via security camera (15s, 30s cooldown)',
    skillCooldown: 2,
  },
  {
    id: 'zero', name: 'Zero', color: '#9b59b6', hat: '#76448a',
    role: 'crewmate', desc: 'The Romantic',
    skill: 'FLOWER', skillName: 'Send Flower', skillDesc: 'Send flower to Lorie — if accepted, join villain team',
    skillCooldown: 0,
  },
  {
    id: 'synth', name: 'Synth', color: '#3498db', hat: '#2874a6',
    role: 'crewmate', desc: 'The Observer',
    skill: 'CCTV_MSG', skillName: 'Broadcast', skillDesc: 'View CCTV and send a message to all players',
    skillCooldown: 2,
  },
  {
    id: 'salt', name: 'Salt', color: '#bdc3c7', hat: '#95a5a6',
    role: 'crewmate', desc: 'The Shadow',
    skill: 'NO_FOG', skillName: 'Fog Sight', skillDesc: 'Passive: No fog of war — you always see the full map',
    skillCooldown: 0,
  },
  {
    id: 'ela', name: 'Ela', color: '#2ecc71', hat: '#229954',
    role: 'crewmate', desc: 'The Messenger',
    skill: 'BROADCAST', skillName: 'Message All', skillDesc: 'Send an anonymous message to all players',
    skillCooldown: 2,
  },
  {
    id: 'alaska', name: 'Alaska', color: '#5850EC', hat: '#8580EC',
    role: 'crewmate', desc: 'The Traveler',
    skill: 'TELEPORT', skillName: 'Teleport', skillDesc: 'Teleport to any portal on the map',
    skillCooldown: 3,
  },
];
