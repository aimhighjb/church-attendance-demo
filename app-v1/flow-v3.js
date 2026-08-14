'use strict';

// iPhone task-flow v3: home chooses date + meeting. Attendance is a focused work screen.
(function(){
  attendancePage=function(){
    const m=meetingById(ui.meetingId)||scheduledMeetings(ui.date||isoToday)[0]||regularMeetings()[0];
    if(!m)return '<div class="dense-empty">선택된 모임이 없습니다. 홈에서 날짜와 모임을 선택하세요.</div>';
    ui.meetingId=m.id;
    const date=ui.date||isoToday;
    const s=ensureSession(m.id,date);
    ensureClassificationSnapshot(m.id,date);
    const readOnly=isReadOnlyYear(date),canEdit=canEditGeneralDate(date)&&!readOnly;
    const all=attendanceCandidates(m),q=ui.search.trim().toLowerCase();
    let filtered=q?all.filter(x=>`${displayName(x)} ${x.title} ${x.note} ${deptName(x.deptId)}`.toLowerCase().includes(q)):all;
    const att=sessionAttendance(s.id);
    if(ui.attendanceFilter==='on')filtered=filtered.filter(x=>att.includes(x.id));
    if(ui.attendanceFilter==='off')filtered=filtered.filter(x=>!att.includes(x.id)&&effectiveClass(x)!=='장기');
    if(ui.attendanceFilter==='regularmiss')filtered=filtered.filter(x=>!att.includes(x.id)&&effectiveClass(x)==='정기');

    return `<section class="section focus-attendance">
      <div class="focus-context">
        <button class="focus-home" data-focus-home aria-label="홈으로">⌂</button>
        <div class="focus-context-main">
          <div class="focus-date">${fmtDate(date)}</div>
          <div class="focus-meeting">${esc(s.nameOverride||m.name)}</div>
          <div class="focus-meta">${m.time||''}${m.locationId?' · '+locationName(m.locationId):''}${readOnly?' · 읽기 전용':canEdit?' · 즉시 저장':' · 수정기간 종료'}</div>
        </div>
        <div class="focus-total"><strong>${att.length}</strong><span>출석</span></div>
      </div>

      <div class="attendance-totals">
        <span>출석 <b>${att.length}</b></span>${m.guest?`<span>Guest <b>${s.guestCount||0}</b></span>`:''}${m.online?`<span>Online <b>${s.onlineCount||0}</b></span>`:''}<span class="presence-text">체크 중 · 김집사 · 이권사 · +1</span>
      </div>

      <div class="attendance-tools">
        <input class="search" id="attSearch" placeholder="이름 · 직분 · Note 검색" value="${esc(ui.search)}">
        <div class="flat-tabs">${[['all','전체'],['on','출석'],['off','미출석'],['regularmiss','정기결석']].map(([v,l])=>`<button data-att-filter="${v}" class="${ui.attendanceFilter===v?'on':''}">${l}</button>`).join('')}</div>
      </div>

      ${q?memberBubbles('검색결과',filtered,att,canEdit):memberBubbles('정기',filtered.filter(x=>effectiveClass(x)==='정기'),att,canEdit)+memberBubbles('가끔',filtered.filter(x=>effectiveClass(x)==='가끔'),att,canEdit)}

      ${(m.guest||m.online)?`<div class="flat-section"><div class="flat-section-title">추가 인원</div><div class="counter-grid">${m.guest?counterCard('guest','방문자',s.guestCount||0,canEdit):''}${m.online?counterCard('online','Online',s.onlineCount||0,canEdit):''}</div></div>`:''}

      ${!q?longAbsenceBlock(filtered.filter(x=>effectiveClass(x)==='장기'),att,canEdit):''}
      ${m.type==='period'?externalParticipantBlock(m,s,canEdit):''}

      ${canEdit?`<div class="focus-actions"><button class="text-action" id="quickAddMember">＋ 성도 추가</button><button class="text-action" id="sessionOptions">회차 설정</button></div>`:''}
    </section>`;
  };

  // Home meeting rows always carry the date chosen on Home into the work screen.
  const previousBindPage=bindPage;
  bindPage=function(){
    previousBindPage();

    $$('[data-home-meeting]').forEach(el=>el.onclick=()=>{
      ui.meetingId=el.dataset.homeMeeting;
      ui.page='attendance';
      ui.classificationKey='';
      saveUI();
      render();
      scrollTo(0,0);
    });

    $$('[data-focus-home]').forEach(el=>el.onclick=()=>{
      ui.page='home';
      saveUI();
      render();
      scrollTo(0,0);
    });

    // Church logo/title is a persistent Home control on every page.
    const brand=$('.brand');
    if(brand){
      brand.setAttribute('role','button');
      brand.setAttribute('tabindex','0');
      brand.setAttribute('aria-label','홈으로');
      brand.onclick=()=>{ui.page='home';saveUI();render();scrollTo(0,0);};
      brand.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();brand.click();}};
    }
  };

  render();
})();
