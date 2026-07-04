import { useState } from 'react'
import { archetypes, tierPickCounts } from './data/archetypes'
import { startRoll, rollNextStat, getEffectiveRange } from './logic/roll'
import AnimatedNumber from './components/AnimatedNumber'
import './App.css'

const STAT_LABELS = {
  hp: 'HP',
  atk: 'Attack',
  def: 'Defense',
  spa: 'Sp. Atk',
  spd: 'Sp. Def',
  spe: 'Speed',
}

const TIERS = Object.keys(tierPickCounts).map(Number)

function App() {
  const [available, setAvailable] = useState(archetypes)
  const [remainingQuota, setRemainingQuota] = useState(tierPickCounts)
  const [current, setCurrent] = useState(null) // { archetype, rollState }
  const [completed, setCompleted] = useState([])
  const [finishedAnimations, setFinishedAnimations] = useState(new Set())
  const [pendingArchetype, setPendingArchetype] = useState(null)
  const [bstRevealed, setBstRevealed] = useState(false)
  const [freePickMode, setFreePickMode] = useState(false)

  const activeTier = TIERS.find((tier) => remainingQuota[tier] > 0)
  const draftComplete = activeTier === undefined && !current
  const isTierPickable = (tier) =>
    remainingQuota[tier] > 0 && (freePickMode || tier === activeTier)

  const handleSelectArchetype = (e) => {
    const name = e.target.value
    if (!name) return
    setPendingArchetype(available.find((a) => a.name === name))
  }

  const handleCancelSelection = () => {
    setPendingArchetype(null)
  }

  const handleConfirmSelection = () => {
    const archetype = pendingArchetype
    setAvailable(available.filter((a) => a.name !== archetype.name))
    setRemainingQuota({ ...remainingQuota, [archetype.tier]: remainingQuota[archetype.tier] - 1 })
    setCurrent({ archetype, rollState: startRoll(archetype) })
    setFinishedAnimations(new Set())
    setBstRevealed(false)
    setPendingArchetype(null)
  }

  const handleStatAnimationComplete = (statName) => {
    setFinishedAnimations((prev) => new Set(prev).add(statName))
  }

  const handleRollStat = (statName) => {
    const { state } = rollNextStat(current.rollState, statName)
    setCurrent({ archetype: current.archetype, rollState: state })
  }

  const handleConfirmArchetype = () => {
    setCompleted([
      ...completed,
      {
        name: current.archetype.name,
        tier: current.archetype.tier,
        bst: current.rollState.targetBST,
        stats: current.rollState.rolled,
      },
    ])
    setCurrent(null)
  }

  return (
    <div className="App">
      <label className="pick-mode-toggle">
        <input
          type="checkbox"
          checked={freePickMode}
          onChange={(e) => setFreePickMode(e.target.checked)}
        />
        Free pick
      </label>

      <h1>Welcome to the TWF Stats Randomizer</h1>

      {draftComplete ? (
        <div className="final-results">
          <h2>Your Team</h2>
          {TIERS.map((tier) => {
            const tierCompleted = completed.filter((entry) => entry.tier === tier)
            if (tierCompleted.length === 0) return null
            return (
              <div key={tier} className="final-tier-row">
                <h3>Tier {tier}</h3>
                <div className="final-grid">
                  {tierCompleted.map((entry) => (
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
            )
          })}
        </div>
      ) : (
      <div className="layout">
        <div className="reference-panel">
          <h2>Archetype Ranges</h2>
          {TIERS.map((tier) => {
            const tierArchetypes = archetypes.filter((a) => a.tier === tier)
            if (tierArchetypes.length === 0) return null
            const locked = remainingQuota[tier] > 0 && !isTierPickable(tier)
            return (
              <div key={tier} className={`tier-block${locked ? ' locked' : ''}`}>
                <h3>
                  Tier {tier} <span className="tier-quota">(pick {tierPickCounts[tier]})</span>
                  {locked && <span className="tier-locked-tag"> · locked</span>}
                </h3>
                <div className="reference-table-wrap">
                  <table className="reference-table">
                    <thead>
                      <tr>
                        <th>Archetype</th>
                        <th>BST</th>
                        {Object.keys(tierArchetypes[0].stats).map((stat) => (
                          <th key={stat}>{STAT_LABELS[stat]}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tierArchetypes.map((archetype) => (
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
            )
          })}
        </div>

        <div className="main-panel">
          {!current && (
            <>
              <p className="quota-status">
                {TIERS.map((tier) => {
                  const locked = remainingQuota[tier] > 0 && !isTierPickable(tier)
                  return (
                    <span key={tier} className={`quota-pill${locked ? ' locked' : ''}`}>
                      Tier {tier}: {locked ? 'locked' : `${remainingQuota[tier]} left`}
                    </span>
                  )
                })}
              </p>

              <p>
                {freePickMode
                  ? 'Select an archetype to randomize stats:'
                  : `Select a Tier ${activeTier} archetype to randomize stats:`}
              </p>
              <select onChange={handleSelectArchetype} value="">
                <option value="">--Select an archetype--</option>
                {TIERS.filter(isTierPickable).map((tier) => (
                  <optgroup key={tier} label={`Tier ${tier}`}>
                    {available
                      .filter((a) => a.tier === tier)
                      .map((archetype) => (
                        <option key={archetype.name} value={archetype.name}>
                          {archetype.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </>
          )}
        </div>

        <div className="summary-panel">
          <h2>Generated Archetypes</h2>
          {completed.length === 0 && <p>None yet.</p>}
          {completed.map((entry) => (
            <div key={entry.name} className="summary-card">
              <h3>
                {entry.name} <span className="tier-tag">Tier {entry.tier}</span>
              </h3>
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
      )}

      {current && (
        <div className="roll-overlay">
          <div className="roll-overlay-card">
            <h2>
              {current.archetype.name} <span className="tier-tag">Tier {current.archetype.tier}</span>
            </h2>
            <p>
              Target BST:{' '}
              <AnimatedNumber
                value={current.rollState.targetBST}
                onComplete={() => setBstRevealed(true)}
                startFrom={300}
                range={current.archetype.bst}
              />{' '}
              {bstRevealed && (
                <span className="pool-counter">
                  (Remaining pool:{' '}
                  {current.rollState.targetBST -
                    [...finishedAnimations].reduce(
                      (sum, stat) => sum + current.rollState.rolled[stat],
                      0
                    )}
                  )
                </span>
              )}
            </p>

            <div className="stat-grid">
              {Object.keys(current.archetype.stats).map((stat) => {
                if (stat in current.rollState.rolled) {
                  const rolledRange = current.rollState.rolledRanges[stat]
                  return (
                    <div key={stat} className="stat-row rolled">
                      <span className="stat-label">{STAT_LABELS[stat]}</span>
                      <span className="stat-value">
                        <AnimatedNumber
                          value={current.rollState.rolled[stat]}
                          onComplete={() => handleStatAnimationComplete(stat)}
                          range={current.archetype.stats[stat]}
                        />
                      </span>
                      <span className="stat-effective">
                        eff. {rolledRange.min}–{rolledRange.max}
                      </span>
                    </div>
                  )
                }

                const effective = getEffectiveRange(current.rollState, stat)
                return (
                  <button
                    key={stat}
                    className={`stat-row pending${bstRevealed ? '' : ' locked'}`}
                    onClick={() => handleRollStat(stat)}
                    disabled={!bstRevealed}
                  >
                    <span className="stat-label">{STAT_LABELS[stat]}</span>
                    <span className="stat-value" />
                    <span className="stat-effective">
                      eff. {effective.min}–{effective.max}
                    </span>
                  </button>
                )
              })}
            </div>

            {current.rollState.remaining.length === 0 &&
              finishedAnimations.size === Object.keys(current.archetype.stats).length && (
                <button className="confirm-button" onClick={handleConfirmArchetype}>
                  Confirm &amp; send to bench
                </button>
              )}
          </div>
        </div>
      )}

      {pendingArchetype && (
        <div className="roll-overlay">
          <div className="roll-overlay-card confirm-card">
            <h2>
              Roll for {pendingArchetype.name}?{' '}
              <span className="tier-tag">Tier {pendingArchetype.tier}</span>
            </h2>
            <p className="pool-counter">
              BST range: {pendingArchetype.bst.min}–{pendingArchetype.bst.max}
            </p>

            <div className="stat-grid">
              {Object.keys(pendingArchetype.stats).map((stat) => (
                <div key={stat} className="stat-row">
                  <span className="stat-label">{STAT_LABELS[stat]}</span>
                  <span className="stat-value" />
                  <span className="stat-effective">
                    {pendingArchetype.stats[stat].min}–{pendingArchetype.stats[stat].max}
                  </span>
                </div>
              ))}
            </div>

            <div className="confirm-actions">
              <button className="confirm-button" onClick={handleConfirmSelection}>
                Yes, roll it
              </button>
              <button className="cancel-button" onClick={handleCancelSelection}>
                No, go back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
