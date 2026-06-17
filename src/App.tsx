import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Gavel,
  Volume2,
  VolumeX,
  Undo2,
  RefreshCcw,
  Search,
  Users,
  Check,
  X,
  Shuffle,
  Coins,
  AlertCircle,
  Plus,
  Minus,
  Shield,
  Trash2,
  ChevronDown,
  ChevronUp,
  Edit,
  Camera
} from 'lucide-react';

// ============================================================
//  TYPES
// ============================================================
interface Player {
  id: number;
  name: string;
  pos: string;
  isGK: boolean;
  status: 'available' | 'sold' | 'unsold';
  soldTo: number | null;
  soldPrice: number | null;
  photoUrl?: string;
}

interface TeamRosterItem {
  playerId: number;
  price: number;
}

interface Team {
  id: number;
  name: string;
  abbr: string;
  color: string;
  bg: string;
  budget: number;
  roster: TeamRosterItem[];
  hasGK: boolean;
}

interface LogEntry {
  id: string;
  msg: string;
  type: 'info' | 'bid' | 'sold' | 'unsold' | 'reset' | 'undo' | 'adjust';
  time: string;
}

interface PlayerStat {
  label: string;
  val: number;
}

// ============================================================
//  CONSTANTS
// ============================================================
const PLAYERS_INIT: Omit<Player, 'status' | 'soldTo' | 'soldPrice'>[] = [
  // Goalkeepers (6)
  { id: 1, name: 'Manuel Neuer', pos: 'GK', isGK: true },
  { id: 2, name: 'Alisson Becker', pos: 'GK', isGK: true },
  { id: 3, name: 'Thibaut Courtois', pos: 'GK', isGK: true },
  { id: 4, name: 'Ederson Moraes', pos: 'GK', isGK: true },
  { id: 5, name: 'Marc-André ter Stegen', pos: 'GK', isGK: true },
  { id: 6, name: 'Gianluigi Donnarumma', pos: 'GK', isGK: true },
  // Defenders (14)
  { id: 7, name: 'Virgil van Dijk', pos: 'CB', isGK: false },
  { id: 8, name: 'Rúben Dias', pos: 'CB', isGK: false },
  { id: 9, name: 'Marquinhos', pos: 'CB', isGK: false },
  { id: 10, name: 'Achraf Hakimi', pos: 'RB', isGK: false },
  { id: 11, name: 'Trent Alexander-Arnold', pos: 'RB', isGK: false },
  { id: 12, name: 'Andrew Robertson', pos: 'LB', isGK: false },
  { id: 13, name: 'Theo Hernández', pos: 'LB', isGK: false },
  { id: 14, name: 'Antonio Rüdiger', pos: 'CB', isGK: false },
  { id: 15, name: 'Milan Škriniar', pos: 'CB', isGK: false },
  { id: 16, name: 'Raphaël Varane', pos: 'CB', isGK: false },
  { id: 17, name: 'João Cancelo', pos: 'RB', isGK: false },
  { id: 18, name: 'Reece James', pos: 'RB', isGK: false },
  { id: 19, name: 'Lucas Hernández', pos: 'CB', isGK: false },
  { id: 20, name: 'Aymeric Laporte', pos: 'CB', isGK: false },
  // Midfielders (14)
  { id: 21, name: 'Kevin De Bruyne', pos: 'CM', isGK: false },
  { id: 22, name: 'Luka Modrić', pos: 'CM', isGK: false },
  { id: 23, name: 'Casemiro', pos: 'DM', isGK: false },
  { id: 24, name: 'Fede Valverde', pos: 'CM', isGK: false },
  { id: 25, name: 'Jude Bellingham', pos: 'CM', isGK: false },
  { id: 26, name: 'Rodri Hernández', pos: 'DM', isGK: false },
  { id: 27, name: 'Toni Kroos', pos: 'CM', isGK: false },
  { id: 28, name: 'Paul Pogba', pos: 'CM', isGK: false },
  { id: 29, name: "N'Golo Kanté", pos: 'DM', isGK: false },
  { id: 30, name: 'Bruno Fernandes', pos: 'AM', isGK: false },
  { id: 31, name: 'Bernardo Silva', pos: 'AM', isGK: false },
  { id: 32, name: 'Phil Foden', pos: 'AM', isGK: false },
  { id: 33, name: 'Pedri González', pos: 'CM', isGK: false },
  { id: 34, name: 'Gavi Páez', pos: 'CM', isGK: false },
  // Forwards (14)
  { id: 35, name: 'Erling Haaland', pos: 'ST', isGK: false },
  { id: 36, name: 'Kylian Mbappé', pos: 'ST', isGK: false },
  { id: 37, name: 'Vinicius Jr.', pos: 'LW', isGK: false },
  { id: 38, name: 'Mohamed Salah', pos: 'RW', isGK: false },
  { id: 39, name: 'Neymar Jr.', pos: 'LW', isGK: false },
  { id: 40, name: 'Robert Lewandowski', pos: 'ST', isGK: false },
  { id: 41, name: 'Harry Kane', pos: 'ST', isGK: false },
  { id: 42, name: 'Lionel Messi', pos: 'RW', isGK: false },
  { id: 43, name: 'Cristiano Ronaldo', pos: 'ST', isGK: false },
  { id: 44, name: 'Sadio Mané', pos: 'LW', isGK: false },
  { id: 45, name: 'Raphinha', pos: 'RW', isGK: false },
  { id: 46, name: 'Richarlison', pos: 'ST', isGK: false },
  { id: 47, name: 'Dusan Vlahović', pos: 'ST', isGK: false },
  { id: 48, name: 'Darwin Núñez', pos: 'ST', isGK: false },
];

const TEAMS_INIT: Omit<Team, 'budget' | 'roster' | 'hasGK'>[] = [
  { id: 0, name: 'Galácticos FC', abbr: 'GFC', color: '#10b981', bg: 'rgba(16,185,129,0.12)' }, // Emerald
  { id: 1, name: 'Red Devils United', abbr: 'RDU', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' }, // Red
  { id: 2, name: 'City of Champions', abbr: 'COC', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' }, // Cyan
  { id: 3, name: 'Golden Eagles', abbr: 'GEA', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' }, // Gold/Amber
  { id: 4, name: 'Titans SC', abbr: 'TSC', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' }, // Purple
  { id: 5, name: 'Phoenix Rising', abbr: 'PHX', color: '#f97316', bg: 'rgba(249,115,22,0.12)' }, // Orange
];

const BASE_BUDGET = 200;
const GK_BASE = 20;
const FIELD_BASE = 10;
const BID_INCREMENT = 5;
const MAX_SQUAD = 8;
const STORAGE_KEY = 'bsl_auction_save_v1';

// ============================================================
//  STABLE STATS GENERATOR FOR FUT CARD
// ============================================================
function getPlayerStats(name: string, pos: string): PlayerStat[] {
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  const seed = sum % 10;

  if (pos === 'GK') {
    return [
      { label: 'DIV', val: 82 + (seed % 9) },
      { label: 'HAN', val: 80 + ((seed + 2) % 9) },
      { label: 'KIC', val: 78 + ((seed + 4) % 11) },
      { label: 'REF', val: 84 + ((seed + 6) % 7) },
      { label: 'SPD', val: 50 + ((seed + 1) % 15) },
      { label: 'POS', val: 81 + ((seed + 3) % 9) }
    ];
  }

  const isDef = ['CB', 'RB', 'LB'].includes(pos);
  const isMid = ['CM', 'DM', 'AM'].includes(pos);

  const pac = isDef ? 72 + (seed % 10) : isMid ? 75 + (seed % 12) : 84 + (seed % 14);
  const sho = isDef ? 45 + (seed % 12) : isMid ? 72 + (seed % 15) : 83 + (seed % 12);
  const pas = isDef ? 65 + (seed % 10) : isMid ? 83 + (seed % 12) : 75 + (seed % 15);
  const dri = isDef ? 64 + (seed % 12) : isMid ? 82 + (seed % 10) : 85 + (seed % 11);
  const def = isDef ? 82 + (seed % 10) : isMid ? 65 + (seed % 12) : 30 + (seed % 12);
  const phy = isDef ? 80 + (seed % 12) : isMid ? 70 + (seed % 14) : 72 + (seed % 14);

  return [
    { label: 'PAC', val: pac },
    { label: 'SHO', val: sho },
    { label: 'PAS', val: pas },
    { label: 'DRI', val: dri },
    { label: 'DEF', val: def },
    { label: 'PHY', val: phy }
  ];
}

function getOverallRating(stats: PlayerStat[]): number {
  const sum = stats.reduce((acc, s) => acc + s.val, 0);
  return Math.round(sum / stats.length) + 4; // Add a nice premium boost
}

const AVATAR_PRESETS = [
  { name: 'Classic Striker', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&h=200&q=80' },
  { name: 'Athletic Midfielder', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&h=200&q=80' },
  { name: 'Star Forward', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&h=200&q=80' },
  { name: 'Elite Guardian', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80' },
  { name: 'Creative Playmaker', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80' },
  { name: 'Pristine Talent', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&h=200&q=80' },
  { name: 'Agile Winger', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80' },
  { name: 'Vibrant Maverick', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&h=200&q=80' },
];

export default function App() {
  // ============================================================
  //  APP STATES
  // ============================================================
  const [isViewerMode, setIsViewerMode] = useState(false);
  const presentationRef = useRef<HTMLDivElement>(null);

 const toggleFullscreenViewer = () => {
    if (!document.fullscreenElement) {
      presentationRef.current?.requestFullscreen().catch((err) => {
        console.log(`Error enabling fullscreen: ${err.message}`);
      });
      setIsViewerMode(true);
    } else {
      document.exitFullscreen();
      setIsViewerMode(false);
    }
  };
  const [pools, setPools] = useState<Player[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_pools');
    if (saved) return JSON.parse(saved);
    return PLAYERS_INIT.map(p => ({ ...p, status: 'available', soldTo: null, soldPrice: null }));
  });

  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [tempPlayerName, setTempPlayerName] = useState<string>('');
  const [tempPlayerPhoto, setTempPlayerPhoto] = useState<string>('');

  useEffect(() => {
    if (editingPlayer) {
      setTempPlayerName(editingPlayer.name);
      setTempPlayerPhoto(editingPlayer.photoUrl || '');
    } else {
      setTempPlayerName('');
      setTempPlayerPhoto('');
    }
  }, [editingPlayer]);

  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_teams');
    if (saved) return JSON.parse(saved);
    return TEAMS_INIT.map(t => ({
      ...t,
      budget: BASE_BUDGET,
      roster: [],
      hasGK: false
    }));
  });

  const [currentPlayerId, setCurrentPlayerId] = useState<number | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_currentPlayerId');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentBid, setCurrentBid] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_currentBid');
    return saved ? JSON.parse(saved) : 0;
  });

  const [currentBidderId, setCurrentBidderId] = useState<number | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_currentBidderId');
    return saved ? JSON.parse(saved) : null;
  });

  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [auditHistory, setAuditHistory] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'auction' | 'pool' | 'settings'>('auction');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterPos, setFilterPos] = useState<'all' | 'gk' | 'field'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'sold' | 'unsold'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Collapse state for commissioner manual budgets
  const [showManualBudget, setShowManualBudget] = useState<boolean>(false);
  const [showRosterManager, setShowRosterManager] = useState<Team | null>(null);

  // References for layout measuring
  const activeContainerRef = useRef<HTMLDivElement>(null);

  // Auto-save state changes to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_pools', JSON.stringify(pools));
    localStorage.setItem(STORAGE_KEY + '_teams', JSON.stringify(teams));
    localStorage.setItem(STORAGE_KEY + '_currentPlayerId', JSON.stringify(currentPlayerId));
    localStorage.setItem(STORAGE_KEY + '_currentBid', JSON.stringify(currentBid));
    localStorage.setItem(STORAGE_KEY + '_currentBidderId', JSON.stringify(currentBidderId));
    localStorage.setItem(STORAGE_KEY + '_logs', JSON.stringify(logs));
  }, [pools, teams, currentPlayerId, currentBid, currentBidderId, logs]);

  // ============================================================
  //  AUDIO CLIENT
  // ============================================================
  const playWebSynth = (type: 'bid' | 'sold' | 'nominate' | 'error' | 'bell') => {
    if (isMuted) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      if (type === 'bid') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(700, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'sold') {
        const playClavel = (timeOffset: number, freq: number, dur: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + timeOffset);
          osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + timeOffset + dur);
          gain.gain.setValueAtTime(0.18, ctx.currentTime + timeOffset);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + timeOffset + dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + timeOffset);
          osc.stop(ctx.currentTime + timeOffset + dur);
        };
        // Gavel striking triple beat
        playClavel(0, 350, 0.12);
        playClavel(0.1, 350, 0.12);
        playClavel(0.2, 500, 0.28);
      } else if (type === 'nominate') {
        const playSwell = (freq: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.45);
        };
        playSwell(261.63); // C4
        playSwell(329.63); // E4
        playSwell(392.00); // G4
        playSwell(523.25); // C5
      } else if (type === 'error') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.22);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.26);
      } else if (type === 'bell') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      }
    } catch (e) {
      console.warn("Audio error ignored:", e);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const pushLog = (msg: string, type: LogEntry['type']) => {
    const n = new Date();
    const timeStr = n.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const entry: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      msg,
      type,
      time: timeStr
    };
    setLogs(prev => [entry, ...prev].slice(0, 100)); // limit to 100 entries
  };

  const pushSnapshot = () => {
    const snap = JSON.stringify({ pools, teams, currentPlayerId, currentBid, currentBidderId });
    setAuditHistory(prev => [snap, ...prev].slice(0, 12));
  };

  // ============================================================
  //  SQUAD MATHS & CHECKS
  // ============================================================
  const getTeamRosterLength = (team: Team) => team.roster.length;
  const getTeamRemainingSlots = (team: Team) => MAX_SQUAD - getTeamRosterLength(team);

  const getTeamMaxBid = (team: Team, playerIsGK: boolean) => {
    const slots = getTeamRemainingSlots(team);
    if (slots <= 0) return 0;
    if (playerIsGK && team.hasGK) return 0;

    const slotsAfter = slots - 1;
    // Do we still need a GK after purchasing this?
    const needsGKAfter = (!team.hasGK && !playerIsGK) ? 1 : 0;
    const gkReserveAfter = needsGKAfter * GK_BASE;

    const fieldsAfter = slotsAfter - needsGKAfter;
    if (fieldsAfter < 0) {
      // It means they strictly need their remaining slots for GKs but this isn't a GK
      return 0;
    }
    const fieldReserveAfter = Math.max(0, fieldsAfter) * FIELD_BASE;
    const totalRequiredReserve = gkReserveAfter + fieldReserveAfter;

    return Math.max(0, team.budget - totalRequiredReserve);
  };

  const checkTeamBiddingEligibility = (team: Team, player: Player, nextBidAmount: number) => {
    const slots = getTeamRemainingSlots(team);
    if (slots <= 0) return { ok: false, reason: 'SQUAD FULL (8/8)' };
    if (player.isGK && team.hasGK) return { ok: false, reason: 'GK ALREADY OWNED' };

    const maxBidAmount = getTeamMaxBid(team, player.isGK);
    if (maxBidAmount < nextBidAmount) {
      return { ok: false, reason: 'INSUFFICIENT FUNDS' };
    }
    return { ok: true, reason: '' };
  };

  // ============================================================
  //  CORE CORE ACTIONS
  // ============================================================
  const nominatePlayer = (playerId: number) => {
    const targetPlayer = pools.find(p => p.id === playerId);
    if (!targetPlayer || targetPlayer.status !== 'available') {
      triggerToast('Player is not available!');
      playWebSynth('error');
      return;
    }

    pushSnapshot();
    setCurrentPlayerId(playerId);
    const startPrice = targetPlayer.isGK ? GK_BASE : FIELD_BASE;
    setCurrentBid(startPrice);
    setCurrentBidderId(null);
    pushLog(`📢 NOMINATED: ${targetPlayer.name} (${targetPlayer.pos}) starting at ${startPrice}M`, 'info');
    playWebSynth('nominate');
    triggerToast(`Nominated ${targetPlayer.name}!`);
  };

  const nominateRandom = (mode: 'any' | 'gk' | 'field') => {
    let available = pools.filter(p => p.status === 'available');
    if (mode === 'gk') {
      available = available.filter(p => p.isGK);
    } else if (mode === 'field') {
      available = available.filter(p => !p.isGK);
    }

    if (available.length === 0) {
      triggerToast(`No available draft-ready players in pool [${mode.toUpperCase()}]`);
      playWebSynth('error');
      return;
    }

    const randomIndex = Math.floor(Math.random() * available.length);
    nominatePlayer(available[randomIndex].id);
  };

  const placeBid = (teamId: number) => {
    if (currentPlayerId === null) return;
    const player = pools.find(p => p.id === currentPlayerId);
    if (!player) return;

    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    // Check if team is bidding against itself helper (disable is set on UI, but keep for guard)
    if (currentBidderId === teamId) return;

    pushSnapshot();
    
    // Calculate bid increment: if it's the opening bid, we start exactly at currentBid (the base price), 
    // otherwise we add exactly 5M.
    const isOpeningBid = currentBidderId === null;
    const nextBid = isOpeningBid ? currentBid : currentBid + BID_INCREMENT;

    const eligibility = checkTeamBiddingEligibility(team, player, nextBid);
    if (!eligibility.ok) {
      triggerToast(`${team.name} is ineligible to bid: ${eligibility.reason}`);
      playWebSynth('error');
      return;
    }

    setCurrentBid(nextBid);
    setCurrentBidderId(teamId);
    pushLog(`💰 ${team.name} bids ${nextBid}M for ${player.name}`, 'bid');
    playWebSynth('bid');
  };

  const triggerSold = () => {
    if (currentPlayerId === null || currentBidderId === null) {
      triggerToast('No active bid or player on auction block.');
      playWebSynth('error');
      return;
    }

    const player = pools.find(p => p.id === currentPlayerId);
    const team = teams.find(t => t.id === currentBidderId);
    if (!player || !team) return;

    pushSnapshot();

    // Assign player to team
    setPools(prev => prev.map(p => {
      if (p.id === player.id) {
        return {
          ...p,
          status: 'sold',
          soldTo: team.id,
          soldPrice: currentBid
        };
      }
      return p;
    }));

    setTeams(prev => prev.map(t => {
      if (t.id === team.id) {
        return {
          ...t,
          budget: t.budget - currentBid,
          roster: [...t.roster, { playerId: player.id, price: currentBid }],
          hasGK: t.hasGK || player.isGK
        };
      }
      return t;
    }));

    pushLog(`🏅 SOLD: ${player.name} to ${team.name} for ${currentBid}M!`, 'sold');
    playWebSynth('sold');
    triggerToast(`Congratulations! ${player.name} belongs to ${team.name}!`);

    // Reset auction block
    setCurrentPlayerId(null);
    setCurrentBid(0);
    setCurrentBidderId(null);
  };

  const triggerUnsoldPass = () => {
    if (currentPlayerId === null) {
      triggerToast('No player on auction block.');
      playWebSynth('error');
      return;
    }

    const player = pools.find(p => p.id === currentPlayerId);
    if (!player) return;

    pushSnapshot();

    setPools(prev => prev.map(p => {
      if (p.id === player.id) {
        return { ...p, status: 'unsold' };
      }
      return p;
    }));

    pushLog(`🚫 UNSOLD: ${player.name} has been passed to Unsold pool.`, 'unsold');
    playWebSynth('bell');
    triggerToast(`${player.name} passed.`);

    // Reset auction block
    setCurrentPlayerId(null);
    setCurrentBid(0);
    setCurrentBidderId(null);
  };

  const triggerUndo = () => {
    if (auditHistory.length === 0) {
      triggerToast('No actions to undo!');
      playWebSynth('error');
      return;
    }

    const previousSnapshotString = auditHistory[0];
    const previousState = JSON.parse(previousSnapshotString);

    setPools(previousState.pools);
    setTeams(previousState.teams);
    setCurrentPlayerId(previousState.currentPlayerId);
    setCurrentBid(previousState.currentBid);
    setCurrentBidderId(previousState.currentBidderId);

    setAuditHistory(prev => prev.slice(1));
    pushLog(`🔄 UNDO: Last action has been reverted successfully.`, 'undo');
    playWebSynth('bell');
    triggerToast('Undone!');
  };

  // ============================================================
  //  COMMISSIONER SPECIAL MANUAL CONTROL
  // ============================================================
  const adjustTeamBudget = (teamId: number, amount: number) => {
    pushSnapshot();
    setTeams(prev => prev.map(t => {
      if (t.id === teamId) {
        const nextBudget = Math.max(0, t.budget + amount);
        pushLog(`🔧 ADJUSTED: ${t.name} budget manually modified from ${t.budget}M to ${nextBudget}M`, 'adjust');
        return { ...t, budget: nextBudget };
      }
      return t;
    }));
    triggerToast('Budget adjusted!');
  };

  const forceRemovePlayerFromTeamRoster = (teamId: number, playerId: number) => {
    pushSnapshot();
    const player = pools.find(p => p.id === playerId);
    if (!player) return;

    setTeams(prev => prev.map(t => {
      if (t.id === teamId) {
        const itemToRemove = t.roster.find(r => r.playerId === playerId);
        const refundAmt = itemToRemove ? itemToRemove.price : 0;
        const nextRoster = t.roster.filter(r => r.playerId !== playerId);
        // Recalculate hasGK
        const stillHasGK = nextRoster.some(r => {
          const pl = pools.find(item => item.id === r.playerId);
          return pl ? pl.isGK : false;
        });

        pushLog(`🔧 ROSTER: Force-removed ${player.name} from ${t.name}. Draft room updated. Refund of ${refundAmt}M issued.`, 'adjust');
        return {
          ...t,
          budget: t.budget + refundAmt,
          roster: nextRoster,
          hasGK: stillHasGK
        };
      }
      return t;
    }));

    setPools(prev => prev.map(p => {
      if (p.id === playerId) {
        return { ...p, status: 'available', soldTo: null, soldPrice: null };
      }
      return p;
    }));

    triggerToast(`${player.name} released!`);
    playWebSynth('bell');
  };

  const handleFullReset = () => {
    if (!window.confirm('WARNING: This will completely reset the entire live draft event, including all roster assignments and budgets. Are you absolutely sure?')) {
      return;
    }
    localStorage.removeItem(STORAGE_KEY + '_pools');
    localStorage.removeItem(STORAGE_KEY + '_teams');
    localStorage.removeItem(STORAGE_KEY + '_currentPlayerId');
    localStorage.removeItem(STORAGE_KEY + '_currentBid');
    localStorage.removeItem(STORAGE_KEY + '_currentBidderId');
    localStorage.removeItem(STORAGE_KEY + '_logs');

    setPools(PLAYERS_INIT.map(p => ({ ...p, status: 'available', soldTo: null, soldPrice: null })));
    setTeams(TEAMS_INIT.map(t => ({
      ...t,
      budget: BASE_BUDGET,
      roster: [],
      hasGK: false
    })));
    setCurrentPlayerId(null);
    setCurrentBid(0);
    setCurrentBidderId(null);
    setLogs([]);
    setAuditHistory([]);
    pushLog(`🚨 AUCTION REALLOCATION: Complete factory reset triggered by commissioner. Ready to nominate.`, 'reset');
    playWebSynth('bell');
    triggerToast('Auction fully reset!');
  };

  const handleUpdatePlayer = (id: number, updatedFields: Partial<Player>) => {
    pushSnapshot();
    setPools(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));
  };

  const handleSavePlayerEdit = () => {
    if (!editingPlayer) return;
    if (!tempPlayerName.trim()) {
      triggerToast('Player name cannot be empty!');
      playWebSynth('error');
      return;
    }
    handleUpdatePlayer(editingPlayer.id, {
      name: tempPlayerName.trim(),
      photoUrl: tempPlayerPhoto.trim() || undefined
    });
    setEditingPlayer(null);
    triggerToast('Player updated successfully!');
    playWebSynth('bell');
  };

  // ============================================================
  //  POOL RENDER COMPUTATIONS
  // ============================================================
  const filteredPoolPlayers = pools.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.pos.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesType = true;
    if (filterPos === 'gk') matchesType = p.isGK;
    else if (filterPos === 'field') matchesType = !p.isGK;

    let matchesStatus = true;
    if (filterStatus !== 'all') matchesStatus = p.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const activePlayer = currentPlayerId !== null ? pools.find(p => p.id === currentPlayerId) : null;
  const activeBidder = currentBidderId !== null ? teams.find(t => t.id === currentBidderId) : null;
  const totalAvailableCount = pools.filter(p => p.status === 'available').length;
  const totalSoldCount = pools.filter(p => p.status === 'sold').length;
  const totalUnsoldCount = pools.filter(p => p.status === 'unsold').length;

  const currentNextBid = activePlayer ? (currentBidderId === null ? currentBid : currentBid + BID_INCREMENT) : 0;

  // Render variables
  const activePlayerStats = activePlayer ? getPlayerStats(activePlayer.name, activePlayer.pos) : null;
  const activePlayerOvr = activePlayerStats ? getOverallRating(activePlayerStats) : null;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-neutral-200 select-none antialiased flex flex-col overflow-x-hidden relative">
      <button
        onClick={toggleFullscreenViewer}
        className="fixed top-4 right-4 z-50 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold border border-slate-600 transition shadow-lg flex items-center gap-1.5"
      >
        {isViewerMode ? '❌ Exit Viewer Mode' : '📺 View Presenter Mode'}
      </button>
      
      {/* Background Decorative Ambient Glows */}
      <div className="absolute w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[140px] -top-1/4 -left-1/4 pointer-events-none z-0" />
      <div className="absolute w-[800px] h-[800px] bg-emerald-600/5 rounded-full blur-[140px] -bottom-1/4 -right-1/4 pointer-events-none z-0" />

      {/* ============================================================
          TOP BROADCAST BAR / HEADER
          ============================================================ */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-8 py-5 flex flex-col md:flex-row items-center justify-between sticky top-0 z-40 gap-4 shadow-2xl relative">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-sky-600 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/30">
            <Gavel className="w-6 h-6 text-emerald-50 pointer-events-none" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tighter text-white font-display uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
                BSL LIVE DRAFT <span className="text-emerald-400 font-normal">2026</span>
              </h1>
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981] animate-pulse"></span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#50e680] font-black">Bendichal Soccer League · Main Commissioner Room</p>
          </div>
        </div>

        {/* Dynamic Telemetry stats that are useful for the TV projection */}
        <div className="flex flex-wrap gap-4 md:gap-7 text-xs bg-slate-900/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-800">
          <div className="text-center">
            <div className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">AVAILABLE</div>
            <div className="text-lg font-black text-white font-mono">{totalAvailableCount} <span className="text-slate-500 text-xs font-normal">left</span></div>
          </div>
          <div className="w-px bg-slate-800 hidden sm:block"></div>
          <div className="text-center">
            <div className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">ROSTERED</div>
            <div className="text-lg font-black text-emerald-400 font-mono">{totalSoldCount} <span className="text-slate-500 text-xs font-normal">signed</span></div>
          </div>
          <div className="w-px bg-slate-800 hidden sm:block"></div>
          <div className="text-center">
            <div className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">UNSOLD</div>
            <div className="text-lg font-black text-red-400 font-mono">{totalUnsoldCount} <span className="text-slate-500 text-xs font-normal">passed</span></div>
          </div>
          <div className="w-px bg-slate-800 hidden sm:block"></div>
          <div className="text-center">
            <div className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">ACTIVE SLOT</div>
            <div className="text-lg font-black text-sky-400 font-mono">
              {activePlayer ? `#${activePlayer.id}` : 'WAITING'}
            </div>
          </div>
        </div>

        {/* Global Controls & Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2.5 rounded-xl border transition-all ${
              isMuted
                ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-neutral-300'
            }`}
            title={isMuted ? "Unmute Sounds" : "Mute Sounds"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={triggerUndo}
            disabled={auditHistory.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-300 hover:bg-amber-500/10 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95"
            title="Undo Last Action"
          >
            <Undo2 className="w-4 h-4" />
            <span className="text-xs font-extrabold uppercase tracking-wide hidden sm:inline">Undo</span>
          </button>
        </div>
      </header>

      {/* Navigation tabs */}
      <div className="bg-slate-950/40 border-b border-slate-850/80 flex items-center justify-between px-8 relative z-10">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('auction')}
            className={`px-6 py-5 text-xs font-black uppercase tracking-[0.15em] transition-all relative ${
              activeTab === 'auction'
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {activeTab === 'auction' && (
              <motion.div layoutId="nav-glow" className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 shadow-[0_-4px_15px_rgba(16,185,129,0.4)]" />
            )}
            ⚔️ Interactive Board
          </button>
          <button
            onClick={() => setActiveTab('pool')}
            className={`px-6 py-5 text-xs font-black uppercase tracking-[0.15em] transition-all relative ${
              activeTab === 'pool'
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {activeTab === 'pool' && (
              <motion.div layoutId="nav-glow" className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 shadow-[0_-4px_15px_rgba(16,185,129,0.4)]" />
            )}
            📋 Player Database
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-5 text-xs font-black uppercase tracking-[0.15em] transition-all relative ${
              activeTab === 'settings'
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {activeTab === 'settings' && (
              <motion.div layoutId="nav-glow" className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 shadow-[0_-4px_15px_rgba(16,185,129,0.4)]" />
            )}
            ⚙️ Control panel
          </button>
        </div>

        <div className="text-[10px] font-mono font-bold text-slate-500 tracking-wider hidden md:block uppercase bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-800/50">
          Audio Response engine: <span className="text-[#50e680] font-black">ACTIVE</span>
        </div>
      </div>

      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 15, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -10, x: '-50%' }}
            className="fixed bottom-6 left-1/2 z-50 px-6 py-4 rounded-xl border border-emerald-500/30 bg-slate-900/95 text-white shadow-[0_12px_45px_rgba(0,0,0,0.6)] flex items-center gap-3.5 backdrop-blur-xl"
          >
            <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-extrabold antialiased text-sm shadow-[0_0_10px_rgba(16,185,129,0.4)]">✓</div>
            <span className="text-xs font-black tracking-widest uppercase">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          MAIN BODY CONTAINER
          ============================================================ */}
      <main className="flex-1 overflow-hidden relative z-10">
        
        {/* ============================================================
            TAB 1: DRAFT & AUCTION MAIN BLOCK
            ============================================================ */}
        {activeTab === 'auction' && (
          <div className="h-full flex flex-col xl:flex-row divide-y xl:divide-y-0 xl:divide-x divide-slate-800/80">
            
            {/* Left side: Broadcaster arena & controls */}
            <div ref={activeContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 lg:space-y-8 bg-grid-pattern relative">
              <button
            onClick={toggleFullscreenViewer}
            className="absolute top-4 right-4 z-50 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-md text-xs font-bold border border-slate-600 transition shadow-lg opacity-40 hover:opacity-100 flex items-center gap-1.5"
          >
            {isViewerMode ? '❌ Exit Presenter Mode' : '📺 Switch to Presenter Mode'}
          </button>
              
              {/* STAGE NOMINATION SHORTCUT STRIP */}
              {currentPlayerId === null && (
                <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none" />
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2 uppercase tracking-wide font-display">
                      ⚡ No Active Nomination on Stage
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 max-w-lg leading-relaxed">
                      All eyes are on this area. Use the quick auto-draw options or navigate to the database tab to put a player in front of the TV audience.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2.5 w-full lg:w-auto justify-end relative z-10">
                    <button
                      onClick={() => nominateRandom('any')}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-sky-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-sky-400 transition-all cursor-pointer shadow-lg shadow-sky-500/10 active:scale-95"
                    >
                      <Shuffle className="w-4 h-4" /> Draw Any Player
                    </button>
                    <button
                      onClick={() => nominateRandom('gk')}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-amber-400 transition-all cursor-pointer shadow-lg shadow-amber-500/10 active:scale-95"
                    >
                      🧤 Draw Keeper
                    </button>
                    <button
                      onClick={() => nominateRandom('field')}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple-500 text-white font-black text-xs uppercase tracking-wider hover:bg-purple-400 transition-all cursor-pointer shadow-lg shadow-purple-500/10 active:scale-95"
                    >
                      ⚽ Draw Outfield
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('pool');
                        setFilterStatus('available');
                      }}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                    >
                      🔍 Browse Database
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================
                  TV PROJECTION SCREEN (HIGH-VISIBILITY & MASSIVE FONTS)
                  ============================================================ */}
              {activePlayer ? (
                <div className="space-y-6">
                  <div ref={presentationRef} className="bg-slate-900/60 border-2 border-slate-800 rounded-[32px] overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0,0.8)] relative backdrop-blur-strong fullscreen:p-12 fullscreen:w-full fullscreen:h-full fullscreen:bg-[#030712] fullscreen:flex fullscreen:flex-col fullscreen:justify-center fullscreen:items-center">
                    <button
              onClick={toggleFullscreenViewer}
              className="absolute top-4 right-4 z-50 bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-1.5 rounded-md text-[11px] font-bold border border-slate-600 transition shadow-lg opacity-40 hover:opacity-100 flex items-center gap-1.5"
            >
              {isViewerMode ? '❌ Exit Presenter Mode' : '📺 Switch to Presenter Mode'}
            </button>
                    
                    {/* High-impact Glowing Neon Bar under header */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-sky-500 via-yellow-400 to-emerald-500" />
                    
                    {/* Main High-Visibility Projection Deck */}
                    <div className="p-6 md:p-8 lg:p-12 flex flex-col lg:flex-row items-center gap-8 lg:gap-14 min-h-[360px] relative">
                      
                      {/* Left: Beautiful FUT-style player card */}
                      <div className="relative shrink-0 flex items-center justify-center w-full lg:w-auto relative">
                        
                        {/* Premium Dynamic Neon Aura behind card */}
                        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/20 via-sky-500/10 to-transparent rounded-[36px] blur-3xl" />
                        
                        {/* THE FUT CARD DESIGN */}
                        <div className="w-60 h-88 rounded-[28px] bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400/50 p-6 flex flex-col justify-between relative shadow-2xl overflow-hidden">
                          
                          {/* Watermark identifier behind initials */}
                          <div className="absolute inset-0 select-none opacity-[0.03] flex items-center justify-center font-black pointer-events-none text-[180px] text-white">
                            {activePlayer.pos}
                          </div>

                          <div className="flex justify-between items-start z-10">
                            <div>
                              <div className="text-4xl font-extrabold text-amber-300 font-display tracking-tighter">{activePlayerOvr}</div>
                              <div className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mt-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{activePlayer.pos}</div>
                            </div>
                            <div className="text-right">
                              <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-bold">RESERVE</span>
                              <span className="text-base font-black text-amber-400 font-mono">{activePlayer.isGK ? GK_BASE : FIELD_BASE}M</span>
                            </div>
                          </div>

                          {/* Center Silhouetted Visual Initials */}
                          <div className="my-2 py-2 flex items-center justify-center relative z-10">
                            <div className="h-30 w-30 rounded-full bg-slate-800/30 border border-slate-700/50 flex items-center justify-center text-4xl font-black text-amber-100 tracking-tight shadow-inner relative overflow-hidden">
                              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500/10 via-transparent to-transparent pointer-events-none z-10" />
                              {activePlayer.photoUrl ? (
                                <img
                                  src={activePlayer.photoUrl}
                                  alt={activePlayer.name}
                                  className="h-full w-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                activePlayer.name.split(' ').map(n=>n[0]).join('').slice(0,3).toUpperCase()
                              )}
                            </div>
                          </div>

                          <div className="text-center z-10 w-full">
                            <h4 className="text-sm font-black tracking-wide text-white uppercase truncate drop-shadow-md font-display">{activePlayer.name}</h4>
                            
                            {/* Physical specs & stats block */}
                            <div className="grid grid-cols-6 gap-0.5 border-t border-slate-800/80 pt-2.5 mt-2.5 text-[8.5px] font-mono text-slate-400">
                              {activePlayerStats && activePlayerStats.map((stat, idx) => (
                                <div key={idx} className="text-center">
                                  <div className="text-[7px] text-slate-500 scale-90">{stat.label}</div>
                                  <div className="font-bold text-white mt-0.5">{stat.val}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Massive TV numbers for the room to read easily */}
                      <div className="flex-1 w-full text-center lg:text-left space-y-6">
                        <div>
                          <div className="inline-flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] bg-sky-500/10 border border-sky-400/20 px-3.5 py-1 rounded-full text-sky-400">
                              {activePlayer.isGK ? '🧤 SPECIALIST GOALKEEPER' : '⚽ OUTFIELD FIELD CRACK'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">SLOT #{activePlayer.id}</span>
                          </div>
                          
                          {/* GIANT DISPLAY DECK NAME */}
                          <div className="flex items-center justify-center lg:justify-start gap-4">
                            <h2 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white uppercase font-display tracking-tighter leading-none drop-shadow-xl text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-100 to-slate-400">
                              {activePlayer.name}
                            </h2>
                            <button
                              onClick={() => setEditingPlayer(activePlayer)}
                              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer self-end shadow-md hover:border-emerald-500/30"
                              title="Quick Edit Player Details"
                            >
                              <Edit className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                            </button>
                          </div>
                        </div>

                        {/* MASSIVE CURRENT BID DECK FOR LARGE ROOM TV MIRRORING */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          
                          {/* CURRENT BID PANEL */}
                          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl relative overflow-hidden flex flex-col justify-center">
                            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.02] to-transparent pointer-events-none" />
                            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.25em] mb-1">
                              CURRENT ACTIVE BID
                            </h3>
                            <div className="text-7xl lg:text-8xl font-black text-amber-400 font-mono tracking-tighter drop-shadow-[0_0_35px_rgba(245,158,11,0.25)]">
                              {currentBid}M
                            </div>
                          </div>

                          {/* LEADING FRANCHISE WINNER */}
                          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl relative overflow-hidden flex flex-col justify-center">
                            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.02] to-transparent pointer-events-none" />
                            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.25em] mb-2">
                              HIGHEST BIDDER
                            </h3>
                            {activeBidder ? (
                              <div className="space-y-1.5">
                                <div className="inline-flex h-11 px-4.5 rounded-xl items-center justify-center text-xs font-black text-white tracking-widest uppercase transition-all shadow-md"
                                     style={{ backgroundColor: activeBidder.bg, border: `1px solid ${activeBidder.color}40` }}>
                                  {activeBidder.abbr}
                                </div>
                                <div className="text-2xl lg:text-3xl font-black truncate tracking-tight text-white max-w-[200px] mx-auto"
                                     style={{ color: activeBidder.color }}>
                                  {activeBidder.name}
                                </div>
                              </div>
                            ) : (
                              <div className="py-2.5">
                                <div className="text-2xl lg:text-3 text-slate-600 font-black font-display tracking-widest uppercase italic">
                                  WAITING
                                </div>
                                <p className="text-[10px] text-slate-500 uppercase font-medium mt-1">Starts at {currentBid}M Reserve</p>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>

                    </div>

                   {/* Quick-Click Header Banner with dynamic metadata rules */}
          {!isViewerMode && (
            <div className="bg-slate-950/80 px-6 py-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 relative z-10">
              <span className="font-extrabold text-[#50e680] uppercase tracking-wider flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]"></span>
                COMMISSIONER CONTROL DESK DIRECT CO-ASSIGNMENT
              </span>
              <span className="text-slate-500">Fast bid click automatically raises draft slot value by <b className="text-amber-400 font-extrabold">+{BID_INCREMENT}M</b></span>
            </div>
          )}
            

                  </div>

                  {/* ============================================================
                      1. AUCTIONEER QUICK-CLICK BID BUTTONS (GRID)
                      ============================================================ */}
                  <div>
                    <h3 className="text-xs font-extrabold tracking-[0.2em] text-slate-400 uppercase mb-3.5 flex items-center gap-2">
                      <span>⚡</span> FRANCHISE MULTI-BID TRIGGERS (DIRECT CLICK OVERRIDE)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                      {teams.map((team) => {
                        const isLeader = team.id === currentBidderId;
                        const slotsLeft = getTeamRemainingSlots(team);
                        const nextBidAmount = currentBidderId === null ? currentBid : currentBid + BID_INCREMENT;
                        
                        const eligibility = checkTeamBiddingEligibility(team, activePlayer, nextBidAmount);
                        const isEligible = eligibility.ok;

                        return (
                          <button
                            key={team.id}
                            disabled={!isEligible || isLeader}
                            onClick={() => placeBid(team.id)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all duration-150 flex flex-col justify-between h-34 relative overflow-hidden group select-none cursor-pointer ${
                              isLeader
                                ? 'bg-sky-500/10 border-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.25)] ring-2 ring-sky-400/50 scale-[1.02]'
                                : !isEligible
                                ? 'bg-red-950/20 border-red-900/40 opacity-40 cursor-not-allowed'
                                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 w-full relative z-10">
                              <div className="flex items-center gap-2 truncate">
                                {/* Small Team Abbreviation Shield */}
                                <div className="h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0"
                                     style={{ backgroundColor: team.bg, color: team.color, border: `2px solid ${team.color}50` }}>
                                  {team.abbr}
                                </div>
                                <span className="text-xs font-black text-white truncate font-display">{team.name}</span>
                              </div>
                              {isLeader && (
                                <span className="text-[8px] font-black uppercase text-sky-400 bg-sky-500/15 px-2 py-0.5 rounded border border-sky-500/30 shrink-0 tracking-widest antialiased">
                                  LEAD
                                </span>
                              )}
                            </div>

                            {isEligible ? (
                              <div className="flex items-end justify-between w-full mt-4 relative z-10">
                                <div>
                                  <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black block group-hover:text-slate-400 transition-colors">BID TO</span>
                                  <span className="text-xl font-extrabold font-mono text-white">
                                    {nextBidAmount}M
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black block">MAX BID</span>
                                  <span className="text-xs font-extrabold font-mono text-emerald-400">
                                    {getTeamMaxBid(team, activePlayer.isGK)}M
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-auto py-1.5 border-t border-red-500/10 w-full text-center relative z-10 leading-tight">
                                <span className="text-[8.5px] font-black text-red-400 tracking-wider uppercase block truncate" title={eligibility.reason}>
                                  ⚠️ {eligibility.reason}
                                </span>
                                <span className="text-[7.5px] text-slate-500 uppercase font-bold mt-0.5 block">
                                  Slots {slotsLeft}/8 · Max {getTeamMaxBid(team, activePlayer.isGK)}M
                                </span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ============================================================
                      2. PRINCIPLE AUCTION BLOCK CONTROLS
                      ============================================================ */}
                  <div className="bg-slate-900/60 rounded-3xl p-6 border border-slate-800 flex flex-col md:flex-row gap-4 shadow-2xl relative overflow-hidden backdrop-blur-md">
                    
                    {/* SOLD CO-ASSIGNMENT BUTTON */}
                    <button
                      disabled={currentBidderId === null}
                      onClick={triggerSold}
                      className="flex-1 py-4.5 px-8 rounded-2xl font-black tracking-widest text-sm uppercase flex items-center justify-center gap-2.5 transition-all duration-200 disabled:opacity-20 disabled:pointer-events-none active:scale-95 cursor-pointer text-slate-950 font-display shadow-2xl"
                      style={{
                        backgroundColor: currentBidderId !== null ? '#10b981' : '#334155',
                        boxShadow: currentBidderId !== null ? '0 0 35px rgba(16,185,129,0.3)' : 'none',
                      }}
                    >
                      <Check className="w-5 h-5 stroke-[3]" />
                      SOLD SLOT TO LEADING BIDDER (✓)
                    </button>

                    {/* UNSOLD RELEASE BUTTON */}
                    <button
                      onClick={triggerUnsoldPass}
                      className="py-4.5 px-6 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 font-black tracking-wider text-xs uppercase flex items-center justify-center gap-2 cursor-pointer hover:bg-red-500/20 hover:border-red-500/50 transition-all active:scale-95"
                    >
                      <X className="w-4 h-4 text-red-300" />
                      UNSOLD / DRAFT PASS (✕)
                    </button>

                    {/* NOMINATE ANOTHER DRAFT BUTTON */}
                    <button
                      onClick={() => nominateRandom('any')}
                      className="py-4.5 px-6 rounded-2xl border border-slate-700 bg-slate-850 hover:bg-slate-800 hover:border-slate-600 text-white font-black tracking-wider text-xs uppercase flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                    >
                      <Shuffle className="w-4 h-4 text-slate-300" />
                      AUTO DRAW RANDOM (🎲)
                    </button>

                  </div>

                </div>
              ) : (
                /* EMPTY STATE (REDUNDANT SAFEGUARD) */
                <div className="border-2 border-dashed border-slate-800 rounded-3xl p-16 text-center space-y-4 bg-slate-900/20 backdrop-blur-sm">
                  <span className="text-6xl inline-block animate-bounce filter drop-shadow">🏆</span>
                  <p className="text-slate-400 font-extrabold max-w-sm mx-auto text-sm leading-relaxed uppercase tracking-wide">
                    The electronic master board is online. Draw any random slot or select a player from database tab to start.
                  </p>
                </div>
              )}

              {/* ============================================================
                  DRAFT ROOM EVENTS LOG (LAST 5 LOG ENTRIES)
                  ============================================================ */}
              <div className="bg-slate-900/60 rounded-3xl border border-slate-800/80 p-6 space-y-4 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping"></span> Live Broadcast Activity Feed
                  </h4>
                  <button onClick={() => setLogs([])} className="text-[9px] hover:text-white transition-colors text-slate-500 font-bold uppercase tracking-widest cursor-pointer">
                    Purge activity
                  </button>
                </div>
                <div className="space-y-2 max-h-36 overflow-y-auto font-mono text-xs text-slate-300 scrollbar-none">
                  {logs.length === 0 ? (
                    <p className="text-slate-600 italic text-center text-xs py-4">Draft room logging ready. First event will stream here...</p>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="flex items-start gap-4 leading-relaxed border-b border-slate-900 pb-1.5 last:border-0">
                        <span className="text-slate-600 text-[10px] select-none">{log.time}</span>
                        <span className={`flex-1 ${
                          log.type === 'sold' ? 'text-emerald-300 font-black' :
                          log.type === 'bid' ? 'text-sky-400 font-bold' :
                          log.type === 'unsold' ? 'text-red-400 font-bold' :
                          log.type === 'undo' ? 'text-amber-400 italic font-bold' :
                          'text-slate-300'
                        }`}>
                          {log.msg}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Right side: Dynamic Standings & Slabs for active teams tracking */}
            <div className="w-full xl:w-96 shrink-0 bg-[#0a0c11]/80 backdrop-blur-md p-4 md:p-5 overflow-y-auto space-y-4 max-h-full">
              
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <h3 className="text-xs font-black tracking-widest uppercase text-slate-400 flex items-center gap-2">
                  🛡️ FRANCHISE TEAM ROSTERS ({teams.length})
                </h3>
                
                {/* Manual budget toggle button */}
                <button
                  onClick={() => setShowManualBudget(!showManualBudget)}
                  className={`text-[9.5px] font-black tracking-wider uppercase px-2 py-1 rounded transition-all ${
                    showManualBudget ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  {showManualBudget ? 'Close Overrides' : '💵 Overrides'}
                </button>
              </div>

              {/* OVERRIDES TELEMETRY */}
              {showManualBudget && (
                <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 space-y-2.5">
                  <div className="text-[10px] font-bold text-amber-300 uppercase tracking-widest">
                    ⚠️ COMMISSIONER OVERRIDES (MONEY CORRECTIONS)
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {teams.map((t) => (
                      <div key={t.id} className="bg-black/30 p-2 rounded border border-white/5 flex items-center justify-between gap-1">
                        <span className="font-extrabold font-mono" style={{ color: t.color }}>{t.abbr}</span>
                        <div className="flex gap-1">
                          <button onClick={() => adjustTeamBudget(t.id, -5)} className="p-1 px-1.5 rounded bg-red-950/20 text-red-400 text-[10px] border border-red-500/20 font-bold">-5M</button>
                          <button onClick={() => adjustTeamBudget(t.id, 5)} className="p-1 px-1.5 rounded bg-emerald-950/20 text-emerald-400 text-[10px] border border-emerald-500/20 font-bold">+5M</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TEAMS SUMMARY PANELS */}
              <div className="space-y-3.5">
                {teams.map((team) => {
                  const slotsLeft = getTeamRemainingSlots(team);
                  const isCurBidder = team.id === currentBidderId;
                  const budgetPercentage = Math.round((team.budget / BASE_BUDGET) * 100);

                  return (
                    <div
                      key={team.id}
                      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                        isCurBidder
                          ? 'border-emerald-500/40 bg-emerald-500/[0.02] shadow-[0_4px_24px_rgba(16,185,129,0.04)]'
                          : 'border-white/5 bg-[#0b0e14]'
                      }`}
                    >
                      {/* Accordion header card */}
                      <div className="p-3.5 flex items-center justify-between gap-3 border-b border-white/[0.03]">
                        <div className="flex items-center gap-2.5 truncate">
                          {/* Left brand shield */}
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0"
                               style={{ backgroundColor: team.bg, color: team.color, border: `1px solid ${team.color}30` }}>
                            {team.abbr}
                          </div>
                          <div className="truncate">
                            <h4 className="text-xs font-black text-white truncate leading-tight">{team.name}</h4>
                            <div className="flex items-center gap-1.5 mt-1">
                              {/* Small mini progress bar */}
                              <div className="h-1 w-24 rounded-full bg-slate-800">
                                <div className="h-1 rounded-full bg-emerald-400" style={{ width: `${Math.min(100, budgetPercentage)}%` }} />
                              </div>
                              <span className="text-[10px] font-bold font-mono text-emerald-400">{team.budget}M</span>
                            </div>
                          </div>
                        </div>

                        {/* Right stats counters */}
                        <div className="text-right shrink-0">
                          <button
                            onClick={() => setShowRosterManager(showRosterManager?.id === team.id ? null : team)}
                            className="bg-white/5 border border-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg text-[10px] text-slate-300 font-extrabold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <span>{team.roster.length}/8</span>
                            {showRosterManager?.id === team.id ? <ChevronUp className="w-2.5 h-2.5 text-slate-500" /> : <ChevronDown className="w-2.5 h-2.5 text-slate-500" />}
                          </button>
                        </div>
                      </div>

                      {/* Team details and constraints */}
                      <div className="px-3 py-2 bg-black/10 flex justify-between text-[9px] text-slate-400 uppercase tracking-widest font-bold">
                        <span>Keeper: <b className={team.hasGK ? 'text-emerald-400 font-black' : 'text-slate-600'}>{team.hasGK ? '✓ OWNED' : '✗ NONE'}</b></span>
                        <span>Slots left: <b className="text-white">{slotsLeft}</b></span>
                        <span>Max Bid cap: <b className="text-amber-400 font-mono text-[9.5px]">
                          {activePlayer ? `${getTeamMaxBid(team, activePlayer.isGK)}M` : '—'}
                        </b></span>
                      </div>

                      {/* Roster list representation */}
                      <div className="p-2 space-y-1 bg-black/5">
                        {team.roster.length === 0 ? (
                          <div className="text-[10.5px] text-slate-600 italic px-2 py-1.5">No players drafted yet.</div>
                        ) : (
                          team.roster.map((item) => {
                            const pl = pools.find(p => p.id === item.playerId);
                            if (!pl) return null;
                            return (
                              <div key={item.playerId} className="flex items-center justify-between p-1.5 px-2 bg-[#0d1017] rounded-lg border border-white/[0.02]">
                                <div className="flex items-center gap-2 truncate">
                                  <span className="text-[8px] font-black bg-slate-800 text-slate-300 px-1 py-0.2 rounded shrink-0">{pl.pos}</span>
                                  <span className="text-xs font-medium text-slate-300 truncate">{pl.name}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs font-bold font-mono text-amber-400">{item.price}M</span>
                                  {showRosterManager?.id === team.id && (
                                    <button
                                      onClick={() => forceRemovePlayerFromTeamRoster(team.id, pl.id)}
                                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                                      title="Force Release Player"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        )}

        {/* ============================================================
            TAB 2: PLAYER POOL SCREEN & STATUSES
            ============================================================ */}
        {activeTab === 'pool' && (
          <div className="h-full p-6 md:p-8 overflow-y-auto space-y-6">
            <div className="max-w-6xl mx-auto space-y-6">
              
              {/* Filter controls */}
              <div className="bg-[#0b0e14] p-5 rounded-2xl border border-white/5 space-y-4 shadow-xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-wider">Master Player Database</h2>
                    <p className="text-xs text-neutral-500 mt-1">Select and nominate individual players from here. Search by name or position.</p>
                  </div>
                  
                  {/* Search Input bar */}
                  <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="Search player database..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all font-medium"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-3.5 text-xs text-slate-500 hover:text-white">✕</button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/5">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Position Filter */}
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                      <button
                        onClick={() => setFilterPos('all')}
                        className={`px-3 py-1.5 rounded-lg text-[10.5px] font-extrabold uppercase transition-all ${
                          filterPos === 'all' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        All Positions
                      </button>
                      <button
                        onClick={() => setFilterPos('gk')}
                        className={`px-3 py-1.5 rounded-lg text-[10.5px] font-extrabold uppercase transition-all ${
                          filterPos === 'gk' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Keepers (GK)
                      </button>
                      <button
                        onClick={() => setFilterPos('field')}
                        className={`px-3 py-1.5 rounded-lg text-[10.5px] font-extrabold uppercase transition-all ${
                          filterPos === 'field' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Field Players
                      </button>
                    </div>

                    {/* Status Filter */}
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                      <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-3 py-1.5 rounded-lg text-[10.5px] font-extrabold uppercase transition-all ${
                          filterStatus === 'all' ? 'bg-[#50e680]/15 text-[#50e680]' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        All States
                      </button>
                      <button
                        onClick={() => setFilterStatus('available')}
                        className={`px-3 py-1.5 rounded-lg text-[10.5px] font-extrabold uppercase transition-all ${
                          filterStatus === 'available' ? 'bg-[#50e680]/15 text-[#50e680]' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Available ({pools.filter(x => x.status === 'available').length})
                      </button>
                      <button
                        onClick={() => setFilterStatus('sold')}
                        className={`px-3 py-1.5 rounded-lg text-[10.5px] font-extrabold uppercase transition-all ${
                          filterStatus === 'sold' ? 'bg-[#50e680]/15 text-[#50e680]' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Sold ({pools.filter(x => x.status === 'sold').length})
                      </button>
                      <button
                        onClick={() => setFilterStatus('unsold')}
                        className={`px-3 py-1.5 rounded-lg text-[10.5px] font-extrabold uppercase transition-all ${
                          filterStatus === 'unsold' ? 'bg-[#50e680]/15 text-[#50e680]' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Unsold / Pass ({pools.filter(x => x.status === 'unsold').length})
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 font-mono">
                    Showing {filteredPoolPlayers.length} matches out of {pools.length} athletes
                  </div>
                </div>

              </div>

              {/* GRID RENDERING */}
              {filteredPoolPlayers.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-white/5 rounded-3xl">
                  <span className="text-4xl text-slate-600 block mb-2">🔍</span>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">No matching players detected in this filter selection.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredPoolPlayers.map((player) => {
                    const plStats = getPlayerStats(player.name, player.pos);
                    const ovr = getOverallRating(plStats);
                    let badgeColor = 'bg-[#1a2333] text-sky-400 border border-sky-500/25';
                    if (player.status === 'sold') badgeColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25';
                    if (player.status === 'unsold') badgeColor = 'bg-red-500/10 text-red-400 border border-red-500/25';

                    const soldTeam = player.soldTo !== null ? teams.find(t => t.id === player.soldTo) : null;

                    return (
                      <div
                        key={player.id}
                        className={`p-4 rounded-2xl bg-[#0b0e14] border border-white/5 hover:border-sky-500/20 transition-all flex items-center justify-between gap-4 ${
                          player.status !== 'available' ? 'opacity-65' : ''
                        }`}
                      >
                        {/* Left portion: Avatar & text */}
                        <div className="flex items-center gap-3 truncate">
                          {/* Mini Avatar space / photo with OVR badge */}
                          <div className="h-11 w-11 rounded-xl shrink-0 relative bg-slate-800/50 border border-slate-800 flex items-center justify-center overflow-hidden">
                            {player.photoUrl ? (
                              <img
                                src={player.photoUrl}
                                alt={player.name}
                                className="h-full w-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="font-extrabold text-xs text-slate-400">
                                {player.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </span>
                            )}
                            <span className={`absolute -bottom-1 -right-1 font-black text-[8px] px-1 rounded-tl-md ${
                              player.isGK ? 'bg-amber-400 text-slate-950' : 'bg-sky-500 text-slate-950'
                            }`}>
                              {ovr}
                            </span>
                          </div>
                          <div className="truncate leading-snug">
                            <h4 className="text-xs font-black text-white uppercase truncate tracking-wide">{player.name}</h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium mt-0.5">
                              <span className="font-bold text-slate-400">{player.pos}</span>
                              <span>•</span>
                              <span>Base {player.isGK ? GK_BASE : FIELD_BASE}M</span>
                            </div>
                          </div>
                        </div>

                        {/* Right state action block */}
                        <div className="shrink-0 flex items-center gap-2">
                          <button
                            onClick={() => setEditingPlayer(player)}
                            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 transition-all cursor-pointer hover:border-slate-700"
                            title="Edit Name & Photo"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <div className="text-right">
                            {player.status === 'available' ? (
                              <button
                                onClick={() => {
                                  nominatePlayer(player.id);
                                  setActiveTab('auction');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-sky-500 text-slate-950 font-black text-[10.5px] uppercase tracking-wide cursor-pointer transition-all hover:bg-sky-400 active:scale-95"
                              >
                                Nominate
                              </button>
                            ) : (
                              <div className="space-y-0.5">
                                <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${badgeColor}`}>
                                  {player.status === 'sold' && soldTeam ? `Sold → ${soldTeam.abbr}` : player.status}
                                </span>
                                {player.status === 'sold' && (
                                  <span className="block font-mono text-[10.5px] font-extrabold text-amber-400">{player.soldPrice}M</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>
        )}

        {/* ============================================================
            TAB 3: SETUP, RESET & MANUAL ACTIONS
            ============================================================ */}
        {activeTab === 'settings' && (
          <div className="h-full p-6 md:p-8 overflow-y-auto">
            <div className="max-w-2xl mx-auto bg-[#0b0e14] p-6 rounded-2xl border border-white/5 space-y-6 shadow-xl leading-relaxed">
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>⚙️</span> Live Arena Configuration Tools
                </h2>
                <p className="text-xs text-neutral-500 mt-1">Commissioner-only commands to reset or alter the current BSL dynamic draft.</p>
              </div>

              {/* Reset Box */}
              <div className="p-4 bg-red-950/10 border border-red-500/20 rounded-xl space-y-3">
                <h4 className="text-xs font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> DANGER ZONE: DESTROY LIVE EVENT STATE
                </h4>
                <p className="text-[11px] text-slate-400">
                  This command wipes the browser database completely. All team budgets will return to $200M, all assigned roster positions are flushed, and all players are set back to 'Available' in their pools.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleFullReset}
                    className="px-5 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-slate-950 border border-red-500/40 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    🚨 EXECUTE COMPLETE FACTORY RESET
                  </button>
                </div>
              </div>

              {/* Roster Assignment Rule Reference */}
              <div className="space-y-3 pt-2 text-xs">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">
                  📐 BENDICHAL SOCCER LEAGUE AUCTION COVENANTS
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-black/30 p-3.5 rounded-xl border border-white/5">
                    <span className="font-extrabold text-white block mb-1">💸 Base Budget</span>
                    Every franchise begins with **200M** of virtual funds.
                  </div>
                  <div className="bg-black/30 p-3.5 rounded-xl border border-white/5">
                    <span className="font-extrabold text-white block mb-1">🧤 Goalkeeping Mandate</span>
                    Exactly **one (1) Keeper** per team is required. GKs start bidding at **20M**.
                  </div>
                  <div className="bg-black/30 p-3.5 rounded-xl border border-white/5">
                    <span className="font-extrabold text-white block mb-1">⚽ Field Squad</span>
                    Exactly **seven (7) non-GKs** are required. Base bidding at **10M**.
                  </div>
                  <div className="bg-black/30 p-3.5 rounded-xl border border-white/5">
                    <span className="font-extrabold text-white block mb-1">🏦 Bidding Guarantee</span>
                    Franchises are blocked from bids that prevent filling their required vacant slots.
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 text-center text-[10px] text-slate-600">
                Lughaty AI core architecture engine. Hand-rendered using high-impact dark theme.
              </div>
            </div>
          </div>
        )}

      </main>

      <AnimatePresence>
        {editingPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 to-transparent pointer-events-none" />
              
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-wider font-display">
                    ✏️ Edit Player Card
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Modify details for #{editingPlayer.id} ({editingPlayer.pos})
                  </p>
                </div>
                <button
                  onClick={() => setEditingPlayer(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Live Preview section */}
              <div className="flex items-center gap-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800 relative z-10 font-sans">
                {/* Avatar frame */}
                <div className="h-16 w-16 rounded-full bg-slate-850 border border-slate-700 flex items-center justify-center text-xl font-bold text-amber-100 shrink-0 relative overflow-hidden shadow-inner">
                  {tempPlayerPhoto ? (
                    <img
                      src={tempPlayerPhoto}
                      alt={tempPlayerName}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '';
                      }}
                    />
                  ) : (
                    tempPlayerName ? tempPlayerName.split(' ').map(n=>n[0]).join('').slice(0,3).toUpperCase() : '?'
                  )}
                </div>
                <div className="truncate">
                  <span className="text-[10px] font-black uppercase text-amber-400 font-mono tracking-widest block">Live Card Preview</span>
                  <span className="text-base font-black text-white truncate block">{tempPlayerName || 'Unnamed Athlete'}</span>
                  <span className="text-xs font-bold text-slate-500 font-mono">{editingPlayer.pos} • Reserve {editingPlayer.isGK ? GK_BASE : FIELD_BASE}M</span>
                </div>
              </div>

              {/* Inputs */}
              <div className="space-y-4 relative z-10 font-sans">
                <div className="space-y-1.5 animate-none">
                  <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">Player Display Name</label>
                  <input
                    type="text"
                    value={tempPlayerName}
                    onChange={(e) => setTempPlayerName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-all font-semibold animate-none"
                    placeholder="e.g. Erling Haaland"
                  />
                </div>

                <div className="space-y-1.5 animate-none">
                  <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">Photo JPG/PNG URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tempPlayerPhoto}
                      onChange={(e) => setTempPlayerPhoto(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-all font-semibold animate-none"
                      placeholder="https://images.unsplash.com/... or paste address"
                    />
                    {tempPlayerPhoto && (
                      <button
                        onClick={() => setTempPlayerPhoto('')}
                        className="px-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-400 hover:text-white transition-all cursor-pointer"
                        title="Clear Photo pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Preset Images Quick Grid */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">Or Quick Select Preset Face</span>
                  <div className="grid grid-cols-4 gap-2">
                    {AVATAR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => setTempPlayerPhoto(preset.url)}
                        className={`h-11 rounded-lg border overflow-hidden relative group transition-all cursor-pointer ${
                          tempPlayerPhoto === preset.url ? 'border-sky-400 ring-2 ring-sky-400/30' : 'border-slate-800 hover:border-slate-700'
                        }`}
                        title={preset.name}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4 border-t border-slate-800 relative z-10 font-sans">
                <button
                  onClick={() => setEditingPlayer(null)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePlayerEdit}
                  className="flex-1 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center shadow-lg shadow-sky-500/10"
                >
                  Save Changes
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
