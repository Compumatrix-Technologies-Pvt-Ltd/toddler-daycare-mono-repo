import React, { useState } from 'react'
import { SharedTabs } from '../index'
import type { TabItem } from '../types'

// ─── Underline Tab Icons ──────────────────────────────────────────────────────

const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="h-4 w-4"
  >
    <path
      fillRule="evenodd"
      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
      clipRule="evenodd"
    />
  </svg>
)

// ─── Underline Tabs Example ────────────────────────────────────────────────────

const pricingTabs: TabItem[] = [
  {
    id: 'daily',
    label: 'Daily',
    icon: <CalendarIcon />,
    badge: 24,
  },
  {
    id: 'weekly',
    label: 'Weekly',
    icon: <CalendarIcon />,
    badge: 8,
  },
  {
    id: 'monthly',
    label: 'Monthly',
    icon: <CalendarIcon />,
  },
  {
    id: 'quarterly',
    label: 'Quarterly',
    disabled: true,
  },
]

export const UnderlineTabsExample: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<string>('daily')

  return (
    <div className="p-6">
      <h2 className="mb-4 text-lg font-semibold">Pricing Plans</h2>
      <SharedTabs
        variant="underline"
        tabs={pricingTabs}
        value={selectedTab}
        onChange={setSelectedTab}
        fullWidth={false}
      />
      {selectedTab && (
        <p className="mt-4 text-sm text-gray-600">
          Selected: {pricingTabs.find((t) => t.id === selectedTab)?.label} plan
        </p>
      )}
    </div>
  )
}
