import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const PORT = process.env.PORT || 3000;

console.log("PORT:", process.env.PORT);
console.log("URL:", process.env.SUPABASE_URL);
console.log("KEY:", process.env.SUPABASE_KEY ? "OK" : "MISSING");

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// GET - Start API Message
app.get("/", async (req, res) => {
  const { error } = await supabase.from("Campagne").select("Nome");
  if (error) return res.status(500).json({ error: error.message, errorMessage: "Nessuna campagna trovata" });
  const message = {
    message: 'DrawSteel Plugin Backend and Database are Working!',
    comands: '*/campagne - GET - Tutte le campagne',
    comands2: '*/abilitaGeneriche - GET - Tutte le categorie di abilita generiche',
    comands3: '*/personaggi/:idCampagna - GET - Tutti i giocatori per campagna',
    comands4: '*/abilita/:idGiocatore - GET - Tutte le abilita specifiche per giocatore',
    comands5: '*/abilita/:nomeAbilita - GET - Tutte le informazioni per singola abilita generica',
    comands6: '*/abilita/:idGiocatore/:nomeAbilita - GET - Tutte le informazioni per singola abilita specifiche di un giocatore'
  };
  res.json(message);
});

// GET - Tutte le campagne
app.get("/campagne", async (req, res) => {
  const { data, error } = await supabase.from("Campagne").select("Nome");
  if (error) return res.status(500).json({ error: error.message, errorMessage: "Nessuna campagna trovata" });
  res.json(data);
});

// GET - Tutte le categorie di abilita generiche
app.get("/abilitaGeneriche", async (req, res) => {
  const { data, error } = await supabase.rpc("get_distinct_categorie");
  if (error) return res.status(500).json({ error: error.message, errorMessage: "Nessuna abilita generica trovata" });

  const uniqueCategorie = [...new Set(data.map(item => item.Categoria))];
  res.json(uniqueCategorie);
});

// GET - Tutti i giocatori per campagna
app.get("/personaggi/:idCampagna", async (req, res) => {
  const { idCampagna } = req.params;
  const { data, error } = await supabase
    .from("Giocatori")
    .select("Nome")
    .eq("Id_Campagna", idCampagna);

  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0)
    return res.status(404).json({ error: `Nessun giocatore trovato per il seguente id campagna: ${idCampagna}` });

  res.json(data);
});

// GET - Tutte le abilita specifiche per giocatore
app.get("/abilita/:idGiocatore", async (req, res) => {
  const { idGiocatore } = req.params;
  const { data, error } = await supabase
    .from("Abilità_Specifiche")
    .select("Nome")
    .eq("Id_Giocatore", idGiocatore);

  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0)
    return res.status(404).json({ error: `Nessuna abilità trovata per il seguente id giocatore: ${idGiocatore}` });

  res.json(data);
});

// GET - Tutte le informazioni per singola abilita generica
app.get("/abilita", async (req, res) => {
  const nomeAbilita = req.query.nome;
  if (!nomeAbilita) return res.status(400).json({ error: "Nessun nome abilita passato nella richiesta" });

  const { data, error } = await supabase
    .from("Abilità_Generiche")
    .select("*")
    .eq("Nome", nomeAbilita)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data)
    return res.status(404).json({ error: `Nessuna info trovata per la seguente abilità: ${nomeAbilita}` });

  res.json(data);
});

// GET - Tutte le informazioni per singola abilita specifiche di un giocatore
app.get("/abilita/:idGiocatore/:nomeAbilita", async (req, res) => {
  const { idGiocatore, nomeAbilita } = req.params;
  const { data, error } = await supabase
    .from("Abilità_Specifiche")
    .select("*")
    .eq("Id_Giocatore", idGiocatore)
    .eq("Nome", nomeAbilita)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data)
    return res.status(404).json({ error: `Nessuna info trovata per la seguente abilità: ${nomeAbilita} per il seguente giocatore: ${idGiocatore}` });

  res.json(data);
});

// POST - Aggiungi nuova Campagna
app.post("/campagna", async (req, res) => {
  const payload = req.body;

  const requiredFields = [
    "Nome"
  ];

  for (const field of requiredFields) {
    if (payload[field] == null) {
      return res.status(400).json({ error: `Campo mancante: ${field}` });
    }
  }

  const { error } = await supabase
    .from("Campagne")
    .insert([payload]);

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json({ message: `Campagna: ${payload[Nome]}, inserita con successo` });
});

// POST - Aggiungi nuovo Giocatore
app.post("/giocatore", async (req, res) => {
  const payload = req.body;

  const requiredFields = [
    "Nome",
    "Id_Campagna"
  ];

  for (const field of requiredFields) {
    if (payload[field] == null) {
      return res.status(400).json({ error: `Campo mancante: ${field}` });
    }
  }

  const { error } = await supabase
    .from("Giocatori")
    .insert([payload]);

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json({ message: `Giocatore: ${payload[Nome]} per la campagna ${payload[Id_Campagna]}, inserito con successo` });
});

// POST - Aggiungi nuova abilità generica
app.post("/abilitaGenerica", async (req, res) => {
  const payload = req.body;

  const requiredFields = [
    "Nome",
    "Categoria",
    "Caratteristica",
    "Distanza",
    "Effetto",
    "Keywords",
    "Bersaglio",
    "Tipo",
    "Tier1",
    "Tier2",
    "Tier3"
  ];

  for (const field of requiredFields) {
    if (!(field in payload)) {
      return res.status(400).json({ error: `Campo mancante: ${field}` });
    }
  }

  const { error } = await supabase
    .from("Abilità_Generiche")
    .insert([payload]);

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json({ message: `Abilità Generica: ${payload[Nome]} della categoria: ${payload[Categoria]}, inserita con successo` });
});

// POST - Aggiungi nuova abilità specifica
app.post("/abilitaSpecifica", async (req, res) => {
  const payload = req.body;

  const requiredFields = [
    "Nome",
    "Id_Giocatore",
    "Caratteristica",
    "Distanza",
    "Effetto",
    "Keywords",
    "Bersaglio",
    "Tipo",
    "Tier1",
    "Tier2",
    "Tier3"
  ];

  for (const field of requiredFields) {
    if (!(field in payload)) {
      return res.status(400).json({ error: `Campo mancante: ${field}` });
    }
  }

  const { error } = await supabase
    .from("Abilità_Specifiche")
    .insert([payload]);

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json({ message: `Abilità Specifica per id Giocatore: ${payload[Id_Giocatore]} e nome: ${payload[Nome]}, inserita con successo` });
});

app.listen(PORT, () => {
  console.log(`Server running!`);
});