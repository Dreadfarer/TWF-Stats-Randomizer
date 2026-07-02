import { useState } from 'react'
import { archetypes } from './data/archetypes'
import { startRoll, rollNextStat, getEffectiveRange } from './logic/roll'
import './App.css'

const STAT_LABELS = {
  hp: 'HP',
  atk: 'Attack',
  def: 'Defense',
  spa: 'Sp. Atk',
  spd: 'Sp. Def',
  spe: 'Speed',
}

function App() {
  const [available, setAvailable] = useState(archetypes)
  const [current, setCurrent] = useState(null) // { archetype, rollState }
  const [completed, setCompleted] = useState([])

  const handleSelectArchetype = (e) => {
    const name = e.target.value
    if (!name) return
    const archetype = available.find((a) => a.name === name)
    setAvailable(available.filter((a) => a.name !== name))
    setCurrent({ archetype, rollState: startRoll(archetype) })
  }

  const handleRollStat = (statName) => {
    const { state } = rollNextStat(current.rollState, statName)
    if (state.remaining.length === 0) {
      setCompleted([
        ...completed,
        { name: current.archetype.name, bst: state.targetBST, stats: state.rolled },
      ])
      setCurrent(null)
    } else {
      setCurrent({ archetype: current.archetype, rollState: state })
    }
  }

  return (
    <div className="App">
      <h1>Welcome to the TWF Stats Randomizer</h1>

      <div className="layout">
        <div className="reference-panel">
          <h2>Archetype Ranges</h2>
          <div className="reference-table-wrap">
            <table className="reference-table">
              <thead>
                <tr>
                  <th>Archetype</th>
                  <th>BST</th>
                  {Object.keys(archetypes[0].stats).map((stat) => (
                    <th key={stat}>{STAT_LABELS[stat]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {archetypes.map((archetype) => (
                  <tr
                    key={archetype.name}
                    className={current?.archetype.name === archetype.name ? 'active' : ''}
                  >
                    <td>{archetype.name}</td>
                    <td>
                      {archetype.bst.min}–{archetype.bst.max}
                    </td>
                    {Object.keys(archetype.stats).map((stat) => (
                      <td key={stat}>
                        {archetype.stats[stat].min}–{archetype.stats[stat].max}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="main-panel">
          {!current && (
            <>
              <p>Select an archetype to randomize stats:</p>
              <select onChange={handleSelectArchetype} value="">
                <option value="">--Select an archetype--</option>
                {available.map((archetype) => (
                  <option key={archetype.name} value={archetype.name}>
                    {archetype.name}
                  </option>
                ))}
              </select>
              {available.length === 0 && <p>All archetypes generated.</p>}
            </>
          )}

          {current && (
            <div className="current-roll">
              <h2>{current.archetype.name}</h2>
              <p>
                Target BST: {current.rollState.targetBST}{' '}
                <span className="pool-counter">(Remaining pool: {current.rollState.pool})</span>
              </p>

              <div className="stat-grid">
                {Object.keys(current.archetype.stats).map((stat) => {
                  if (stat in current.rollState.rolled) {
                    return (
                      <div key={stat} className="stat-row rolled">
                        <span className="stat-label">{STAT_LABELS[stat]}</span>
                        <span className="stat-value">{current.rollState.rolled[stat]}</span>
                      </div>
                    )
                  }

                  const effective = getEffectiveRange(current.rollState, stat)
                  return (
                    <button
                      key={stat}
                      className="stat-row pending"
                      onClick={() => handleRollStat(stat)}
                    >
                      <span className="stat-label">{STAT_LABELS[stat]}</span>
                      <span className="stat-effective">
                        eff. {effective.min}–{effective.max}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="summary-panel">
          <h2>Generated Archetypes</h2>
          {completed.length === 0 && <p>None yet.</p>}
          {completed.map((entry) => (
            <div key={entry.name} className="summary-card">
              <h3>{entry.name}</h3>
              <p className="summary-bst">BST: {entry.bst}</p>
              <ul>
                {Object.entries(entry.stats).map(([stat, value]) => (
                  <li key={stat}>
                    <span>{STAT_LABELS[stat]}</span>
                    <span>{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
