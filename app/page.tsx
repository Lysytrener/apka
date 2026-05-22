// force redeploy
"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Dumbbell, History, PlayCircle, Plus, Save, Search, Trash2, Users } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const groups = ["Klatka", "Plecy", "Barki", "Nogi", "Pośladki", "Brzuch", "Ramiona"];

const exercises = [
  { id: "bench", name: "Wyciskanie sztangi leżąc", group: "Klatka", equipment: "Sztanga / ławka", muscles: "Klatka, triceps, przedni akton barków", video: "https://www.youtube.com/embed/dQw4w9WgXcQ", desc: "Ściągnij łopatki, ustaw stabilnie stopy i prowadź sztangę kontrolowanie do klatki. Wyciskaj bez odrywania pośladków od ławki." },
  { id: "pulldown", name: "Ściąganie drążka wyciągu górnego", group: "Plecy", equipment: "Wyciąg górny", muscles: "Najszerszy grzbietu, biceps", video: "https://www.youtube.com/embed/dQw4w9WgXcQ", desc: "Zacznij od pracy łopatek, prowadź łokcie w dół i nie bujaj tułowiem. Kontroluj pełny zakres ruchu." },
  { id: "squat", name: "Przysiad ze sztangą", group: "Nogi", equipment: "Sztanga / rack", muscles: "Czworogłowe uda, pośladki, core", video: "https://www.youtube.com/embed/dQw4w9WgXcQ", desc: "Napnij brzuch, utrzymaj całą stopę na podłożu i prowadź kolana zgodnie z linią palców." },
  { id: "rdl", name: "Martwy ciąg rumuński", group: "Pośladki", equipment: "Sztanga / hantle", muscles: "Dwugłowe uda, pośladki, prostowniki", video: "https://www.youtube.com/embed/dQw4w9WgXcQ", desc: "Cofaj biodra, utrzymuj neutralny kręgosłup i prowadź ciężar blisko nóg." },
  { id: "raise", name: "Unoszenie hantli bokiem", group: "Barki", equipment: "Hantle", muscles: "Boczny akton barków", video: "https://www.youtube.com/embed/dQw4w9WgXcQ", desc: "Nie szarp ciężaru. Unieś łokcie do linii barków i kontroluj opuszczanie." },
  { id: "plank", name: "Plank", group: "Brzuch", equipment: "Masa ciała", muscles: "Core, brzuch, pośladki", video: "https://www.youtube.com/embed/dQw4w9WgXcQ", desc: "Podwiń miednicę, napnij pośladki i utrzymuj żebra w dole." }
];

const initialPlan = [
  { id: 1, exerciseId: "bench", sets: 4, reps: 8, weight: 80, rest: 150 },
  { id: 2, exerciseId: "pulldown", sets: 4, reps: 10, weight: 60, rest: 120 },
  { id: 3, exerciseId: "rdl", sets: 3, reps: 8, weight: 90, rest: 180 }
];

type Client = {
  id: string;
  created_at?: string;
  name: string;
  email: string;
  notes?: string | null;
};

function kg(n: number) {
  return `${Number(n).toFixed(n % 1 ? 2 : 0)} kg`;
}

export default function Home() {
  const [tab, setTab] = useState("clients");
  const [group, setGroup] = useState("Klatka");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(exercises[0]);
  const [plan, setPlan] = useState(initialPlan);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [message, setMessage] = useState("");

  const filtered = exercises.filter(e => e.group === group && e.name.toLowerCase().includes(query.toLowerCase()));
  const planRows = plan.map(row => ({ ...row, exercise: exercises.find(e => e.id === row.exerciseId)! }));
  const totalVolume = useMemo(() => planRows.reduce((sum, r) => sum + r.sets * r.reps * r.weight, 0), [planRows]);

  async function loadClients() {
    if (!supabase) {
      setMessage("Brak połączenia z Supabase. Sprawdź Environment Variables w Vercel.");
      return;
    }

    setLoadingClients(true);
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Błąd pobierania podopiecznych: " + error.message);
    } else {
      setClients(data || []);
      setMessage("");
    }
    setLoadingClients(false);
  }

  async function addClient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) {
      setMessage("Brak połączenia z Supabase. Sprawdź Environment Variables w Vercel.");
      return;
    }

    if (!clientName.trim() || !clientEmail.trim()) {
      setMessage("Wpisz imię/nazwę i e-mail podopiecznego.");
      return;
    }

    const { error } = await supabase.from("clients").insert({
      name: clientName.trim(),
      email: clientEmail.trim(),
      notes: clientNotes.trim() || null
    });

    if (error) {
      setMessage("Nie udało się dodać podopiecznego: " + error.message);
      return;
    }

    setClientName("");
    setClientEmail("");
    setClientNotes("");
    setMessage("Podopieczny dodany ✅");
    await loadClients();
  }

  async function deleteClient(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) setMessage("Nie udało się usunąć: " + error.message);
    else {
      setMessage("Podopieczny usunięty.");
      await loadClients();
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  function update(id: number, field: "sets" | "reps" | "weight" | "rest", value: string) {
    setPlan(prev => prev.map(row => row.id === id ? { ...row, [field]: Number(value) } : row));
  }

  function addExercise(id: string) {
    setPlan(prev => [...prev, { id: Date.now(), exerciseId: id, sets: 3, reps: 10, weight: 20, rest: 90 }]);
    setTab("plan");
  }

  return (
    <main>
      <header className="hero">
        <div>
          <div className="badge"><Dumbbell size={16}/> Łysy Trener App</div>
          <h1>Panel trenera, atlas ćwiczeń i plany online</h1>
          <p>Aplikacja WWW: podopieczni, ćwiczenia, progresja ciężaru co 1,25 kg, historia i objętość treningowa.</p>
        </div>
        <div className="stats">
          <div><strong>{clients.length || 0}</strong><span>podopiecznych</span></div>
          <div><strong>600+</strong><span>docelowo ćwiczeń</span></div>
          <div><strong>{kg(totalVolume)}</strong><span>objętość planu</span></div>
        </div>
      </header>

      <nav className="tabs">
        <button onClick={() => setTab("clients")} className={tab === "clients" ? "active" : ""}><Users size={18}/> Podopieczni</button>
        <button onClick={() => setTab("atlas")} className={tab === "atlas" ? "active" : ""}><PlayCircle size={18}/> Atlas</button>
        <button onClick={() => setTab("plan")} className={tab === "plan" ? "active" : ""}><Plus size={18}/> Plan</button>
        <button onClick={() => setTab("history")} className={tab === "history" ? "active" : ""}><History size={18}/> Historia</button>
      </nav>

      {message && <div className="notice">{message}</div>}

      {tab === "clients" && (
        <>
          <section className="card">
            <div className="sectionHead">
              <div>
                <h2>Dodaj podopiecznego</h2>
                <p>Dane zapiszą się w tabeli Supabase: clients.</p>
              </div>
            </div>
            <form className="clientForm" onSubmit={addClient}>
              <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Imię i nazwisko" />
              <input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="E-mail" type="email" />
              <input value={clientNotes} onChange={e => setClientNotes(e.target.value)} placeholder="Notatka / cel, np. masa, redukcja" />
              <button type="submit"><Plus size={18}/> Dodaj podopiecznego</button>
            </form>
          </section>

          <section className="grid3">
            {loadingClients && <article className="card"><h2>Ładowanie...</h2></article>}
            {!loadingClients && clients.length === 0 && <article className="card"><h2>Brak podopiecznych</h2><p>Dodaj pierwszego powyżej.</p></article>}
            {clients.map(c => (
              <article className="card" key={c.id}>
                <h2>{c.name}</h2>
                <p>Email: {c.email}</p>
                <p>Notatka: {c.notes || "Brak"}</p>
                <CheckCircle2 className="yellow"/>
                <button className="danger" onClick={() => deleteClient(c.id)}><Trash2 size={16}/> Usuń</button>
              </article>
            ))}
          </section>
        </>
      )}

      {tab === "atlas" && (
        <section className="layout">
          <aside className="card">
            <div className="search"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Szukaj ćwiczenia" /></div>
            {groups.map(g => <button key={g} onClick={() => setGroup(g)} className={"group " + (g === group ? "active" : "")}>{g}</button>)}
          </aside>
          <div className="list">
            {filtered.map(e => <article key={e.id} className="card exercise" onClick={() => setSelected(e)}>
              <h2>{e.name}</h2><p>{e.equipment}</p><button onClick={(ev) => { ev.stopPropagation(); addExercise(e.id); }}><Plus size={16}/> Dodaj do planu</button>
            </article>)}
          </div>
          <article className="card detail">
            <iframe src={selected.video} title={selected.name} />
            <div className="badge">{selected.group}</div>
            <h2>{selected.name}</h2>
            <p><strong>Mięśnie:</strong> {selected.muscles}</p>
            <p>{selected.desc}</p>
          </article>
        </section>
      )}

      {tab === "plan" && (
        <section className="card">
          <div className="sectionHead"><div><h2>Plan treningowy</h2><p>Kliknij nazwę ćwiczenia, aby wrócić do instrukcji w atlasie.</p></div><button><Save size={18}/> Zapisz trening</button></div>
          <div className="table">
            <div className="row head"><span>Ćwiczenie</span><span>Serie</span><span>Powt.</span><span>Ciężar</span><span>Przerwa</span><span>Objętość</span><span></span></div>
            {planRows.map(r => <div className="row" key={r.id}>
              <button className="link" onClick={() => { setSelected(r.exercise); setTab("atlas"); }}>{r.exercise.name}</button>
              <input type="number" value={r.sets} onChange={e => update(r.id, "sets", e.target.value)} />
              <input type="number" value={r.reps} onChange={e => update(r.id, "reps", e.target.value)} />
              <input type="number" step="1.25" value={r.weight} onChange={e => update(r.id, "weight", e.target.value)} />
              <input type="number" step="15" value={r.rest} onChange={e => update(r.id, "rest", e.target.value)} />
              <strong>{kg(r.sets * r.reps * r.weight)}</strong>
              <button className="icon" onClick={() => setPlan(prev => prev.filter(x => x.id !== r.id))}><Trash2 size={18}/></button>
            </div>)}
          </div>
          <div className="total"><span>Suma objętości</span><strong>{kg(totalVolume)}</strong></div>
        </section>
      )}

      {tab === "history" && (
        <section className="card">
          <h2>Historia treningów</h2>
          {[
            ["2026-05-20", "Wyciskanie sztangi leżąc", "4 × 8", "80 kg", "2560 kg"],
            ["2026-05-13", "Wyciskanie sztangi leżąc", "4 × 8", "77.5 kg", "2480 kg"],
            ["2026-05-06", "Wyciskanie sztangi leżąc", "4 × 8", "75 kg", "2400 kg"]
          ].map((r) => <div className="history" key={r.join("-")}><CalendarDays size={18}/><span>{r[0]}</span><strong>{r[1]}</strong><span>{r[2]}</span><span>{r[3]}</span><strong>{r[4]}</strong></div>)}
        </section>
      )}
    </main>
  );
}
