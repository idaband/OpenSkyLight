import { useEffect, useState } from 'react'
import { DateTime } from 'luxon'
import { usePeople, useSettings } from '../../api/hooks'
import { useUi, ZONE } from '../../stores/uiStore'
import { SegmentedControl, IconButton } from '../../components/ui'
import { ChevronLeftIcon, ChevronRightIcon, GearIcon, PlusIcon } from '../../components/icons'
import { WeatherButton } from '../weather/WeatherHeader'
import { initials, textOn } from '../../lib/format'
import type { CalendarViewKind } from '@shared/types'

function useNow(): DateTime {
  const [now, setNow] = useState(() => DateTime.now().setZone(ZONE))
  useEffect(() => {
    const t = setInterval(() => setNow(DateTime.now().setZone(ZONE)), 20_000)
    return () => clearInterval(t)
  }, [])
  return now
}

function periodLabel(view: CalendarViewKind, focusedDate: string, weekStartsOn: 0 | 1): string {
  const d = DateTime.fromISO(focusedDate, { zone: ZONE })
  if (view === 'home' || view === 'lists') return ''
  if (view === 'day' || view === 'chores') return d.toFormat('LLL d')
  if (view === 'month') return d.toFormat('LLLL yyyy')
  if (view === 'agenda') return `From ${d.toFormat('LLL d')}`
  const target = weekStartsOn === 0 ? 7 : 1
  let start = d
  while (start.weekday !== target) start = start.minus({ days: 1 })
  const end = start.plus({ days: 6 })
  return start.month === end.month
    ? `${start.toFormat('LLL d')} – ${end.toFormat('d')}`
    : `${start.toFormat('LLL d')} – ${end.toFormat('LLL d')}`
}

export function Header() {
  const now = useNow()
  const { data: settings } = useSettings()
  const { data: people = [] } = usePeople()
  const view = useUi((s) => s.view)
  const setView = useUi((s) => s.setView)
  const focusedDate = useUi((s) => s.focusedDate)
  const step = useUi((s) => s.step)
  const goToday = useUi((s) => s.goToday)
  const hiddenPeople = useUi((s) => s.hiddenPeople)
  const togglePerson = useUi((s) => s.togglePerson)
  const setSettingsOpen = useUi((s) => s.setSettingsOpen)
  const weekStartsOn = settings?.weekStartsOn ?? 0
  const timeFormat = settings?.timeFormat ?? '12h'
  return (
    <header className="flex flex-wrap items-center gap-1 px-2 pt-2 pb-2 min-[640px]:flex-nowrap min-[640px]:gap-2 min-[640px]:px-4 min-[640px]:pt-5 min-[640px]:pb-4 min-[1500px]:gap-3 min-[1500px]:px-5">
      {/* Today + a big clock (the header is the only clock since the home
          screen dropped its clock tile); scales down so everything still
          fits on 1280-wide displays */}
      <button type="button" onClick={goToday} className="pressable flex min-w-0 shrink items-center gap-1.5 text-left min-[640px]:gap-3 min-[1500px]:gap-4">
        <div>
          <div className="font-display truncate text-[1.35rem] leading-none font-semibold tracking-tight min-[640px]:text-[2.05rem] min-[1500px]:text-[2.6rem]">
            {now.toFormat('cccc')}
          </div>
          <div className="mt-0.5 text-xs font-bold text-ink-soft min-[640px]:mt-1 min-[640px]:text-base min-[1500px]:text-lg">{now.toFormat('LLLL d')}</div>
        </div>
        <div className="w-px self-stretch bg-ink-faint/30" />
        <div className="font-display shrink-0 text-[1.35rem] leading-none font-semibold tracking-tight tabular-nums min-[640px]:text-[2.05rem] min-[1500px]:text-[3.1rem]">
          {timeFormat === '24h' ? (
            now.toFormat('HH:mm')
          ) : (
            <>
              {now.toFormat('h:mm')}
              <span className="ml-0.5 text-xs font-bold text-ink-soft min-[640px]:ml-1 min-[640px]:text-lg min-[1500px]:ml-1.5 min-[1500px]:text-2xl">
                {now.toFormat('a').toLowerCase()}
              </span>
            </>
          )}
        </div>
      </button>

      <div className="shrink-0 [&_button]:h-11 [&_button]:w-11 min-[640px]:[&_button]:h-auto min-[640px]:[&_button]:w-auto">
        <WeatherButton />
      </div>

      <div className="hidden flex-1 min-[640px]:block" />

      {/* person filter: compact avatar circles, never clipped (overlap when the family is large) */}
      {people.length > 0 && (
        <div className={`hidden shrink-0 items-center min-[640px]:flex ${people.length >= 4 ? '-space-x-2' : 'gap-1.5'}`}>
          {people.map((p) => {
            const hidden = hiddenPeople.includes(p.id)
            return (
              <button
                key={p.id}
                type="button"
                aria-label={`${hidden ? 'Show' : 'Hide'} ${p.name}`}
                title={p.name}
                onClick={() => togglePerson(p.id)}
                className={`pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ring-2 ring-paper transition-all ${
                  hidden ? 'opacity-35 grayscale' : 'shadow-card'
                }`}
                style={{ backgroundColor: p.color, color: textOn(p.color) }}
              >
                {initials(p.name)}
              </button>
            )
          })}
        </div>
      )}

      {/* period nav (removed from layout where it isn't meaningful — space matters here) */}
      {view !== 'lists' && view !== 'home' && (
        <div className="hidden shrink-0 items-center gap-1 rounded-2xl bg-paper-deep/70 p-1 min-[640px]:flex">
          <IconButton label="Previous" onClick={() => step(-1)}>
            <ChevronLeftIcon />
          </IconButton>
          <button
            type="button"
            onClick={goToday}
            className="pressable min-w-16 rounded-xl px-2 py-2 text-center text-base font-extrabold text-ink min-[1500px]:min-w-24"
          >
            {periodLabel(view, focusedDate, weekStartsOn)}
          </button>
          <IconButton label="Next" onClick={() => step(1)}>
            <ChevronRightIcon />
          </IconButton>
        </div>
      )}

      <div className="order-last w-full min-w-0 overflow-x-auto [scrollbar-width:none] min-[640px]:order-none min-[640px]:w-auto">
        <SegmentedControl
          value={view}
          onChange={setView}
          options={[
          { value: 'home', label: 'Home' },
          { value: 'day', label: 'Day' },
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
          { value: 'agenda', label: 'Agenda' },
          { value: 'chores', label: 'Chores' },
          { value: 'lists', label: 'Lists' }
          ]}
        />
      </div>

      <IconButton label="Settings" onClick={() => setSettingsOpen(true)}>
        <GearIcon size={26} />
      </IconButton>
    </header>
  )
}

export function Fab() {
  const openCreate = useUi((s) => s.openCreate)
  return (
    <button
      type="button"
      aria-label="Add event"
      onClick={() => openCreate()}
      className="pressable fixed right-7 bottom-7 z-30 flex h-18 w-18 items-center justify-center rounded-full bg-ember text-white shadow-float hover:bg-ember-deep"
    >
      <PlusIcon size={32} />
    </button>
  )
}
