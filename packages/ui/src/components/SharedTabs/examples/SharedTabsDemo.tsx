import React, { useState } from 'react'
import { SharedTabs } from '../index'
import type { TabItem } from '../types'

const StayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
    <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
    <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
  </svg>
)

const DineIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
    <path fillRule="evenodd" d="M9.75 6.75h-3a.75.75 0 000 1.5h3a.75.75 0 000-1.5zm6.75-3h-15a.75.75 0 00-.75.75v15a.75.75 0 00.75.75h15a.75.75 0 00.75-.75V4.5a.75.75 0 00-.75-.75z" clipRule="evenodd" />
  </svg>
)

const SpaIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
    <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25zM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h8.25c1.035 0 1.875-.84 1.875-1.875V15z" />
  </svg>
)

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
  </svg>
)

const serviceTabs: TabItem[] = [
  {
    id: 'stay',
    label: 'Stay',
    title: 'Stay',
    description: 'Suites, villas, and junior suites across Wess resorts.',
    icon: <StayIcon />,
    badge: 12,
  },
  {
    id: 'dine',
    label: 'Dine',
    title: 'Dine',
    description: 'Beach restaurants, pool bars, and curated dining experiences.',
    icon: <DineIcon />,
    badge: 3,
  },
  {
    id: 'wellbeing',
    label: 'Wellbeing',
    title: 'Wellbeing',
    description: 'Spa, gym, and restorative experiences for every guest.',
    icon: <SpaIcon />,
  },
]

const pricingTabs: TabItem[] = [
  { id: 'nightly', label: 'Nightly', icon: <CalendarIcon />, badge: 24 },
  { id: 'weekly', label: 'Weekly', icon: <CalendarIcon />, badge: 8 },
  { id: 'monthly', label: 'Monthly', icon: <CalendarIcon /> },
  { id: 'package', label: 'Package', disabled: true },
]

export const SharedTabsDemo: React.FC = () => {
  const [selectedService, setSelectedService] = useState<string>('')
  const [selectedPricing, setSelectedPricing] = useState<string>('nightly')

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Wess Experiences</h1>
        <p className="mt-1 text-sm text-gray-500">
          Choose from our range of hospitality services
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
          Services
        </h2>
        <SharedTabs
          variant="card"
          tabs={serviceTabs}
          value={selectedService}
          onChange={setSelectedService}
          fullWidth
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
          Select Duration
        </h2>
        <SharedTabs
          variant="underline"
          tabs={pricingTabs}
          value={selectedPricing}
          onChange={setSelectedPricing}
          fullWidth={false}
        />
      </section>

      <section className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="font-medium text-gray-900">Your Selection</h3>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <div>
            <span className="text-sm text-gray-500">Service:</span>
            <p className="font-medium">
              {selectedService
                ? serviceTabs.find((t) => t.id === selectedService)?.title
                : 'None selected'}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Duration:</span>
            <p className="font-medium">
              {pricingTabs.find((t) => t.id === selectedPricing)?.label}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
