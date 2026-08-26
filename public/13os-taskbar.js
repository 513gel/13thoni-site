(()=>{"use strict";
  const root=document.getElementById("os-taskbar");
  if(!root)return;
  document.body.classList.add("has-13os-taskbar");
  const path=location.pathname.replace(/\/+$/,"/").toUpperCase();
  root.innerHTML='<button class="os-start" type="button" aria-expanded="false">十三鬼 <span>START</span></button><div class="os-apps"><a href="/">HOME</a><a href="/MOTTLE/">MOTTLE</a><a href="/PIXEL-FORGE/">PIXEL FORGE</a><a href="/GLYPHSHIFT/">GLYPHSHIFT</a></div><button class="os-media" type="button" aria-expanded="false">♫ RUDE BOI HOURS <span>PLAYER</span></button><span class="os-status">LOCAL TOOL // GUEST SESSION</span><span class="os-clock">LOCAL --:--:--</span><span class="os-access"><img src="/brand/oni-emblem.png" alt="" />GUEST ACCESS</span>';
  const apps=[["/","HOME"],["/MOTTLE/","MOTTLE"],["/PIXEL-FORGE/","PIXEL FORGE"],["/GLYPHSHIFT/","GLYPHSHIFT"]];
  apps.forEach(([url])=>{const link=[...root.querySelectorAll(".os-apps a")].find(a=>a.getAttribute("href")===url);if(link&&(url==="/"?path==="/":path===url.toUpperCase()))link.setAttribute("aria-current","page");});
  const menu=document.createElement("nav");
  menu.id="os-start-menu";
  menu.setAttribute("aria-label","13OS start menu");
  menu.innerHTML='<strong>13OS // START</strong><a href="/">◌ HOME</a><a href="/MOTTLE/">◌ MOTTLE</a><a href="/PIXEL-FORGE/">◌ PIXEL FORGE</a><a href="/GLYPHSHIFT/">◌ GLYPHSHIFT</a>';
  document.body.append(menu);
  const dock=document.createElement("section");
  dock.id="os-media-dock";
  dock.setAttribute("aria-label","Rude Boi Hours media dock");
  dock.innerHTML='<header><span>RUDE BOI HOURS // SPOTIFY UPLINK</span><button type="button">MINIMIZE ×</button></header><iframe title="Rude Boi Hours Spotify playlist" width="100%" height="152" frameborder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>';
  document.body.append(dock);
  const start=root.querySelector(".os-start"),media=root.querySelector(".os-media"),minimize=dock.querySelector("button"),iframe=dock.querySelector("iframe"),clock=root.querySelector(".os-clock");
  let playerLoaded=false;
  function updateClock(){clock.textContent="LOCAL "+new Intl.DateTimeFormat("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).format(new Date());}
  function toggleMenu(force){const open=typeof force==="boolean"?force:!menu.classList.contains("is-open");menu.classList.toggle("is-open",open);start.classList.toggle("is-active",open);start.setAttribute("aria-expanded",String(open));}
  function togglePlayer(force){const open=typeof force==="boolean"?force:!dock.classList.contains("is-open");if(open&&!playerLoaded){iframe.src="https://open.spotify.com/embed/playlist/4HSwiGun7jGSpFbPBj7J8a?utm_source=generator&theme=0&si=2da6b42ffd8843b5";playerLoaded=true;}dock.classList.toggle("is-open",open);media.classList.toggle("is-active",open);media.setAttribute("aria-expanded",String(open));media.querySelector("span").textContent=open?"MINIMIZE":"PLAYER";}
  start.addEventListener("click",()=>toggleMenu());
  media.addEventListener("click",()=>togglePlayer());
  minimize.addEventListener("click",()=>togglePlayer(false));
  document.addEventListener("keydown",event=>{if(event.key==="Escape"){toggleMenu(false);togglePlayer(false);}});
  updateClock();setInterval(updateClock,1000);
})();
