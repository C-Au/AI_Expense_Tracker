function formatMonth(ym) {
  const [year, month] = ym.split("-");
  const d = new Date(Number(year), Number(month) - 1);
  return d.toLocaleString("default", { month: "long", year: "numeric" });
}

export default function MonthFilter({ months, selected, onChange }) {
  return (
    <div className="filter-bar">
      <span className="filter-label">Month:</span>

      {["All", ...months].map((m) => {
        const isActive = m === selected;
        return (
          <button
            key={m}
            className="filter-pill"
            style={
              isActive
                ? {
                    background: "#4a6cf7",
                    color: "#fff",
                    boxShadow: "0 2px 8px #4a6cf755",
                  }
                : {}
            }
            onClick={() => onChange(m)}
          >
            {m === "All" ? "All Months" : formatMonth(m)}
          </button>
        );
      })}
    </div>
  );
}
