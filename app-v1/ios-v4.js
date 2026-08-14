'use strict';

// v4: iPhone-first information hierarchy inspired by native list/task patterns.
(function(){
  const previousBindGlobal=bindGlobal;

  function v4Session(meetingId,date){
    return db.sessions.find(s=>s.meetingId===meetingId&&s.date===date)||null;
  }
  function v4GroupSessions(date){
    let list=db.groupSessions.filter(s=>s.date===date);
    if(isLeader()){
      const g=leaderGroup();
      list=g?list.filter(s=>s.groupId===g.id):[];
    }
    return list.sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  }
  function countForMeeting(m,date){
    const s=v4Session(m.id,date);
    return {s,n:s?sessionAttendance(s.id).length:0,guest:s?.guestCount||0,online:s?.onlineCount||0};
  }

  render=function(){
    applyAppearance();
    const actor=currentActor();
    app.innerHTML=`<div class="app-shell">
      <header class="ios-header">
        <div class="brand ios-brand" role="button" tabindex="0" aria-label="홈으로">
          <div class="ios-logo">✚</div>
          <div class="ios-brand-copy"><div class="ios-church">${esc(db.config.church.name)} 출석관리</div><div class="ios-user">${esc(actor.name)} · ${esc(actor.role)}</div></div>
        </div>
        <div class="ios-test"><span class="ios-test-label">TEST</span><select class="ios-role" id="roleSelect"><option value="admin" ${ui.roleMode==='admin'?'selected':''}>Admin</option><option value="user" ${ui.roleMode==='user'?'selected':''}>User</option><option value="leader" ${ui.roleMode==='leader'?'selected':''}>순장/부순장</option></select></div>
      </header>
      <main class="page">${renderPage()}</main>
    </div>
    <nav class="bottom-nav">${navItems().map(([p,i,l])=>`<button class="nav-btn ${activeNav(ui.page)===p?'on':''}" data-page="${p}"><span>${i}</span>${l}</button>`).join('')}</nav>`;
    bindGlobal();
    bindPage();
  };

  bindGlobal=function(){
    previousBindGlobal();
    $('#roleSelect')?.addEventListener('change',e=>{
      ui.roleMode=e.target.value;
      if(isLeader()&&ui.page==='members')ui.page='home';
      saveUI();render();
    });
  };

  homePage=function(){
    const date=ui.date||isoToday,isToday=date===isoToday;
    const meetings=scheduledMeetings(date);
    const unique=new Set();let guest=0,online=0;
    meetings.forEach(m=>{
      const {s}=countForMeeting(m,date);
      if(!s)return;
      sessionAttendance(s.id).forEach(id=>unique.add(id));
      guest+=s.guestCount||0;online+=s.onlineCount||0;
    });
    const groupSessions=v4GroupSessions(date);
    return `<section class="section" style="margin-top:3px!important">
      <div class="v4-date">
        <button class="date-step" data-home-date-step="-1" aria-label="이전 날짜">‹</button>
        <label><span>${isToday?'오늘 · ':''}${fmtDate(date)}</span><input id="homeDate" type="date" value="${date}" aria-label="날짜 선택"></label>
        <button class="date-step" data-home-date-step="1" aria-label="다음 날짜">›</button>
        <button class="date-today" id="homeTodayBtn" ${isToday?'disabled':''}>오늘</button>
      </div>
    </section>

    <section class="section">
      <div class="v4-summary"><strong class="primary-number">${unique.size}</strong><span class="primary-label">Unique 등록교인</span><span class="secondary">Guest <b>${guest}</b> · Online <b>${online}</b></span></div>
    </section>

    <section class="section"><div class="section-head"><h2>${isToday?'오늘 모임':'선택 날짜 모임'}</h2><div class="hint">${meetings.length}개</div></div>
      <div class="v4-surface">${meetings.length?meetings.map(m=>homeMeetingCard(m,date)).join(''):`<div class="v4-empty"><strong>예정된 일반 모임이 없습니다.</strong>다른 날짜를 선택해 주세요.</div>`}</div>
    </section>

    ${canAccessGroup()?`<section class="section"><div class="section-head"><h2>순모임</h2><div class="hint">${fmtShort(date)}</div></div><div class="v4-surface">${groupSessions.length?groupSessions.map(homeGroupCard).join(''):homeUpcomingGroup(date)}</div></section>`:''}

    ${isAdmin()?`<section class="section"><div class="v4-summary"><span class="primary-label">운영</span><span class="secondary">Active 회원 <b>${activeMembers().length}</b> · 활성 모임 <b>${db.meetings.filter(m=>m.status==='Active').length}</b> · Backup <b>${db.backups[0]?.date?fmtShort(db.backups[0].date):'미실행'}</b></span></div></section>`:''}`;
  };

  homeMeetingCard=function(m,date=ui.date||isoToday){
    const {s,n,guest,online}=countForMeeting(m,date),cancelled=s?.status==='Cancelled';
    return `<div class="v4-row ${cancelled?'cancelled':''}" data-home-meeting="${m.id}">
      <div class="v4-time">${m.time||'--:--'}</div>
      <div class="v4-row-main"><span class="v4-row-title">${esc(s?.nameOverride||m.name)}</span><span class="v4-row-loc">${esc(locationName(m.locationId))}</span></div>
      <div class="v4-row-metrics"><strong>${n}</strong>${m.guest?`G${guest}`:''}${m.online?` · O${online}`:''}</div><span class="v4-chevron">›</span>
    </div>`;
  };

  homeGroupCard=function(s){
    const g=groupById(s.groupId),den=groupDenominator(s),present=(s.attendance||[]).filter(id=>den.includes(id)).length;
    return `<div class="v4-row ${s.status==='Cancelled'?'cancelled':''}" data-home-group="${s.id}"><div class="v4-time">${s.time||'--:--'}</div><div class="v4-row-main"><span class="v4-row-title">${esc(g?.name||'순모임')}</span><span class="v4-row-loc">${esc(s.location||'장소 미정')}</span></div><div class="v4-row-metrics"><strong>${present}/${den.length}</strong>자녀${s.children||0} · 방${s.guests||0}</div><span class="v4-chevron">›</span></div>`;
  };

  homeUpcomingGroup=function(date=ui.date||isoToday){
    const g=isLeader()?leaderGroup():groupById('g_love');
    if(!g)return '<div class="v4-empty">연결된 순이 없습니다.</div>';
    return `<div class="v4-create" data-new-group-session="${g.id}" data-new-group-date="${date}"><span>＋</span><b>${esc(g.name)} 회차 만들기</b><small>${fmtShort(date)}</small></div>`;
  };

  attendancePage=function(){
    const date=ui.date||isoToday;
    const m=meetingById(ui.meetingId);
    if(!m)return `<div class="v4-empty"><strong>선택된 모임이 없습니다.</strong>홈에서 날짜와 모임을 선택해 주세요.</div>`;
    const s=ensureSession(m.id,date);ensureClassificationSnapshot(m.id,date);
    const readOnly=isReadOnlyYear(date),canEdit=canEditGeneralDate(date)&&!readOnly;
    const all=attendanceCandidates(m),q=ui.search.trim().toLowerCase();let filtered=q?all.filter(x=>`${displayName(x)} ${x.title} ${x.note} ${deptName(x.deptId)}`.toLowerCase().includes(q)):all;
    const att=sessionAttendance(s.id);
    if(ui.attendanceFilter==='on')filtered=filtered.filter(x=>att.includes(x.id));
    if(ui.attendanceFilter==='off')filtered=filtered.filter(x=>!att.includes(x.id)&&effectiveClass(x)!=='장기');
    if(ui.attendanceFilter==='regularmiss')filtered=filtered.filter(x=>!att.includes(x.id)&&effectiveClass(x)==='정기');
    return `<section class="section focus-attendance">
      <div class="v4-context"><button class="v4-home" data-focus-home aria-label="홈으로">‹</button><div class="v4-context-main"><div class="v4-context-line"><span class="v4-context-meeting">${esc(s.nameOverride||m.name)}</span><span class="v4-context-date">${fmtShort(date)}</span></div><div class="v4-context-meta">${m.time||''}${m.locationId?' · '+locationName(m.locationId):''}${readOnly?' · 읽기 전용':canEdit?' · 즉시 저장':' · 수정기간 종료'}</div></div><div class="v4-att-total"><strong>${att.length}</strong><span>출석</span></div></div>
      <div class="v4-inline-stats"><span>출석 <b>${att.length}</b></span>${m.guest?`<span>Guest <b>${s.guestCount||0}</b></span>`:''}${m.online?`<span>Online <b>${s.onlineCount||0}</b></span>`:''}<span class="presence">체크 중 · 김집사 · 이권사 · +1</span></div>
      <div class="v4-tools"><input class="v4-search" id="attSearch" placeholder="이름 · 직분 · Note 검색" value="${esc(ui.search)}"><div class="v4-tabs">${[['all','전체'],['on','출석'],['off','미출석'],['regularmiss','정기결석']].map(([v,l])=>`<button data-att-filter="${v}" class="${ui.attendanceFilter===v?'on':''}">${l}</button>`).join('')}</div></div>
      ${q?memberBubbles('검색결과',filtered,att,canEdit):memberBubbles('정기',filtered.filter(x=>effectiveClass(x)==='정기'),att,canEdit)+memberBubbles('가끔',filtered.filter(x=>effectiveClass(x)==='가끔'),att,canEdit)}
      ${(m.guest||m.online)?`<div class="v4-extra"><div class="v4-extra-title">추가 인원</div><div class="v4-counter-line">${m.guest?counterCard('guest','Guest',s.guestCount||0,canEdit):''}${m.online?counterCard('online','Online',s.onlineCount||0,canEdit):''}</div></div>`:''}
      ${!q?longAbsenceBlock(filtered.filter(x=>effectiveClass(x)==='장기'),att,canEdit):''}
      ${m.type==='period'?externalParticipantBlock(m,s,canEdit):''}
      ${canEdit?`<div class="focus-actions"><button class="text-action" id="quickAddMember">＋ 성도 추가</button><button class="text-action" id="sessionOptions">회차 설정</button></div>`:''}
    </section>`;
  };

  function personButton(m,on,canEdit,groupMode=false,subText=''){
    return `<div class="person-btn ${on?'on':''}" ${groupMode?`data-group-member="${m.id}"`:`data-att-member="${m.id}" data-disabled="${canEdit?'0':'1'}"`} role="button" tabindex="0"><div class="person-top"><span class="person-name">${esc(displayName(m))}</span><span class="person-title">${esc(m.title)}</span></div><span class="person-sub">${esc(subText||m.note||deptName(m.deptId))}</span><span class="person-check">${on?'✓':''}</span>${groupMode?'':`<button class="person-more" data-member-menu="${m.id}" aria-label="성도 상세">⋯</button>`}</div>`;
  }

  memberBubbles=function(label,list,att,canEdit){
    if(!list.length)return '';
    return `<div class="group-block dense-group"><div class="group-label"><span>${label} · ${list.length}</span></div><div class="attendance-grid">${list.sort(nameSort).map(m=>personButton(m,att.includes(m.id),canEdit)).join('')}</div></div>`;
  };
  longAbsenceBlock=function(list,att,canEdit){
    if(!list.length)return '';
    return `<div class="group-block dense-group"><div class="group-label"><span>장기결석 · ${list.length}</span><button class="text-btn" id="toggleLong">${ui.longCollapsed?'펼치기':'접기'}</button></div>${ui.longCollapsed?'':`<div class="attendance-grid">${list.sort(nameSort).map(m=>personButton(m,att.includes(m.id),canEdit)).join('')}</div>`}</div>`;
  };
  externalParticipantBlock=function(meeting,session,canEdit){
    const list=(meeting.externalParticipants||[]).filter(e=>ui.date>=e.start&&ui.date<=e.end);if(!list.length)return '';
    const att=sessionAttendance(session.id);
    return `<div class="group-block dense-group"><div class="group-label"><span>외부 참가자 · ${list.length}</span></div><div class="attendance-grid">${list.map(e=>`<button class="person-btn ${att.includes(e.id)?'on':''}" data-external-att="${e.id}" ${canEdit?'':'disabled'}><div class="person-top"><span class="person-name">${esc(e.name)}</span></div><span class="person-sub">${esc(e.note||'임시 참가자')}</span><span class="person-check">${att.includes(e.id)?'✓':''}</span></button>`).join('')}</div></div>`;
  };
  counterCard=function(key,title,value,canEdit){
    return `<div class="inline-counter"><label>${title}</label><button data-session-counter="${key}" data-delta="-1" ${canEdit?'':'disabled'}>−</button><input type="number" min="0" data-session-input="${key}" value="${value}" ${canEdit?'':'disabled'}><button data-session-counter="${key}" data-delta="1" ${canEdit?'':'disabled'}>＋</button></div>`;
  };

  groupPage=function(){
    if(!canAccessGroup())return '<div class="v4-empty">순모임 접근 권한이 없습니다.</div>';
    const g=leaderGroup();if(!g)return '<div class="v4-empty">연결된 순이 없습니다.</div>';
    const s=currentGroupSession();if(!s)return `<section class="section"><div class="section-head"><h2>${esc(g.name)}</h2></div><div class="v4-surface"><div class="v4-create" data-new-group-session="${g.id}"><span>＋</span><b>새 회차 만들기</b></div></div></section>`;
    const roster=lockGroupRoster(s),den=groupDenominator(s),att=s.attendance||[],present=att.filter(id=>den.includes(id)).length,rate=den.length?Math.round(present/den.length*100):0,noteVisible=canReadGroupNote(s);
    return `<section class="section"><div class="v4-context"><button class="v4-home" data-focus-home>‹</button><div class="v4-context-main"><div class="v4-context-line"><span class="v4-context-meeting">${esc(g.name)}</span><span class="v4-context-date">${fmtShort(s.date)}</span></div><div class="v4-context-meta">${s.time||''}${s.location?' · '+esc(s.location):''}</div></div><div class="v4-att-total"><strong>${present}/${den.length}</strong><span>순원</span></div></div>
      <div class="v4-group-summary"><strong>${rate}%</strong><span>출석률</span><small>기타 ${(s.otherMembers||[]).length} · 자녀 ${s.children||0} · 방문 ${s.guests||0} · 현장 ${att.length+(s.otherMembers||[]).length+(s.children||0)+(s.guests||0)}</small></div>
      <div class="group-block dense-group"><div class="group-label"><span>순원 · ${roster.length}</span><span class="soft">Note 미표시</span></div><div class="attendance-grid">${roster.map(id=>{const m=memberById(id);if(!m)return '';const role=g.leaderId===m.id?'순장':g.assistantIds.includes(m.id)?'부순장':'';const excluded=!den.includes(id);return personButton(m,att.includes(id),true,true,role||(excluded?'제외기간':''));}).join('')}</div></div>
      <div class="v4-extra"><div class="v4-counter-line">${groupCounter('children','순자녀들',s.children||0)}${groupCounter('guests','방문',s.guests||0)}${groupCounter('otherMembers','기타',(s.otherMembers||[]).length,true)}</div></div>
      <section class="section"><div class="section-head"><h2>특이사항 / 기도제목</h2><div class="hint">Report 미포함</div></div>${noteVisible?`<div class="v4-note"><textarea id="groupNote" maxlength="1000">${esc(s.note||'')}</textarea><div class="v4-note-meta">마지막 수정 ${esc(s.noteUpdatedBy||'')} ${s.noteUpdatedAt?'· '+new Date(s.noteUpdatedAt).toLocaleString('ko-KR'):''}</div><div class="focus-actions"><button class="text-action" id="saveGroupNote">저장</button><button class="text-action" id="editExclusions">제외기간</button><button class="text-action" id="editGroupSession">회차 수정</button></div></div>`:`<div class="v4-empty">과거 Note는 Admin만 조회할 수 있습니다.</div>`}</section>
    </section>`;
  };
  groupCounter=function(key,title,value,isOther=false){
    return isOther?`<div class="inline-counter"><label>${title}</label><strong>${value}</strong><button class="text-btn" id="otherMemberBtn">변환</button></div>`:`<div class="inline-counter"><label>${title}</label><button data-gcounter="${key}" data-delta="-1">−</button><input type="number" min="0" data-ginput="${key}" value="${value}"><button data-gcounter="${key}" data-delta="1">＋</button></div>`;
  };

  render();
})();
