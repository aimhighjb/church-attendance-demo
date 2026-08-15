'use strict';

// v6 workflow guard: no implicit meeting selection; map simulated leader role to member's group.
(function(){
  const previousLeaderGroup=leaderGroup;
  leaderGroup=function(){
    if(ui.roleMode==='leader'){
      const actor=currentActor();
      const member=actor?.memberId?memberById(actor.memberId):null;
      const group=member?.groupId?groupById(member.groupId):null;
      if(group)return group;
    }
    return previousLeaderGroup();
  };

  document.addEventListener('click',e=>{
    const login=e.target.closest('[data-v6-login]');
    if(login){
      setTimeout(()=>{ui.meetingId='';ui.v6HasMeetingContext=false;saveUI();},0);
      return;
    }
    const meeting=e.target.closest('[data-v6-meeting]');
    if(meeting&&meeting.dataset.cancelled!=='1'){
      ui.v6HasMeetingContext=true;
      saveUI();
      return;
    }
    const attendance=e.target.closest('[data-page="attendance"]');
    if(attendance&&!ui.v6HasMeetingContext){
      e.preventDefault();
      e.stopImmediatePropagation();
      ui.page='home';
      saveUI();
      render();
      setTimeout(()=>toast('홈에서 모임을 먼저 선택하세요.'),0);
      return;
    }
    if(e.target.closest('#v6SwitchAccount')){
      ui.meetingId='';ui.v6HasMeetingContext=false;saveUI();
    }
  },true);

  document.addEventListener('change',e=>{
    if(e.target?.id==='v6TopDate'){
      ui.meetingId='';ui.v6HasMeetingContext=false;saveUI();
    }
  },true);
})();
