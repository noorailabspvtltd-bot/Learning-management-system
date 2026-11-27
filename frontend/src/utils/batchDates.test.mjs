import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeBatchDates, normalizeDateInput } from './batchDates.ts'

test('preserves a selected start date exactly in the API date range', () => {
  const selectedStartDate = '2026-11-28'

  assert.equal(normalizeDateInput(selectedStartDate), selectedStartDate)
  assert.deepEqual(normalizeBatchDates(selectedStartDate, '2026-12-05'), {
    start_date: selectedStartDate,
    end_date: '2026-12-05',
  })
})

test('rejects malformed, impossible, and reversed dates without coercion', () => {
  assert.equal(normalizeDateInput('61128-02-20'), '')
  assert.equal(normalizeDateInput('2026-02-29'), '')
  assert.equal(normalizeDateInput('2024-02-29'), '2024-02-29')
  assert.equal(normalizeBatchDates('2026-12-05', '2026-11-28'), null)
})
