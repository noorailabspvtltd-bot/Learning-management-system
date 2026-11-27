export interface BatchDateRange {
  start_date: string
  end_date: string
}

export function normalizeDateInput(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return ''

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (year < 1 || month < 1 || month > 12) return ''

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return day >= 1 && day <= daysInMonth[month - 1] ? value : ''
}

export function normalizeBatchDates(startDate: string, endDate: string): BatchDateRange | null {
  const start_date = normalizeDateInput(startDate)
  const end_date = normalizeDateInput(endDate)
  if (!start_date || !end_date || end_date < start_date) return null

  return { start_date, end_date }
}
