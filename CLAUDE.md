# CLAUDE.md — Church Attendance App Source of Truth

This file is the permanent project instruction and regression checklist for the Korean church attendance app.

## 0. NON-NEGOTIABLE RULES

1. **UI redesign must NEVER remove existing functionality.**
   - A design change is a visual/interaction change only unless the user explicitly asks to remove a feature.
   - Before every UI change, compare the feature checklist in this file and confirm all existing functions remain reachable.
   - If a feature temporarily cannot be shown in the new layout, keep the underlying function and add a reachable menu/action rather than deleting it.

2. **iPhone is the primary design target right now.**
   - Design first for current iPhone screen widths.
   - iPad and PC must remain responsive, but do not compromise the iPhone experience to make desktop prettier.
   - PC will later use a dedicated wide-screen layout; do not merely stretch the iPhone UI.

3. **Readability for older adults is a core product requirement.**
   - Many users have presbyopia / older eyes.
   - Default important text must be visibly large, not merely technically readable.
   - Prefer 18–22px for primary labels/names, 22–28px for major headings, and 28px+ for critical numbers where appropriate.
   - Secondary text should generally not drop below 14–16px on iPhone.
   - Touch targets should be at least ~44pt high where practical.
   - Large-text mode must make primary text clearly larger, not just 1–2px larger.

4. **Use space efficiently.**
   - Do not create large decorative whitespace.
   - Avoid oversized cards, excessive padding, stacked labels, repeated explanatory copy, and large empty right-side areas.
   - Put information on one line whenever it remains readable.
   - Favor compact rows, aligned columns, 2-column people grids, and information hierarchy through typography rather than containers.

5. **Use bubbles/cards sparingly.**
   - Do NOT wrap every item in a rounded bubble/card.
   - Use flat surfaces, grouped lists, compact rows, whitespace, typography, and subtle background grouping.
   - Pills/badges are for short status only.
   - Person attendance controls may use a soft tap area, but iPhone layout is **2 people per row**.

6. **GitHub Pages is the normal test workflow.**
   - Repo: `aimhighjb/church-attendance-demo`
   - Primary test app: `app-v1/`
   - After meaningful changes: commit to repo, let GitHub Pages deploy, verify deployment status, then provide the test URL.
   - Do not make ZIP/local-file testing the default unless explicitly requested.

---

# 1. PRODUCT VISION

Korean church attendance management PWA/web app with:
- modern Korean MZ visual feel,
- futuristic/clean flavor used subtly,
- high information density,
- large high-contrast Korean typography,
- extremely fast attendance checking,
- simple role-based navigation,
- strong privacy, audit, archive, and backup model.

The app should feel closer to a polished native iPhone productivity app than a dashboard full of cards.

---

# 2. CURRENT iPHONE NAVIGATION MODEL

## Global Top Floating Bar
Always visible near the top.

Layout:
- **Left:** church logo + church name
  - tap => Home
- **Center:** selected date, e.g. `8/14/2026`
  - on Home: date is selectable
  - on attendance work screen: date is display-only; user must return Home to choose another date/meeting
- **Right:** current user
  - opens user / role / display controls in test mode

Keep this bar compact but large enough for older eyes.

## Bottom Floating Navigation
Keep the current 5-button bottom navigation for now.

Admin/User:
- Home
- Attendance
- Members
- Reports
- More

Leader:
- Home
- Attendance
- My Small Group
- Reports
- More

## Attendance Secondary Floating Bar (Top 2)
Appears only after the user selects a meeting from Home.

Must contain:
- search icon on the **left**
- meeting name prominently
- current number attending prominently
- filter selector/dropdown with:
  - 전체
  - 출석
  - 미출석
  - 장기결석

Do NOT place date picker or other-meeting shortcuts in this screen.
The attendance screen is a work screen, not a navigation screen.

---

# 3. HOME SCREEN FLOW

Home is the place where the user chooses context.

1. User selects date from the top floating bar.
2. Main content shows only meetings relevant to that selected date.
3. Each meeting row shows its attendance status.
4. User taps one meeting.
5. App opens that meeting's attendance work screen.
6. User checks people.
7. User returns Home via:
   - church logo/church name in top bar, or
   - Home button in bottom nav.

## Home Information Hierarchy
Critical information must be visually obvious.

Preferred compact summary pattern:
`14 Unique 등록교인 · Guest 3 · Online 9`

Do not split these into three large cards unless there is a very strong reason.

## Today's / Selected Date Meetings
Use aligned row/grid columns so every meeting is easy to scan.

Suggested logical columns:
- Time
- Meeting name / location
- Attendance count
- Guest / Online / status
- chevron

The **attendance count is the most important number** and should stand out.
Avoid a boxed dashboard look.

---

# 4. GENERAL ATTENDANCE SCREEN

## Selection Controls
- 2 people per row on iPhone.
- Large names.
- Title displayed adjacent to name, smaller but still readable.
- Note or department can be one compact secondary line.
- Do not use huge rounded bubbles.
- Selected/present state should be obvious using a soft highlight + checkmark.
- Tap toggles attendance immediately.
- Tap again toggles OFF immediately; no confirmation.
- Haptic feedback where supported; visual fallback.

## Attendance Groups
General regular meetings support:
- 정기
- 가끔
- 장기결석

Filters:
- 전체
- 출석
- 미출석
- 장기결석

Search:
- search icon in secondary floating bar
- reveal compact search field only when needed
- search name + title + Note
- search all Active members, not only target department

## Counters
Where enabled:
- Guest count
- Online count

Use compact inline controls, e.g.:
`Guest   −  3  +     Online   −  9  +`

Do not create a large card for each counter.

## Multi-user behavior (production target)
- realtime sync
- last successful write wins on same-member conflict
- audit every write/reversal
- optimistic UI
- retry 1–2 times and revert on failure

---

# 5. MEMBER MANAGEMENT — MUST REMAIN AVAILABLE

Never lose the member management page during UI redesign.

Member fields:
- stable Member ID
- Name
- duplicate suffix A/B/C when needed
- Title (optional/configurable master)
- Department
- Note
- Status: Active / Inactive / Deceased
- current small-group assignment
- joined/tracking start date
- per-meeting classification override
- history

Rules:
- no hard delete
- Inactive hidden from normal attendance/search by default
- Deceased hidden from ordinary attendance/search
- reactivated member returns unassigned to small group
- Inactive/Deceased removes current small-group leadership
- same-name members remain distinct via stable ID

User permissions:
- Admin and general User can manage member information
- only Admin can manage small-group assignment / leader assignment
- leaders cannot edit general member info

Member page features:
- search/filter by department/title/status/name/Note/meeting/classification/group
- bulk department/title/status/group actions
- Excel/CSV import target
- filtered export
- individual attendance history
- historical department/classification context
- manual classification override AUTO/정기/가끔/장기

---

# 6. MEETING MANAGEMENT — MUST NEVER DISAPPEAR

**This has recently regressed visually; do not remove it again.**

Admin must always have a reachable Meeting Management page.

Meeting types:
1. Regular recurring
2. Period/ad-hoc
3. One-time special
4. Small-group manual session (separate workflow)

Meeting fields/features:
- name
- Active / Inactive / Archived
- time (no end time required)
- location master for general meetings
- weekdays for recurring
- start/end for period meetings
- date for one-time meetings
- target departments
- Guest count toggle
- Online count toggle for regular meetings only
- Note/description
- occurrence name override
- cancel occurrence
- add/change occurrence
- exclude special occurrence from auto classification
- classification settings per meeting

Regular meeting examples/defaults:
- Sunday 1st service
- Sunday 2nd service
- EM
- middle/high
- children
- toddlers
- Friday praise
- Saturday morning
- weekday dawn

Meeting Management must support:
- create
- edit
- inactivate/reactivate
- archive
- occurrence settings
- union service helper

Union service helper:
- cancel selected regular sessions
- create a separate one-time special union service
- cancelled regular sessions do not count toward classification

---

# 7. ATTENDANCE CLASSIFICATION

Default automatic classification for a regular meeting:
- Regular: >= 2 of recent 4 held sessions
- Occasional: not Regular, but >=1 in recent 30 held sessions
- Long absent: 0 in recent 30 held sessions

Configurable globally and per meeting.

Rules:
- only held eligible sessions count
- cancelled sessions excluded
- new member uses configurable minimum actual sessions before AUTO is trusted; default 4
- manual override supports AUTO / Regular / Occasional / Long absent
- override persists until AUTO restored
- corrections recalculate attendance while preserving historical semantics

---

# 8. SMALL GROUPS (순모임)

## Group Master
Admin manages:
- group name
- Note
- Active / Inactive
- exactly one current 순장
- multiple 부순장
- members

Leader constraints:
- leaders must be registered members
- same group as the group they lead
- moving/inactivating/deceasing removes leadership automatically
- replacing leader removes old leader role but keeps member

Permissions:
- Admin: all groups
- 순장/부순장: identical operational permissions for own group only
- normal User: no small-group access unless assigned leader

## Small-group session
Manual, no fixed weekday required.

Fields:
- date
- time
- free-form location
- status Active/Cancelled
- session Note / prayer requests

Attendance:
- leaders included in roster and denominator
- 2 people per row on iPhone
- no regular/occasional/long grouping
- filters can be overall/present/missed as appropriate
- small-group leader view must NOT show general Member Note
- show only name + title + leader role tag when relevant

Counters:
- 기타 등록회원
- 순자녀들
- 방문

Primary summary example:
`순원 8/10 · 80% · 기타회원 1 · 순자녀들 5 · 방문 2`

Secondary:
`현장 총인원 16`

Other-member rule:
- leader initially records visitor count only
- Admin may later convert one visitor to an actual registered member as 기타 등록회원
- guest -1, member attendance ON
- original group does not change

## Exclusion periods
Admin and relevant leaders can create non-overlapping date ranges with optional reason.
- excluded from denominator
- excluded from missed/consecutive absence
- if member attends during exclusion, attendance is recorded but denominator remains excluded
- reason is app-only; reports show excluded count, not reason

## Session Note privacy
- one Note per session
- max 1000 characters
- leaders same read/write rights within configured period
- default leader read/edit window 7 days
- after window leaders cannot read old Note
- Admin can read/edit according to active historical rules
- no Note search
- never export Note to PDF/Excel
- full change audit while retained

Retention:
- configurable 1–5 calendar years, default 2
- old note content and note change-content history deleted after retention
- audit retains only fact of retention deletion and timestamp

---

# 9. REPORTS — MUST REMAIN AVAILABLE

General User and Admin can view normal reports.
Leaders can view/download own small-group reports.

General reports:
- weekly Sunday–Saturday per meeting
- Sunday summary
- registered-member Unique across Sunday meetings
- Guest sum separately
- Online separately
- department-level Unique
- attendance rate
- regular absentees with title + consecutive absence
- previous-week delta
- recent 4-week average
- 12/26/52-week trends
- monthly average/max/min
- monthly registered Unique
- regulars absent whole month
- previous-month delta
- Summary / Detailed modes
- individual attendance history export

Exports:
- screen
- Excel target
- print-ready PDF
- CSV acceptable only for current static prototype where xlsx is not yet connected
- Admin-only Save to Drive target

Small-group reports:
- weekly/monthly
- meeting count
- average attendance rate
- Unique roster attendees
- other registered members
- children
- guests
- consecutive absentees
- prior-month delta
- 6/12-month trends
- Admin all-group comparison without ranking
- leader own group only
- Admin combined all-group PDF/Excel

---

# 10. USERS / ROLES / LOGIN

Base roles:
- Admin
- User

Small-group leadership is separate member-based assignment.

Production login target:
- Firebase Authentication with Google login
- Admin allowlist of Google emails
- unlisted users denied
- multiple Admins allowed
- cannot deactivate the last Active Admin
- users are Active/Inactive, not deleted
- one Member can have multiple Google accounts
- Member link optional for normal Admin/User
- Member link required for leader access
- if a leader member has multiple Active linked logins, all may access leader functions
- unlinked external account gets manual display name
- audit stores display name + actual email

Test version may use role switching, but this must not be mistaken for production security.

---

# 11. AUDIT

Admin only.

Audit all material changes including:
- attendance ON/OFF
- member fields
- departments/titles/locations
- counters
- users/permissions
- config
- group changes
- session notes
- backup/restore
- archive
- report generation/save

Audit filters/search:
- date
- user
- member
- change type
- meeting

Retention configurable; default 2 years, except sensitive small-group Note content follows stricter Note retention rules.

---

# 12. BACKUP / RESTORE / ARCHIVE

Production architecture target:
- Firestore = active operational DB
- Firebase Auth = login
- optional Realtime Database only for lightweight presence
- Google Drive = Backup / Archive / Reports / Logo / Import files
- avoid Firebase Storage / Cloud Functions in early free-plan version when practical
- each church should ideally own its own Firebase/Google Cloud project and Drive

Active Firestore retention:
- current calendar year + previous calendar year editable/active
- older years archived/read-only
- e.g. 2026 => 2026 & 2025 active, 2024 and earlier Archive/read-only

Archive process:
- triggered on first Admin login after new year rather than scheduled cloud function in early version
- archive by year + data type
- encrypted
- checksum/integrity verified
- two copies
- never delete source until archive creation + verification succeeds
- secondary copy failure warns but does not block primary archive
- retry at most once per eligible Admin-login day + manual retry

Recovery key:
- church-specific auto-generated
- shown once to first Admin
- not re-displayable
- Admin rotation requires Google reauthentication
- rotation safely re-encrypts archives only after verification
- audit rotation

Restore:
- create safety backup before restore
- support whole or selected-area restore target

---

# 13. ADMIN CONFIG / MASTERS

Must remain reachable from More/Admin menus:
- Meeting Management
- Small Group Management
- User / Permission Management
- Basic Church Info
- Departments
- Titles
- Locations
- Attendance/classification defaults
- Small-group eligible departments
- Edit windows
- Note retention/read window
- Audit retention
- Backup/Archive
- Audit
- System info

Department/title/location masters:
- add
- rename
- inactivate
- reorder
- reactivate
- no destructive hard delete when historical records depend on them

---

# 14. DESIGN SYSTEM — CURRENT DIRECTION

## General
- iPhone-native productivity feel
- dark default, light supported
- subtle futuristic accent, not gaming/neon overload
- large typography
- strong contrast
- compact vertical rhythm
- minimal borders
- minimal cards
- use surfaces only to group meaningful sections

## Typography priority
1. Critical count / current attendance
2. Meeting name / person name / page title
3. Primary metadata
4. Secondary metadata

Do not give all text the same weight.

## Preferred iPhone sizing guidance
- critical count: ~30–40px depending on layout
- meeting/page heading: ~22–28px
- person name: ~18–22px
- primary row text: ~17–20px
- secondary text: ~14–16px
- never hide important information in tiny gray text

## Person controls
- 2 columns on iPhone
- large name
- adjacent title
- max one compact secondary line
- no unnecessary border
- soft selected background + check
- avoid empty internal padding

## Lines and borders
- do not create a checkerboard of borders
- prefer spacing + subtle grouped background
- use hairline separators only where scanability actually improves

---

# 15. RESPONSIVE TARGETS

## iPhone
Primary target now.
- 2 person controls per row
- large text
- floating top and bottom navigation
- compact one-line data wherever possible

## iPad
- may expand columns naturally
- preserve touch-first interactions

## PC
Later dedicated layout.
- do not simply enlarge iPhone cards
- use wide screen intentionally
- keyboard/mouse optimized
- potentially multi-panel views
- same domain logic/data model as mobile

---

# 16. REGRESSION CHECKLIST BEFORE EVERY RELEASE

Before pushing any redesign, verify these are still reachable/working:

### Navigation / UI
- [ ] Logo/church name returns Home
- [ ] Home date selection works
- [ ] Selected date shows correct meetings
- [ ] Meeting row opens selected meeting/date attendance
- [ ] Attendance screen does not force date/meeting re-selection
- [ ] Bottom navigation remains available
- [ ] User/role controls remain available in test mode
- [ ] Large text/readability remains strong

### General attendance
- [ ] Member attendance ON/OFF
- [ ] Search
- [ ] 전체 / 출석 / 미출석 / 장기결석 filter
- [ ] Guest count
- [ ] Online count where applicable
- [ ] regular/occasional/long classification
- [ ] quick member add
- [ ] occurrence/session settings
- [ ] past attendance editing rules

### Member management
- [ ] member list
- [ ] add/edit member
- [ ] status
- [ ] department/title/note
- [ ] duplicate names
- [ ] group assignment where Admin
- [ ] classification override
- [ ] bulk actions/export
- [ ] member history

### Meeting management
- [ ] meeting management page exists
- [ ] regular meeting create/edit
- [ ] period meeting create/edit
- [ ] one-time meeting create/edit
- [ ] Active/Inactive/Archived
- [ ] target departments
- [ ] location
- [ ] Guest/Online options
- [ ] occurrence settings
- [ ] union service helper

### Small groups
- [ ] group master page
- [ ] leader/assistant assignment
- [ ] group session create/edit/cancel
- [ ] roster attendance
- [ ] children/guest/other-member counts
- [ ] exclusion periods
- [ ] session Note privacy/window
- [ ] small-group reports

### Reports / Admin
- [ ] weekly report
- [ ] monthly report
- [ ] individual report/history
- [ ] export/print actions
- [ ] users/permissions
- [ ] config masters
- [ ] Audit
- [ ] Backup/Restore
- [ ] Archive

If any checked feature disappears because of a redesign, the redesign is incomplete and must not be considered finished.

---

# 17. CURRENT PROTOTYPE LIMITATIONS

The GitHub Pages test version may still use browser `localStorage` and simulated roles.
Do not confuse prototype limitations with product requirements.

Not yet production-wired:
- real Firebase Authentication
- Firestore persistence
- real multi-user realtime sync
- Google Drive backup/archive/report storage
- production encryption/recovery-key workflow
- true XLSX generation in all paths
- production server-side security rules

These are planned backend/integration tasks, not features to remove.

---

# 18. WORKING RULE FOR FUTURE AGENTS

When the user asks to “redesign,” “make it prettier,” “make text larger,” “reduce bubbles,” or similar:

1. Inspect this `CLAUDE.md` first.
2. Inspect the current implementation before editing.
3. Preserve all functions.
4. Change only the presentation/interaction required.
5. Run a regression pass against Section 16.
6. Commit to GitHub.
7. Verify GitHub Pages deployment.
8. Give the user the same test URL whenever possible.

**The product is functionality-first, iPhone-first, readability-first, and regression-intolerant.**
