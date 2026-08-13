function bindGlobal(){
  $('#themeBtn')?.addEventListener('click',()=>{ui.theme=ui.theme==='dark'?'light':'dark';saveUI();render();});
  $('#fontBtn')?.addEventListener('click',()=>{ui.font=ui.font==='large'?'normal':'large';saveUI();render();});
  $$('[data-role]').forEach(b=>b.addEventListener('click',()=>{ui.roleMode=b.dataset.role;if(isLeader()&&ui.page==='members')ui.page='home';saveUI();render();}));
  $$('[data-page]').forEach(b=>b.addEventListener('click',()=>{ui.page=b.dataset.page;ui.adminPage='';saveUI();render();scrollTo(0,0);}));
  $$('[data-admin-page]').forEach(b=>b.addEventListener('click',()=>{ui.page=b.dataset.adminPage;ui.adminPage='';saveUI();render();scrollTo(0,0);}));
  $$('[data-menu-action]').forEach(b=>b.addEventListener('click',()=>handleMenuAction(b.dataset.menuAction)));
}

function bindPage(){
  $$('[data-home-meeting]').forEach(b=>b.onclick=()=>{ui.meetingId=b.dataset.homeMeeting;ui.date=isoToday;ui.page='attendance';ui.classificationKey='';saveUI();render();});
  $$('[data-home-group]').forEach(b=>b.onclick=()=>{const s=groupSessionById(b.dataset.homeGroup); if(s){ if(isAdmin())ui.groupAdminId=s.groupId; ui.groupSessionId=s.id; ui.page='group'; saveUI(); render(); }});
  $$('[data-new-group-session]').forEach(b=>b.onclick=()=>{if(isAdmin())ui.groupAdminId=b.dataset.newGroupSession;openGroupSessionModal(b.dataset.newGroupSession);});

  $('#attendanceDate')?.addEventListener('change',e=>{ui.date=e.target.value;ui.classificationKey='';saveUI();render();});
  $$('[data-date-step]').forEach(b=>b.onclick=()=>{ui.date=addDays(ui.date,Number(b.dataset.dateStep));ui.classificationKey='';saveUI();render();});
  $('#todayBtn')?.addEventListener('click',()=>{ui.date=isoToday;ui.classificationKey='';saveUI();render();});
  $$('[data-meeting-pick]').forEach(b=>b.onclick=()=>{ui.meetingId=b.dataset.meetingPick;ui.classificationKey='';saveUI();render();});
  $('#attSearch')?.addEventListener('input',e=>{ui.search=e.target.value;saveUI();render(); requestAnimationFrame(()=>$('#attSearch')?.focus());});
  $$('[data-att-filter]').forEach(b=>b.onclick=()=>{ui.attendanceFilter=b.dataset.attFilter;saveUI();render();}); $('#toggleLong')?.addEventListener('click',()=>{ui.longCollapsed=!ui.longCollapsed;saveUI();render();});
  $$('[data-att-member]').forEach(b=>b.addEventListener('click',e=>{if(e.target.closest('[data-member-menu]')||b.dataset.disabled==='1')return; toggleAttendance(b.dataset.attMember);}));
  $$('[data-member-menu]').forEach(b=>b.onclick=e=>{e.stopPropagation();openMemberModal(b.dataset.memberMenu);}); $$('[data-external-att]').forEach(b=>b.onclick=()=>toggleExternalAttendance(b.dataset.externalAtt));
  $$('[data-session-counter]').forEach(b=>b.onclick=()=>changeSessionCounter(b.dataset.sessionCounter,Number(b.dataset.delta)));
  $$('[data-session-input]').forEach(i=>i.onchange=()=>setSessionCounter(i.dataset.sessionInput,i.value));
  $('#quickAddMember')?.addEventListener('click',()=>openMemberModal()); $('#sessionOptions')?.addEventListener('click',openSessionOptions);

  $('#memberQ')?.addEventListener('input',e=>{ui.memberFilter.q=e.target.value;saveUI();render();requestAnimationFrame(()=>$('#memberQ')?.focus());});
  $('#memberDept')?.addEventListener('change',e=>{ui.memberFilter.dept=e.target.value;saveUI();render();}); $('#memberStatus')?.addEventListener('change',e=>{ui.memberFilter.status=e.target.value;saveUI();render();}); $('#memberGroup')?.addEventListener('change',e=>{ui.memberFilter.group=e.target.value;saveUI();render();});
  $('#addMemberBtn')?.addEventListener('click',()=>openMemberModal()); $$('[data-open-member]').forEach(r=>r.onclick=e=>{if(e.target.matches('[data-member-select]'))return;openMemberModal(r.dataset.openMember);}); $$('[data-member-select]').forEach(c=>c.onchange=e=>{const id=e.target.dataset.memberSelect;ui.selectedMembers=e.target.checked?[...new Set([...ui.selectedMembers,id])]:ui.selectedMembers.filter(x=>x!==id);saveUI();render();});
  $('#bulkAction')?.addEventListener('click',openBulkModal); $('#exportMembers')?.addEventListener('click',exportMembers);

  $('#groupSessionSelect')?.addEventListener('change',e=>{const s=groupSessionById(e.target.value);if(s){ui.groupSessionId=s.id;saveUI();render();}}); $$('[data-group-session-step]').forEach(b=>b.onclick=()=>stepGroupSession(Number(b.dataset.groupSessionStep)));
  $$('[data-group-member]').forEach(b=>b.onclick=()=>toggleGroupAttendance(b.dataset.groupMember)); $$('[data-gcounter]').forEach(b=>b.onclick=()=>changeGroupCounter(b.dataset.gcounter,Number(b.dataset.delta))); $$('[data-ginput]').forEach(i=>i.onchange=()=>setGroupCounter(i.dataset.ginput,i.value));
  $('#saveGroupNote')?.addEventListener('click',saveGroupNote); $('#editExclusions')?.addEventListener('click',openExclusionModal); $('#editGroupSession')?.addEventListener('click',()=>openGroupSessionModal(leaderGroup().id,currentGroupSession()?.id)); $('#otherMemberBtn')?.addEventListener('click',convertGuestToMember);

  $$('[data-report-tab]').forEach(b=>b.onclick=()=>{ui.reportTab=b.dataset.reportTab;saveUI();render();}); $$('[data-report-mode]').forEach(b=>b.onclick=()=>{ui.reportMode=b.dataset.reportMode;saveUI();render();}); $('#exportReport')?.addEventListener('click',exportCurrentReport); $('#printReport')?.addEventListener('click',()=>window.print()); $('#saveDrive')?.addEventListener('click',()=>{db.reportSaves.unshift({ts:new Date().toISOString(),name:`${ui.reportTab}_${isoToday}.pdf`});audit('Report','Save to Drive (Demo)');toast('Drive 저장은 Test에서 Audit만 기록했습니다.');});

  $$('[data-meeting-tab]').forEach(b=>b.onclick=()=>{ui.adminPage=b.dataset.meetingTab;saveUI();render();}); $('#addMeeting')?.addEventListener('click',()=>openMeetingModal()); $('#unionService')?.addEventListener('click',openUnionServiceModal); $$('[data-edit-meeting]').forEach(r=>r.onclick=()=>openMeetingModal(r.dataset.editMeeting));
  $('#addGroup')?.addEventListener('click',()=>openGroupModal()); $$('[data-edit-group]').forEach(r=>r.onclick=()=>openGroupModal(r.dataset.editGroup));
  $('#addUser')?.addEventListener('click',()=>openUserModal()); $$('[data-edit-user]').forEach(r=>r.onclick=()=>openUserModal(r.dataset.editUser));
  $('#saveSettings')?.addEventListener('click',saveSettings); $$('[data-add-master]').forEach(b=>b.onclick=()=>openMasterModal(b.dataset.addMaster)); $$('[data-edit-master]').forEach(r=>r.onclick=()=>{const [t,id]=r.dataset.editMaster.split('|');openMasterModal(t,id);});
  $('#auditQ')?.addEventListener('input',filterAudit); $('#auditType')?.addEventListener('change',filterAudit);
  $('#makeBackup')?.addEventListener('click',makeBackup); $('#downloadBackup')?.addEventListener('click',()=>{audit('Backup','JSON 백업 다운로드');downloadText(`church-backup-${isoToday}.json`,JSON.stringify(db,null,2),'application/json');}); $('#restoreFile')?.addEventListener('change',restoreFromFile); $$('[data-archive-year]').forEach(r=>r.onclick=()=>openArchiveYear(Number(r.dataset.archiveYear)));
}

function handleMenuAction(a){ if(a==='theme'){ui.theme=ui.theme==='dark'?'light':'dark';saveUI();render();} else if(a==='font'){ui.font=ui.font==='large'?'normal':'large';saveUI();render();} else if(a==='reset'){ if(confirm('Demo 데이터를 처음 상태로 되돌릴까요?')){db=seedData();ui=loadUI();saveDB();toast('Demo 초기화 완료');render();} } }

function toggleAttendance(memberId){ const s=ensureSession(ui.meetingId,ui.date); if(!canEditGeneralDate(ui.date)||isReadOnlyYear(ui.date))return toast('읽기 전용 또는 수정 기간이 지났습니다.','error'); const a=sessionAttendance(s.id),i=a.indexOf(memberId); if(i>=0)a.splice(i,1);else a.push(memberId);audit('Attendance',`${meetingById(ui.meetingId).name} ${ui.date} · ${displayName(memberById(memberId))} ${i>=0?'OFF':'ON'}`,{meetingId:ui.meetingId,memberId});saveDB();render(); }
function toggleExternalAttendance(externalId){const s=ensureSession(ui.meetingId,ui.date);if(!canEditGeneralDate(ui.date)||isReadOnlyYear(ui.date))return;const a=sessionAttendance(s.id),i=a.indexOf(externalId);if(i>=0)a.splice(i,1);else a.push(externalId);const ext=meetingById(ui.meetingId)?.externalParticipants?.find(e=>e.id===externalId);audit('Attendance',`${meetingById(ui.meetingId).name} · 외부 참가자 ${ext?.name||externalId} ${i>=0?'OFF':'ON'}`,{meetingId:ui.meetingId});saveDB();render();}

function changeSessionCounter(key,delta){const s=ensureSession(ui.meetingId,ui.date);if(!canEditGeneralDate(ui.date)||isReadOnlyYear(ui.date))return;const prop=key==='guest'?'guestCount':'onlineCount';s[prop]=clamp0((s[prop]||0)+delta);audit('Attendance',`${meetingById(ui.meetingId).name} ${key} count → ${s[prop]}`,{meetingId:ui.meetingId});saveDB();render();}
function setSessionCounter(key,val){const s=ensureSession(ui.meetingId,ui.date);const prop=key==='guest'?'guestCount':'onlineCount';s[prop]=clamp0(val);audit('Attendance',`${meetingById(ui.meetingId).name} ${key} count → ${s[prop]}`,{meetingId:ui.meetingId});saveDB();render();}

function stepGroupSession(delta){
  const g=leaderGroup(); if(!g)return; const arr=db.groupSessions.filter(x=>x.groupId===g.id).sort((a,b)=>b.date.localeCompare(a.date)); if(!arr.length)return; const cur=currentGroupSession(); let idx=Math.max(0,arr.findIndex(x=>x.id===cur?.id)); idx=Math.max(0,Math.min(arr.length-1,idx+delta)); ui.groupSessionId=arr[idx].id;saveUI();render();
}

function currentGroupSession(){ const g=leaderGroup(); if(!g)return null; if(ui.groupSessionId){const x=groupSessionById(ui.groupSessionId);if(x?.groupId===g.id)return x;} return db.groupSessions.filter(x=>x.groupId===g.id).sort((a,b)=>b.date.localeCompare(a.date))[0]||null; }
function toggleGroupAttendance(memberId){const s=currentGroupSession();if(!s)return;const i=s.attendance.indexOf(memberId);if(i>=0)s.attendance.splice(i,1);else s.attendance.push(memberId);audit('Group',`${groupById(s.groupId).name} ${s.date} · ${displayName(memberById(memberId))} ${i>=0?'OFF':'ON'}`,{groupId:s.groupId,memberId});saveDB();render();}
function changeGroupCounter(key,delta){const s=currentGroupSession();s[key]=clamp0((s[key]||0)+delta);audit('Group',`${groupById(s.groupId).name} ${key} → ${s[key]}`,{groupId:s.groupId});saveDB();render();}
function setGroupCounter(key,val){const s=currentGroupSession();s[key]=clamp0(val);audit('Group',`${groupById(s.groupId).name} ${key} → ${s[key]}`,{groupId:s.groupId});saveDB();render();}
function saveGroupNote(){const s=currentGroupSession();if(!s||!canReadGroupNote(s))return; s.note=$('#groupNote').value.slice(0,1000);s.noteUpdatedAt=new Date().toISOString();s.noteUpdatedBy=currentActor().name;audit('Group','순모임 회차 Note 수정',{groupId:s.groupId});saveDB();toast('Note 저장 완료');render();}

function openModal(title,body,actions=''){ modalRoot.innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><div class="modal-title">${title}</div><button class="modal-close" data-close-modal>×</button></div>${body}<div class="modal-actions">${actions}</div></div></div>`; $$('[data-close-modal]').forEach(b=>b.onclick=closeModal); $('.modal-backdrop')?.addEventListener('click',e=>{if(e.target.classList.contains('modal-backdrop'))closeModal();}); }
function closeModal(){modalRoot.innerHTML='';}
function toast(msg,type=''){toastRoot.innerHTML=`<div class="toast ${type}">${esc(msg)}</div>`;setTimeout(()=>toastRoot.innerHTML='',1600);}
