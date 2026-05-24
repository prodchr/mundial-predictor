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

function isLocked(match: Match) {
  const now = new Date();

  const kickoff = new Date(
    new Date(match.kickoff_at).toLocaleString('en-US', {
      timeZone: 'Asia/Nicosia',
    })
  );

  const cyNow = new Date(
    now.toLocaleString('en-US', {
      timeZone: 'Asia/Nicosia',
    })
  );

  return cyNow >= kickoff;
}

function formatCyprusTime(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Nicosia',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}
function isPredictionComplete(prediction?: Prediction) {
  return !!prediction && prediction.pred_home !== null && prediction.pred_away !== null;
}
function formatCyprusTime(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Nicosia',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
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
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [tab, setTab] = useState('dashboard');
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

async function login() {
  setMessage('Προσπαθώ να κάνω login...');

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

  setUser(data.user);
  setProfile(profileResult.data);
  setMessage('');
}

  async function signUp() {
    setMessage('');

    const settings = await supabase.from('app_settings').select('invite_code').eq('id', 1).single();
    if (!settings.data || settings.data.invite_code !== inviteCode.trim()) {
      setMessage('Λάθος invite code.');
      return;
    }

    if (!username.trim()) {
      setMessage('Βάλε username.');
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: username.trim() } },
    });

    if (error) setMessage(error.message);
    else setMessage('Signup έγινε. Αν ζητήσει email confirmation, έλεγξε το email σου και μετά κάνε login.');
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
      setMessage('Ο αγώνας προστέθηκε.');
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

  if (!user || !profile) {
    return (
      <main style={pageStyle}>
        <div style={{ maxWidth: 460, margin: '40px auto', ...cardStyle }}>
          <div style={{ color: '#fbbf24', fontWeight: 900, letterSpacing: 2 }}>WORLD CUP 2026</div>
          <h1 style={{ fontSize: 38, margin: '8px 0 4px' }}>Mundial Predictor</h1>
          <p style={{ color: '#cbd5e1' }}>Login ή δημιούργησε account.</p>

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

  const tabs = ['dashboard', 'fixtures', 'predictions', 'players', 'leaderboard', 'groups'];
  if (profile.role === 'admin') tabs.push('admin');

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
          <div>
            <div style={{ color: '#fbbf24', fontWeight: 900, letterSpacing: 2 }}>WORLD CUP 2026</div>
            <h1 style={{ fontSize: 36, margin: '4px 0' }}>Mundial Predictor</h1>
            <div style={{ color: '#cbd5e1' }}>@{profile.username} · {profile.role === 'admin' ? 'Admin' : 'Player'}</div>
          </div>
          <button style={{ ...buttonStyle, background: '#334155', color: '#fff' }} onClick={logout}>Logout</button>
        </header>

        <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {tabs.map((item) => (
            <button key={item} onClick={() => setTab(item)} style={{ ...buttonStyle, background: tab === item ? '#fbbf24' : 'rgba(255,255,255,.1)', color: tab === item ? '#020617' : '#fff' }}>
              {item}
            </button>
          ))}
        </nav>

        {message && <div style={{ ...cardStyle, borderColor: '#fbbf24', marginBottom: 16, color: '#fde68a' }}>{message}</div>}

        {tab === 'dashboard' && (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
            {leaderboard.slice(0, 3).map((player, index) => (
              <div key={player.id} style={{ ...cardStyle, textAlign: 'center' }}>
                <div style={{ fontSize: 52 }}>{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</div>
                <h2 style={{ margin: '8px 0', fontSize: 24 }}>{player.username}</h2>
                <div style={{ color: '#fbbf24', fontSize: 44, fontWeight: 900 }}>{player.points}</div>
                <div style={{ color: '#cbd5e1' }}>{player.exacts} exact · {player.submitted} submitted</div>
              </div>
            ))}
          </section>
        )}

        {tab === 'fixtures' && (
          <section style={cardStyle}>
            <h2>Fixtures</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {matches.map((match) => (
                    <tr key={match.id}>
                      <td style={tdStyle}>{match.match_no}</td>
                      <td style={tdStyle}>{formatCyprusTime(match.kickoff_at)} CY</td>
                      <td style={tdStyle}>{match.group_name || '-'}</td>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>{match.home_team} vs {match.away_team}</td>
                      <td style={tdStyle}>{match.home_score === null ? '-' : match.home_score} - {match.away_score === null ? '-' : match.away_score}</td>
                      <td style={tdStyle}>{isLocked(match) ? '🔒 Locked' : '🟢 Open'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'predictions' && (
          <section style={cardStyle}>
            <h2>Οι προβλέψεις μου</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {matches.map((match) => {
                    const prediction = predictionFor(user.id, match.id);
                    const locked = isLocked(match);
                    return (
                      <tr key={match.id}>
                        <td style={tdStyle}>{formatCyprusTime(match.kickoff_at)} CY</td>
                        <td style={tdStyle}>{match.group_name}</td>
                        <td style={{ ...tdStyle, fontWeight: 900 }}>{match.home_team} vs {match.away_team}</td>
                        <td style={tdStyle}>
                          <input disabled={locked} style={{ ...scoreInputStyle, opacity: locked ? 0.6 : 1 }} value={prediction?.pred_home ?? ''} onChange={(e) => savePrediction(match, 'pred_home', e.target.value)} />
                          <span style={{ margin: '0 8px' }}>-</span>
                          <input disabled={locked} style={{ ...scoreInputStyle, opacity: locked ? 0.6 : 1 }} value={prediction?.pred_away ?? ''} onChange={(e) => savePrediction(match, 'pred_away', e.target.value)} />
                        </td>
                        <td style={tdStyle}>{locked ? '🔒 Locked' : '🟢 Open'}</td>
                        <td style={{ ...tdStyle, color: '#fbbf24', fontWeight: 900 }}>{predictionPoints(match, prediction)} pts</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'players' && (
          <section style={cardStyle}>
            <h2>Players submission status</h2>
            <p style={{ color: '#cbd5e1' }}>Πριν το kickoff φαίνεται μόνο αν συμπληρώθηκε. Μετά το kickoff φαίνεται και το σκορ.</p>
            <div style={{ display: 'grid', gap: 14 }}>
              {matches.map((match) => (
                <div key={match.id} style={{ background: 'rgba(255,255,255,.06)', borderRadius: 18, padding: 14 }}>
                  <h3>{formatCyprusTime(match.kickoff_at)} CY · {match.home_team} vs {match.away_team}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 8 }}>
                    {profiles.filter((player) => player.role !== 'admin').map((player) => {
                      const prediction = predictionFor(player.id, match.id);
                      const visible = isLocked(match);
                      return (
                        <div key={player.id} style={{ padding: 10, borderRadius: 14, background: 'rgba(255,255,255,.08)' }}>
                          <b>@{player.username}</b><br />
                          {isPredictionComplete(prediction)
  ? (visible ? `${prediction!.pred_home} - ${prediction!.pred_away}` : 'Submitted ✅')
  : 'Not submitted ⏳'}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'leaderboard' && (
          <section style={cardStyle}>
            <h2>Leaderboard</h2>
            {leaderboard.map((player, index) => (
              <div key={player.id} style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,.12)', padding: '14px 0' }}>
                <b>{index + 1}. @{player.username}</b>
                <span style={{ color: '#fbbf24', fontWeight: 900 }}>{player.points} pts</span>
              </div>
            ))}
          </section>
        )}

        {tab === 'groups' && (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14 }}>
            {Object.entries(groups).map(([group, rows]: any) => (
              <div key={group} style={cardStyle}>
                <h2 style={{ color: '#fbbf24' }}>Group {group}</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr><th style={thStyle}>Team</th><th style={thStyle}>P</th><th style={thStyle}>GD</th><th style={thStyle}>Pts</th></tr>
                  </thead>
                  <tbody>
                    {rows.map((row: any) => (
                      <tr key={row.team}>
                        <td style={tdStyle}><b>{row.team}</b></td>
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

        {tab === 'admin' && profile.role === 'admin' && (
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
            #{match.match_no} — {match.home_team} vs {match.away_team}
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
              <p style={{ color: '#cbd5e1' }}>Format ανά γραμμή: match_no,match_day,group,home,away,kickoff_at</p>
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
                        <td style={{ ...tdStyle, fontWeight: 900 }}>{match.home_team} vs {match.away_team}</td>
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

