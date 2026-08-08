// Exported from the Notion PT log supplied by the user.
// The export contains dates for every record and exercise notes for the final
// four sessions. Unknown fields are intentionally left blank instead of being
// guessed.

export const importedMemberId = 'member-notion-1'

export const importedMembers = [
  {
    id: importedMemberId,
    name: '용이레',
    phone: '',
    email: '',
    birthYear: '',
    gender: '',
    joinedAt: '2026-04-06',
    trainerId: 'trainer-1',
    goal: 'PT 회차 기록 확인',
    caution: '',
    status: '활성',
    avatarColor: '#d1fae5',
  },
]

const importedRows = [
  ['1회차', '2026-04-06', '2026-07-19T16:37'],
  ['2회차', '2026-04-09', '2026-07-19T16:37'],
  ['체형 분석', '2026-04-09', '2026-07-19T16:37'],
  ['3회차', '2026-04-16', '2026-07-19T16:37'],
  ['4회차', '2026-04-23', '2026-06-03T16:14'],
  ['5회차', '2026-04-30', '2026-05-01T13:25'],
  ['6회차', '2026-05-06', '2026-05-18T14:46'],
  ['7회차', '2026-05-08', '2026-05-18T14:46'],
  ['8회차', '2026-05-13', '2026-05-15T14:55'],
  ['9회차', '2026-05-15', '2026-05-18T14:56'],
  ['10회차', '2026-05-20', '2026-06-11T12:18'],
  ['11회차', '2026-05-22', '2026-05-26T15:53'],
  ['12회차', '2026-05-29', '2026-06-01T17:35'],
  ['13회차', '2026-06-04', '2026-06-08T16:01'],
  ['14회차', '2026-06-09', '2026-06-15T10:53'],
  ['15회차', '2026-06-10', '2026-06-15T10:59'],
  ['16회차', '2026-06-16', '2026-06-23T17:45'],
  ['17회차', '2026-06-18', '2026-06-23T17:47'],
  ['18회차', '2026-06-23', '2026-06-26T13:44'],
  ['19회차', '2026-06-24', '2026-06-26T13:45'],
  ['20회차', '2026-06-30', '2026-07-05T16:38'],
  ['21회차', '2026-07-02', '2026-07-05T16:37'],
  ['22회차', '2026-07-06', '2026-07-06T21:41'],
  ['23회차', '2026-07-07', '2026-07-20T19:30'],
  ['24회차', '2026-07-20', '2026-07-20T19:29'],
  ['25회차', '2026-07-22', '2026-07-23T14:38'],
  ['26회차', '2026-07-24', '2026-07-25T14:46'],
  ['27회차', '2026-07-28', '2026-07-28T13:26', 'Bosuball Squat · Machine Shoulder Press · Side Lateral Raise · Smith Lunge'],
  ['28회차', '2026-07-29', '2026-08-03T07:58', 'Pull-up · Dumbbell Row · Cable Fly · Chest Press Machine'],
  ['29회차', '2026-07-31', '2026-08-03T08:00', 'Barbell Shoulder Press · Front Raise · Bent-over Raise'],
  ['30회차', '2026-08-03', '2026-08-04T16:48', 'Deadlift · Bench Press · Squat'],
]

export const importedSessions = importedRows.map(([focus, date, sourceEditedAt, exercises], index) => ({
  id: `notion-session-${index + 1}`,
  memberId: importedMemberId,
  trainerId: 'trainer-1',
  date,
  startTime: '',
  duration: null,
  status: '완료',
  focus,
  exercises: exercises || 'Notion 회차 기록',
  condition: '기록 확인 필요',
  memo: 'Notion에서 가져온 회차 기록입니다.',
  nextPlan: '',
  source: 'notion',
  sourceEditedAt,
}))

export function getImportedState() {
  return {
    members: structuredClone(importedMembers),
    memberships: [],
    sessions: structuredClone(importedSessions),
    measurements: [],
    payments: [],
    notes: [],
    workoutAssignments: [],
    workoutLogs: [],
    mealRecords: [],
    coachingNotes: [],
    communications: [],
    announcements: [],
  }
}
