
(function(){
  const root=document.getElementById("tvd");if(!root)return;
  const $=id=>document.getElementById(id);
  const RVB="M6 50 L12 46 L20 42 C21 35 28 29 37 27.5 C39.5 24 41 19 45 16 C48.5 13.5 53 13.5 55.5 16 C58.5 17 61.5 19.5 63.5 22.5 C60.5 22.8 58 23.6 55.8 25 L54.5 26.6 L52.6 26.1 L53 28 L50.8 27.7 L51 29.6 L49 29.3 C50.5 35 47.5 42 40 45 C36 46.5 32 47 28 47.2 L14 52 L9 53.5 Z",RVW="M41 29 C34 28.6 25 32 18 39 L9.5 48.8 C19 46 29 43.8 35.5 41.3 C40.5 39.3 43 34 41 29 Z",RVL="M33 46.5 L32 55 M32 55 L29 57 M32 55 L34.5 57 M38 45.5 L39 55 M39 55 L36.5 57 M39 55 L41.5 57";
  root.querySelectorAll(".rvslot").forEach(s=>{const n=+s.dataset.s;s.innerHTML=`<svg class="rv" viewBox="4 10 61 49" width="${n}" height="${Math.round(n*49/61)}" aria-hidden="true"><g class="rvbird"><path class="rvb" d="${RVB}"/><path class="rvl" d="${RVL}" stroke-width="1.8" stroke-linecap="round" fill="none"/><path class="rvw" d="${RVW}"/><circle cx="50.8" cy="19.2" r="1.3" fill="var(--red)"/></g></svg>`});
  const stage=$("tvdStage"),view=stage.parentElement;
  const fit=()=>{stage.style.transform="scale("+(innerWidth<=760?1100:view.clientWidth)/1100+")"};fit();
  if(window.ResizeObserver)new ResizeObserver(fit).observe(view);else addEventListener("resize",fit);
  const SC=[
    {t:"Your whole pipeline at a glance",p:"Every stage, what's due today, and what's slipping, the moment you open it.",nav:"home"},
    {t:"Click into what's due",p:"Every stat and task opens the exact meeting or follow-up behind it.",nav:"home"},
    {t:"Meeting notes, organized by stage",p:"A tab for each meeting type, with dated notes linked to the appointment.",nav:"notes"},
    {t:"Move deals with a drag",p:"Your stages, your way. Every move is logged automatically.",nav:"stages"},
    {t:"The full story on every account",p:"Bio, locations, appointment history, and what's up next, all in one place.",nav:"stages"},
    {t:"Live team chat around each deal",p:"Threads for each account, typing indicators, and reactions in real time.",nav:"team"},
    {t:"Muninn remembers everything",p:"Ask about any account, task, or note and get a straight answer.",nav:"mun"}
  ];
  const chips=$("tvdChips");
  const LBL=["Home","Due today","Notes","Stages","Accounts","Team chat","Muninn"];
  LBL.forEach((l,i)=>{const b=document.createElement("button");b.type="button";b.textContent=l;b.setAttribute("role","tab");b.onclick=()=>{auto=false;pause.textContent="Resume tour";run(i)};chips.append(b)});
  const pause=document.createElement("button");pause.type="button";pause.className="tvd-pause";pause.textContent="Pause tour";pause.addEventListener("click",()=>{auto=!auto;token++;pause.textContent=auto?"Pause tour":"Resume tour";if(auto)run(cur)});chips.parentElement.insertAdjacentElement("afterend",pause);
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  let token=0,cur=0,auto=!reduce,visible=true;
  const sleep=(ms,t)=>new Promise((res,rej)=>setTimeout(()=>t===token?res():rej("x"),reduce?0:ms));
  const waitVisible=async t=>{while(!visible||document.hidden){await new Promise(r=>setTimeout(r,300));if(t!==token)throw"x"}};
  const cursor=$("tvdCur");
  const pt=(el,dx=.5,dy=.5)=>{const s=stage.getBoundingClientRect(),r=el.getBoundingClientRect(),k=1100/s.width;return[(r.left-s.left+r.width*dx)*k,(r.top-s.top+r.height*dy)*k]};
  const move=async(el,t,dx,dy,ms=800)=>{const[x,y]=pt(el,dx,dy);cursor.style.transitionDuration=ms+"ms";cursor.style.left=x+"px";cursor.style.top=y+"px";await sleep(ms+80,t)};
  const click=async t=>{cursor.classList.remove("click");void cursor.offsetWidth;cursor.classList.add("click");await sleep(320,t)};
  const show=i=>{root.querySelectorAll(".tvd-scene").forEach(s=>s.classList.toggle("on",+s.dataset.s===i));root.querySelectorAll(".tvd-nav").forEach(n=>n.classList.toggle("on",n.dataset.n===SC[i].nav));[...chips.children].forEach((c,k)=>{c.classList.toggle("on",k===i);c.setAttribute("aria-selected",k===i)});$("tvdCapT").textContent=SC[i].t;$("tvdCapP").textContent=SC[i].p;cur=i};
  const typeInto=async(el,text,t,cps=55)=>{el.innerHTML="";const tx=document.createTextNode("");const c=document.createElement("span");c.className="caret";el.append(tx,c);if(reduce){tx.data=text;c.remove();return}for(let i=0;i<=text.length;i+=2){tx.data=text.slice(0,i);await sleep(1000/cps,t)}tx.data=text;c.remove()};
  const hop=()=>{const r=$("tvdMun").querySelector(".rv");if(!r)return;r.classList.remove("hop");void r.getBoundingClientRect();r.classList.add("hop")};
  function reset(i){
    root.querySelectorAll("[data-c]").forEach(b=>b.textContent=reduce||i!==0?b.dataset.c:"0");
    $("tvdDue").classList.remove("hot");$("tvdDueItem").classList.remove("hl");
    $("tvdType").textContent=reduce?NOTE:"";$("tvdNote").classList.remove("saved");$("tvdSaved").textContent=reduce?"Saved Oct 20, 10:58 AM by Cody":"Not saved yet";if(reduce)$("tvdNote").classList.add("saved");
    const card=$("tvdCard");card.classList.remove("fly");card.style.cssText="";const gh=root.querySelector(".ghost");if(gh)gh.remove();
    if(card.parentElement!==$("tvdBbD"))$("tvdBbD").prepend(card);$("tvdCntD").textContent="6";$("tvdCntA").textContent="3";$("tvdColA").classList.remove("over");$("tvdToast").classList.remove("on");
    if(reduce&&i===3){$("tvdBbA").prepend(card);$("tvdCntD").textContent="5";$("tvdCntA").textContent="4"}
    $("tvdQ").classList.toggle("new",!reduce);$("tvdRx").classList.toggle("on",reduce);$("tvdTyping").textContent="";
    $("tvdChat").classList.toggle("on",reduce&&i===6);$("tvdAsk").style.opacity=reduce?1:0;$("tvdAns").style.opacity=reduce?1:0;$("tvdAns").textContent=reduce?ANS:"";
  }
  const NOTE="Owner Dana and head coach Marcus. About 420 active kids. Juggling three tools for billing, makeups, and waitlists. Wants scheduling and makeups first. Next: alignment Thursday.";
  const ANS="Three things this week:\n• Summit Ridge is in Alignment. Thursday at 1:00, send the recap today.\n• Lakeview Tumble has gone quiet for 9 days.\n• North Star's proposal is waiting on a follow-up.";
  const counters=async t=>{const els=[...root.querySelectorAll('.tvd-scene[data-s="0"] [data-c]')];for(let k=1;k<=12;k++){els.forEach(b=>b.textContent=Math.round(b.dataset.c*k/12));await sleep(45,t)}};
  const steps=[
    async t=>{await counters(t);await sleep(1600,t);await move($("tvdDue"),t,.4,.55);$("tvdDue").classList.add("hot");await click(t);await sleep(250,t)},
    async t=>{await sleep(900,t);await move($("tvdDueItem"),t,.35,.5);$("tvdDueItem").classList.add("hl");await sleep(500,t);await click(t);await sleep(300,t)},
    async t=>{await move($("tvdType"),t,.3,.3,600);await click(t);await typeInto($("tvdType"),NOTE,t);await sleep(400,t);await move($("tvdSave"),t);await click(t);$("tvdNote").classList.add("saved");$("tvdSaved").textContent="Saved Oct 20, 10:58 AM by Cody";await sleep(1700,t)},
    async t=>{const card=$("tvdCard");await sleep(600,t);await move(card,t,.5,.4);await click(t);
      const b=$("tvdBoard").getBoundingClientRect(),r=card.getBoundingClientRect(),k=1100/stage.getBoundingClientRect().width;
      const gh=document.createElement("div");gh.className="ghost";card.after(gh);
      card.classList.add("fly");card.style.left=(r.left-b.left)*k+"px";card.style.top=(r.top-b.top)*k+"px";card.style.width=r.width*k+"px";
      const tr=$("tvdBbA").getBoundingClientRect();await sleep(60,t);
      const tx=(tr.left-b.left)*k+7,ty=(tr.top-b.top)*k;card.style.left=tx+"px";card.style.top=ty+"px";
      const[cx,cy]=[tx+ (r.width*k)/2+ (b.left-stage.getBoundingClientRect().left)*k, ty+20+(b.top-stage.getBoundingClientRect().top)*k];cursor.style.transitionDuration="900ms";cursor.style.left=cx+"px";cursor.style.top=cy+"px";
      $("tvdColA").classList.add("over");await sleep(950,t);
      card.classList.remove("fly");card.style.cssText="";gh.remove();$("tvdBbA").prepend(card);$("tvdColA").classList.remove("over");$("tvdCntD").textContent="5";$("tvdCntA").textContent="4";$("tvdToast").classList.add("on");await sleep(1800,t);$("tvdToast").classList.remove("on");await sleep(300,t)},
    async t=>{cursor.style.left="760px";cursor.style.top="560px";await sleep(4200,t)},
    async t=>{await sleep(1100,t);$("tvdTyping").textContent="Quan is typing…";await sleep(1700,t);$("tvdTyping").textContent="";$("tvdQ").classList.remove("new");await sleep(1000,t);await move($("tvdQ"),t,.15,.7);await click(t);$("tvdRx").classList.add("on");await sleep(1800,t)},
    async t=>{const m=$("tvdMun");await sleep(500,t);hop();await sleep(1100,t);await move(m,t,.5,.5);await click(t);$("tvdChat").classList.add("on");await sleep(700,t);$("tvdAsk").style.opacity=1;await sleep(900,t);const a=$("tvdAns");a.style.opacity=1;a.textContent="";for(let i=0;i<=ANS.length;i+=3){a.textContent=ANS.slice(0,i);await sleep(28,t)}a.textContent=ANS;await sleep(3200,t)}
  ];
  async function run(i){
    const t=++token;show(i);reset(i);
    try{
      if(reduce)return;
      await waitVisible(t);await steps[i](t);
      if(auto){run((i+1)%SC.length)}
    }catch(e){}
  }
  if("IntersectionObserver" in window)new IntersectionObserver(es=>{visible=es[0].isIntersecting},{threshold:.25}).observe(root);
  if(!reduce)setInterval(()=>{if(cur!==6&&visible&&!document.hidden&&Math.random()<.35)hop()},9000);
  if(reduce)pause.textContent="Resume tour";
  run(0);
})();
