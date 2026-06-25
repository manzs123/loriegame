export default function Menu({ onStart }) {
  return (
    <div className="menu">
      <div className="menu-title">
        🔪 LORIE IS<br />WITH US 🔪
      </div>
      <div className="menu-subtitle">
        Find the killer among you.<br />
        Complete your tasks.<br />
        Escape the facility.<br />
        <br />
        But beware... Lorie is watching.
      </div>
      <button className="btn" onClick={onStart}>
        ▶ START GAME
      </button>
      <div style={{ fontSize: '6px', color: '#3d3d3d', textAlign: 'center', lineHeight: 2 }}>
        10 unique characters · special abilities<br />
        pixel art · strategy · deduction
      </div>
    </div>
  );
}
