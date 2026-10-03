import Link from "next/link";
import type { DailyViews } from "@/lib/stats";

type TopPost = { id: string; title: string; slug: string; views: number };

function shortDay(day: string) {
  return new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Dashboard card: views over the last 30 days, the change from the 30 days before, and the most-read posts. */
export function ReadershipPanel({
  days,
  last30,
  previous30,
  allTime,
  topPosts,
}: {
  days: DailyViews[];
  last30: number;
  previous30: number;
  allTime: number;
  topPosts: TopPost[];
}) {
  const max = Math.max(1, ...days.map((d) => d.views));
  const change = previous30 > 0 ? Math.round(((last30 - previous30) / previous30) * 100) : null;
  const barWidth = 600 / Math.max(1, days.length);
  const topMax = Math.max(1, ...topPosts.map((p) => p.views));

  return (
    <section className="dash-panel" aria-labelledby="readership-title">
      <div className="dash-panel__header">
        <h2 id="readership-title">Readership</h2>
        <span>Last 30 days</span>
      </div>

      {allTime === 0 ? (
        <p className="dash-panel__empty">
          No reads recorded yet. A view is counted when a visitor opens a post; your own visits while signed in don&apos;t count.
        </p>
      ) : (
        <div className="readership">
          <div className="readership__summary">
            <div className="readership__total">{last30.toLocaleString()}</div>
            <div className="readership__label">views in the last 30 days</div>
            {change !== null && (
              <div className={`readership__change ${change >= 0 ? "is-up" : "is-down"}`}>
                {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% vs the 30 days before
              </div>
            )}
            <div className="readership__alltime">{allTime.toLocaleString()} views all time</div>
          </div>

          <div className="readership__chart">
            <svg viewBox="0 0 600 140" preserveAspectRatio="none" role="img" aria-label="Views per day over the last 30 days">
              {days.map((d, i) => {
                const h = d.views === 0 ? 2 : Math.max(4, (d.views / max) * 130);
                return (
                  <rect
                    key={d.day}
                    x={i * barWidth + barWidth * 0.15}
                    y={140 - h}
                    width={barWidth * 0.7}
                    height={h}
                    rx={2}
                    className={d.views === 0 ? "readership__bar is-empty" : "readership__bar"}
                  >
                    <title>{`${shortDay(d.day)}: ${d.views.toLocaleString()} view${d.views === 1 ? "" : "s"}`}</title>
                  </rect>
                );
              })}
            </svg>
            {days.length > 0 && (
              <div className="readership__axis">
                <span>{shortDay(days[0].day)}</span>
                <span>{shortDay(days[days.length - 1].day)}</span>
              </div>
            )}
          </div>

          <div className="readership__top">
            <h3>Most read</h3>
            {topPosts.length === 0 ? (
              <p className="dash-panel__empty">No reads in the last 30 days.</p>
            ) : (
              <ol>
                {topPosts.map((p) => (
                  <li key={p.id}>
                    <div className="readership__top-row">
                      <Link href={`/admin/posts/${p.id}`}>{p.title}</Link>
                      <span>{p.views.toLocaleString()}</span>
                    </div>
                    <div className="readership__meter">
                      <span style={{ width: `${(p.views / topMax) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
