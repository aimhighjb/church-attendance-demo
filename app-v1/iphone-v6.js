'use strict';

// iPhone v6 — test-login first, workflow-first UI.
(function(){
  const TEST_USERS = [
    {id:'tu_admin_user', name:'김영수 집사', email:'kim.youngsoo@test.church', memberId:'m1', roles:['Admin','User']},
    {id:'tu_admin_leader', name:'이선희 권사', email:'lee.sunhee@test.church', memberId:'m2', roles:['Admin','Leader']},
    {id:'tu_user_leader', name:'박정호 집사', email:'park.jungho@test.church', memberId:'m3', roles:['User','Leader']},
    {id:'tu_user_only', name:'최미경 권사', email:'choi.mikyung@test.church', memberId:'m4', roles:['User']},
    {id:'tu_leader_only', name:'한민수 집사', email:'han.minsu@test.church', memberId:'m6', roles:['Leader']}
  ];

  const ROLE_LABEL={Admin:'Admin',User:'User',Leader:'순장/부순장'};
  const ROLE_MODE={Admin:'admin',User:'user',Leader:'leader'};

  function testUser(){ return TEST_USERS.find(x=>x.id===ui.testUserId)||null; }
  function activeRole(){
    const u=testUser();
    if(!u)return null;
    if(!u.roles.includes(ui.testActiveRole)) ui.testActiveRole=u.roles[0];
    return ui.testActiveRole;
  }
  function activateRole(role){
    const u=testUser(); if(!u||!u.roles.includes(role))return;
    ui.testActiveRole=role; ui.roleMode=ROLE_MODE[role];
    if(role==='Leader'&&ui.page==='members')ui.page='home';
  }

  currentActor=function(){
    const u=testUser();
    if(!u) return {name:'Test User',email:'',role:'',memberId:null};
    const r=activeRole();
    return {name:u.name,email:u.email,role:ROLE_LABEL[r]||r,memberId:u.memberId};
  };

  function fmtTopDate(date){
    const d=new Date(`${date}T12:00:00`);
    return `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`;
  }
  function sessionFor(mid,date){return db.sessions.find(s=>s.meetingId===mid&&s.date===date)||null;}
  function meetingStats(m,date){const s=sessionFor(m.id,date);return {s,n:s?sessionAttendance(s.id).length:0,g:s?.guestCount||0,o:s?.onlineCount||0};}

  function loginScreen(){
    return `<div class="v6-login-shell">
      <div class="v6-login-mark">교</div>
      <div class="v6-login-title">교회 출석관리</div>
      <div class="v6-login-sub">TEST LOGIN</div>
      <p class="v6-login-help">테스트할 사용자를 선택하세요.<br>실제 로그인 대신 사용하는 테스트 화면입니다.</p>
      <div class="v6-login-list">
        ${TEST_USERS.map(u=>`<button class="v6-login-row" data-v6-login="${u.id}">
          <span class="v6-login-avatar">${esc(u.name.slice(0,1))}</span>
          <span class="v6-login-copy"><strong>${esc(u.name)}</strong><small>${esc(u.email)}</small></span>
          <span class="v6-login-roles">${u.roles.map(r=>`<em>${ROLE_LABEL[r]}</em>`).join('')}</span>
          <span class="v6-login-chevron">›</span>
        </button>`).join('')}
      </div>
      <div class="v6-login-note">Admin 2 · User 3 · 순장/부순장 3 · 복수 역할 포함</div>
    </div>`;
  }

  function topBar(){
    const u=testUser(),home=ui.page==='home';
    return `<header class="v6-topbar">
      <button class="v6-brand" id="v6Home"><span class="v6-brand-logo">교</span><span class="v6-brand-name">${esc(db.config.church.name)}</span></button>
      <label class="v6-top-date ${home?'is-editable':'is-locked'}">
        <span>${fmtTopDate(ui.date||isoToday)}</span>${home?`<input id="v6TopDate" type="date" value="${ui.date||isoToday}">`:''}
      </label>
      <button class="v6-user" id="v6User"><span>${esc(u?.name.split(' ')[0]||'User')}</span><i>${(u?.name||'U').slice(0,1)}</i></button>
    </header>`;
  }

  render=function(){
    applyAppearance();
    const u=testUser();
    if(!u){
      app.innerHTML=loginScreen();
      modalRoot.innerHTML='';
      bindLogin();
      return;
    }
    activateRole(activeRole());
    app.innerHTML=`<div class="app-shell v6-shell">${topBar()}<main class="page v6-page">${renderPage()}</main></div>
      <nav class="bottom-nav v6-bottom">${navItems().map(([p,i,l])=>`<button class="nav-btn ${activeNav(ui.page)===p?'on':''}" data-page="${p}"><span>${i}</span>${l}</button>`).join('')}</nav>`;
    bindGlobal();bindPage();bindV6();
  };

  function bindLogin(){
    $$('[data-v6-login]').forEach(b=>b.onclick=()=>{
      const u=TEST_USERS.find(x=>x.id===b.dataset.v6Login);if(!u)return;
      ui.testUserId=u.id;ui.testActiveRole=u.roles[0];ui.roleMode=ROLE_MODE[u.roles[0]];ui.page='home';ui.date=isoToday;ui.search='';ui.v6SearchOpen=false;saveUI();render();
    });
  }

  function bindV6(){
    $('#v6Home')?.addEventListener('click',()=>{ui.page='home';ui.search='';ui.v6SearchOpen=false;saveUI();render();scrollTo(0,0);});
    $('#v6TopDate')?.addEventListener('change',e=>{ui.date=e.target.value||isoToday;ui.classificationKey='';saveUI();render();});
    $('#v6User')?.addEventListener('click',openUserSheet);
    $$('[data-v6-meeting]').forEach(r=>r.onclick=()=>{if(r.dataset.cancelled==='1')return;ui.meetingId=r.dataset.v6Meeting;ui.page='attendance';ui.search='';ui.v6SearchOpen=false;ui.attendanceFilter='all';ui.classificationKey='';saveUI();render();scrollTo(0,0);});
    $('#v6Search')?.addEventListener('click',()=>{ui.v6SearchOpen=!ui.v6SearchOpen;saveUI();render();if(ui.v6SearchOpen)requestAnimationFrame(()=>$('#attSearch')?.focus());});
    $('#v6Filter')?.addEventListener('change',e=>{ui.attendanceFilter=e.target.value;saveUI();render();});
    $('#attSearch')?.addEventListener('input',e=>{ui.search=e.target.value;saveUI();render();requestAnimationFrame(()=>{const x=$('#attSearch');if(x){x.focus();x.setSelectionRange(x.value.length,x.value.length);}});});
  }

  function openUserSheet(){
    const u=testUser(),role=activeRole();
    openModal('테스트 사용자',`<div class="v6-user-sheet">
      <div class="v6-account"><strong>${esc(u.name)}</strong><span>${esc(u.email)}</span></div>
      ${u.roles.length>1?`<div class="v6-setting-row"><span>현재 역할</span><select id="v6Role">${u.roles.map(r=>`<option value="${r}" ${role===r?'selected':''}>${ROLE_LABEL[r]}</option>`).join('')}</select></div>`:`<div class="v6-setting-row"><span>역할</span><b>${ROLE_LABEL[role]}</b></div>`}
      <div class="v6-setting-row"><span>글자 크기</span><select id="v6Font"><option value="normal" ${ui.font==='normal'?'selected':''}>크게</option><option value="large" ${ui.font==='large'?'selected':''}>아주 크게</option></select></div>
      <div class="v6-setting-row"><span>화면</span><select id="v6Theme"><option value="dark" ${ui.theme==='dark'?'selected':''}>Dark</option><option value="light" ${ui.theme==='light'?'selected':''}>Light</option></select></div>
      <button class="v6-switch-account" id="v6SwitchAccount">다른 사용자로 테스트</button>
    </div>`,`<button class="btn" data-close-modal>닫기</button>`);
    $('#v6Role')?.addEventListener('change',e=>{activateRole(e.target.value);saveUI();closeModal();render();});
    $('#v6Font')?.addEventListener('change',e=>{ui.font=e.target.value;saveUI();closeModal();render();});
    $('#v6Theme')?.addEventListener('change',e=>{ui.theme=e.target.value;saveUI();closeModal();render();});
    $('#v6SwitchAccount')?.addEventListener('click',()=>{ui.testUserId='';ui.testActiveRole='';ui.page='home';saveUI();closeModal();render();});
    $$('[data-close-modal]').forEach(b=>b.onclick=closeModal);
  }

  homePage=function(){
    const date=ui.date||isoToday,isToday=date===isoToday,meetings=scheduledMeetings(date).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
    const unique=new Set();let guest=0,online=0;
    meetings.forEach(m=>{const s=sessionFor(m.id,date);if(!s)return;sessionAttendance(s.id).forEach(id=>unique.add(id));guest+=s.guestCount||0;online+=s.onlineCount||0;});
    let gs=db.groupSessions.filter(s=>s.date===date&&s.status!=='Cancelled');if(isLeader()){const g=leaderGroup();gs=g?gs.filter(s=>s.groupId===g.id):[];}
    return `<div class="v6-home">
      <div class="v6-hero-line"><strong>${unique.size}</strong><span>Unique 등록교인</span><b>Guest ${guest}</b><b>Online ${online}</b></div>
      <section class="v6-section">
        <div class="v6-section-head"><h1>${isToday?'오늘의 모임':'선택한 날짜의 모임'}</h1><span>${meetings.length}개</span></div>
        <div class="v6-meet-table">
          <div class="v6-meet-head"><span>시간</span><span>모임</span><span>출석</span><span>기타</span></div>
          ${meetings.length?meetings.map(m=>meetingRow(m,date)).join(''):'<div class="v6-empty">이 날짜에는 예정된 모임이 없습니다.</div>'}
        </div>
      </section>
      ${canAccessGroup()?`<section class="v6-section"><div class="v6-section-head"><h1>순모임</h1><span>${gs.length}개</span></div><div class="v6-meet-table">${gs.length?gs.map(groupRow).join(''):createGroupRow(date)}</div></section>`:''}
      ${isAdmin()?`<section class="v6-admin-shortcuts"><button data-admin-page="meetings"><strong>모임 관리</strong><span>정규 · 기간형 · 일회성 수정</span><i>›</i></button><button data-admin-page="groups"><strong>순 관리</strong><span>순원 · 리더 · 회차</span><i>›</i></button></section>`:''}
    </div>`;
  };

  function meetingRow(m,date){
    const {s,n,g,o}=meetingStats(m,date),cancelled=s?.status==='Cancelled';
    return `<button class="v6-meet-row ${cancelled?'is-cancelled':''}" data-v6-meeting="${m.id}" data-cancelled="${cancelled?'1':'0'}">
      <span class="v6-time">${m.time||'--:--'}</span>
      <span class="v6-meet-name"><strong>${esc(s?.nameOverride||m.name)}</strong><small>${esc(locationName(m.locationId))}${cancelled?' · 취소':''}</small></span>
      <span class="v6-count"><strong>${n}</strong><small>명</small></span>
      <span class="v6-extra">${m.guest?`G ${g}`:''}${m.online?`<br>O ${o}`:''}${!m.guest&&!m.online?'—':''}</span>
      <i>›</i>
    </button>`;
  }
  function groupRow(s){const g=groupById(s.groupId),den=groupDenominator(s),present=(s.attendance||[]).filter(id=>den.includes(id)).length;return `<button class="v6-meet-row" data-home-group="${s.id}"><span class="v6-time">${s.time||'--:--'}</span><span class="v6-meet-name"><strong>${esc(g?.name||'순모임')}</strong><small>${esc(s.location||'장소 미정')}</small></span><span class="v6-count"><strong>${present}/${den.length}</strong><small>순원</small></span><span class="v6-extra">자녀 ${s.children||0}<br>방문 ${s.guests||0}</span><i>›</i></button>`;}
  function createGroupRow(date){const g=isLeader()?leaderGroup():groupById('g_love');return g?`<button class="v6-create" data-new-group-session="${g.id}" data-new-group-date="${date}">＋ ${esc(g.name)} 회차 만들기</button>`:'<div class="v6-empty">연결된 순이 없습니다.</div>';}

  attendancePage=function(){
    const date=ui.date||isoToday,m=meetingById(ui.meetingId);if(!m)return '<div class="v6-empty">홈에서 날짜와 모임을 먼저 선택하세요.</div>';
    const s=ensureSession(m.id,date);ensureClassificationSnapshot(m.id,date);
    const readOnly=isReadOnlyYear(date),canEdit=canEditGeneralDate(date)&&!readOnly,att=sessionAttendance(s.id);
    if(!['all','on','off','long'].includes(ui.attendanceFilter))ui.attendanceFilter='all';
    let people=attendanceCandidates(m),q=(ui.search||'').trim().toLowerCase();if(q)people=people.filter(x=>`${displayName(x)} ${x.title} ${x.note} ${deptName(x.deptId)}`.toLowerCase().includes(q));
    if(ui.attendanceFilter==='on')people=people.filter(x=>att.includes(x.id));if(ui.attendanceFilter==='off')people=people.filter(x=>!att.includes(x.id)&&effectiveClass(x)!=='장기');if(ui.attendanceFilter==='long')people=people.filter(x=>effectiveClass(x)==='장기');
    return `<div class="v6-att">
      <div class="v6-att-float">
        <button class="v6-search" id="v6Search" aria-label="검색">⌕</button>
        <div class="v6-att-title"><strong>${esc(s.nameOverride||m.name)}</strong><span><b>${att.length}명</b> 출석 중</span></div>
        <select class="v6-filter" id="v6Filter"><option value="all" ${ui.attendanceFilter==='all'?'selected':''}>전체</option><option value="on" ${ui.attendanceFilter==='on'?'selected':''}>출석</option><option value="off" ${ui.attendanceFilter==='off'?'selected':''}>미출석</option><option value="long" ${ui.attendanceFilter==='long'?'selected':''}>장기결석</option></select>
      </div>
      ${ui.v6SearchOpen?`<div class="v6-search-box"><input id="attSearch" value="${esc(ui.search||'')}" placeholder="이름 · 직분 · Note 검색"></div>`:''}
      <div class="v6-context"><strong>${fmtTopDate(date)}</strong><span>${m.time||''} · ${esc(locationName(m.locationId))}</span>${m.guest?`<span>Guest <b>${s.guestCount||0}</b></span>`:''}${m.online?`<span>Online <b>${s.onlineCount||0}</b></span>`:''}<span>${readOnly?'읽기 전용':canEdit?'터치 즉시 저장':'수정기간 종료'}</span></div>
      ${peopleBlock(people,att,canEdit,q)}
      ${(m.guest||m.online)?`<div class="v6-counters">${m.guest?counterCard('guest','Guest',s.guestCount||0,canEdit):''}${m.online?counterCard('online','Online',s.onlineCount||0,canEdit):''}</div>`:''}
      ${m.type==='period'?externalParticipantBlock(m,s,canEdit):''}
      ${canEdit?`<div class="focus-actions"><button class="text-action" id="quickAddMember">＋ 성도 추가</button><button class="text-action" id="sessionOptions">회차 설정</button></div>`:''}
    </div>`;
  };

  function peopleBlock(list,att,canEdit,q){
    if(q||ui.attendanceFilter!=='all')return memberBubbles(q?'검색결과':({on:'출석',off:'미출석',long:'장기결석'}[ui.attendanceFilter]||'전체'),list,att,canEdit);
    const reg=list.filter(x=>effectiveClass(x)==='정기'),occ=list.filter(x=>effectiveClass(x)==='가끔'),lng=list.filter(x=>effectiveClass(x)==='장기');
    return memberBubbles('정기',reg,att,canEdit)+memberBubbles('가끔',occ,att,canEdit)+longAbsenceBlock(lng,att,canEdit);
  }
  memberBubbles=function(label,list,att,canEdit){if(!list.length)return '';return `<section class="v6-people-section"><div class="v6-people-head"><strong>${label}</strong><span>${list.length}명</span></div><div class="v6-people">${list.sort(nameSort).map(m=>person(m,att.includes(m.id),canEdit)).join('')}</div></section>`;};
  longAbsenceBlock=function(list,att,canEdit){if(!list.length)return '';return `<section class="v6-people-section"><div class="v6-people-head"><strong>장기결석</strong><button class="text-btn" id="toggleLong">${ui.longCollapsed?'보기':'접기'} · ${list.length}명</button></div>${ui.longCollapsed?'':`<div class="v6-people">${list.sort(nameSort).map(m=>person(m,att.includes(m.id),canEdit)).join('')}</div>`}</section>`;};
  function person(m,on,canEdit){return `<div class="v6-person ${on?'on':''}" data-att-member="${m.id}" data-disabled="${canEdit?'0':'1'}" role="button" tabindex="0"><div><strong>${esc(displayName(m))}</strong><em>${esc(m.title)}</em></div><small>${esc(m.note||deptName(m.deptId))}</small><span>${on?'✓':''}</span><button data-member-menu="${m.id}" aria-label="성도 상세">⋯</button></div>`;}
  counterCard=function(key,title,value,canEdit){return `<div class="v6-counter"><strong>${title}</strong><button data-session-counter="${key}" data-delta="-1" ${canEdit?'':'disabled'}>−</button><input type="number" min="0" data-session-input="${key}" value="${value}" ${canEdit?'':'disabled'}><button data-session-counter="${key}" data-delta="1" ${canEdit?'':'disabled'}>＋</button></div>`;};

  // Keep Meeting Management and all existing pages intact; only make admin shortcuts explicit.
  const oldMorePage=morePage;
  morePage=function(){
    const base=oldMorePage();
    const u=testUser();
    if(activeRole()==='Leader'&&u?.roles.includes('User')){
      return `<section class="v6-role-extra"><button data-admin-page="members"><strong>회원 관리</strong><span>User 권한으로 이용 가능</span><i>›</i></button></section>${base}`;
    }
    return base;
  };

  render();
})();
