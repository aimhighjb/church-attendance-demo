# CLAUDE.md — Church Attendance App Source of Truth

This file is the permanent product, UX, permission, regression, and implementation guide for the Korean church attendance app. Read it before changing code.

## 0. NON-NEGOTIABLE RULES

1. **UI redesign must NEVER remove existing functionality.** A design change is visual/interaction work only unless the user explicitly asks to remove a feature. If a feature does not fit the new layout, keep it reachable through an appropriate menu/action.
2. **iPhone is the primary design target now.** iPad/PC remain responsive, but iPhone usability wins. PC will later receive a dedicated wide-screen layout using the same domain logic.
3. **Older-eye readability is a core requirement.** Important text must look large, not merely satisfy a minimum. Primary names/labels should generally be 18–22px+, major headings 24–30px, critical counts 30–44px, secondary text generally 14–16px+. Touch targets should be about 44pt or larger.
4. **Use space efficiently.** Avoid decorative whitespace, oversized cards, excessive padding, repeated labels, and large unused areas. Put compatible information on one line.
5. **Use cards/bubbles sparingly.** Prefer typography, spacing, grouped surfaces, compact rows, and subtle highlights. Pills are for short status only. Attendance people controls are **2 per row on iPhone**.
6. **Functionality-first and regression-intolerant.** Before release, run the regression checklist in this file.
7. **GitHub Pages is the standard test workflow.** Repo: `aimhighjb/church-attendance-demo`; primary app: `app-v1/`. Push meaningful changes, verify Pages deployment, and reuse the same test URL.

---

# 1. CORE PRODUCT WORKFLOW — ABSOLUTE UX RULE

The everyday attendance workflow is intentionally simple:

> **1. Select Date → 2. Select Meeting → 3. Check Attendance → Return Home**

This is the primary workflow around which the iPhone UI must be designed.

## Step 0 — Login / Test Login
Production will use Google login through Firebase Auth. During prototype testing, the **very first screen must be a TEST LOGIN user selector** so permissions can be tested without real authentication.

After a user is selected, the app enters Home.

## Step 1 — Select Date on Home
- Home owns the current working date (`selectedDate`).
- Default is today.
- Date is selected from the center of the global top floating bar.
- Changing date immediately refreshes the Home content to show meetings for that date only.
- Date remains selected when returning Home from attendance.

## Step 2 — Select Meeting on Home
- Home shows only scheduled/valid meetings for `selectedDate`.
- General regular, period/ad-hoc, and one-time meetings appear in one chronological list; users should not need to understand the internal meeting type to attend.
- Each meeting row clearly shows time, meeting name/location, current attendance count, Guest/Online/status when applicable.
- Cancelled meetings are clearly marked and do not open attendance entry.
- Selecting a meeting establishes `activeMeetingId` and opens the attendance work screen.

## Step 3 — Attendance Work Screen
Once a meeting is selected, the attendance screen is **work-only**:
- No date picker.
- No previous/next date.
- No other-meeting shortcuts.
- No meeting carousel.
- The selected date and meeting are display-only context.
- The user checks attendance, Guest, Online, etc.
- Changes save immediately.

Return to Home using either:
- church logo/name in the global top bar, or
- Home in the bottom navigation.

Home returns to the same `selectedDate`, allowing the next meeting to be selected.

## Bottom Attendance Button behavior
- If there is a valid previously selected meeting context, it may resume that attendance screen.
- If there is no selected meeting, Attendance must route to Home/meeting selection rather than silently choosing a random/default meeting.

## Workflow state
Keep the core navigation state simple:
- `selectedDate`
- `activeMeetingId`
- selected test/production user identity
- current role context where applicable

**Home is where context is selected. Attendance is where work is done.** Never blur those responsibilities.

---

# 2. TEST LOGIN MODEL

The prototype must open with a TEST LOGIN screen before the normal app UI. This is a replacement for real authentication only during testing.

Use these five test identities so the requested role counts are exact:

1. **김영수 집사** — `Admin + User`
2. **이선희 권사** — `Admin + 순장/부순장`
3. **박정호 집사** — `User + 순장/부순장`
4. **최미경 권사** — `User only`
5. **한민수 집사** — `순장/부순장 only` (prototype role context; production login still follows base-account rules)

This yields:
- Admin: 2 people
- User: 3 people
- Leader: 3 people
- Admin people are both dual-role
- among the three User people, two are dual-role and one is User-only
- among the three Leader people, two are dual-role and one is Leader-only

### Multi-role testing
- Selecting a person logs in as that identity with a sensible default role (first listed role).
- If the selected person has multiple roles, the user menu must allow switching **only among that identity's assigned roles**.
- Role switching is a test convenience, not production security.
- “다른 사용자로 테스트” returns to the TEST LOGIN screen.

### Production role model
Base roles remain:
- Admin
- User

Small-group leadership is member-based and separate. Production authentication uses Google login + Firebase Authentication + Admin allowlist.

---

# 3. GLOBAL iPHONE NAVIGATION

## Global Top Floating Bar
Always visible after login.

Layout:
- **Left:** church logo + church name; tap => Home
- **Center:** selected date, e.g. `8/14/2026`
  - selectable only on Home
  - display-only on attendance work screen
- **Right:** current user; opens user/role/display menu

The bar must be compact but readable for older eyes.

## Bottom Floating Navigation
Keep five primary buttons.

Admin/User default:
- Home
- Attendance
- Members
- Reports
- More

Leader role default:
- Home
- Attendance
- My Small Group
- Reports
- More

If a multi-role test user needs a function omitted from the current role's five buttons, keep that function reachable from More or switch role from the user menu. Never delete the function.

## Attendance Secondary Floating Bar (“Top 2”)
Only on the attendance work screen.

Must contain:
- search icon on the left
- selected meeting name prominently
- current attendance count prominently
- dropdown: `전체 / 출석 / 미출석 / 장기결석`

Search field stays hidden until search icon is tapped to save space.

---

# 4. DESIGN SYSTEM

## Typography
Use a webfont that renders Korean and English consistently. Current approved choice:

**Noto Sans KR** (Google Fonts) with system fallbacks.

Rationale: reliable Korean glyphs, strong Latin/English rendering, many weights, and good readability.

Priority:
1. Current attendance count / critical number
2. Meeting name / person name / page title
3. Primary metadata
4. Secondary metadata

Suggested iPhone defaults:
- critical count: 32–44px
- major screen/section heading: 24–30px
- meeting/person name: 19–23px
- primary row text: 17–20px
- secondary text: 14–16px
- do not hide important data in tiny gray text

Large-text mode must noticeably increase sizes.

## Visual style
- native iPhone productivity feel
- modern Korean MZ + subtle futuristic flavor
- dark default, light supported
- strong contrast
- minimal borders
- minimal cards
- one meaningful grouped surface is better than many bubbles
- use whitespace intentionally, but do not waste space
- prefer one-line information where readable

## Person attendance controls
- exactly 2 per row on iPhone
- large name, title adjacent
- at most one secondary line
- selected state: subtle background + clear checkmark
- no unnecessary border nesting
- entire control is a large tap target

## Meeting rows
Use aligned columns so the list scans like a well-designed mobile table:
- Time
- Meeting name / location
- Attendance count
- Guest / Online / status
- chevron

Attendance count is the most visually dominant cell.

---

# 5. HOME SCREEN

Home is context selection, not a generic analytics dashboard.

Primary summary should be compact, e.g.:
`14 Unique 등록교인 · Guest 3 · Online 9`

Do not create three huge cards for those numbers.

Then show selected-date meetings chronologically. Each row should show the current attendance status and be easy to tap.

For Admin, compact management shortcuts may appear (e.g. Meeting Management, Small Group Management), but the selected-date meeting workflow stays first.

For Leader/Admin, small-group sessions relevant to the selected date may appear as a separate section and remain separate from worship attendance statistics.

---

# 6. GENERAL ATTENDANCE

## Attendance operation
- tap person => attendance ON, save immediately
- tap again => OFF immediately, no confirmation
- optimistic UI production target
- haptic where supported; visual fallback

## Classification groups
General regular meetings support:
- 정기
- 가끔
- 장기결석

Filter dropdown:
- 전체
- 출석
- 미출석
- 장기결석

Search:
- reveal from search icon
- name + title + Note
- searches all Active members, including non-target department

## Guest / Online
Where enabled, use compact inline counter controls rather than large cards.
Example:
`Guest  − 3 +    Online  − 9 +`

## Multi-user production target
- realtime sync
- last successful write wins for same-member conflict
- every write/reversal audited
- retry 1–2 times and revert on failed persistence

---

# 7. MEMBERS — MUST REMAIN AVAILABLE

Fields:
- stable Member ID
- Name
- duplicate suffix A/B/C as needed
- Department
- Title optional/configurable
- Note
- Active / Inactive / Deceased
- current small-group assignment
- joined/tracking start date
- per-meeting classification override
- history

Rules:
- no hard delete
- Inactive hidden from ordinary attendance/search by default
- Deceased hidden from ordinary attendance/search
- Inactive/Deceased ends current group membership and leadership
- reactivation does not restore former group
- duplicate names remain distinct by stable ID

Permissions:
- Admin/User can manage general member info
- Admin alone manages group assignment/leader assignment
- leader-only context cannot edit general member info

Features:
- search/filter by department/title/status/name/Note/meeting/classification/group
- bulk department/title/status/group actions
- Excel/CSV import target
- filtered export
- attendance history
- historical department/classification context
- manual override AUTO/정기/가끔/장기

---

# 8. MEETING MANAGEMENT — MUST NEVER DISAPPEAR

Admin must always have a reachable **모임 관리** page. A redesign that hides/removes this is incomplete.

Meeting types:
1. Regular recurring
2. Period/ad-hoc
3. One-time special
4. Small-group manual session (separate workflow)

Fields/features:
- name
- Active / Inactive / Archived
- time (no end time required)
- general-meeting location master
- weekdays for recurring
- start/end for period
- date for one-time
- target departments
- Guest toggle
- Online toggle for regular meetings only
- Note/description
- occurrence display-name override
- cancel occurrence
- add/change occurrence
- exclude occurrence from auto classification
- per-meeting classification settings

Default/example regular meetings include Sunday 1st/2nd, EM, middle/high, children, toddlers, Friday praise, Saturday morning, weekday dawn.

Admin actions:
- create
- edit
- inactivate/reactivate
- archive
- occurrence settings
- union service helper

Union service helper:
- cancel chosen regular sessions
- create separate one-time union service
- cancelled sessions excluded from classification

---

# 9. ATTENDANCE CLASSIFICATION

Default:
- Regular: >=2 of recent 4 held sessions
- Occasional: not Regular but >=1 in recent 30 held sessions
- Long absent: 0 in recent 30 held sessions

Global and per-meeting configurable.

Rules:
- Held eligible sessions only
- Cancelled excluded
- new members use configurable minimum actual meeting count before AUTO; default 4
- manual override AUTO / Regular / Occasional / Long absent persists until reset to AUTO
- corrections recalculate attendance while preserving historical department/classification semantics

---

# 10. SMALL GROUPS (순모임)

## Group master
Admin manages:
- Name
- Note
- Active/Inactive
- exactly one current 순장
- multiple 부순장
- member assignment

Leadership:
- leader must be registered member and same group
- moving/inactivating/deceasing removes leadership automatically
- replacing leader removes role, not member record
- 순장/부순장 have identical group operational permissions

## Small-group session
Manual; no fixed weekday required.
Fields: date, time, free-form location, Active/Cancelled, session Note/prayer requests.

Attendance:
- leader included in roster/denominator
- 2 people per iPhone row
- no Regular/Occasional/Long grouping
- leader view does NOT show general Member Note
- show name + title + leader tag only

Counters:
- 기타 등록회원
- 순자녀들
- 방문

Primary summary example:
`순원 8/10 · 80% · 기타회원 1 · 순자녀들 5 · 방문 2`
Secondary: `현장 총인원 16`

Other-member conversion: Admin can convert one visitor into an actual registered member attendance without changing the person's original group.

## Exclusion periods
Admin + relevant leaders can create non-overlapping date ranges with optional app-only reason. Excluded members do not count in denominator/missed/consecutive absence; attendance during an exclusion can still be recorded.

## Session Note privacy
- max 1000 chars
- leader read/edit within configured window, default 7 days
- after window leader cannot read old Note
- Admin retains access within active historical rules
- no Note search
- never export Note to PDF/Excel
- audit changes while retained
- retention configurable 1–5 calendar years, default 2; expired Note content and change-content history deleted

---

# 11. REPORTS — MUST REMAIN AVAILABLE

General User/Admin reports:
- weekly Sunday–Saturday per meeting
- Sunday summary + registered-member Unique
- Guest/Online separate
- department Unique
- attendance rate
- regular absentees + title + consecutive absence
- previous-week delta / recent 4-week average
- 12/26/52-week trends target
- monthly avg/max/min + Unique + Guest/Online + full-month absentees + prior-month delta
- Summary/Detailed
- individual attendance history/export

Exports:
- screen
- Excel target
- print-ready PDF
- static prototype may temporarily use CSV
- Admin-only Save to Drive target

Small-group reports:
- weekly/monthly
- meeting count, average rate, Unique roster attendees, other members, children, guests, consecutive absentees, prior-month delta
- 6/12-month trends
- Admin comparison without ranking
- leader own group only
- Admin combined all-group PDF/Excel target

---

# 12. USERS / AUTH / PERMISSIONS

Production target:
- Firebase Authentication + Google login
- Admin email allowlist
- unlisted denied
- multiple Admins
- cannot deactivate last Active Admin
- accounts Active/Inactive, not deleted
- one Member can link multiple Google accounts
- member link optional for normal Admin/User; required for leader access
- linked multiple Active accounts inherit member leadership
- unlinked external account has manual display name
- audit stores display name + email

Test login is only a UI/permission simulator and must never be mistaken for production authentication/security.

---

# 13. AUDIT

Admin only. Audit:
- attendance ON/OFF
- member changes
- department/title/location masters
- counters
- users/permissions
- config
- group/session changes
- Note changes
- backup/restore/archive
- report generation/save

Search/filter by date, user, member, type, meeting. Default retention 2 years except sensitive group Note content follows Note retention.

---

# 14. BACKUP / RESTORE / ARCHIVE

Production architecture:
- Firestore = active operational DB
- Firebase Auth = login
- optional Realtime Database = lightweight presence only
- Google Drive = Backup / Archive / Reports / Logo / Import
- avoid Firebase Storage/Cloud Functions early when practical
- each church ideally owns its own Firebase/Google Cloud project + Drive

Active data:
- current calendar year + previous calendar year active/editable
- older years Archive/read-only
- e.g. in 2026: 2026/2025 active; 2024 and older read-only

Archive:
- first Admin login after new year can trigger process in early version
- split by year + data type
- encrypted + checksum verified
- two copies
- never delete source until archive verified
- secondary failure warns but does not block primary
- retry max once per eligible Admin-login day + manual retry

Recovery key:
- church-specific auto-generated
- shown once to first Admin
- not re-displayable
- rotation requires Google reauthentication
- safely re-encrypt archives after verification
- audited

Restore:
- safety backup first
- whole or selected-area restore target

---

# 15. ADMIN CONFIG / MASTERS

Must remain reachable from More/Admin:
- Meeting Management
- Small Group Management
- User / Permission Management
- Basic Church Info
- Departments
- Titles
- Locations
- attendance/classification defaults
- small-group eligible departments
- edit windows
- Note retention/read window
- Audit retention
- Backup/Archive
- Audit
- System info

Department/title/location masters support add, rename, inactivate, reorder, reactivate; avoid destructive deletion when history references them.

---

# 16. RESPONSIVE TARGETS

## iPhone
Primary target now:
- test/login selector first in prototype
- floating top/bottom navigation after login
- 2 people per row
- large text
- one-line information where readable
- date → meeting → attendance workflow

## iPad
Natural column expansion while preserving touch-first behavior.

## PC
Later dedicated wide layout, keyboard/mouse optimized, potentially multi-panel. Do not merely enlarge iPhone cards.

---

# 17. REGRESSION CHECKLIST BEFORE EVERY RELEASE

### Login / Navigation / Core Workflow
- [ ] TEST LOGIN appears when no test identity is selected
- [ ] all 5 test identities appear with correct roles
- [ ] multi-role identity can switch only between assigned roles
- [ ] change-account returns to TEST LOGIN
- [ ] logo/church name returns Home
- [ ] Home date selection works
- [ ] selected date shows correct meetings
- [ ] meeting row opens selected meeting/date attendance
- [ ] cancelled meeting does not open attendance entry
- [ ] attendance screen contains no date picker or other-meeting shortcut
- [ ] returning Home preserves selected date
- [ ] Bottom navigation remains available
- [ ] text is large enough for older users

### General attendance
- [ ] member ON/OFF
- [ ] exactly 2 person controls per iPhone row
- [ ] search icon/search field
- [ ] 전체 / 출석 / 미출석 / 장기결석 dropdown
- [ ] Guest
- [ ] Online where applicable
- [ ] Regular/Occasional/Long classification
- [ ] quick member add
- [ ] occurrence/session settings
- [ ] past edit rules

### Member management
- [ ] member list
- [ ] add/edit
- [ ] Active/Inactive/Deceased
- [ ] department/title/note
- [ ] duplicate names
- [ ] Admin group assignment
- [ ] classification override
- [ ] bulk actions/export
- [ ] history

### Meeting management
- [ ] **Meeting Management page exists and is reachable from Admin More**
- [ ] regular create/edit
- [ ] period create/edit
- [ ] one-time create/edit
- [ ] Active/Inactive/Archived
- [ ] target departments
- [ ] location
- [ ] Guest/Online options
- [ ] occurrence settings
- [ ] union service helper

### Small groups
- [ ] group master
- [ ] leader/assistant assignment
- [ ] session create/edit/cancel
- [ ] roster attendance
- [ ] children/guest/other counts
- [ ] exclusion periods
- [ ] Note privacy/window
- [ ] group reports

### Reports / Admin
- [ ] weekly/monthly/individual/group reports
- [ ] export/print
- [ ] users/permissions
- [ ] masters/settings
- [ ] Audit
- [ ] Backup/Restore
- [ ] Archive

If any checked feature disappears because of a redesign, the redesign is incomplete.

---

# 18. CURRENT STATIC PROTOTYPE LIMITATIONS

GitHub Pages currently may use `localStorage` and simulated identities/roles.
Not yet production-wired:
- real Firebase Authentication
- Firestore persistence
- true realtime multi-user sync
- Google Drive backup/archive/report storage
- production encryption/recovery-key flow
- full XLSX paths
- production server-side security rules

These are future integrations, not features to remove.

---

# 19. WORKING RULE FOR FUTURE AGENTS

For any redesign / prettier UI / larger text / reduced bubbles request:
1. Read this file.
2. Inspect current implementation.
3. Preserve all functions and routes.
4. Apply only needed presentation/interaction changes.
5. Validate the Core Workflow in Section 1.
6. Run Section 17 regression checks, especially Meeting Management.
7. Commit to GitHub.
8. Verify GitHub Pages deployment.
9. Reuse the stable test URL whenever possible.

**Functionality-first · iPhone-first · readability-first · workflow-first · regression-intolerant.**
