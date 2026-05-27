'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient, User } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

const INVITE_CODE = 'mundial2026hermanos';
const ADMIN_EMAIL = 'prodromos.chrysostomou@outlook.com';

type Profile = {
  id: string;
  email: string;
  username: string;
  role: 'player' | 'admin';
  league_id: string | null;
};

type Match = {
  id: number;
  match_no: number;
  match_day: string;
  group_name: string | null;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  home_score: number | null;
  away_score: number | null;
};

type Prediction = {
  id: number;
  user_id: string;
  match_id: number;
  pred_home: number | null;
  pred_away: number | null;
};

type LeagueChatMessage = {
  id: string;
  league_id: string;
  user_id: string;
  comment: string;
  created_at: string;
};

function isLocked(match: Match) {
  return new Date() >= new Date(match.kickoff_at);
}

function formatLocalTime(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}
function country(code: string) {
  const map: Record<string, { name: string; flag: string }> = {
    MEX: { name: 'Mexico', flag: 'https://flagcdn.com/w20/mx.png' },
    RSA: { name: 'South Africa', flag: 'https://flagcdn.com/w20/za.png' },
    KOR: { name: 'South Korea', flag: 'https://flagcdn.com/w20/kr.png' },
    CZE: { name: 'Czechia', flag: 'https://flagcdn.com/w20/cz.png' },

    CAN: { name: 'Canada', flag: 'https://flagcdn.com/w20/ca.png' },
    BIH: { name: 'Bosnia & Herzegovina', flag: 'https://flagcdn.com/w20/ba.png' },
    QAT: { name: 'Qatar', flag: 'https://flagcdn.com/w20/qa.png' },
    SUI: { name: 'Switzerland', flag: 'https://flagcdn.com/w20/ch.png' },

    BRA: { name: 'Brazil', flag: 'https://flagcdn.com/w20/br.png' },
    MAR: { name: 'Morocco', flag: 'https://flagcdn.com/w20/ma.png' },
    HAI: { name: 'Haiti', flag: 'https://flagcdn.com/w20/ht.png' },
    SCO: { name: 'Scotland', flag: 'https://flagcdn.com/w20/gb-sct.png' },

    USA: { name: 'United States', flag: 'https://flagcdn.com/w20/us.png' },
    PAR: { name: 'Paraguay', flag: 'https://flagcdn.com/w20/py.png' },
    AUS: { name: 'Australia', flag: 'https://flagcdn.com/w20/au.png' },
    TUR: { name: 'Türkiye', flag: 'https://flagcdn.com/w20/tr.png' },

    GER: { name: 'Germany', flag: 'https://flagcdn.com/w20/de.png' },
    CUW: { name: 'Curaçao', flag: 'https://flagcdn.com/w20/cw.png' },
    CIV: { name: 'Ivory Coast', flag: 'https://flagcdn.com/w20/ci.png' },
    ECU: { name: 'Ecuador', flag: 'https://flagcdn.com/w20/ec.png' },

    NED: { name: 'Netherlands', flag: 'https://flagcdn.com/w20/nl.png' },
    JPN: { name: 'Japan', flag: 'https://flagcdn.com/w20/jp.png' },
    SWE: { name: 'Sweden', flag: 'https://flagcdn.com/w20/se.png' },
    TUN: { name: 'Tunisia', flag: 'https://flagcdn.com/w20/tn.png' },

    BEL: { name: 'Belgium', flag: 'https://flagcdn.com/w20/be.png' },
    EGY: { name: 'Egypt', flag: 'https://flagcdn.com/w20/eg.png' },
    IRN: { name: 'Iran', flag: 'https://flagcdn.com/w20/ir.png' },
    NZL: { name: 'New Zealand', flag: 'https://flagcdn.com/w20/nz.png' },

    ESP: { name: 'Spain', flag: 'https://flagcdn.com/w20/es.png' },
    CPV: { name: 'Cape Verde', flag: 'https://flagcdn.com/w20/cv.png' },
    KSA: { name: 'Saudi Arabia', flag: 'https://flagcdn.com/w20/sa.png' },
    URU: { name: 'Uruguay', flag: 'https://flagcdn.com/w20/uy.png' },

    FRA: { name: 'France', flag: 'https://flagcdn.com/w20/fr.png' },
    SEN: { name: 'Senegal', flag: 'https://flagcdn.com/w20/sn.png' },
    IRQ: { name: 'Iraq', flag: 'https://flagcdn.com/w20/iq.png' },
    NOR: { name: 'Norway', flag: 'https://flagcdn.com/w20/no.png' },
    
    ARG: { name: 'Argentina', flag: 'https://flagcdn.com/w20/ar.png' },
    ALG: { name: 'Algeria', flag: 'https://flagcdn.com/w20/dz.png' },
    AUT: { name: 'Austria', flag: 'https://flagcdn.com/w20/at.png' },
    JOR: { name: 'Jordan', flag: 'https://flagcdn.com/w20/jo.png' },
    
    POR: { name: 'Portugal', flag: 'https://flagcdn.com/w20/pt.png' },
    DRC: { name: 'Congo DR', flag: 'https://flagcdn.com/w20/cd.png' },
    UZB: { name: 'Uzbekistan', flag: 'https://flagcdn.com/w20/uz.png' },
    COL: { name: 'Colombia', flag: 'https://flagcdn.com/w20/co.png' },
    
    ENG: { name: 'England', flag: 'https://flagcdn.com/w20/gb-eng.png' },
    CRO: { name: 'Croatia', flag: 'https://flagcdn.com/w20/hr.png' },
    GHA: { name: 'Ghana', flag: 'https://flagcdn.com/w20/gh.png' },
    PAN: { name: 'Panama', flag: 'https://flagcdn.com/w20/pa.png' },

    TBD: { name: 'TBD', flag: '' },
  }

  return map[code] || { name: code, flag: '' }
}
function countdownText(kickoffAt: string, now: Date) {
  const diff = new Date(kickoffAt).getTime() - now.getTime();

  if (diff <= 0) return 'Locked';

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `Locks in ${days}d ${hours}h`;
  if (hours > 0) return `Locks in ${hours}h ${minutes}m`;
  return `Locks in ${minutes}m`;
}

function predictionDistribution(match: Match, predictions: Prediction[]) {
  const relevant = predictions.filter(
    (p) =>
      p.match_id === match.id &&
      p.pred_home !== null &&
      p.pred_away !== null
  );

  if (!relevant.length) {
    return { home: 0, draw: 0, away: 0 };
  }

  let home = 0;
  let draw = 0;
  let away = 0;

  relevant.forEach((p) => {
    if (p.pred_home > p.pred_away) home++;
    else if (p.pred_home < p.pred_away) away++;
    else draw++;
  });

  const total = relevant.length;

  return {
    home: Math.round((home / total) * 100),
    draw: Math.round((draw / total) * 100),
    away: Math.round((away / total) * 100),
  };
}
function isPredictionComplete(prediction?: Prediction) {
  return !!prediction && prediction.pred_home !== null && prediction.pred_away !== null;
}

function predictionPoints(match: Match, prediction?: Prediction) {
  if (!prediction) return 0;
  if (
    match.home_score === null ||
    match.away_score === null ||
    prediction.pred_home === null ||
    prediction.pred_away === null
  ) return 0;

  if (match.home_score === prediction.pred_home && match.away_score === prediction.pred_away) {
    return 3;
  }

  const actual = match.home_score > match.away_score ? 'H' : match.home_score < match.away_score ? 'A' : 'D';
  const guessed = prediction.pred_home > prediction.pred_away ? 'H' : prediction.pred_home < prediction.pred_away ? 'A' : 'D';

  return actual === guessed ? 1 : 0;
}

function playerBadges(playerId: string, matches: Match[], predictions: Prediction[]) {
  const playerPredictions = predictions.filter((p) => p.user_id === playerId);

  let exactScores = 0;
  let correctOutcomes = 0;
  let exactStreak = 0;
  let bestExactStreak = 0;

  matches.forEach((match) => {
    if (
      match.home_score === null ||
      match.away_score === null
    ) return;

    const prediction = playerPredictions.find((p) => p.match_id === match.id);
    if (!prediction) return;

    const points = predictionPoints(match, prediction);

    if (points === 3) {
      exactScores++;
      exactStreak++;
      if (exactStreak > bestExactStreak) bestExactStreak = exactStreak;
    } else {
      exactStreak = 0;
    }

    if (points > 0) {
      correctOutcomes++;
    }
  });

  const badges = [];

  if (exactScores >= 3) badges.push('🎯 Sniper');
  if (bestExactStreak >= 2) badges.push('🔥 Hot Hand');
  if (correctOutcomes >= 10) badges.push('🧠 Oracle');

  return badges;
}

function groupStandings(matches: Match[]) {
  const tables: Record<string, any[]> = {};

  matches.forEach((match) => {
    const group = match.group_name || 'Other';
    if (!tables[group]) tables[group] = [];

    [match.home_team, match.away_team].forEach((team) => {
      if (!tables[group].some((row) => row.team === team)) {
        tables[group].push({ team, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 });
      }
    });
  });

  matches.forEach((match) => {
    if (match.home_score === null || match.away_score === null) return;

    const group = match.group_name || 'Other';
    const home = tables[group].find((row) => row.team === match.home_team);
    const away = tables[group].find((row) => row.team === match.away_team);
    if (!home || !away) return;

    home.P += 1;
    away.P += 1;
    home.GF += match.home_score;
    home.GA += match.away_score;
    away.GF += match.away_score;
    away.GA += match.home_score;

    if (match.home_score > match.away_score) {
      home.W += 1;
      away.L += 1;
      home.Pts += 3;
    } else if (match.home_score < match.away_score) {
      away.W += 1;
      home.L += 1;
      away.Pts += 3;
    } else {
      home.D += 1;
      away.D += 1;
      home.Pts += 1;
      away.Pts += 1;
    }

    home.GD = home.GF - home.GA;
    away.GD = away.GF - away.GA;
  });

  Object.keys(tables).forEach((group) => {
    tables[group].sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF || a.team.localeCompare(b.team));
  });

  return tables;
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg,#020617,#0f172a 55%,#111827)',
  color: 'white',
  fontFamily: 'Inter, Arial, sans-serif',
  padding: 18,
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,.08)',
  border: '1px solid rgba(255,255,255,.12)',
  borderRadius: 24,
  padding: 18,
  boxShadow: '0 18px 40px rgba(0,0,0,.25)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,.16)',
  background: '#0f172a',
  color: '#fff',
  boxSizing: 'border-box',
};

const scoreInputStyle: React.CSSProperties = {
  width: 54,
  padding: '10px 8px',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,.16)',
  background: '#d9f99d',
  color: '#020617',
  textAlign: 'center',
  fontWeight: 800,
};

const adminScoreInputStyle: React.CSSProperties = {
  ...scoreInputStyle,
  background: '#fde68a',
};

const buttonStyle: React.CSSProperties = {
  border: 0,
  borderRadius: 16,
  padding: '12px 16px',
  fontWeight: 900,
  cursor: 'pointer',
  background: '#fbbf24',
  color: '#020617',
};

const tdStyle: React.CSSProperties = {
  borderTop: '1px solid rgba(255,255,255,.12)',
  padding: '12px 10px',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
};

const thStyle: React.CSSProperties = {
  borderBottom: '1px solid rgba(255,255,255,.16)',
  color: '#cbd5e1',
  textAlign: 'left',
  padding: 8,
};

export default function MundialPredictor() {
  const [user, setUser] = useState<User | null>(null);
 const [profile, setProfile] = useState<Profile | null>(null);
  const [leagueName, setLeagueName] = useState('');
  const [openPlayerMatches, setOpenPlayerMatches] = useState<Record<number, boolean>>({});
  const [now, setNow] = useState(new Date());
  const [leagueMessages, setLeagueMessages] = useState<LeagueChatMessage[]>([]);
  const [chatText, setChatText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [draftPredictions, setDraftPredictions] = useState<
  Record<number, { pred_home: string; pred_away: string }>
>({});
  const [tab, setTab] = useState('Dashboard');
  const [message, setMessage] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const [bulkText, setBulkText] = useState('');
  const [editingMatches, setEditingMatches] = useState<Record<number, Partial<Match>>>({});
  const [singleMatch, setSingleMatch] = useState({
    match_no: '',
    match_day: '',
    group_name: '',
    home_team: '',
    away_team: '',
    kickoff_at: '',
  });

  async function loadLeagueMessages(leagueId: string) {
  const { data } = await supabase
    .from('league_comments')
    .select('*')
    .eq('league_id', leagueId)
    .order('created_at', { ascending: true });

  if (data) setLeagueMessages(data);
}

async function sendLeagueMessage() {
  if (!profile?.league_id || !user || !chatText.trim()) return;

  const { error } = await supabase.from('league_comments').insert({
    league_id: profile.league_id,
    user_id: user.id,
    comment: chatText.trim(),
  });

  if (!error) {
    setChatText('');
    await loadLeagueMessages(profile.league_id);
  }
}

async function deleteLeagueMessage(messageId: string) {
  if (!profile?.league_id) return;

  await supabase.from('league_comments').delete().eq('id', messageId);
  await loadLeagueMessages(profile.league_id);
}

async function updateLeagueMessage(messageId: string) {
  if (!profile?.league_id || !editingText.trim()) return;

  await supabase
    .from('league_comments')
    .update({ comment: editingText.trim() })
    .eq('id', messageId);

  setEditingMessageId(null);
  setEditingText('');
  await loadLeagueMessages(profile.league_id);
}
 async function loadEverything(activeUser?: User | null) {
  const currentUser = activeUser ?? user;

  const matchesResult = await supabase.from('matches').select('*').order('match_no');
  if (matchesResult.error) {
    setMessage('Matches error: ' + matchesResult.error.message);
    return;
  }

  const predictionsResult = await supabase.from('predictions').select('*');
  if (predictionsResult.error) {
    setMessage('Predictions error: ' + predictionsResult.error.message);
    return;
  }

  const profilesResult = await supabase.from('profiles').select('*').order('username');
  if (profilesResult.error) {
    setMessage('Profiles error: ' + profilesResult.error.message);
    return;
  }

  setMatches(matchesResult.data || []);
  setPredictions(predictionsResult.data || []);
  setProfiles(profilesResult.data || []);

if (currentUser) {
  const profileResult = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .limit(1);

  if (profileResult.error) {
    setMessage('Profile error: ' + profileResult.error.message);
    return;
  }

  if (profileResult.data && profileResult.data.length > 0) {
    setProfile(profileResult.data[0]);
    setMessage('');
  } else {
    setMessage('No profile found.');
  }
}
}
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      loadEverything(sessionUser);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (!sessionUser) setProfile(null);
      loadEverything(sessionUser);
    });

    return () => listener.subscription.unsubscribe();
  }, []);
  
  useEffect(() => {
  const timer = setInterval(() => {
    setNow(new Date());
  }, 60000);

  return () => clearInterval(timer);
}, []);
  useEffect(() => {
  if (!profile?.league_id) return;

  const channel = supabase
    useEffect(() => {
  if (!profile?.league_id) return;

  loadLeagueMessages(profile.league_id);
}, [profile?.league_id, tab]);
    .channel('league-chat')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'league_comments',
        filter: `league_id=eq.${profile.league_id}`,
      },
      () => {
        loadLeagueMessages(profile.league_id);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [profile?.league_id]);

async function login() {
  setMessage('Logging in...');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    setMessage(error.message);
    return;
  }

  const profileResult = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileResult.error) {
    setMessage('Profile error: ' + profileResult.error.message);
    return;
  }

  if (!profileResult.data) {
    setMessage('No profile for auth user id: ' + data.user.id);
    return;
  }

setProfile(profileResult.data);

if (profileResult.data?.league_id) {
  const leagueResult = await supabase
    .from('leagues')
    .select('name')
    .eq('id', profileResult.data.league_id)
    .single();

  if (leagueResult.data) {
    setLeagueName(leagueResult.data.name);
  }
}
if (profileResult.data?.league_id) {
  await loadLeagueMessages(profileResult.data.league_id);
}
setMessage('');
}

  async function signUp() {
    setMessage('');

    const leagueResult = await supabase
  .from('leagues')
  .select('id, name')
  .eq('invite_code', inviteCode.trim())
  .single();

if (leagueResult.error || !leagueResult.data) {
  setMessage('Invalid invite code.');
  return;
}

    if (!username.trim()) {
      setMessage('Please enter a username.');
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
  data: {
    username: username.trim(),
    league_id: leagueResult.data.id,
  },
},
    });

    if (error) setMessage(error.message);
    else setMessage('Signup successful. If email confirmation is required, check your inbox and then log in.');
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  function predictionFor(userId: string, matchId: number) {
    return predictions.find((prediction) => prediction.user_id === userId && prediction.match_id === matchId);
  }

  async function savePrediction(match: Match, field: 'pred_home' | 'pred_away', value: string) {
    if (!user || isLocked(match)) return;
    if (value !== '' && !/^\d{0,2}$/.test(value)) return;

    const existing = predictionFor(user.id, match.id);
    const parsedValue = value === '' ? null : Number(value);

    if (existing) {
      await supabase.from('predictions').update({ [field]: parsedValue, updated_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      await supabase.from('predictions').insert({
        user_id: user.id,
        match_id: match.id,
        pred_home: field === 'pred_home' ? parsedValue : null,
        pred_away: field === 'pred_away' ? parsedValue : null,
      });
    }

    await loadEverything();
  }

  async function saveScore(match: Match, field: 'home_score' | 'away_score', value: string) {
    if (profile?.role !== 'admin') return;
    if (value !== '' && !/^\d{0,2}$/.test(value)) return;

    await supabase.from('matches').update({ [field]: value === '' ? null : Number(value) }).eq('id', match.id);
    await loadEverything();
  }

  async function addSingleMatch() {
    if (profile?.role !== 'admin') return;

    const { error } = await supabase.from('matches').insert({
      match_no: Number(singleMatch.match_no),
      match_day: singleMatch.match_day,
      group_name: singleMatch.group_name || null,
      home_team: singleMatch.home_team.toUpperCase(),
      away_team: singleMatch.away_team.toUpperCase(),
      kickoff_at: new Date(singleMatch.kickoff_at).toISOString(),
    });

    if (error) setMessage(error.message);
    else {
      setMessage('Match added successfully.');
      setSingleMatch({ match_no: '', match_day: '', group_name: '', home_team: '', away_team: '', kickoff_at: '' });
      await loadEverything();
    }
  }
async function updateMatch(match: Match) {
  if (profile?.role !== 'admin') return;

  const draft = editingMatches[match.id];
  if (!draft) return;

  const payload: any = {
    match_no: draft.match_no ?? match.match_no,
    match_day: draft.match_day ?? match.match_day,
    group_name: draft.group_name ?? match.group_name,
    home_team: draft.home_team ?? match.home_team,
    away_team: draft.away_team ?? match.away_team,
    kickoff_at: draft.kickoff_at ?? match.kickoff_at,
  };

  const { error } = await supabase
    .from('matches')
    .update(payload)
    .eq('id', match.id);

  if (error) {
    setMessage(error.message);
    return;
  }

  setEditingMatches((prev) => {
    const next = { ...prev };
    delete next[match.id];
    return next;
  });

  setMessage('Match updated.');
  await loadEverything();
}

async function deleteMatch(match: Match) {
  if (profile?.role !== 'admin') return;

  const confirmed = window.confirm(
    `Delete ${match.home_team} vs ${match.away_team}? This will also delete predictions for this match.`
  );

  if (!confirmed) return;

  const { error } = await supabase
    .from('matches')
    .delete()
    .eq('id', match.id);

  if (error) {
    setMessage(error.message);
    return;
  }

  setMessage('Match deleted.');
  await loadEverything();
}
  async function bulkImport() {
    if (profile?.role !== 'admin') return;

    const rows = bulkText.split('\n').map((row) => row.trim()).filter(Boolean);
    const parsed = rows.map((line) => {
      const [match_no, match_day, group_name, home_team, away_team, kickoff_at] = line.split(',').map((item) => item.trim());
      return {
        match_no: Number(match_no),
        match_day,
        group_name,
        home_team: home_team.toUpperCase(),
        away_team: away_team.toUpperCase(),
        kickoff_at: new Date(kickoff_at).toISOString(),
      };
    });

    const { error } = await supabase.from('matches').insert(parsed);

    if (error) setMessage(error.message);
    else {
      setMessage(`${parsed.length} fixtures imported.`);
      setBulkText('');
      await loadEverything();
    }
  }

  const leaderboard = useMemo(() => {
    return profiles
      .filter((profile) => profile.role !== 'admin')
      .map((profile) => ({
        ...profile,
        points: matches.reduce((sum, match) => sum + predictionPoints(match, predictionFor(profile.id, match.id)), 0),
        exacts: matches.reduce((sum, match) => {
          const prediction = predictionFor(profile.id, match.id);
          return sum + (
            prediction &&
            match.home_score !== null &&
            match.away_score !== null &&
            prediction.pred_home === match.home_score &&
            prediction.pred_away === match.away_score
              ? 1
              : 0
          );
        }, 0),
        submitted: matches.reduce(
  (sum, match) => sum + (isPredictionComplete(predictionFor(profile.id, match.id)) ? 1 : 0),
  0
),
      }))
      .sort((a, b) => b.points - a.points || b.exacts - a.exacts || a.username.localeCompare(b.username));
  }, [profiles, matches, predictions]);

  const groups = useMemo(() => groupStandings(matches), [matches]);

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  if (!user || !profile) {
    return (
      <main style={pageStyle}>
        <div style={{ maxWidth: 460, margin: '40px auto', ...cardStyle }}>
          <h1 style={{ fontSize: 38, margin: '8px 0 4px' }}>Score Predictor</h1>
          <p style={{ color: '#cbd5e1' }}>Login or create an account.</p>

<div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
  <button
    style={{
      ...buttonStyle,
      flex: 1,
      background: authMode === 'login' ? '#fbbf24' : 'rgba(255,255,255,.1)',
      color: authMode === 'login' ? '#020617' : '#fff',
    }}
    onClick={() => setAuthMode('login')}
  >
    Login
  </button>

  <button
    style={{
      ...buttonStyle,
      flex: 1,
      background: authMode === 'signup' ? '#22c55e' : 'rgba(255,255,255,.1)',
      color: authMode === 'signup' ? '#020617' : '#fff',
    }}
    onClick={() => setAuthMode('signup')}
  >
    Sign up
  </button>
</div>

{authMode === 'login' && (
  <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
    <input
      style={inputStyle}
      placeholder="Email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />
    <input
      style={inputStyle}
      placeholder="Password"
      type="password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
    />
    <button style={buttonStyle} onClick={login}>
      Login
    </button>
  </div>
)}

{authMode === 'signup' && (
  <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
    <input
      style={inputStyle}
      placeholder="Email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />
    <input
      style={inputStyle}
      placeholder="Password"
      type="password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
    />
    <input
      style={inputStyle}
      placeholder="Username"
      value={username}
      onChange={(e) => setUsername(e.target.value)}
    />
    <input
      style={inputStyle}
      placeholder="Invite code"
      value={inviteCode}
      onChange={(e) => setInviteCode(e.target.value)}
    />
    <button
      style={{ ...buttonStyle, background: '#22c55e' }}
      onClick={signUp}
    >
      Create account
    </button>
  </div>
)}

{message && <p style={{ color: '#fde68a', marginTop: 16 }}>{message}</p>}
        </div>
      </main>
    );
  }

  const tabs = ['Dashboard', 'Fixtures', 'Predictions', 'Players', 'Leaderboard', 'Groups', 'Chat', 'Instructions'];
  if (profile.role === 'admin') tabs.push('Admin')

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
          <div>
            <h1 style={{ fontSize: 36, margin: '4px 0' }}>Score Predictor</h1>
            <div style={{ color: '#cbd5e1' }}>@{profile.username} · {profile.role === 'admin' ? 'Admin' : 'Player'} · {leagueName}</div>
          </div>
          <button style={{ ...buttonStyle, background: '#334155', color: '#fff' }} onClick={logout}>Logout</button>
        </header>

        <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {tabs.map((item) => (
            <button key={item} onClick={() => {
  setTab(item);

  if (item === 'Chat' && profile?.league_id) {
    loadLeagueMessages(profile.league_id);
  }
}} style={{ ...buttonStyle, background: tab === item ? '#fbbf24' : 'rgba(255,255,255,.1)', color: tab === item ? '#020617' : '#fff' }}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </nav>

        {message && <div style={{ ...cardStyle, borderColor: '#fbbf24', marginBottom: 16, color: '#fde68a' }}>{message}</div>}

        {tab === 'Dashboard' && (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 14 }}>
            {leaderboard.slice(0, 3).map((player, index) => (
              <div key={player.id} style={{ ...cardStyle, textAlign: 'center' }}>
                <div style={{ fontSize: 52 }}>{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</div>
                <h2 style={{ margin: '8px 0', fontSize: 24 }}>{player.username}</h2>
                <div style={{ color: '#fbbf24', fontSize: 44, fontWeight: 900 }}>{player.points}</div>
                <div style={{ color: '#cbd5e1' }}>{player.exacts} exact · {player.submitted} submitted</div>
              </div>
            ))}<div style={{ ...cardStyle }}>
  <h2>My League Snapshot</h2>
  <div style={{ display: 'grid', gap: 10, color: '#cbd5e1' }}>
    <div>📝 Your submissions: {predictions.filter((p) => p.user_id === user?.id && isPredictionComplete(p)).length}</div>
    <div>🎯 Exact scores: {leaderboard.find((p) => p.id === user?.id)?.exacts || 0}</div>
    <div>
      ⏭️ Next match:{' '}
      {matches.find((m) => new Date(m.kickoff_at) > new Date())
        ? `${country(matches.find((m) => new Date(m.kickoff_at) > new Date())!.home_team).name} vs ${country(matches.find((m) => new Date(m.kickoff_at) > new Date())!.away_team).name}`
        : 'No upcoming matches'}
    </div>
  </div>
</div>
          </section>
        )}

        {tab === 'Fixtures' && (
          <section style={cardStyle}>
            <h2>Fixtures</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {matches.map((match) => (
                    <tr key={match.id}>
                      <td style={tdStyle}>{match.match_no}</td>
                      <td style={tdStyle}>{formatLocalTime(match.kickoff_at)} Local</td>
                      <td style={tdStyle}>{match.group_name || '-'}</td>
                      <td style={{ ...tdStyle, fontWeight: 900 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>   {country(match.home_team).flag && (     <img src={country(match.home_team).flag} width={20} height={14} alt="" />   )}   <span>{country(match.home_team).name}</span>    <span>vs</span>    {country(match.away_team).flag && (     <img src={country(match.away_team).flag} width={20} height={14} alt="" />   )}   <span>{country(match.away_team).name}</span> </div></td>
                      <td style={tdStyle}>{match.home_score === null ? '-' : match.home_score} - {match.away_score === null ? '-' : match.away_score}</td>
                      <td style={tdStyle}>{isLocked(match) ? '🔒 Locked' : '🟢 Open'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'Predictions' && (
  <section style={cardStyle}>
    <h2>My Predictions</h2>

    <div style={{ display: 'grid', gap: 14 }}>
      {matches.map((match) => {
        const prediction = predictionFor(user.id, match.id);
        const locked = isLocked(match);

        return (
          <div
            key={match.id}
            style={{
              borderTop: '1px solid rgba(255,255,255,.12)',
              padding: '16px 0',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 14,
              alignItems: 'start',
            }}
          >
            <div>{formatLocalTime(match.kickoff_at)} Local</div>

            <div>
              <div style={{ color: '#cbd5e1', marginBottom: 6 }}>Group {match.group_name}</div>

              <div style={{ display: 'grid', gap: 6, fontWeight: 900 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {country(match.home_team).flag && (
                    <img src={country(match.home_team).flag} width={22} height={15} alt="" />
                  )}
                  <span>{country(match.home_team).name}</span>
                </div>

                <div style={{ color: '#cbd5e1', fontSize: 14 }}>vs</div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {country(match.away_team).flag && (
                    <img src={country(match.away_team).flag} width={22} height={15} alt="" />
                  )}
                  <span>{country(match.away_team).name}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                disabled={locked}
                style={{ ...scoreInputStyle, opacity: locked ? 0.6 : 1 }}
               value={draftPredictions[match.id]?.pred_home ?? prediction?.pred_home ?? ''}
onChange={(e) =>
  setDraftPredictions((prev) => ({
    ...prev,
    [match.id]: {
      pred_home: e.target.value,
      pred_away: prev[match.id]?.pred_away ?? String(prediction?.pred_away ?? ''),
    },
  }))
}
              />
              <span>-</span>
              <input
                disabled={locked}
                style={{ ...scoreInputStyle, opacity: locked ? 0.6 : 1 }}
                value={draftPredictions[match.id]?.pred_away ?? prediction?.pred_away ?? ''}
onChange={(e) =>
  setDraftPredictions((prev) => ({
    ...prev,
    [match.id]: {
      pred_home: prev[match.id]?.pred_home ?? String(prediction?.pred_home ?? ''),
      pred_away: e.target.value,
    },
  }))
}
              />
            <button
  disabled={locked}
  style={{
  ...buttonStyle,
  padding: '10px 14px',
  opacity: locked ? 0.6 : 1,
  minWidth: 95,
}}
  onClick={async () => {   const draft = draftPredictions[match.id];    await savePrediction(match, 'pred_home', draft?.pred_home ?? String(prediction?.pred_home ?? ''));   await savePrediction(match, 'pred_away', draft?.pred_away ?? String(prediction?.pred_away ?? ''));    setMessage('Prediction submitted ✅'); }}
>
  Submit
</button>
</div>

            <div style={{ display: 'grid', gap: 8, minWidth: 120 }}>
  <div>{locked ? '🔒 Locked' : countdownText(match.kickoff_at, now)}</div>

  <div style={{ color: '#fbbf24', fontWeight: 900 }}>
    {predictionPoints(match, prediction)} pts
  </div>
</div>
          </div>
        );
      })}
    </div>
  </section>
)}

       {tab === 'Players' && (
  <section style={cardStyle}>
    <h2>Players submission status</h2>
    <p style={{ color: '#cbd5e1' }}>
      Before kickoff, only submission status is visible. After kickoff, predictions are revealed.
    </p>

    <div style={{ display: 'grid', gap: 14 }}>
      {matches.map((match) => {
        const visible = isLocked(match);
        const distribution = predictionDistribution(match, predictions);
        const playerList = profiles.filter((player) => player.role !== 'admin');
        const submittedCount = playerList.filter((player) =>
          isPredictionComplete(predictionFor(player.id, match.id))
        ).length;

        return (
          <div
            key={match.id}
            style={{
              background: 'rgba(255,255,255,.06)',
              borderRadius: 18,
              padding: 14,
            }}
          >
            <button
              style={{
                width: '100%',
                border: 0,
                background: 'transparent',
                color: '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                fontWeight: 900,
                fontSize: 18,
              }}
              onClick={() =>
                setOpenPlayerMatches((prev) => ({
                  ...prev,
                  [match.id]: !prev[match.id],
                }))
              }
            >
              <span>
                {formatLocalTime(match.kickoff_at)} Local · {' '}
{country(match.home_team).flag && (
  <img src={country(match.home_team).flag} width={20} height={14} alt="" style={{ verticalAlign: 'middle', marginRight: 6 }} />
)}
{country(match.home_team).name}
{' vs '}
{country(match.away_team).flag && (
  <img src={country(match.away_team).flag} width={20} height={14} alt="" style={{ verticalAlign: 'middle', margin: '0 6px' }} />
)}
{country(match.away_team).name}
              </span>

              <span style={{ color: '#fbbf24', whiteSpace: 'nowrap' }}>
                {submittedCount}/{playerList.length} submitted {openPlayerMatches[match.id] ? '▲' : '▼'}
              </span>
            </button>

          {openPlayerMatches[match.id] && (
  <>
    {visible && (
  <div
    style={{
      marginTop: 12,
      padding: 12,
      borderRadius: 14,
      background: 'rgba(251,191,36,.12)',
      fontWeight: 700,
    }}
  >
    Prediction distribution:
    <div style={{ marginTop: 8 }}>
      {country(match.home_team).name} win: {distribution.home}% · Draw: {distribution.draw}% · {country(match.away_team).name} win: {distribution.away}%
    </div>
  </div>
)}
              <div
                style={{
                  marginTop: 12,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
                  gap: 10,
                }}
              >
                {playerList.map((player) => {
                  const prediction = predictionFor(player.id, match.id);

                  return (
                    <div
                      key={player.id}
                      style={{
                        padding: 10,
                        borderRadius: 14,
                        background: 'rgba(255,255,255,.08)',
                      }}
                    >
                      <b>@{player.username}</b>
                      <br />

                      {isPredictionComplete(prediction)
                        ? visible
                          ? `${prediction!.pred_home} - ${prediction!.pred_away}`
                          : 'Submitted ✅'
                        : 'Not submitted ⏳'}
                    </div>
                  );
                })}
              </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  </section>
)}
        {tab === 'Leaderboard' && (
  <section style={cardStyle}>
    <h2>Leaderboard</h2>
        {leaderboard.map((player, index) => {
  const badges = playerBadges(player.id, matches, predictions);

  return (
    <div
      key={player.id}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        borderTop: '1px solid rgba(255,255,255,.12)',
        padding: 12,
      }}
    >
      <div>
        <b>{index + 1}. @{player.username}</b>

        {badges.length > 0 && (
          <div style={{ marginTop: 6, color: '#cbd5e1', fontSize: 14 }}>
            {badges.join(' · ')}
          </div>
        )}
      </div>

      <span style={{ color: '#fbbf24', fontWeight: 900 }}>{player.points} pts</span>
    </div>
  );
})}
      </section>
  )}

        {tab === 'Groups' && (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14 }}>
            {Object.entries(groups).map(([group, rows]: any) => (
              <div key={group} style={cardStyle}>
                <h2 style={{ color: '#fbbf24' }}>Group {group}</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
  <th style={{ ...thStyle, width: '60%' }}>Team</th>
  <th style={{ ...thStyle, width: '13%' }}>P</th>
  <th style={{ ...thStyle, width: '13%' }}>GD</th>
  <th style={{ ...thStyle, width: '14%' }}>Pts</th>
</tr>
                  </thead>
                  <tbody>
                    {rows.map((row: any) => (
                      <tr key={row.team}>
                       <td style={{ ...tdStyle, minWidth: 0 }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
    {country(row.team).flag && (
      <img
        src={country(row.team).flag}
        width={20}
        height={14}
        alt=""
        style={{ flexShrink: 0 }}
      />
    )}
    <b
      style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        minWidth: 0,
      }}
    >
      {country(row.team).name}
    </b>
  </div>
</td>
                        <td style={tdStyle}>{row.P}</td>
                        <td style={tdStyle}>{row.GD}</td>
                        <td style={{ ...tdStyle, color: '#fbbf24', fontWeight: 900 }}>{row.Pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </section>
        )}

        {tab === 'Chat' && (
  <section style={cardStyle}>
    <h2>League Chat</h2>
    
    <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
      {leagueMessages.map((message) => {
        const sender = profiles.find((p) => p.id === message.user_id);

        return (
          <div
            key={message.id}
            style={{
              padding: 12,
              borderRadius: 14,
              background: 'rgba(255,255,255,.08)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
  <b>@{sender?.username || 'Unknown'}</b>

  {(message.user_id === user?.id || profile?.role === 'admin') && (
    <div style={{ display: 'flex', gap: 8 }}>
      {message.user_id === user?.id && (
        <button
          style={{ ...buttonStyle, padding: '6px 10px' }}
          onClick={() => {
            setEditingMessageId(message.id);
            setEditingText(message.comment);
          }}
        >
          Edit
        </button>
      )}

      <button
        style={{ ...buttonStyle, padding: '6px 10px', background: '#ef4444', color: '#fff' }}
        onClick={() => deleteLeagueMessage(message.id)}
      >
        Delete
      </button>
    </div>
  )}
</div>

{editingMessageId === message.id ? (
  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
    <input
      style={inputStyle}
      value={editingText}
      onChange={(e) => setEditingText(e.target.value)}
    />
    <button
      style={{ ...buttonStyle, padding: '8px 12px' }}
      onClick={() => updateLeagueMessage(message.id)}
    >
      Save
    </button>
    <button
      style={{ ...buttonStyle, padding: '8px 12px', background: '#334155', color: '#fff' }}
      onClick={() => {
        setEditingMessageId(null);
        setEditingText('');
      }}
    >
      Cancel
    </button>
  </div>
) : (
  <div style={{ marginTop: 4 }}>{message.comment}</div>
)}
          </div>
        );
      })}
    </div>

    <div style={{ display: 'flex', gap: 10 }}>
      <input
        style={inputStyle}
        placeholder="Write a message..."
        value={chatText}
        onChange={(e) => setChatText(e.target.value)}
      />

      <button style={buttonStyle} onClick={sendLeagueMessage}>
  Send
</button>
    </div>
  </section>
)}

        {tab === 'Instructions' && (
  <section style={{ display: 'grid', gap: 20 }}>
    <div style={cardStyle}>
      <h2>Instructions 🇬🇧</h2>

      <ol style={{ lineHeight: 1.8 }}>
        <li>Go to <b>Predictions</b> and submit your score predictions before kickoff.</li>
        <li>You can edit or delete your prediction until the match starts.</li>
        <li>Once kickoff begins, predictions are locked automatically.</li>
        <li>Before kickoff, other players only see <b>Submitted</b>.</li>
        <li>After kickoff, all predictions become visible to everyone.</li>
        <li>
          Scoring system:
          <ul>
            <li>Exact score = <b>3 points</b></li>
            <li>Correct winner / draw = <b>1 point</b></li>
            <li>Wrong prediction = <b>0 points</b></li>
          </ul>
        </li>
        <li>Leaderboard updates automatically after results are entered.</li>
        <li>All match times are shown in <b>your local timezone</b>.</li>
      </ol>
    </div>

    <div style={cardStyle}>
      <h2>Οδηγίες 🇬🇷</h2>

      <ol style={{ lineHeight: 1.8 }}>
        <li>Πήγαινε στο <b>Predictions</b> και βάλε τις προβλέψεις σου πριν την έναρξη του αγώνα.</li>
        <li>Μπορείς να αλλάξεις ή να διαγράψεις πρόβλεψη μέχρι να ξεκινήσει ο αγώνας.</li>
        <li>Με την έναρξη του αγώνα οι προβλέψεις κλειδώνουν αυτόματα.</li>
        <li>Πριν την έναρξη οι άλλοι βλέπουν μόνο <b>Submitted</b>.</li>
        <li>Μετά την έναρξη όλες οι προβλέψεις γίνονται ορατές.</li>
        <li>
          Σύστημα βαθμών:
          <ul>
            <li>Ακριβές σκορ = <b>3 βαθμοί</b></li>
            <li>Σωστό αποτέλεσμα (νίκη / ισοπαλία) = <b>1 βαθμός</b></li>
            <li>Λάθος πρόβλεψη = <b>0 βαθμοί</b></li>
          </ul>
        </li>
        <li>Το leaderboard ενημερώνεται αυτόματα μόλις μπουν τα αποτελέσματα.</li>
        <li>Όλες οι ώρες εμφανίζονται στη <b>δική σου τοπική ώρα</b>.</li>
      </ol>
    </div>
  </section>
)}
        
        {tab === 'Admin' && profile.role === 'admin' && (
          <section style={{ display: 'grid', gap: 14 }}>
            <div style={cardStyle}>
              <h2>Admin: Add match</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10 }}>
                {Object.keys(singleMatch).map((key) => (
                  <input key={key} style={inputStyle} placeholder={key} value={(singleMatch as any)[key]} onChange={(e) => setSingleMatch({ ...singleMatch, [key]: e.target.value })} />
                ))}
              </div>
              <button style={{ ...buttonStyle, marginTop: 10 }} onClick={addSingleMatch}>Add match</button>
            </div>
<div style={{ marginTop: 24 }}>
  <h2>Manage matches</h2>

  <div style={{ display: 'grid', gap: 12 }}>
    {matches.map((match) => {
      const draft = editingMatches[match.id] || {};

      return (
        <div
          key={match.id}
          style={{
            ...cardStyle,
            padding: 16,
            display: 'grid',
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 800 }}>
            #{match.match_no} — <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>   {country(match.home_team).flag && (     <img src={country(match.home_team).flag} width={20} height={14} alt="" />   )}   <span>{country(match.home_team).name}</span>    <span>vs</span>    {country(match.away_team).flag && (     <img src={country(match.away_team).flag} width={20} height={14} alt="" />   )}   <span>{country(match.away_team).name}</span> </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <input
              style={inputStyle}
              placeholder="Match no"
              value={draft.match_no ?? match.match_no}
              onChange={(e) =>
                setEditingMatches((prev) => ({
                  ...prev,
                  [match.id]: {
                    ...prev[match.id],
                    match_no: Number(e.target.value),
                  },
                }))
              }
            />

            <input
              style={inputStyle}
              placeholder="Day"
              value={draft.match_day ?? match.match_day}
              onChange={(e) =>
                setEditingMatches((prev) => ({
                  ...prev,
                  [match.id]: {
                    ...prev[match.id],
                    match_day: e.target.value,
                  },
                }))
              }
            />

            <input
              style={inputStyle}
              placeholder="Group"
              value={draft.group_name ?? match.group_name ?? ''}
              onChange={(e) =>
                setEditingMatches((prev) => ({
                  ...prev,
                  [match.id]: {
                    ...prev[match.id],
                    group_name: e.target.value,
                  },
                }))
              }
            />

            <input
              style={inputStyle}
              placeholder="Home"
              value={draft.home_team ?? match.home_team}
              onChange={(e) =>
                setEditingMatches((prev) => ({
                  ...prev,
                  [match.id]: {
                    ...prev[match.id],
                    home_team: e.target.value,
                  },
                }))
              }
            />

            <input
              style={inputStyle}
              placeholder="Away"
              value={draft.away_team ?? match.away_team}
              onChange={(e) =>
                setEditingMatches((prev) => ({
                  ...prev,
                  [match.id]: {
                    ...prev[match.id],
                    away_team: e.target.value,
                  },
                }))
              }
            />

            <input
              style={inputStyle}
              placeholder="Kickoff"
              value={draft.kickoff_at ?? match.kickoff_at}
              onChange={(e) =>
                setEditingMatches((prev) => ({
                  ...prev,
                  [match.id]: {
                    ...prev[match.id],
                    kickoff_at: e.target.value,
                  },
                }))
              }
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              style={buttonStyle}
              onClick={() => updateMatch(match)}
            >
              Save
            </button>

            <button
              style={{ ...buttonStyle, background: '#aa2222' }}
              onClick={() => deleteMatch(match)}
            >
              Delete
            </button>
          </div>
        </div>
      );
    })}
  </div>
</div>
            <div style={cardStyle}>
              <h2>Admin: Bulk import</h2>
              <p style={{ color: '#cbd5e1' }}>Format per line: match_no,match_day,group,home,away,kickoff_at</p>
              <textarea style={{ ...inputStyle, minHeight: 150 }} value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder={'1,Πέμπτη 11 Ιουνίου,A,MEX,RSA,2026-06-11T19:00:00Z'} />
              <button style={{ ...buttonStyle, marginTop: 10 }} onClick={bulkImport}>Import</button>
            </div>

            <div style={cardStyle}>
              <h2>Admin: Results</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {matches.map((match) => (
                      <tr key={match.id}>
                        <td style={tdStyle}>{match.match_no}</td>
                        <td style={tdStyle}>{match.match_day}</td>
                        <td style={{ ...tdStyle, fontWeight: 900 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>   {country(match.home_team).flag && (     <img src={country(match.home_team).flag} width={20} height={14} alt="" />   )}   <span>{country(match.home_team).name}</span>    <span>vs</span>    {country(match.away_team).flag && (     <img src={country(match.away_team).flag} width={20} height={14} alt="" />   )}   <span>{country(match.away_team).name}</span> </div></td>
                        <td style={tdStyle}>
                          <input style={adminScoreInputStyle} value={match.home_score ?? ''} onChange={(e) => saveScore(match, 'home_score', e.target.value)} />
                          <span style={{ margin: '0 8px' }}>-</span>
                          <input style={adminScoreInputStyle} value={match.away_score ?? ''} onChange={(e) => saveScore(match, 'away_score', e.target.value)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

