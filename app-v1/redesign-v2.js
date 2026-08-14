'use strict';

// Dense iPhone-first redesign layer. Keeps the v1 data model and all v1 actions.
(function(){
  function sessionForHome(meetingId,date){
    return db.sessions.find(s=>s.meetingId===meetingId&&s.date===date) || null;
  }
  function groupsForHomeDate(date){
    let list=db.groupSessions.filter(s=>s.date===date);
    if(isLeader()){
      const g=leaderGroup();
      list=g?list.filter(s=>s.groupId===g.id):[];
    }
    return list.sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  }
  function statusText(session,count){
    if(session?.status==='Cancelled')return '취소됨';
    if(count>0)return '출석 있음';
    return '예정';
  }
  function compactMetric(label,value,extra=''){
    return `<div class="summary-metric"><strong>${value}</strong><span>${label}</span>${extra?`<small>${extra}</small>`:''}</div>`;
  }

  homePage=function(){
    const date=ui.date||isoToday;
    const meetings=scheduledMeetings(date);
    const unique=new Set(); let guest=0,online=0;
    meetings.forEach(m=>{
      const s=sessionForHome(m.id,date);
      if(!s)return;
      sessionAttendance(s.id).forEach(id=>unique.add(id));
      guest+=s.guestCount||0;
      online+=s.onlineCount||0;
    });
    const gs=groupsForHomeDate(date);
    const isToday=date===isoToday;
    return `
      <section class="section home-date-section">
        <div class="home-datebar">
          <button class="date-arrow" data-home-date-step="-1" aria-label="이전 날짜">‹</button>
          <label class="home-date-input-wrap">
            <span>${isToday?'오늘 · ':''}${fmtDate(date)}</span>
            <input type="date" id="homeDate" value="${date}" aria-label="날짜 선택">
          </label>
          <button class="date-arrow" data-home-date-step="1" aria-label="다음 날짜">›</button>
          <button class="today-link" id="homeTodayBtn" ${isToday?'disabled':''}>오늘</button>
        </div>
      </section>

      <section class="section dense-section">
        <div class="section-head dense-head"><h2>${isToday?'오늘':'선택 날짜'} 요약</h2><div class="hint">${meetings.length}개 모임</div></div>
        <div class="summary-strip">
          ${compactMetric('등록교인 Unique',unique.size,'중복 제거')}
          ${compactMetric('Guest',guest)}
          ${compactMetric('Online',online)}
        </div>
      </section>

      <section class="section dense-section">
        <div class="section-head dense-head"><h2>모임</h2><div class="hint">${fmtShort(date)}</div></div>
        <div class="dense-list">
          ${meetings.length?meetings.map(m=>homeMeetingCard(m,date)).join(''):`<div class="dense-empty"><strong>이 날짜에는 예정된 일반 모임이 없습니다.</strong><span>날짜를 바꾸면 해당 날짜의 모임이 바로 표시됩니다.</span></div>`}
        </div>
      </section>

      ${canAccessGroup()?`<section class="section dense-section">
        <div class="section-head dense-head"><h2>순모임</h2><div class="hint">선택 날짜 기준</div></div>
        <div class="dense-list">
          ${gs.length?gs.map(homeGroupCard).join(''):homeUpcomingGroup(date)}
        </div>
      </section>`:''}

      ${isAdmin()?`<section class="section dense-section admin-ops"><div class="section-head dense-head"><h2>운영</h2><div class="hint">Admin</div></div>
        <div class="ops-line"><span>Active 회원 <b>${activeMembers().length}</b></span><span>활성 모임 <b>${db.meetings.filter(m=>m.status==='Active').length}</b></span><span>Backup <b>${db.backups[0]?.date?fmtShort(db.backups[0].date):'미실행'}</b></span></div>
      </section>`:''}`;
  };

  homeMeetingCard=function(m,date=ui.date||isoToday){
    const s=sessionForHome(m.id,date);
    const n=s?sessionAttendance(s.id).length:0;
    const cancelled=s?.status==='Cancelled';
    return `<div class="dense-row meeting-row ${cancelled?'is-cancelled':''}" data-home-meeting="${m.id}">
      <div class="row-time">${m.time||'--:--'}</div>
      <div class="dense-main">
        <div class="dense-title">${esc(s?.nameOverride||m.name)}</div>
        <div class="dense-sub">${locationName(m.locationId)}${m.type==='one-time'?' · 일회성':m.type==='period'?' · 기간형':''}</div>
      </div>
      <div class="dense-numbers">
        <strong>${n}</strong><small>${statusText(s,n)}</small>
        ${m.guest?`<span>G ${s?.guestCount||0}</span>`:''}${m.online?`<span>O ${s?.onlineCount||0}</span>`:''}
      </div>
      <span class="row-chevron">›</span>
    </div>`;
  };

  homeGroupCard=function(s){
    const g=groupById(s.groupId),den=groupDenominator(s);
    const present=(s.attendance||[]).filter(id=>den.includes(id)).length;
    return `<div class="dense-row group-row ${s.status==='Cancelled'?'is-cancelled':''}" data-home-group="${s.id}">
      <div class="row-time">${s.time||'--:--'}</div>
      <div class="dense-main"><div class="dense-title">${esc(g?.name||'순모임')}</div><div class="dense-sub">${esc(s.location||'장소 미정')}</div></div>
      <div class="dense-numbers"><strong>${present}/${den.length}</strong><small>순원</small><span>자녀 ${s.children||0}</span><span>방문 ${s.guests||0}</span></div>
      <span class="row-chevron">›</span>
    </div>`;
  };

  homeUpcomingGroup=function(date=ui.date||isoToday){
    const g=isLeader()?leaderGroup():groupById('g_love');
    if(!g)return '<div class="dense-empty">연결된 순이 없습니다.</div>';
    return `<div class="dense-action-row" data-new-group-session="${g.id}" data-new-group-date="${date}"><span class="action-plus">＋</span><div><strong>${esc(g.name)} 회차 만들기</strong><small>${fmtShort(date)} · 날짜/시간/장소 지정</small></div></div>`;
  };

  // Keep report functionality but replace large stat cards with compact metric cells.
  statCard=function(v,l,c,cls='number'){
    return `<div class="metric-cell"><div class="${cls}">${v}</div><div class="metric-label">${l}</div><div class="metric-caption">${c}</div></div>`;
  };
  smallStatus=function(title,value,badge){
    return `<div class="ops-cell"><span>${title}</span><strong>${value}</strong><small>${badge}</small></div>`;
  };

  // Attendance remains 3 columns on iPhone, but becomes a flat table-like tap grid instead of bubbles.
  memberBubbles=function(label,list,att,canEdit){
    if(!list.length)return '';
    return `<div class="group-block dense-group"><div class="group-label"><span>${label} · ${list.length}</span></div><div class="attendance-grid">${list.sort(nameSort).map(m=>attendanceCell(m,att.includes(m.id),canEdit)).join('')}</div></div>`;
  };
  function attendanceCell(m,on,canEdit){
    return `<div class="att-cell ${on?'on':''}" data-att-member="${m.id}" data-disabled="${canEdit?'0':'1'}" role="button" tabindex="0">
      <span class="att-name">${esc(displayName(m))}</span>
      <span class="att-title">${esc(m.title)}</span>
      <span class="att-note">${esc(m.note||deptName(m.deptId))}</span>
      <span class="att-check">${on?'✓':''}</span>
      <button class="att-more" type="button" data-member-menu="${m.id}" aria-label="성도 상세">⋯</button>
    </div>`;
  }
  longAbsenceBlock=function(list,att,canEdit){
    if(!list.length)return '';
    return `<div class="group-block dense-group"><div class="group-label"><span>장기결석 · ${list.length}</span><button class="text-btn" id="toggleLong">${ui.longCollapsed?'펼치기':'접기'}</button></div>${ui.longCollapsed?'':`<div class="attendance-grid">${list.sort(nameSort).map(m=>attendanceCell(m,att.includes(m.id),canEdit)).join('')}</div>`}</div>`;
  };
  externalParticipantBlock=function(meeting,session,canEdit){
    const list=(meeting.externalParticipants||[]).filter(e=>ui.date>=e.start&&ui.date<=e.end);
    if(!list.length)return '';
    const att=sessionAttendance(session.id);
    return `<div class="group-block dense-group"><div class="group-label"><span>외부 임시 참가자 · ${list.length}</span><span class="soft">이 모임에만 존재</span></div><div class="attendance-grid">${list.map(e=>`<button class="att-cell external ${att.includes(e.id)?'on':''}" data-external-att="${e.id}" ${canEdit?'':'disabled'}><span class="att-name">${esc(e.name)}</span><span class="att-note">${esc(e.note||'임시 참가자')}</span><span class="att-check">${att.includes(e.id)?'✓':''}</span></button>`).join('')}</div></div>`;
  };

  counterCard=function(key,title,value,canEdit){
    return `<div class="count-row"><span class="count-label">${title}</span><button data-session-counter="${key}" data-delta="-1" ${canEdit?'':'disabled'}>−</button><input type="number" min="0" data-session-input="${key}" value="${value}" ${canEdit?'':'disabled'}><button data-session-counter="${key}" data-delta="1" ${canEdit?'':'disabled'}>＋</button></div>`;
  };

  groupMemberBubble=function(m,s,inDen){
    if(!m)return '';
    const excluded=!inDen,g=groupById(s.groupId),role=g.leaderId===m.id?'순장':g.assistantIds.includes(m.id)?'부순장':'';
    const on=s.attendance.includes(m.id);
    return `<button class="att-cell group-att ${on?'on':''} ${excluded?'excluded':''}" data-group-member="${m.id}">
      <span class="att-name">${esc(displayName(m))}</span><span class="att-title">${esc(m.title)}</span>
      <span class="att-note">${role|| (excluded?'제외기간':'')}</span><span class="att-check">${on?'✓':''}</span>
    </button>`;
  };
  groupCounter=function(key,title,value,isOther=false){
    return isOther
      ? `<div class="count-row other-count"><span class="count-label">${title}</span><strong>${value}</strong><button class="text-btn" id="otherMemberBtn">Admin 변환</button></div>`
      : `<div class="count-row"><span class="count-label">${title}</span><button data-gcounter="${key}" data-delta="-1">−</button><input type="number" min="0" data-ginput="${key}" value="${value}"><button data-gcounter="${key}" data-delta="1">＋</button></div>`;
  };

  const originalBindPage=bindPage;
  bindPage=function(){
    originalBindPage();
    $('#homeDate')?.addEventListener('change',e=>{ui.date=e.target.value||isoToday;ui.classificationKey='';saveUI();render();});
    $$('[data-home-date-step]').forEach(b=>b.onclick=()=>{ui.date=addDays(ui.date||isoToday,Number(b.dataset.homeDateStep));ui.classificationKey='';saveUI();render();});
    $('#homeTodayBtn')?.addEventListener('click',()=>{ui.date=isoToday;ui.classificationKey='';saveUI();render();});
    // Override v1 handler, which always used today. Home now opens attendance on the selected date.
    $$('[data-home-meeting]').forEach(b=>b.onclick=()=>{ui.meetingId=b.dataset.homeMeeting;ui.page='attendance';ui.classificationKey='';saveUI();render();scrollTo(0,0);});
    $$('[data-new-group-date]').forEach(b=>b.onclick=()=>{
      if(isAdmin())ui.groupAdminId=b.dataset.newGroupSession;
      openGroupSessionModal(b.dataset.newGroupSession);
      requestAnimationFrame(()=>{const f=$('#gsmDate');if(f)f.value=b.dataset.newGroupDate||ui.date||isoToday;});
    });
  };

  render();
})();
