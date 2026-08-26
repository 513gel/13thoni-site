(()=>{"use strict";
  const root=document.getElementById("os-taskbar");
  if(!root)return;
  document.body.classList.add("has-13os-taskbar");
  const path=location.pathname.replace(/\/+$/,"/").toUpperCase();
  const apps=[["/","HOME"],["/MOTTLE/","MOTTLE"],["/PIXEL-FORGE/","PIXEL FORGE"],["/GLYPHSHIFT/","GLYPHSHIFT"],["/FORMATKILLER/","FORMATKILLER"],["/RHYTHMGRID/","RHYTHMGRID"],["/BASSLIQUID/","BASSLIQUID"],["/LOOPFORGE/","LOOPFORGE"]];
  const links=apps.map(([url,name])=>'<a href="'+url+'">'+name+'</a>').join("");
  root.innerHTML='<button class="os-start" type="button" aria-expanded="false">十三鬼 <span>START</span></button><div class="os-apps">'+links+'</div><span class="os-status">LOCAL TOOL // GUEST SESSION</span><span class="os-clock">LOCAL --:--:--</span><span class="os-access"><img src="/brand/oni-emblem.png" alt="" />GUEST ACCESS</span>';
  apps.forEach(([url])=>{const link=[...root.querySelectorAll(".os-apps a")].find(a=>a.getAttribute("href")===url);if(link&&(url==="/"?path==="/":path===url.toUpperCase()))link.setAttribute("aria-current","page");});
  const menu=document.createElement("nav");
  menu.id="os-start-menu";
  menu.setAttribute("aria-label","13OS start menu");
  menu.innerHTML='<strong>13OS // START</strong>'+apps.map(([url,name])=>'<a href="'+url+'">◌ '+name+'</a>').join("");
  document.body.append(menu);
  const start=root.querySelector(".os-start"),clock=root.querySelector(".os-clock");
  function updateClock(){clock.textContent="LOCAL "+new Intl.DateTimeFormat("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).format(new Date());}
  function toggleMenu(force){const open=typeof force==="boolean"?force:!menu.classList.contains("is-open");menu.classList.toggle("is-open",open);start.classList.toggle("is-active",open);start.setAttribute("aria-expanded",String(open));}
  start.addEventListener("click",()=>toggleMenu());
  document.addEventListener("keydown",event=>{if(event.key==="Escape")toggleMenu(false);});
  updateClock();setInterval(updateClock,1000);
})();
