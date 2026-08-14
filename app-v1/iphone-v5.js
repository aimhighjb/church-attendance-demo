'use strict';

// iPhone v5: persistent top floating bar + focused attendance floating bar.
(function(){
  function v5Date(date){
    const d=new Date(`${date}T12:00:00`);
    return `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`;
  }
  function v5Session(meetingId,date){
    return db.sessions.find(s=>s.meetingId===meetingId&&s.date===date)||null;
  }
  function v5MeetingStats(m,date){
    const s=v5Session(m.id,date);
    return {s,n:s?sessionAttendance(s.id).length:0,guest:s?.guestCount||0,online:s?.onlineCount||0};
  }
  function v5ShortUser(){
    const a=currentActor();
    return a.name.split(' ')[0]||a.name;
  }
  function v5Top(){
    const a=currentActor(),home=ui.page==='home';
    return `<header class="v5-top">
      <button class="v5-home-brand" id="v5HomeBrand" aria-label="홈으로">
        <span class="v5-logo">교</span><span class="v5-church">${esc(db.config.church.name)}</span>
      </button>
      <label class="v5-date-wrap ${home?'editable':'locked'}">
        <span class="v5-date-text">${v5Date(ui.date||isoToday)}</span>
        ${home?`<input id="v5TopDate" type="date" value="${ui.date||isoToday}" aria-label="날짜 선택">`:''}
      </label>
      <button class="v5-user-btn" id="v5UserBtn" aria-label="사용자 메뉴">
        <span class="v5-user-avatar">${esc(v5ShortUser().slice(0,1))}</span><span class="v5-user-name">${esc(v5ShortUser())}</span>
      </button>
    </header>`;
  }

  render=function(){
    applyAppearance();
    app.innerHTML=`<div class="app-shell">${v5Top()}<main class="page">${renderPage()}</main></div>
      <nav class="bottom-nav">${navItems().map(([p,i,l])=>`<button class="nav-btn ${activeNav(ui.page)===p?'on':''}" data-page="${p}"><span>${i}</span>${l}</button>`).join('')}</nav>`;
    bindGlobal();
    bindPage();
    bindV5();
  };

  function bindV5(){
    $('#v5HomeBrand')?.addEventListener('click',()=>{ui.page='home';ui.search='';ui.v5SearchOpen=false;saveUI();render();scrollTo(0,0);});
    $('#v5TopDate')?.addEventListener('change',e=>{ui.date=e.target.value||isoToday;ui.classificationKey='';saveUI();render();});
    $('#v5UserBtn')?.addEventListener('click',openV5UserMenu);
    $$('[data-v5-home-meeting]').forEach(el=>el.onclick=()=>{ui.meetingId=el.dataset.v5HomeMeeting;ui.page='attendance';ui.search='';ui.v5SearchOpen=false;ui.attendanceFilter='all';ui.classificationKey='';saveUI();render();scrollTo(0,0);});
    $('#v5SearchBtn')?.addEventListener('click',()=>{ui.v5SearchOpen=!ui.v5SearchOpen;saveUI();render();if(ui.v5SearchOpen)requestAnimationFrame(()=>$('#attSearch')?.focus());});
    $('#v5Filter')?.addEventListener('change',e=>{ui.attendanceFilter=e.target.value;saveUI();render();});
    const search=$('#attSearch');
    if(search){
      search.addEventListener('input',e=>{ui.search=e.target.value;saveUI();render();requestAnimationFrame(()=>{const x=$('#attSearch');if(x){x.focus();x.setSelectionRange(x.value.length,x.value.length);}});});
    }
  }

  function openV5UserMenu(){
    const a=currentActor();
    openModal('사용자',`<div class="v5-user-menu">
      <div style="padding:2px 0 8px"><div style="font-size:20px;font-weight:950">${esc(a.name)}</div><div class="help">${esc(a.email)} · ${esc(a.role)}</div></div>
      <div class="v5-menu-row"><label>TEST 역할</label><select id="v5Role"><option value="admin" ${ui.roleMode==='admin'?'selected':''}>Admin</option><option value="user" ${ui.roleMode==='user'?'selected':''}>User</option><option value="leader" ${ui.roleMode==='leader'?'selected':''}>순장/부순장</option></select></div>
      <div class="v5-menu-row"><label>글자 크기</label><select id="v5Font"><option value="normal" ${ui.font==='normal'?'selected':''}>크게</option><option value="large" ${ui.font==='large'?'selected':''}>더 크게</option></select></div>
      <div class="v5-menu-row"><label>화면</label><select id="v5Theme"><option value="dark" ${ui.theme==='dark'?'selected':''}>Dark</option><option value="light" ${ui.theme==='light'?'selected':''}>Light</option></select></div>
    </div>`,`<button class="btn" data-close-modal>닫기</button>`);
    $('#v5Role')?.addEventListener('change',e=>{ui.roleMode=e.target.value;if(isLeader()&&ui.page==='members')ui.page='home';saveUI();closeModal();render();});
    $('#v5Font')?.addEventListener('change',e=>{ui.font=e.target.value;saveUI();closeModal();render();});
    $('#v5Theme')?.addEventListener('change',e=>{ui.theme=e.target.value;saveUI();closeModal();render();});
    $$('[data-close-modal]').forEach(b=>b.onclick=closeModal);
  }

  homePage=function(){
    const date=ui.date||isoToday,isToday=date===isoToday,meetings=scheduledMeetings(date);
    const unique=new Set();let guest=0,online=0;
    meetings.forEach(m=>{
      const s=v5Session(m.id,date);if(!s)return;
      sessionAttendance(s.id).forEach(id=>unique.add(id));guest+=s.guestCount||0;online+=s.onlineCount||0;
    });
    let gs=db.groupSessions.filter(s=>s.date===date);
    if(isLeader()){
      const g=leaderGroup();gs=g?gs.filter(s=>s.groupId===g.id):[];
    }
    gs.sort((a,b)=>(a.time||'').localeCompare(b.time||''));
    return `<div class="v5-home">
      <div class="v5-summary-line"><strong>${unique.size}</strong><span class="main-label">Unique 등록교인</span><span class="minor">· Guest ${guest} · Online ${online}</span></div>
      <section>
        <div class="v5-section-title"><h2>${isToday?'오늘의 모임':'선택 날짜 모임'}</h2><span>${meetings.length}개</span></div>
        <div class="v5-meeting-list">
          <div class="v5-grid-head"><span>시간</span><span>모임</span><span>출석</span><span>기타</span><span></span></div>
          ${meetings.length?meetings.map(m=>v5HomeMeetingRow(m,date)).join(''):`<div class="v5-empty">이 날짜에는 예정된 모임이 없습니다.</div>`}
        </div>
      </section>
      ${canAccessGroup()?`<section><div class="v5-section-title"><h2>순모임</h2><span>${gs.length?`${gs.length}개`:'예정 없음'}</span></div><div class="v5-meeting-list">${gs.length?gs.map(v5HomeGroupRow).join(''):v5CreateGroupRow(date)}</div></section>`:''}
      ${isAdmin()?`<div class="v5-summary-line" style="padding-top:14px"><span class="main-label">운영</span><span class="minor">Active 회원 ${activeMembers().length} · 활성 모임 ${db.meetings.filter(m=>m.status==='Active').length} · Backup ${db.backups[0]?.date?fmtShort(db.backups[0].date):'미실행'}</span></div>`:''}
    </div>`;
  };

  function v5HomeMeetingRow(m,date){
    const {s,n,guest,online}=v5MeetingStats(m,date),cancelled=s?.status==='Cancelled';
    return `<div class="v5-meeting-row ${cancelled?'cancelled':''}" data-v5-home-meeting="${m.id}">
      <div class="v5-m-time">${m.time||'--:--'}</div>
      <div class="v5-m-main"><div class="v5-m-name">${esc(s?.nameOverride||m.name)}</div><div class="v5-m-loc">${esc(locationName(m.locationId))}${cancelled?' · 취소':''}</div></div>
      <div class="v5-m-att"><strong>${n}</strong><small>명</small></div>
      <div class="v5-m-extra">${m.guest?`<span>G ${guest}</span>`:''}${m.online?`<span>O ${online}</span>`:''}${!m.guest&&!m.online?'<span>—</span>':''}</div>
      <div class="v5-chevron">›</div>
    </div>`;
  }

  function v5HomeGroupRow(s){
    const g=groupById(s.groupId),den=groupDenominator(s),present=(s.attendance||[]).filter(id=>den.includes(id)).length;
    return `<div class="v5-group-row" data-home-group="${s.id}"><div class="v5-m-time">${s.time||'--:--'}</div><div class="v5-m-main"><div class="v5-m-name">${esc(g?.name||'순모임')}</div><div class="v5-m-loc">${esc(s.location||'장소 미정')}</div></div><div class="v5-group-metric"><strong>${present}/${den.length}</strong>자녀 ${s.children||0} · 방문 ${s.guests||0}</div><div class="v5-chevron">›</div></div>`;
  }
  function v5CreateGroupRow(date){
    const g=isLeader()?leaderGroup():groupById('g_love');if(!g)return '<div class="v5-empty">연결된 순이 없습니다.</div>';
    return `<div class="v5-create-row" data-new-group-session="${g.id}" data-new-group-date="${date}">＋ ${esc(g.name)} 회차 만들기</div>`;
  }

  attendancePage=function(){
    const date=ui.date||isoToday,m=meetingById(ui.meetingId);
    if(!m)return '<div class="v5-empty">홈에서 날짜와 모임을 먼저 선택하세요.</div>';
    const s=ensureSession(m.id,date);ensureClassificationSnapshot(m.id,date);
    const readOnly=isReadOnlyYear(date),canEdit=canEditGeneralDate(date)&&!readOnly,att=sessionAttendance(s.id);
    const allowed=['all','on','off','long'];if(!allowed.includes(ui.attendanceFilter))ui.attendanceFilter='all';
    const q=(ui.search||'').trim().toLowerCase();let filtered=attendanceCandidates(m);
    if(q)filtered=filtered.filter(x=>`${displayName(x)} ${x.title} ${x.note} ${deptName(x.deptId)}`.toLowerCase().includes(q));
    if(ui.attendanceFilter==='on')filtered=filtered.filter(x=>att.includes(x.id));
    if(ui.attendanceFilter==='off')filtered=filtered.filter(x=>!att.includes(x.id)&&effectiveClass(x)!=='장기');
    if(ui.attendanceFilter==='long')filtered=filtered.filter(x=>effectiveClass(x)==='장기');

    const filterLabel={all:'전체',on:'출석',off:'미출석',long:'장기결석'}[ui.attendanceFilter];
    return `<div class="v5-attendance">
      <div class="v5-meeting-float">
        <button class="v5-search-btn" id="v5SearchBtn" aria-label="검색">⌕</button>
        <div class="v5-meeting-center"><div class="v5-meeting-title">${esc(s.nameOverride||m.name)}</div><div class="v5-meeting-status"><strong>${att.length}명</strong> 출석 중</div></div>
        <select class="v5-filter-select" id="v5Filter" aria-label="출석 필터"><option value="all" ${ui.attendanceFilter==='all'?'selected':''}>전체</option><option value="on" ${ui.attendanceFilter==='on'?'selected':''}>출석</option><option value="off" ${ui.attendanceFilter==='off'?'selected':''}>미출석</option><option value="long" ${ui.attendanceFilter==='long'?'selected':''}>장기결석</option></select>
      </div>
      ${ui.v5SearchOpen?`<div class="v5-search-panel"><input id="attSearch" value="${esc(ui.search||'')}" placeholder="이름 · 직분 · Note 검색"></div>`:''}
      <div class="v5-att-meta"><span><b>${v5Date(date)}</b></span><span>${m.time||''} · ${esc(locationName(m.locationId))}</span>${m.guest?`<span>Guest <b>${s.guestCount||0}</b></span>`:''}${m.online?`<span>Online <b>${s.onlineCount||0}</b></span>`:''}<span>${readOnly?'읽기 전용':canEdit?'터치 즉시 저장':'수정기간 종료'}</span></div>
      ${v5PeopleContent(filtered,att,canEdit,q,filterLabel)}
      ${(m.guest||m.online)?`<div class="v5-extra-row">${m.guest?counterCard('guest','Guest',s.guestCount||0,canEdit):''}${m.online?counterCard('online','Online',s.onlineCount||0,canEdit):''}</div>`:''}
      ${m.type==='period'?externalParticipantBlock(m,s,canEdit):''}
      ${canEdit?`<div class="focus-actions"><button class="text-action" id="quickAddMember">＋ 성도 추가</button><button class="text-action" id="sessionOptions">회차 설정</button></div>`:''}
    </div>`;
  };

  function v5PeopleContent(filtered,att,canEdit,q,filterLabel){
    if(q||ui.attendanceFilter!=='all')return memberBubbles(`${q?'검색결과':filterLabel}`,filtered,att,canEdit);
    const regular=filtered.filter(x=>effectiveClass(x)==='정기'),occasional=filtered.filter(x=>effectiveClass(x)==='가끔'),long=filtered.filter(x=>effectiveClass(x)==='장기');
    return memberBubbles('정기',regular,att,canEdit)+memberBubbles('가끔',occasional,att,canEdit)+longAbsenceBlock(long,att,canEdit);
  }

  memberBubbles=function(label,list,att,canEdit){
    if(!list.length)return '';
    return `<section class="v5-person-section"><div class="v5-person-head"><strong>${label}</strong><span>${list.length}명</span></div><div class="attendance-grid">${list.sort(nameSort).map(m=>v5Person(m,att.includes(m.id),canEdit)).join('')}</div></section>`;
  };
  longAbsenceBlock=function(list,att,canEdit){
    if(!list.length)return '';
    return `<section class="v5-person-section"><div class="v5-person-head"><strong>장기결석</strong><button class="text-btn" id="toggleLong">${ui.longCollapsed?'보기':'접기'} · ${list.length}명</button></div>${ui.longCollapsed?'':`<div class="attendance-grid">${list.sort(nameSort).map(m=>v5Person(m,att.includes(m.id),canEdit)).join('')}</div>`}</section>`;
  };
  function v5Person(m,on,canEdit){
    return `<div class="person-btn ${on?'on':''}" data-att-member="${m.id}" data-disabled="${canEdit?'0':'1'}" role="button" tabindex="0"><div class="person-top"><span class="person-name">${esc(displayName(m))}</span><span class="person-title">${esc(m.title)}</span></div><span class="person-sub">${esc(m.note||deptName(m.deptId))}</span><span class="person-check">${on?'✓':''}</span><button class="person-more" type="button" data-member-menu="${m.id}" aria-label="성도 상세">⋯</button></div>`;
  }
  counterCard=function(key,title,value,canEdit){
    return `<div class="inline-counter"><label>${title}</label><button data-session-counter="${key}" data-delta="-1" ${canEdit?'':'disabled'}>−</button><input type="number" min="0" data-session-input="${key}" value="${value}" ${canEdit?'':'disabled'}><button data-session-counter="${key}" data-delta="1" ${canEdit?'':'disabled'}>＋</button></div>`;
  };

  render();
})();
