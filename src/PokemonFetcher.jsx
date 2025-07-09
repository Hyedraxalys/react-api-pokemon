import React, { useState, useEffect } from 'react';
import './PokemonFetcher.css';

const traduccionesTipos = {
  normal: "Normal",
  fire: "Fuego",
  water: "Agua",
  grass: "Planta",
  electric: "Eléctrico",
  ice: "Hielo",
  fighting: "Lucha",
  poison: "Veneno",
  ground: "Tierra",
  flying: "Volador",
  psychic: "Psíquico",
  bug: "Bicho",
  rock: "Roca",
  ghost: "Fantasma",
  dark: "Siniestro",
  dragon: "Dragón",
  steel: "Acero",
  fairy: "Hada",
};

const tipoEspToEng = {
  normal: "normal",
  fuego: "fire",
  agua: "water",
  planta: "grass",
  eléctrico: "electric",
  electrico: "electric",
  hielo: "ice",
  lucha: "fighting",
  veneno: "poison",
  tierra: "ground",
  volador: "flying",
  psiquico: "psychic",
  psíquico: "psychic",
  bicho: "bug",
  roca: "rock",
  fantasma: "ghost",
  siniestro: "dark",
  dragon: "dragon",
  dragón: "dragon",
  acero: "steel",
  hada: "fairy",
};

const tiposEsp = [
  "normal", "fuego", "agua", "planta", "eléctrico", "electrico", "hielo", "lucha", "veneno", "tierra", "volador", "psíquico", "psiquico", "bicho", "roca", "fantasma", "siniestro", "dragón", "dragon", "acero", "hada"
];

// Función para quitar acentos (compatible universalmente)
function normalizar(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const coloresTipo = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  grass: "#78C850",
  electric: "#F8D030",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dark: "#705848",
  dragon: "#7038F8",
  steel: "#B8B8D0",
  fairy: "#EE99AC"
};

const PokemonFetcher = () => {
  const [pokemones, setPokemones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [nombresPokemon, setNombresPokemon] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);

  useEffect(() => {
    const fetchNombresPokemon = async () => {
      try {
        const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=898');
        const data = await res.json();
        const nombres = data.results.map(p => p.name);
        setNombresPokemon(nombres);
      } catch (err) {
        console.error("Error cargando nombres:", err);
      }
    };
    fetchNombresPokemon();
    fetchPokemonesAleatorios();
  }, []);

  const fetchPokemonesAleatorios = async () => {
    try {
      setCargando(true);
      setError(null);
      const fetchedPokemones = [];
      const pokemonIds = new Set();

      while (pokemonIds.size < 6) {
        const randomId = Math.floor(Math.random() * 898) + 1;
        pokemonIds.add(randomId);
      }

      for (const id of pokemonIds) {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const data = await res.json();
        fetchedPokemones.push({
          id: data.id,
          nombre: data.name,
          imagen: data.sprites.front_default,
          tipos: data.types.map(t => t.type.name),
        });
      }

      setPokemones(fetchedPokemones);
    } catch (err) {
      setError('Error al obtener pokemones aleatorios.');
    } finally {
      setCargando(false);
    }
  };

  const buscarPokemon = async (texto = busqueda) => {
    if (!texto.trim()) return;
    try {
      setCargando(true);
      setError(null);

      // Normalizar texto para ignorar acentos
      const textoLower = normalizar(texto);

      // Buscar tipo (en español, con o sin acento)
      const tipoTraducido = tipoEspToEng[textoLower] || textoLower;

      // Buscar por tipo
      const resTipo = await fetch(`https://pokeapi.co/api/v2/type/${tipoTraducido}`);
      if (resTipo.ok) {
        const dataTipo = await resTipo.json();
        const primeros5 = dataTipo.pokemon.slice(0, 5);

        const detalles = await Promise.all(
          primeros5.map(p => fetch(p.pokemon.url).then(r => r.json()))
        );

        const resultado = detalles.map(p => ({
          id: p.id,
          nombre: p.name,
          imagen: p.sprites.front_default,
          tipos: p.types.map(t => t.type.name),
        }));

        setPokemones(resultado);
        return;
      }

      // Buscar por nombre (ignorando acentos)
      // Buscar el nombre real en la lista de nombres
      const nombreMatch = nombresPokemon.find(n => normalizar(n) === textoLower);
      const nombreParaBuscar = nombreMatch || textoLower;
      const resNombre = await fetch(`https://pokeapi.co/api/v2/pokemon/${nombreParaBuscar}`);
      if (resNombre.ok) {
        const data = await resNombre.json();
        setPokemones([{
          id: data.id,
          nombre: data.name,
          imagen: data.sprites.front_default,
          tipos: data.types.map(t => t.type.name),
        }]);
      } else {
        throw new Error('No se encontró el Pokémon.');
      }
    } catch (err) {
      setError('No se encontró el Pokémon o tipo.');
    } finally {
      setCargando(false);
    }
  };

  const handleInputChange = (e) => {
    const texto = e.target.value;
    setBusqueda(texto);

    if (texto.length > 0) {
      const textoNorm = normalizar(texto);

      // Sugerencias de nombres
      const sugerenciasNombres = nombresPokemon.filter(nombre =>
        normalizar(nombre).includes(textoNorm)
      );
      // Sugerencias de tipos (en español, con y sin acento)
      const sugerenciasTipos = tiposEsp.filter(tipo =>
        normalizar(tipo).includes(textoNorm)
      );
      // Unir y limitar a 5 sugerencias
      const sugerenciasUnidas = [...sugerenciasTipos, ...sugerenciasNombres].slice(0, 5);
      setSugerencias(sugerenciasUnidas);
    } else {
      setSugerencias([]);
    }
  };

  const seleccionarSugerencia = (nombre) => {
    setBusqueda(nombre);
    setSugerencias([]);
    buscarPokemon(nombre);
  };

  return (
    <div className='pokemon-container'>
      <h2>Buscar Pokémon</h2>

      <div className="autocomplete">
        <input
          type="text"
          placeholder="Nombre o tipo (fuego, agua, planta...)"
          value={busqueda}
          onChange={handleInputChange}
        />
        <div className="sugerencias">
          {sugerencias.map((sug, idx) => (
            <div key={idx} onClick={() => seleccionarSugerencia(sug)}>
              {sug}
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => buscarPokemon()}>Buscar</button>
      <button onClick={fetchPokemonesAleatorios}>Aleatorios</button>

      {cargando && <p>Cargando...</p>}
      {error && <p className="error">{error}</p>}

      <div className="pokemon-list">
        {pokemones.map(pokemon => (
          <div key={pokemon.id} className="pokemon-card">
            <h3>{pokemon.nombre.charAt(0).toUpperCase() + pokemon.nombre.slice(1)}</h3>
            <img src={pokemon.imagen} alt={pokemon.nombre} />
            <div className="tipos">
              {pokemon.tipos.map(tipo => (
                <span
                  key={tipo}
                  className="tipo"
                  style={{ backgroundColor: coloresTipo[tipo] || "#777" }}
                >
                  {traduccionesTipos[tipo] || tipo}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PokemonFetcher;