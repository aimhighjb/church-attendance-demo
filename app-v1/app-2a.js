const app=$('#app'); const modalRoot=$('#modal-root'); const toastRoot=$('#toast-root');

function applyAppearance(){ document.body.classList.toggle('font-large',ui.font==='large'); document.body.classList.toggle('light',ui.theme==='light'); }
function navItems(){
  return isLeader()
    ? [['home','⌂','홈'],['attendance','✓','출석'],['group','◉','내 순모임'],['reports','▤','리포트'],['more','⋯','더보기']]
    : [['home','⌂','홈'],['attendance','✓','출석'],['members','♙','회원'],['reports','▤','리포트'],['more','⋯','더보기']];
}
function activeNav(page){ return ['meetings','groups','users','settings','audit','backup','archive'].includes(page)?'more':page; }

function render(){
  applyAppearance();
  const actor=currentActor();
  app.innerHTML=`<div class="app-shell">
    <header class="topbar">
      <div class="brand"><div class="brand-logo">교</div><div><div class="brand-name">${esc(db.config.church.name)} 출석관리</div><div class="brand-sub">${esc(actor.name)} · ${esc(actor.role)} · Integrated Test v1</div></div></div>
      <div class="top-actions"><button class="icon-btn" id="themeBtn" title="테마">${ui.theme==='dark'?'☀':'☾'}</button><button class="icon-btn" id="fontBtn" title="글자크기">가+</button></div>
    </header>
    <div class="notice">통합 TEST · 실제 개인정보 입력 금지 · iPhone 우선 / PC 자동확장 · ${archiveCutoffYear}년 및 이전 자료는 읽기 전용</div>
    <div class="test-strip"><span class="test-label">TEST ROLE</span><div class="seg">${[['admin','Admin'],['user','User'],['leader','순장/부순장']].map(([r,l])=>`<button data-role="${r}" class="${ui.roleMode===r?'on':''}">${l}</button>`).join('')}</div></div>
    <main class="page">${renderPage()}</main>
  </div>
  <nav class="bottom-nav">${navItems().map(([p,i,l])=>`<button class="nav-btn ${activeNav(ui.page)===p?'on':''}" data-page="${p}"><span>${i}</span>${l}</button>`).join('')}</nav>`;
  bindGlobal(); bindPage();
}

function renderPage(){
  switch(ui.page){
    case 'home':return homePage();case 'attendance':return attendancePage();case 'members':return membersPage();case 'group':return groupPage();case 'reports':return reportsPage();case 'meetings':return meetingsPage();case 'groups':return groupsPage();case 'users':return usersPage();case 'settings':return settingsPage();case 'audit':return auditPage();case 'backup':return backupPage();case 'archive':return archivePage();default:return morePage();
  }
}

function homePage(){
  const todayMeet=scheduledMeetings(isoToday); const unique=new Set(); let guest=0,online=0;
  todayMeet.forEach(m=>{ const s=ensureSession(m.id,isoToday); sessionAttendance(s.id).forEach(id=>unique.add(id)); guest+=s.guestCount||0; online+=s.onlineCount||0; });
  const gs=todayGroupSessions();
  return `<section class="section"><div class="section-head"><h2>오늘 요약</h2><div class="hint">${fmtDate(isoToday)}</div></div><div class="grid stats">
    ${statCard(unique.size,'등록교인 Unique','오늘 중복 제거','main-number')}${statCard(guest,'Guest','예배 방문자')}${statCard(online,'Online','온라인')}</div></section>
    <section class="section"><div class="section-head"><h2>오늘 모임</h2><div class="hint">카드 터치 → 출석</div></div><div class="grid two">${todayMeet.length?todayMeet.map(homeMeetingCard).join(''):'<div class="empty">오늘 예정된 일반 모임이 없습니다.</div>'}</div></section>
    ${canAccessGroup()?`<section class="section"><div class="section-head"><h2>${isLeader()?'내 순모임':'오늘 / 이번 주 순모임'}</h2><div class="hint">순모임은 예배 통계와 분리</div></div><div class="grid two">${gs.length?gs.map(homeGroupCard).join(''):homeUpcomingGroup()}</div></section>`:''}
    ${isAdmin()?`<section class="section"><div class="section-head"><h2>운영 상태</h2><div class="hint">Admin</div></div><div class="grid three">${smallStatus('회원',activeMembers().length+'명','Active')}${smallStatus('활성 모임',db.meetings.filter(m=>m.status==='Active').length+'개','정상')}${smallStatus('Backup',db.backups[0]?.date?fmtShort(db.backups[0].date):'미실행','Demo')}</div></section>`:''}`;
}
function statCard(v,l,c,cls='number'){ return `<div class="card stat-card"><div class="${cls}">${v}</div><div class="stat-label">${l}</div><div class="stat-caption">${c}</div></div>`; }
function smallStatus(title,value,badge){return `<div class="card"><div class="item-title">${title}</div><div class="number" style="font-size:26px;margin-top:6px">${value}</div><div class="badges"><span class="badge ok">${badge}</span></div></div>`;}
function homeMeetingCard(m){ const s=ensureSession(m.id,isoToday),n=sessionAttendance(s.id).length;return `<div class="card meeting-card" data-home-meeting="${m.id}"><div class="mini-icon">${m.type==='one-time'?'★':m.id==='dawn'?'✦':'✧'}</div><div><div class="item-title">${esc(s.nameOverride||m.name)}</div><div class="item-meta">${m.time||''} · ${locationName(m.locationId)}</div><div class="badges"><span class="badge ${n?'ok':''}">${n?'출석 있음':'예정'} · ${n}명</span>${m.guest?`<span class="badge">Guest ${s.guestCount||0}</span>`:''}${m.online?`<span class="badge">Online ${s.onlineCount||0}</span>`:''}</div></div></div>`; }
function homeGroupCard(s){ const g=groupById(s.groupId),den=groupDenominator(s);return `<div class="card group-card" data-home-group="${s.id}"><div class="mini-icon">◉</div><div><div class="item-title">${esc(g?.name||'순모임')}</div><div class="item-meta">${s.time||''} · ${esc(s.location||'')}</div><div class="badges"><span class="badge ok">순원 ${s.attendance.length}/${den.length}</span><span class="badge">순자녀들 ${s.children||0}</span><span class="badge">방문 ${s.guests||0}</span></div></div></div>`; }
function homeUpcomingGroup(){ const g=isLeader()?leaderGroup():groupById('g_love');return `<div class="card group-card" data-new-group-session="${g?.id||'g_love'}"><div class="mini-icon">＋</div><div><div class="item-title">새 순모임 회차 만들기</div><div class="item-meta">${esc(g?.name||'사랑순')} · 날짜/장소 지정</div></div></div>`; }

function attendancePage(){
  const m=meetingById(ui.meetingId)||regularMeetings()[0]; if(m) ui.meetingId=m.id; const s=ensureSession(ui.meetingId,ui.date); ensureClassificationSnapshot(ui.meetingId,ui.date);
  const readOnly=isReadOnlyYear(ui.date); const canEdit=canEditGeneralDate(ui.date)&&!readOnly; const all=attendanceCandidates(m); const q=ui.search.trim().toLowerCase(); let filtered=q?all.filter(x=>`${displayName(x)} ${x.title} ${x.note} ${deptName(x.deptId)}`.toLowerCase().includes(q)):all;
  const att=sessionAttendance(s.id); if(ui.attendanceFilter==='on')filtered=filtered.filter(x=>att.includes(x.id)); if(ui.attendanceFilter==='off')filtered=filtered.filter(x=>!att.includes(x.id)&&effectiveClass(x)!=='장기'); if(ui.attendanceFilter==='regularmiss')filtered=filtered.filter(x=>!att.includes(x.id)&&effectiveClass(x)==='정기');
  return `<section class="section"><div class="section-head"><h2>출석체크</h2><div class="hint">${readOnly?'<span class="readonly">🔒 읽기 전용</span>':canEdit?'즉시 저장':'수정기간 종료'}</div></div>
    <div class="date-nav"><button class="icon-btn" data-date-step="-1">‹</button><input class="field" type="date" id="attendanceDate" value="${ui.date}"><button class="icon-btn" data-date-step="1">›</button><button class="btn small" id="todayBtn">오늘</button></div>
    <div class="toolbar-row" style="margin-top:6px"><div class="seg">${selectableMeetings(ui.date).map(x=>`<button data-meeting-pick="${x.id}" class="${ui.meetingId===x.id?'on':''}">${esc(x.name.replace('예배',''))}</button>`).join('')}</div></div>
    <div class="sticky-summary"><strong>${esc(s.nameOverride||m.name)}</strong><span>${m.time} · ${locationName(m.locationId)}</span><span>출석 ${att.length}</span>${m.guest?`<span>Guest ${s.guestCount||0}</span>`:''}${m.online?`<span>Online ${s.onlineCount||0}</span>`:''}<span>체크 중 · 김집사 · 이권사 · +1</span></div>
    <div class="toolbar"><input class="search" id="attSearch" placeholder="이름 · 직분 · Note 검색" value="${esc(ui.search)}"><div class="seg">${[['all','전체'],['on','출석'],['off','미출석'],['regularmiss','정기결석']].map(([v,l])=>`<button data-att-filter="${v}" class="${ui.attendanceFilter===v?'on':''}">${l}</button>`).join('')}</div></div>
    ${q?memberBubbles('검색결과',filtered,att,canEdit):memberBubbles('정기',filtered.filter(x=>effectiveClass(x)==='정기'),att,canEdit)+memberBubbles('가끔',filtered.filter(x=>effectiveClass(x)==='가끔'),att,canEdit)}
    <section class="section"><div class="section-head"><h2>추가 인원</h2><div class="hint">${readOnly?'수정 불가':'즉시 반영'}</div></div><div class="counter-grid">${m.guest?counterCard('guest','방문자',s.guestCount||0,canEdit):''}${m.online?counterCard('online','Online',s.onlineCount||0,canEdit):''}</div></section>
    ${!q?longAbsenceBlock(filtered.filter(x=>effectiveClass(x)==='장기'),att,canEdit):''}
    ${m.type==='period'?externalParticipantBlock(m,s,canEdit):''}
    ${canEdit?`<div class="toolbar-row"><button class="btn primary" id="quickAddMember">+ 성도 추가</button><button class="btn" id="sessionOptions">회차 설정</button></div>`:''}
  </section>`;
}
function selectableMeetings(date){ const map=new Map(); regularMeetings().forEach(m=>map.set(m.id,m)); scheduledMeetings(date).forEach(m=>map.set(m.id,m)); return [...map.values()].sort((a,b)=>(a.order||99)-(b.order||99)); }
function attendanceCandidates(m){ const target=new Set(m.targetDepts||[]); if(m.type==='period'&&m.participants?.length){const ids=new Set(m.participants.filter(p=>ui.date>=p.start&&ui.date<=p.end).map(p=>p.memberId));return activeMembers().filter(x=>ids.has(x.id)||ui.search.trim());} return activeMembers().filter(x=>target.has(x.deptId)||classification(x,m.id,ui.date)==='정기'||ui.search.trim()); }
function memberBubbles(label,list,att,canEdit){ if(!list.length)return ''; return `<div class="group-block"><div class="group-label"><span>${label} · ${list.length}</span></div><div class="bubbles">${list.sort(nameSort).map(m=>`<div class="bubble ${att.includes(m.id)?'on':''}" data-att-member="${m.id}" data-disabled="${canEdit?'0':'1'}" role="button" tabindex="0"><span class="bubble-name">${esc(displayName(m))}<span class="bubble-title">${esc(m.title)}</span></span><span class="bubble-note">${esc(m.note||deptName(m.deptId))}</span><button class="ellipsis" type="button" data-member-menu="${m.id}">⋯</button></div>`).join('')}</div></div>`; }
function nameSort(a,b){ return displayName(a).localeCompare(displayName(b),'ko'); }
function longAbsenceBlock(list,att,canEdit){ if(!list.length)return ''; return `<div class="group-block"><div class="group-label"><span>장기결석 · ${list.length}</span><button class="btn small" id="toggleLong">${ui.longCollapsed?'펼치기':'접기'}</button></div>${ui.longCollapsed?'':`<div class="bubbles">${list.sort(nameSort).map(m=>`<div class="bubble ${att.includes(m.id)?'on':''}" data-att-member="${m.id}" data-disabled="${canEdit?'0':'1'}" role="button"><span class="bubble-name">${esc(displayName(m))}<span class="bubble-title">${esc(m.title)}</span></span><span class="bubble-note">${esc(m.note||deptName(m.deptId))}</span><button class="ellipsis" data-member-menu="${m.id}">⋯</button></div>`).join('')}</div>`}</div>`; }
function externalParticipantBlock(meeting,session,canEdit){ const list=(meeting.externalParticipants||[]).filter(e=>ui.date>=e.start&&ui.date<=e.end); if(!list.length)return ''; const att=sessionAttendance(session.id); return `<div class="group-block"><div class="group-label"><span>외부 임시 참가자 · ${list.length}</span><span class="soft">이 모임에만 존재</span></div><div class="bubbles">${list.map(e=>`<button class="bubble ${att.includes(e.id)?'on':''}" data-external-att="${e.id}" ${canEdit?'':'disabled'}><span class="bubble-name">${esc(e.name)}</span><span class="bubble-note">${esc(e.note||'임시 참가자')}</span></button>`).join('')}</div></div>`; }
function counterCard(key,title,value,canEdit){return `<div class="card counter-card"><div class="counter-title">${title}</div><div class="counter"><button data-session-counter="${key}" data-delta="-1" ${canEdit?'':'disabled'}>−</button><input type="number" min="0" data-session-input="${key}" value="${value}" ${canEdit?'':'disabled'}><button data-session-counter="${key}" data-delta="1" ${canEdit?'':'disabled'}>＋</button></div></div>`;}

function membersPage(){
  const f=ui.memberFilter; let list=[...db.members]; if(f.status)list=list.filter(m=>m.status===f.status); if(f.dept)list=list.filter(m=>m.deptId===f.dept); if(f.group==='unassigned')list=list.filter(m=>!m.groupId&&db.config.eligibleGroupDepts.includes(m.deptId)); else if(f.group)list=list.filter(m=>m.groupId===f.group); if(f.q){const q=f.q.toLowerCase(); list=list.filter(m=>`${displayName(m)} ${m.title} ${m.note} ${deptName(m.deptId)}`.toLowerCase().includes(q));}
  const selected=new Set(ui.selectedMembers);
  return `<section class="section"><div class="section-head"><h2>회원관리</h2><div class="hint">${list.length}명</div></div>
    <div class="form-grid two"><input class="search" id="memberQ" placeholder="이름 / Note 검색" value="${esc(f.q)}"><select class="field" id="memberDept"><option value="">전체 부서</option>${db.departments.map(d=>`<option value="${d.id}" ${f.dept===d.id?'selected':''}>${esc(d.name)}</option>`).join('')}</select><select class="field" id="memberStatus"><option ${f.status==='Active'?'selected':''}>Active</option><option ${f.status==='Inactive'?'selected':''}>Inactive</option><option ${f.status==='Deceased'?'selected':''}>Deceased</option><option value="" ${!f.status?'selected':''}>전체 상태</option></select><select class="field" id="memberGroup"><option value="">전체 순</option><option value="unassigned" ${f.group==='unassigned'?'selected':''}>순 미배정</option>${db.groups.map(g=>`<option value="${g.id}" ${f.group===g.id?'selected':''}>${esc(g.name)}</option>`).join('')}</select></div>
    <div class="toolbar-row" style="margin-top:7px"><button class="btn primary" id="addMemberBtn">+ 성도 추가</button><button class="btn" id="exportMembers">Excel/CSV</button>${isAdmin()?`<button class="btn" id="bulkAction" ${selected.size?'':'disabled'}>선택 ${selected.size}명 일괄수정</button>`:''}</div>
    <div class="row-list" style="margin-top:8px">${list.sort(nameSort).map(m=>memberRow(m,selected.has(m.id))).join('')||'<div class="empty">조건에 맞는 성도가 없습니다.</div>'}</div></section>`;
}
function memberRow(m,selected){ const g=groupById(m.groupId); return `<div class="row-card" data-open-member="${m.id}">${isAdmin()?`<input class="select-check" type="checkbox" data-member-select="${m.id}" ${selected?'checked':''} onclick="event.stopPropagation()">`:`<div class="avatar">${esc(displayName(m)[0])}</div>`}<div class="row-main"><div class="row-title">${esc(displayName(m))} ${esc(m.title)}</div><div class="row-sub">${deptName(m.deptId)} · ${m.status}${g?' · '+esc(g.name):''}${m.note?' · '+esc(m.note):''}</div></div><div class="row-actions"><span class="badge ${m.status==='Active'?'ok':m.status==='Deceased'?'danger':'warn'}">${m.status}</span><span class="chevron">›</span></div></div>`; }

function groupPage(){
  if(!canAccessGroup()) return '<div class="empty">순모임 접근 권한이 없습니다.</div>';
  const g=leaderGroup(); if(!g)return '<div class="empty">연결된 순이 없습니다.</div>';
  let s=currentGroupSession();
  if(!s) return `<section class="section"><div class="section-head"><h2>${esc(g.name)}</h2></div><div class="empty">회차가 없습니다.</div><button class="btn primary" data-new-group-session="${g.id}" style="margin-top:8px">+ 새 회차</button></section>`;
  const roster=lockGroupRoster(s),den=groupDenominator(s),att=s.attendance||[],rate=den.length?Math.round(att.filter(id=>den.includes(id)).length/den.length*100):0; const noteVisible=canReadGroupNote(s);
  return `<section class="section"><div class="section-head"><h2>${esc(g.name)} · ${fmtShort(s.date)}</h2><div class="hint">${s.status==='Cancelled'?'<span class="badge danger">취소</span>':esc(s.time||'')}</div></div>
    <div class="date-nav"><button class="icon-btn" data-group-session-step="-1">‹</button><select class="field" id="groupSessionSelect">${db.groupSessions.filter(x=>x.groupId===g.id).sort((a,b)=>b.date.localeCompare(a.date)).map(x=>`<option value="${x.id}" ${x.id===s.id?'selected':''}>${x.date} ${x.time||''}${x.status==='Cancelled'?' (취소)':''}</option>`).join('')}</select><button class="icon-btn" data-group-session-step="1">›</button><button class="btn small" data-new-group-session="${g.id}">＋</button></div>
    <div class="sticky-summary"><strong>순원 ${att.filter(id=>roster.includes(id)).length}/${den.length}</strong><span>${rate}%</span><span>기타회원 ${(s.otherMembers||[]).length}</span><span>순자녀들 ${s.children||0}</span><span>방문 ${s.guests||0}</span><span>현장 총인원 ${att.length+(s.otherMembers||[]).length+(s.children||0)+(s.guests||0)}</span></div>
    <div class="group-block"><div class="group-label"><span>순원 · ${roster.length}</span><span class="soft">성도 Note 미표시</span></div><div class="bubbles">${roster.map(id=>groupMemberBubble(memberById(id),s,den.includes(id))).join('')}</div></div>
    <section class="section"><div class="section-head"><h2>추가 인원</h2><div class="hint">순자녀들 → 방문자 순서</div></div><div class="counter-grid">${groupCounter('children','순자녀들',s.children||0)}${groupCounter('guests','방문자',s.guests||0)}${groupCounter('otherMembers','기타 등록회원',(s.otherMembers||[]).length,true)}</div></section>
    <section class="section"><div class="section-head"><h2>특이사항 / 기도제목</h2><div class="hint">PDF/Excel에는 절대 미포함</div></div>${noteVisible?`<div class="card"><textarea class="field" id="groupNote" maxlength="1000" style="min-height:105px">${esc(s.note||'')}</textarea><div class="help" style="margin-top:6px">마지막 수정 ${esc(s.noteUpdatedBy||'')} · ${s.noteUpdatedAt?new Date(s.noteUpdatedAt).toLocaleString('ko-KR'):''}</div><div class="toolbar-row" style="margin-top:7px"><button class="btn primary" id="saveGroupNote">저장</button><button class="btn" id="editExclusions">제외기간</button><button class="btn" id="editGroupSession">회차 수정</button></div></div>`:`<div class="empty">Admin이 아닌 사용자는 설정된 기간이 지난 회차 Note를 읽을 수 없습니다.</div>`}</section>
  </section>`;
}
function groupMemberBubble(m,s,inDen){ if(!m)return ''; const excluded=!inDen; const g=groupById(s.groupId); const role=g.leaderId===m.id?'순장':g.assistantIds.includes(m.id)?'부순장':''; return `<button class="bubble ${s.attendance.includes(m.id)?'on':''} ${excluded?'excluded':''}" data-group-member="${m.id}"><span class="bubble-name">${esc(displayName(m))}<span class="bubble-title">${esc(m.title)}</span></span>${role?`<span class="bubble-role">${role}</span>`:''}${excluded?'<span class="bubble-note">제외기간</span>':'<span class="bubble-note">&nbsp;</span>'}</button>`; }
function groupCounter(key,title,value,isOther=false){return `<div class="card counter-card"><div class="counter-title">${title}</div>${isOther?`<div class="number" style="font-size:24px;margin-top:7px">${value}</div><button class="btn small" id="otherMemberBtn" style="margin-top:7px">Admin 변환</button>`:`<div class="counter"><button data-gcounter="${key}" data-delta="-1">−</button><input type="number" min="0" data-ginput="${key}" value="${value}"><button data-gcounter="${key}" data-delta="1">＋</button></div>`}</div>`; }
