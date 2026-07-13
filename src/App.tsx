import type { Component, Accessor, Setter } from "solid-js";
import {
  For,
  Index,
  Show,
  createMemo,
  createResource,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import { themeChange } from "theme-change";
import { Game, RowGame, scrollSpeeds, stateToTimeZone } from "./utils";

const fetchSeasonData = async (): Promise<Game[]> => {
  const res = await fetch(import.meta.env.BASE_URL + "2000-2025_winners.json");
  if (!res.ok) throw new Error("Failed to load season data");
  return res.json();
};

// ── Shared Components ──────────────────────────────────────────────

const TimelineGrid: Component<{
  seasonGameRows: Accessor<Record<string, RowGame[]>>;
  weekIndex: Accessor<number>;
  setWeekIndex: Setter<number>;
}> = (props) => (
  <div class="flex flex-col gap-0.5">
    <For each={Object.entries(props.seasonGameRows())}>
      {([season, games]) => (
        <div class="flex items-center gap-1">
          <div class="w-14 text-right font-semibold pr-2 text-sm">{season}</div>
          <For each={games}>
            {(game) => (
              <button
                class={`w-10 h-10 p-1 rounded-box hover:opacity-75 transition-opacity tooltip ${
                  props.weekIndex() === game.total_week
                    ? "ring-2 ring-offset-2 ring-primary ring-offset-base-100 bg-primary-content"
                    : ""
                }`}
                data-tip={game.teamName}
                onClick={() => props.setWeekIndex(game.total_week)}
              >
                <img
                  src={game.logoUrl}
                  alt={game.teamName}
                  class="w-full h-full object-contain"
                />
              </button>
            )}
          </For>
        </div>
      )}
    </For>
  </div>
);

const ScoreTable: Component<{ game: Accessor<Game> }> = (props) => (
  <div class="overflow-x-auto border rounded-box border-base-300">
    <table class="table table-sm bg-base-200">
      <thead>
        <tr class="bg-base-300">
          <th></th>
          <Index each={props.game().awayLineScores}>
            {(_, index) => <th>Q{index + 1}</th>}
          </Index>
          <th class="font-bold text-lg">T</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th class="flex items-center">
            <img
              src={`https://a.espncdn.com/i/teamlogos/ncaa/500/${
                props.game().homeId
              }.png`}
              alt={props.game().homeTeam}
              class="w-8 h-8 object-contain"
            />
          </th>
          <Index each={props.game().homeLineScores}>
            {(item) => <td>{item()}</td>}
          </Index>
          <th class="font-bold">{props.game().homePoints}</th>
        </tr>
        <tr>
          <th class="flex items-center">
            <img
              src={`https://a.espncdn.com/i/teamlogos/ncaa/500/${
                props.game().awayId
              }.png`}
              alt={props.game().awayTeam}
              class="w-8 h-8 object-contain"
            />
          </th>
          <Index each={props.game().awayLineScores}>
            {(item) => <td>{item()}</td>}
          </Index>
          <th class="font-bold">{props.game().awayPoints}</th>
        </tr>
      </tbody>
    </table>
  </div>
);

const GameInfo: Component<{ game: Accessor<Game> }> = (props) => (
  <>
    <div class="divider text-sm text-base-content/70">GAME INFO</div>
    <p class="text-center text-sm">
      <Show
        when={props.game().city || props.game().venue || props.game().state}
      >
        <span class="font-semibold">{props.game().venue}</span> in{" "}
        {props.game().city}, {props.game().state}
      </Show>
      <Show when={props.game().neutralSite}>
        <span class="badge badge-warning ml-2">Neutral Site</span>
      </Show>
      <Show when={props.game().conferenceGame}>
        <span class="badge badge-warning ml-2">Conference</span>
      </Show>
      <Show
        when={
          !props.game().conferenceGame && props.game().seasonType === "regular"
        }
      >
        <span class="badge badge-info ml-2">Non-Conference</span>
      </Show>
    </p>
  </>
);

const MatchupContent: Component<{
  game: Accessor<Game>;
  formattedGameDate: Accessor<string>;
}> = (props) => (
  <div class="space-y-4">
    <div class="text-center">
      <h3 class="font-bold text-2xl">{props.game().notes}</h3>
      <div class="badge badge-lg badge-neutral mt-2 mb-1">
        {props.game().season} |{" "}
        {props.game().seasonType.charAt(0).toUpperCase() +
          props.game().seasonType.slice(1)}
        {props.game().seasonType === "regular" &&
          ` | Week ${props.game().week}`}
      </div>
      <p class="text-sm font-medium text-base-content/80">
        <time>{props.formattedGameDate()}</time>
      </p>
    </div>

    <div class="grid grid-cols-3 gap-6 items-start">
      <div
        class={`card bg-base-100 shadow-md p-2 items-center text-center ${
          props.game().homeId === props.game().winner_id
            ? "border-2 border-success"
            : "border border-base-300"
        }`}
      >
        <div class="text-sm font-bold mb-1">Home</div>
        <img
          src={`https://a.espncdn.com/i/teamlogos/ncaa/500/${
            props.game().homeId
          }.png`}
          alt={props.game().homeTeam}
          class="w-16 h-16 object-contain mx-auto mb-2"
        />
        <h3 class="font-bold text-lg mb-1">{props.game().homeTeam}</h3>
        <div class="badge badge-ghost badge-sm mb-2">
          {props.game().homeConference}
        </div>
        <div class="text-xs">
          AP Rank:{" "}
          <span class="font-semibold">{props.game().homeApRank || "NR"}</span>
        </div>
        <div class="text-xs">
          Coaches:{" "}
          <span class="font-semibold">
            {props.game().homeCoachesRank || "NR"}
          </span>
        </div>
      </div>

      <div class="flex flex-col items-center justify-center text-center font-extrabold text-primary pt-10">
        <span class="text-sm font-normal text-base-content/70">Score</span>
        <div class="text-2xl md:text-4xl font-black text-primary">
          {props.game().homePoints} - {props.game().awayPoints}
        </div>
        <span class="mt-4 text-lg md:text-xl font-bold">VS</span>
      </div>

      <div
        class={`card bg-base-100 shadow-md p-2 items-center text-center ${
          !(props.game().homeId === props.game().winner_id)
            ? "border-2 border-success"
            : "border border-base-300"
        }`}
      >
        <div class="text-sm font-bold mb-1">Away</div>
        <img
          src={`https://a.espncdn.com/i/teamlogos/ncaa/500/${
            props.game().awayId
          }.png`}
          alt={props.game().awayTeam}
          class="w-16 h-16 object-contain mx-auto mb-2"
        />
        <h3 class="font-bold text-lg mb-1">{props.game().awayTeam}</h3>
        <div class="badge badge-ghost badge-sm mb-2">
          {props.game().awayConference}
        </div>
        <div class="text-xs">
          AP Rank:{" "}
          <span class="font-semibold">{props.game().awayApRank || "NR"}</span>
        </div>
        <div class="text-xs">
          Coaches:{" "}
          <span class="font-semibold">
            {props.game().awayCoachesRank || "NR"}
          </span>
        </div>
      </div>
    </div>

    <ScoreTable game={props.game} />
    <GameInfo game={props.game} />

    <Show when={props.game().highlights}>
      <div class="w-full aspect-video rounded-box overflow-hidden shadow-lg border border-base-300">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${props
            .game()
            .highlights.slice(-11)}`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    </Show>
  </div>
);

const TimelineControls: Component<{
  autoScroll: Accessor<boolean>;
  toggleAutoScroll: () => void;
  scrollingWeekSpeed: Accessor<number>;
  setScrollingWeekSpeed: Setter<number>;
  stopAutoScroll: () => void;
  startAutoScroll: () => void;
  weekIndex: Accessor<number>;
  setWeekIndex: Setter<number>;
  maxTotalWeek: Accessor<number>;
  compact?: boolean;
}> = (props) => {
  const sm = props.compact;
  return (
    <div
      class={`card bg-base-100 shadow-xl border border-base-300 w-full mx-auto p-${
        sm ? "2" : "5"
      } ${sm ? "gap-0.5" : ""}`}
    >
      <h3
        class={`${sm ? "text-xl" : "text-lg"} font-bold text-center mb-${
          sm ? "2" : "4"
        }`}
      >
        Timeline Controls
      </h3>
      <div class="flex gap-2 items-center justify-center">
        <button
          class={`btn btn-primary btn-circle ${sm ? "btn-sm" : ""}`}
          onClick={props.toggleAutoScroll}
        >
          {props.autoScroll() ? "\u23F8" : "\u25B6"}
        </button>
        <select
          class={`select select-bordered w-fit select-all select-primary ${
            sm ? "select-sm" : ""
          }`}
          value={props.scrollingWeekSpeed()}
          onChange={(e: Event) => {
            const val = (e.currentTarget as HTMLSelectElement).value;
            props.setScrollingWeekSpeed(Number(val));
            if (props.autoScroll()) {
              props.stopAutoScroll();
              props.startAutoScroll();
            }
          }}
        >
          <For each={scrollSpeeds}>
            {(speed_option) => (
              <option value={speed_option.value}>{speed_option.key}</option>
            )}
          </For>
        </select>
      </div>
      <div
        class={`flex items-center gap-${sm ? "2" : "4"} mt-${sm ? "2" : "6"}`}
      >
        <button
          class={`btn btn-outline btn-circle ${sm ? "btn-sm" : ""}`}
          onClick={() => props.setWeekIndex((w) => Math.max(w - 1, 0))}
          disabled={props.weekIndex() === 0}
        >
          {"<"}
        </button>
        <input
          type="range"
          min={0}
          max={props.maxTotalWeek()}
          value={props.weekIndex()}
          class={`range range-primary flex-1 ${sm ? "range-sm" : ""}`}
          step={1}
          onInput={(e) => props.setWeekIndex(Number(e.currentTarget.value))}
        />
        <button
          class={`btn btn-outline btn-circle ${sm ? "btn-sm" : ""}`}
          onClick={() =>
            props.setWeekIndex((w) => Math.min(w + 1, props.maxTotalWeek()))
          }
          disabled={props.weekIndex() >= props.maxTotalWeek()}
        >
          {">"}
        </button>
      </div>
      <p class={`text-center text-sm ${sm ? "" : "mt-2"}`}>
        Game: <span class="font-bold text-lg">{props.weekIndex() + 1}</span> of{" "}
        {props.maxTotalWeek() + 1}
      </p>
    </div>
  );
};

// ── App ────────────────────────────────────────────────────────────

const App: Component = () => {
  const [seasonData] = createResource(fetchSeasonData);
  const [weekIndex, setWeekIndex] = createSignal(0);
  const [isFlipped, setIsFlipped] = createSignal(false);
  const [autoScroll, setAutoScroll] = createSignal(false);
  const [scrollingWeekSpeed, setScrollingWeekSpeed] = createSignal(2);
  const [mobileShow, setMobileShow] = createSignal<
    "timeline" | "matchup" | "data"
  >("timeline");

  let scrollInterval: ReturnType<typeof setInterval> | null = null;

  function startAutoScroll() {
    if (scrollInterval) return;
    scrollInterval = setInterval(() => {
      setWeekIndex((prev) => {
        const max = maxTotalWeek();
        return prev >= max ? max : prev + 1;
      });
    }, scrollingWeekSpeed() * 1000);
  }

  function stopAutoScroll() {
    if (scrollInterval) {
      clearInterval(scrollInterval);
      scrollInterval = null;
    }
  }

  function toggleAutoScroll() {
    const next = !autoScroll();
    setAutoScroll(next);
    if (next) startAutoScroll();
    else stopAutoScroll();
  }

  onMount(() => {
    themeChange();
    onCleanup(() => stopAutoScroll());
  });

  const maxTotalWeek = createMemo(() => {
    const weeks = seasonData()?.map((g) => g.total_week) ?? [];
    return weeks.length > 0 ? Math.max(...weeks) : 0;
  });

  const currentTimelineGame = createMemo(() => {
    const data = seasonData();
    return data?.find((g) => g.total_week === weekIndex()) ?? null;
  });

  const formattedGameDate = createMemo(() => {
    const game = currentTimelineGame();
    if (!game || !game.startDate) return "Date N/A";
    const date = new Date(game.startDate);
    if (isNaN(date.getTime())) return "Date N/A";
    const timeZone = stateToTimeZone[game.state] || "America/New_York";
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone,
    }).format(date);
  });

  const seasonGameRows = createMemo(() => {
    const data = seasonData();
    if (!data) return {};
    const seasonMap: Record<string, RowGame[]> = {};
    for (const game of data) {
      const winnerTeam =
        game.winner_id === game.homeId ? game.homeTeam : game.awayTeam;
      if (!seasonMap[game.season]) seasonMap[game.season] = [];
      seasonMap[game.season].push({
        winner_id: game.winner_id,
        teamName: winnerTeam,
        logoUrl: `https://a.espncdn.com/i/teamlogos/ncaa/500/${game.winner_id}.png`,
        total_week: game.total_week,
        seasonType: game.seasonType,
      });
    }
    for (const season in seasonMap) {
      seasonMap[season].sort((a, b) => a.total_week - b.total_week);
    }
    return seasonMap;
  });

  const controlsProps = () => ({
    autoScroll,
    toggleAutoScroll,
    scrollingWeekSpeed,
    setScrollingWeekSpeed,
    stopAutoScroll,
    startAutoScroll,
    weekIndex,
    setWeekIndex,
    maxTotalWeek,
  });

  return (
    <div class="min-h-screen flex flex-col bg-base-200">
      <div class="navbar bg-base-100 shadow-lg max-w-7xl mx-auto rounded-b-box justify-between">
        <h1 class="text-xl md:text-2xl font-bold flex flex-row">
          Lineal <span class="flex lg:hidden ml-1 mr-1">NCAAF</span>
          <span class="hidden lg:flex ml-1 mr-1">College Football</span>
          Champion 2000–2025
        </h1>
        <label class="swap swap-rotate">
          <input type="checkbox" class="theme-controller" value="dim" />
          <svg
            class="swap-off h-10 w-10 fill-current"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
          </svg>
          <svg
            class="swap-on h-10 w-10 fill-current"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
          </svg>
        </label>
      </div>

      {/* ── MOBILE LAYOUT ── */}
      <div class="lg:hidden flex flex-col gap-2 flex-1">
        <div class="flex flex-col flex-1 gap-2 min-h-0">
          <div class="shadow-xl border border-base-300 flex-1 flex min-h-0">
            <Show
              when={currentTimelineGame()}
              fallback={<div class="text-center">Loading game data...</div>}
            >
              {(game) => (
                <div class="flex flex-col w-full min-h-0 gap-1 flex-1">
                  <div class="three-card flex flex-1 min-h-0">
                    <div
                      class="three-card-inner"
                      classList={{
                        "rotate-timeline": mobileShow() === "timeline",
                        "rotate-matchup": mobileShow() === "matchup",
                        "rotate-data": mobileShow() === "data",
                      }}
                    >
                      <div class="card card-border card-face card-timeline p-2 bg-base-100">
                        <h2 class="text-lg font-bold mb-2 border-b">
                          Timeline
                        </h2>
                        <div class="flex-1 flex-col gap-0.5 overflow-y-auto">
                          <TimelineGrid
                            seasonGameRows={seasonGameRows}
                            weekIndex={weekIndex}
                            setWeekIndex={setWeekIndex}
                          />
                        </div>
                      </div>

                      <div class="card card-border card-face card-matchup p-2 bg-base-100">
                        <h2 class="text-lg font-bold mb-2 border-b">Matchup</h2>
                        <div class="flex-1 overflow-y-auto p-2">
                          <MatchupContent
                            game={game}
                            formattedGameDate={formattedGameDate}
                          />
                        </div>
                      </div>

                      <div class="card card-border card-face card-data p-2 bg-base-100">
                        <h2 class="text-lg font-bold border-b">Data</h2>
                        <div class="flex-grow overflow-auto border-base-content flex rounded-box">
                          <pre class="text-xs whitespace-pre-wrap break-words p-2">
                            {JSON.stringify(currentTimelineGame(), null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="card card-border bg-base-100 gap-2 p-2">
                    <div class="card-actions">
                      {(["timeline", "matchup", "data"] as const).map((tab) => (
                        <button
                          class={`btn btn-primary btn-outline btn-sm ${
                            mobileShow() === tab && "btn-active"
                          }`}
                          onClick={() => setMobileShow(tab)}
                        >
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Show>
          </div>
          <TimelineControls {...controlsProps()} compact />
        </div>
      </div>

      {/* ── DESKTOP LAYOUT ── */}
      <div class="max-w-7xl w-full h-full mx-auto">
        <div class="hidden lg:flex gap-6 flex-row w-full pt-4 h-[calc(100vh-100px)]">
          <div class="card bg-base-100 shadow-xl border border-base-300 flex-none w-fit flex-shrink-0 h-full overflow-y-auto p-2">
            <h2 class="text-lg font-bold mb-2 sticky top-0 bg-base-100 border-b">
              Timeline
            </h2>
            <TimelineGrid
              seasonGameRows={seasonGameRows}
              weekIndex={weekIndex}
              setWeekIndex={setWeekIndex}
            />
          </div>

          <div class="flex flex-col w-full">
            <Show
              when={currentTimelineGame()}
              fallback={<div class="p-4 text-center">Loading game data...</div>}
            >
              {(game) => (
                <div class="flex-1 min-w-0 max-w-4xl mx-0">
                  <div
                    class="flip-card w-full h-full"
                    classList={{ "is-flipped": isFlipped() }}
                  >
                    <div class="flip-card-inner">
                      <div class="bg-base-100 shadow-xl border border-base-300 flip-card-front rounded-box">
                        <div class="flex-1 overflow-y-auto p-6">
                          <MatchupContent
                            game={game}
                            formattedGameDate={formattedGameDate}
                          />
                        </div>
                        <div class="flex justify-center p-4 card-actions flex-shrink-0 border-t border-base-content/10">
                          <button
                            class="btn btn-primary btn-outline"
                            onClick={() => setIsFlipped((f) => !f)}
                          >
                            View Game Data
                          </button>
                        </div>
                      </div>

                      <div class="flip-card-back bg-base-300 shadow-xl border border-base-300 text-left rounded-box">
                        <h2 class="text-xl font-bold py-4 px-6 border-b border-base-content/10 flex-shrink-0">
                          Game Data
                        </h2>
                        <div class="flex-1 overflow-y-auto p-6">
                          <pre class="text-sm whitespace-pre-wrap break-words">
                            {JSON.stringify(currentTimelineGame(), null, 2)}
                          </pre>
                        </div>
                        <div class="flex justify-center p-4 border-t border-base-content/10 flex-shrink-0">
                          <button
                            class="btn btn-primary btn-outline"
                            onClick={() => setIsFlipped((f) => !f)}
                          >
                            Show Game
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Show>
            <TimelineControls {...controlsProps()} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
