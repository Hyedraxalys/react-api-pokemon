import React from 'react';
import PokemonFetcher from './PokemonFetcher.jsx';
import './App.css';


function App() {
  return (
    <div className="contenedor-principal">
      <h1 className="titulo-principal">Conoce a tu Pokemones</h1>
      <PokemonFetcher />
    </div>
  );
}

export default App;
