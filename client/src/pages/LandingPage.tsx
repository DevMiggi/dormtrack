import {
  ArrowRight,
  BedDouble,
  CalendarClock,
  ChartColumn,
  ClipboardList,
  KeyRound,
  ReceiptText,
  ShieldCheck,
  UserCog,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router'
import Logo from '../components/layout/Logo'

// Every sentence on this page comes from CLAUDE.md §1. No invented claims, numbers or testimonials.

type Item = { icon: LucideIcon; text: string }

const RECORDS: Item[] = [
  { icon: BedDouble, text: 'Rooms' },
  { icon: Users, text: 'Tenants' },
  { icon: KeyRound, text: 'Room assignments (occupancies)' },
  { icon: ReceiptText, text: 'Monthly billing' },
  { icon: Wallet, text: 'Payments' },
  { icon: Wrench, text: 'Maintenance requests' },
]

const PROBLEMS: Item[] = [
  { icon: BedDouble, text: 'which rooms still have free slots' },
  { icon: Users, text: 'whether a room is over capacity or a tenant is assigned twice' },
  { icon: Wallet, text: 'how much each tenant owes after partial payments' },
  { icon: CalendarClock, text: 'which accounts are overdue' },
  { icon: Wrench, text: 'which maintenance concerns are still open' },
]

const COMPUTES: Item[] = [
  { icon: BedDouble, text: 'Room availability and the occupancy rate' },
  { icon: ReceiptText, text: 'Bill totals and remaining balances' },
  { icon: CalendarClock, text: 'Overdue accounts' },
  { icon: ChartColumn, text: 'Revenue and maintenance summaries' },
]

const RULES = ['No overcapacity', 'No double assignment', 'No overpayment', 'Valid maintenance status changes only']

const USERS: (Item & { title: string })[] = [
  {
    icon: UserCog,
    title: 'Owners and managers',
    text: 'Dormitory or boarding-house owners and managers who assign rooms, bill tenants and record payments.',
  },
  {
    icon: ClipboardList,
    title: 'Caretakers and staff',
    text: 'Caretakers or staff who log and follow up maintenance requests.',
  },
]

const GROUP_MEMBERS = ['Miguel G. Salas', 'Erin Gabriel R. Turla', 'Pio Rafael D. Guinto', 'John Paul Akio Simbulan']

// The main call to action, styled like a button.
const ctaClasses =
  'inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-ink transition-colors hover:bg-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

function SectionHeading({ title, intro }: { title: string; intro?: string }) {
  return (
    <div className="mb-8 max-w-2xl">
      <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h2>
      {intro && <p className="mt-3 text-ink-muted">{intro}</p>}
    </div>
  )
}

function IconChip({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
      <Icon className="size-5" aria-hidden="true" />
    </span>
  )
}

function LandingPage() {
  return (
    <div className="min-h-screen">
      <section className="bg-primary text-white">
        <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <Logo onDark />
          <Link
            to="/dashboard"
            className="rounded-lg px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white"
          >
            Open dashboard
          </Link>
        </header>

        <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-8 pb-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:pt-12 lg:pb-24">
          <div>
            <p className="text-sm font-semibold tracking-wide text-accent uppercase">
              Dormitory and Boarding House Management System
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">DormTrack</h1>
            <p className="mt-5 max-w-xl text-lg text-white/85">
              DormTrack keeps rooms, tenants, room assignments, monthly billing, payments and maintenance requests in
              one system.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/dashboard" className={ctaClasses}>
                Go to the dashboard
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <a
                href="#problem"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-white/30 px-5 text-sm font-semibold text-white hover:bg-white/10"
              >
                Why DormTrack
              </a>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 text-ink shadow-xl">
            <p className="text-sm font-semibold text-ink-muted">Kept together in one system</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {RECORDS.map(({ icon, text }) => (
                <li key={text} className="flex items-center gap-3 rounded-lg border border-line p-3">
                  <IconChip icon={icon} />
                  <span className="text-sm font-medium">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <main>
        <section id="problem" className="mx-auto max-w-6xl scroll-mt-4 px-4 py-16 sm:px-6">
          <SectionHeading
            title="The problem"
            intro="Many dormitories and boarding houses keep records by hand. That makes it hard to tell:"
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PROBLEMS.map(({ icon, text }) => (
              <li key={text} className="flex items-start gap-4 rounded-xl border border-line bg-white p-5 shadow-sm">
                <IconChip icon={icon} />
                <span className="pt-2 text-ink">{text}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-y border-line bg-white">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2">
            <div>
              <SectionHeading title="What it computes" />
              <ul className="space-y-4">
                {COMPUTES.map(({ icon, text }) => (
                  <li key={text} className="flex items-center gap-4">
                    <IconChip icon={icon} />
                    <span className="font-medium text-ink">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <SectionHeading title="Rules it enforces" />
              <ul className="space-y-3">
                {RULES.map((rule) => (
                  <li key={rule} className="flex items-center gap-3 rounded-lg bg-surface px-4 py-3">
                    <ShieldCheck className="size-5 shrink-0 text-success" aria-hidden="true" />
                    <span className="font-medium text-ink">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionHeading title="Who it is for" />
          <div className="grid gap-4 md:grid-cols-2">
            {USERS.map(({ icon, title, text }) => (
              <div key={title} className="rounded-xl border border-line bg-white p-6 shadow-sm">
                <IconChip icon={icon} />
                <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-ink-muted">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-primary">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between">
            <p className="max-w-xl text-xl font-semibold text-white">
              Rooms, tenants, billing, payments and maintenance in one system.
            </p>
            <Link to="/dashboard" className={ctaClasses}>
              Go to the dashboard
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-ink-muted sm:px-6 md:flex-row md:items-center md:justify-between">
        <Logo />
        <p>Group members: {GROUP_MEMBERS.join(', ')}</p>
      </footer>
    </div>
  )
}

export default LandingPage
