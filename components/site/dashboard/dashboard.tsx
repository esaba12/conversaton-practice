"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Clock3, Flame, Lock, MessageCircle, Plus, ShieldCheck, Sparkles, UserRound, Users, Video } from "lucide-react";
import type { DashboardData } from "@/lib/data/dashboard";
import { Avatar } from "./avatar";
import { CountUp } from "./count-up";
import { bestStreak, countsByDay, dayKey, currentStreak, greeting, heatmapWeeks, relativeDay, thisWeek } from "./stats";
import styles from "./dashboard.module.css";

const HEATMAP_WEEKS = 24;

function plannedDate(day: string) {
  const date = new Date(`${day}T12:00:00`);
  return { month: date.toLocaleDateString(undefined, { month: "short" }), day: date.getDate(), weekday: date.toLocaleDateString(undefined, { weekday: "long" }) };
}

function formatMinutes(minutes: number) {
  if (minutes < 1) return `${Math.max(1, Math.round(minutes * 60))} sec`;
  return `${Math.round(minutes)} min`;
}

export function Dashboard({ data }: { data: DashboardData }) {
  const reduced = useReducedMotion();
  // The user's own clock decides greetings, streaks and day buckets, so these wait for the browser.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); }, []);

  const practiceCalls = useMemo(() => data.practices.filter((p) => p.kind === "practice"), [data.practices]);
  const counts = useMemo(() => countsByDay(data.practices), [data.practices]);
  const minutes = data.practices.reduce((sum, p) => sum + p.minutes, 0);
  const streak = now ? currentStreak(counts, now) : 0;
  const best = bestStreak(counts);
  const week = now ? thisWeek(counts, now) : [];
  const weeks = now ? heatmapWeeks(counts, now, HEATMAP_WEEKS) : [];
  const activeDays = counts.size;
  const todayKey = now ? dayKey(now) : "";
  const upcoming = data.planned.filter((p) => !p.checkin || p.plannedOn >= todayKey);
  const lifts = data.planned.filter((p) => p.before !== null && p.after !== null);
  const avgLift = lifts.length ? Math.round(lifts.reduce((s, p) => s + ((p.after ?? 0) - (p.before ?? 0)), 0) / lifts.length) : null;
  const firstRun = practiceCalls.length === 0;

  const rise = (i: number) => reduced ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.05 * i, type: "spring" as const, stiffness: 260, damping: 30 } };

  const stats = [
    { icon: MessageCircle, label: "Practice calls", value: practiceCalls.length, decimals: 0, note: data.practices.length > practiceCalls.length ? `+${data.practices.length - practiceCalls.length} “Show me first”` : "Live video calls" },
    { icon: Clock3, label: "Minutes talking", value: minutes, decimals: minutes > 0 && minutes < 10 ? 1 : 0, note: "Time on calls" },
    { icon: Flame, label: "Day streak", value: streak, decimals: 0, note: best > 0 ? `Best: ${best} ${best === 1 ? "day" : "days"}` : "Start one today" },
    { icon: Users, label: "People saved", value: data.peopleCount, decimals: 0, note: `${data.factsCount} About-me ${data.factsCount === 1 ? "fact" : "facts"}` },
  ];

  return (
    <main id="main" className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />

      <section className={styles.hero} aria-labelledby="dash-title">
        <motion.div className={styles.heroCopy} {...rise(0)}>
          <p className={styles.eyebrow}><span className={styles.pulse} />{now ? now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) : "Your practice room"}</p>
          <h1 id="dash-title" className={styles.title}>
            {now ? greeting(now) : "Welcome back"}.<br />
            <em>{firstRun ? "Let’s find your words." : streak > 1 ? `${streak} days in a row.` : "Ready for another try?"}</em>
          </h1>
          <p className={styles.lede}>
            {firstRun
              ? "Pick a starter character or describe someone from your life. Each call starts fresh, and you choose what’s kept."
              : "Every call starts fresh. Pick up with someone you’ve practiced with, or try a new conversation."}
          </p>
          <div className={styles.ctaRow}>
            <Link href="/practice" className={styles.cta}><Video size={18} strokeWidth={2} aria-hidden="true" />Start a practice</Link>
            <Link href="/practice?new=1" className={styles.ctaGhost}><Plus size={18} strokeWidth={2} aria-hidden="true" />Someone new</Link>
          </div>
        </motion.div>

        <motion.aside className={styles.weekCard} aria-label="This week" {...rise(1)}>
          <div className={styles.weekTop}>
            <span className={styles.flame} data-on={streak > 0}><Flame size={22} strokeWidth={2} aria-hidden="true" /></span>
            <div>
              <p className={styles.weekBig}>{streak} <span>{streak === 1 ? "day" : "days"}</span></p>
              <p className={styles.weekNote}>{streak > 0 ? "Current streak" : "No streak yet. One call starts it."}</p>
            </div>
          </div>
          <ol className={styles.weekDots}>
            {week.map((d) => (
              <li key={d.key} data-done={d.done} data-today={d.isToday} data-future={d.future}>
                <span className={styles.dot}>{d.done ? <Sparkles size={14} strokeWidth={2} aria-hidden="true" /> : null}</span>
                <span className={styles.dotLabel} aria-hidden="true">{d.label}</span>
                <span className="sr-only">{new Date(`${d.key}T12:00:00`).toLocaleDateString(undefined, { weekday: "long" })}: {d.done ? "practiced" : "no call"}</span>
              </li>
            ))}
          </ol>
          <p className={styles.weekFoot}>{activeDays} {activeDays === 1 ? "day" : "days"} with practice so far</p>
        </motion.aside>
      </section>

      <section className={styles.stats} aria-label="Your practice in numbers">
        {stats.map((stat, i) => (
          <motion.article key={stat.label} className={styles.stat} {...rise(i + 2)}>
            <span className={styles.statIcon}><stat.icon size={18} strokeWidth={2} aria-hidden="true" /></span>
            <p className={styles.statValue}><CountUp value={stat.value} decimals={stat.decimals} /></p>
            <h2 className={styles.statLabel}>{stat.label}</h2>
            <p className={styles.statNote}>{stat.note}</p>
          </motion.article>
        ))}
      </section>

      {!data.available ? <p className={styles.notice} role="status">We couldn’t load your practice history just now. Starting a practice still works.</p> : null}

      <div className={styles.columns}>
        <section className={styles.panel} aria-labelledby="try-again">
          <header className={styles.panelHead}>
            <h2 id="try-again">{data.tryAgain.length ? "Try again with" : "Start with someone"}</h2>
            <Link href="/practice" className={styles.panelLink}>Everyone <ArrowRight size={16} aria-hidden="true" /></Link>
          </header>
          <ul className={styles.people}>
            {(data.tryAgain.length ? data.tryAgain : data.starters).map((person, i) => (
              <motion.li key={person.key} {...rise(i + 4)}>
                <Link href={person.href} className={styles.personCard}>
                  <Avatar name={person.name} preset={person.portraitPreset} />
                  <span className={styles.personText}>
                    <span className={styles.personName}>{person.name}</span>
                    <span className={styles.personMeta}>{person.relationship}</span>
                    <span className={styles.personSub}>
                      {person.practices > 0 && now
                        ? `${person.practices} ${person.practices === 1 ? "call" : "calls"} · last ${person.lastAt ? relativeDay(person.lastAt, now) : ""}`
                        : person.saved ? "Saved person" : "Starter character"}
                    </span>
                  </span>
                  <span className={styles.callBtn} aria-hidden="true"><Video size={18} strokeWidth={2} /></span>
                  <span className="sr-only">{person.practices > 0 ? "Practice again" : "Practice"}</span>
                </Link>
              </motion.li>
            ))}
          </ul>
          {data.tryAgain.length > 0 && data.starters.length > 0 ? (
            <div className={styles.starterStrip}>
              <p>Or try a starter</p>
              <ul>
                {data.starters.map((s) => (
                  <li key={s.key}><Link href={s.href} className={styles.chipLink}><Avatar name={s.name} preset={s.portraitPreset} size={28} />{s.name}<span>{s.relationship}</span></Link></li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className={styles.panel} aria-labelledby="coming-up">
          <header className={styles.panelHead}>
            <h2 id="coming-up">Coming up</h2>
            {avgLift !== null ? <span className={styles.lift} title="Average change in how likely you felt you’d have the real conversation, before vs after practice">{avgLift >= 0 ? "+" : ""}{avgLift} pts confidence</span> : null}
          </header>
          {upcoming.length ? (
            <ul className={styles.planned}>
              {upcoming.slice(0, 4).map((plan) => {
                const d = plannedDate(plan.plannedOn);
                return (
                  <li key={plan.id}>
                    <Link href={plan.href} className={styles.plannedRow}>
                      <span className={styles.dateBadge}><span>{d.month}</span><strong>{d.day}</strong></span>
                      <span className={styles.plannedText}>
                        <span className={styles.personName}>{plan.label ?? `Talk with ${plan.personName}`}</span>
                        <span className={styles.personMeta}>{plan.personName} · {d.weekday}</span>
                        {plan.before !== null ? (
                          <span className={styles.meter} aria-label={`Felt ${plan.before}% likely before practice${plan.after !== null ? `, ${plan.after}% after` : ""}`}>
                            <span className={styles.meterBefore} style={{ width: `${plan.before}%` }} />
                            {plan.after !== null ? <span className={styles.meterAfter} style={{ width: `${plan.after}%` }} /> : null}
                          </span>
                        ) : null}
                      </span>
                      <ArrowRight size={16} aria-hidden="true" className={styles.rowArrow} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className={styles.emptyPlan}>
              <CalendarDays size={28} strokeWidth={1.5} aria-hidden="true" />
              <p><strong>Nothing on the calendar.</strong> After practicing with a saved person, add the day you plan to have the real conversation. We’ll check in once that day comes.</p>
            </div>
          )}
        </section>
      </div>

      <section className={styles.panel} aria-labelledby="activity">
        <header className={styles.panelHead}>
          <h2 id="activity">Activity</h2>
          <span className={styles.panelMeta}>Last {HEATMAP_WEEKS} weeks</span>
        </header>
        <div className={styles.activity}>
        <div className={styles.heatWrap}>
          <div className={styles.heatmap} role="img" aria-label={`${data.practices.length} calls on ${activeDays} days in the last ${HEATMAP_WEEKS} weeks`}>
            {weeks.map((column, w) => (
              <div key={w} className={styles.heatCol}>
                {column.map((cell) => (
                  <span key={cell.key} className={styles.heatCell} data-level={cell.future ? "future" : Math.min(cell.count, 3)} title={cell.future ? undefined : `${cell.key}: ${cell.count} ${cell.count === 1 ? "call" : "calls"}`} />
                ))}
              </div>
            ))}
          </div>
          <div className={styles.heatLegend} aria-hidden="true">Less <span data-level="0" /><span data-level="1" /><span data-level="2" /><span data-level="3" /> More</div>
        </div>
        {data.recent.length ? (
          <ol className={styles.timeline} aria-label="Recent calls">
            <li aria-hidden="true" className={styles.timelineHead}>Recent calls</li>
            {data.recent.map((call) => (
              <li key={call.id}>
                <span className={styles.timelineDot} data-kind={call.kind} />
                <span className={styles.timelineName}>{call.kind === "stand_in" ? `Show me first · ${call.name}` : call.name}</span>
                <span className={styles.timelineMeta}>{formatMinutes(call.minutes)} · {now ? relativeDay(call.at, now) : ""}</span>
              </li>
            ))}
          </ol>
        ) : <p className={styles.panelMeta}>Your calls will show up here. Only the date and length are kept, never what was said.</p>}
        </div>
      </section>

      <section className={styles.links} aria-label="More">
        <Link href="/practice/about-me" className={styles.linkCard}>
          <span className={styles.linkIcon}><UserRound size={20} aria-hidden="true" /></span>
          <span><strong>About me</strong><span>Facts about you, and who gets to know them.</span></span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <Link href="/practice/data" className={styles.linkCard}>
          <span className={styles.linkIcon}><ShieldCheck size={20} aria-hidden="true" /></span>
          <span><strong>Your data</strong><span>See what’s stored, and delete it any time.</span></span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <div className={styles.linkCard} data-static>
          <span className={styles.linkIcon}><Lock size={20} aria-hidden="true" /></span>
          <span><strong>Private by default</strong><span>No call transcripts are kept. Your notes never reach the character.</span></span>
        </div>
      </section>

      <p className={styles.disclosure}>Practice with fictional AI characters. A practice tool; it doesn’t predict how a real person will respond.</p>
    </main>
  );
}
