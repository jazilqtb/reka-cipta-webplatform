// lib/calculator.ts
// Epic 6 Slice 2 (E6-S2-CONST-02) — fungsi kalkulasi murni, tanpa side
// effect, tanpa fetch. 100% client-side per CLAUDE.md rendering strategy.

import { CALCULATOR_RULES, CAPACITY_UNITS, type CapacityUnit, type IndustryValue } from '@/lib/constants/salt-calculator'

export interface CalculatorInput {
  industry: IndustryValue
  capacity: number
  unit: CapacityUnit
  subOption?: string
}

export interface CalculatorOutput {
  estimateMinTon: number
  estimateMaxTon: number
  recommendedSlugs: string[]
  reasoning: string
}

export function calculateSaltNeeds(input: CalculatorInput): CalculatorOutput {
  const rule = CALCULATOR_RULES[input.industry]
  const unitConfig = CAPACITY_UNITS.find((u) => u.value === input.unit)
  const monthlyFactor = unitConfig?.toMonthlyFactor ?? 1

  const monthlyCapacity = input.capacity * monthlyFactor

  const subOption = rule.subOptions.find((opt) => opt.value === input.subOption)
  const adjustFactor = subOption?.adjustFactor ?? 1

  const estimateMinTon = Math.round(monthlyCapacity * rule.saltRatioMin * adjustFactor * 10) / 10
  const estimateMaxTon = Math.round(monthlyCapacity * rule.saltRatioMax * adjustFactor * 10) / 10

  return {
    estimateMinTon,
    estimateMaxTon,
    recommendedSlugs: rule.recommendedSlugs,
    reasoning: rule.reasoning,
  }
}
