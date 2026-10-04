const $=id=>document.getElementById(id);
const views=[...document.querySelectorAll('.view')];
const links=[...document.querySelectorAll('.side-link')];
let fmState={fm:5,fc:100,dev:25,amp:1,noise:0,att:0,beta:5,bw:60,msg:[],carrier:[],fmSig:[],received:[],spectrum:{f:[],m:[]}};
let walkie={samples:null,sr:16000,duration:2.5};
const savedTheme=localStorage.getItem('fmLabTheme'); if(savedTheme!=='light') document.body.classList.add('dark');
// The cinematic landing screen is intentionally shown on EVERY fresh page load.
// Do not store a 'visited' flag: the evaluator should always see the opening experience.
const landing=$('landing'); const enterLab=$('enterLab');
function resetOpeningScreen(){ if(landing) landing.classList.remove('hide'); }
resetOpeningScreen();
window.addEventListener('pageshow', resetOpeningScreen);
enterLab?.addEventListener('click',()=>{ landing?.classList.add('hide'); });

function showView(id){views.forEach(v=>v.classList.toggle('active',v.id===id));links.forEach(l=>l.classList.toggle('active',l.dataset.view===id));window.scrollTo({top:0,behavior:'smooth'});if(id==='analysis')setTimeout(()=>runFM(),50);if(id==='observations')updateObs();}
links.forEach(l=>l.addEventListener('click',()=>showView(l.dataset.view)));
document.querySelectorAll('[data-jump]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.jump)));
$('themeBtn').addEventListener('click',()=>{document.body.classList.toggle('dark');const dark=document.body.classList.contains('dark');localStorage.setItem('fmLabTheme',dark?'dark':'light');$('themeBtn').textContent=dark?'☀':'☾';drawAll();});

function bindRange(id,out,unit=''){const el=$(id);const o=$(out);const update=()=>o.textContent=el.value+unit;el.addEventListener('input',update);update();}
bindRange('fm','fmOut',' Hz');bindRange('fc','fcOut',' Hz');bindRange('dev','devOut',' Hz');bindRange('amp','ampOut','');bindRange('noise','noiseOut',' %');bindRange('att','attOut',' %');
['fm','fc','dev','amp','noise','att'].forEach(id=>$(id).addEventListener('input',()=>{readControls();runFM(false);}));
$('runFM').addEventListener('click',()=>runFM(true));

function readControls(){fmState.fm=+$('fm').value;fmState.fc=+$('fc').value;fmState.dev=+$('dev').value;fmState.amp=+$('amp').value;fmState.noise=+$('noise').value;fmState.att=+$('att').value;fmState.beta=fmState.dev/fmState.fm;fmState.bw=2*(fmState.dev+fmState.fm);$('beta').textContent=fmState.beta.toFixed(2);$('bw').textContent=fmState.bw.toFixed(0)+' Hz';$('devMetric').textContent=fmState.dev+' Hz';$('snr').textContent=fmState.noise===0?'∞ dB':(20*Math.log10(100/Math.max(1,fmState.noise))).toFixed(1)+' dB';updateObs();updateLiveInsight();}
function updateLiveInsight(){
 const {fm,fc,dev,noise,att,beta,bw}=fmState;
 const low=fc-dev, high=fc+dev;
 const health=Math.max(8,Math.round(100-(noise*1.25)-(att*.42)));
 const meter=$('healthMeter'), hv=$('healthValue'), hb=$('healthBadge');
 if(meter) meter.style.width=health+'%'; if(hv) hv.textContent=health+'%'; if(hb) hb.textContent='SIGNAL HEALTH '+health+'%';
 if($('freqRange')) $('freqRange').textContent=low.toFixed(0)+'–'+high.toFixed(0)+' Hz';
 if($('markerReadout')) $('markerReadout').textContent=low.toFixed(0)+' / '+fc.toFixed(0)+' / '+high.toFixed(0)+' Hz';
 if($('specLow')) $('specLow').textContent=low.toFixed(0)+' Hz'; if($('specCarrier')) $('specCarrier').textContent=fc.toFixed(0)+' Hz'; if($('specHigh')) $('specHigh').textContent=high.toFixed(0)+' Hz'; if($('specBandwidth')) $('specBandwidth').textContent=bw.toFixed(0)+' Hz';
 let text;
 if(noise>22) text='High channel noise is masking the received waveform. Compare the noisy signal with the recovered message.';
 else if(att>45) text='Strong attenuation has reduced received amplitude. FM information is still represented by frequency variation in this simplified model.';
 else if(dev>55) text='Large frequency deviation increases β and expands the approximate FM bandwidth.';
 else if(fm>12) text='A faster message changes the instantaneous frequency more rapidly and reduces β when Δf is held fixed.';
 else text='The carrier stays centered at fc while the instantaneous frequency swings by ±Δf.';
 if($('liveInsight')) $('liveInsight').textContent=text;
 if($('obsBeta')) $('obsBeta').textContent=beta.toFixed(2); if($('obsBW')) $('obsBW').textContent=bw.toFixed(0)+' Hz'; if($('obsNoise')) $('obsNoise').textContent=noise+'%'; if($('obsAtt')) $('obsAtt').textContent=att+'%';
}

function runFM(show=true){readControls();const {fm,fc,dev,amp,noise,att}=fmState;const duration=Math.max(0.7,Math.min(2,4/fm));const N=1800;const dt=duration/(N-1);let phase=0;const msg=[],carrier=[],sig=[],rec=[];for(let i=0;i<N;i++){const t=i*dt,m=amp*Math.cos(2*Math.PI*fm*t);const c=Math.cos(2*Math.PI*fc*t);phase+=2*Math.PI*(fc+dev*Math.cos(2*Math.PI*fm*t))*dt;const s=Math.cos(phase);const n=(Math.random()*2-1)*(noise/100)*.65;msg.push(m);carrier.push(c);sig.push(s);rec.push((1-att/100)*s+n);}fmState.msg=msg;fmState.carrier=carrier;fmState.fmSig=sig;fmState.received=rec;fmState.spectrum=fftMagnitude(sig,duration);drawAll();if(show && $('labStatus')) $('labStatus').textContent='Simulation updated';}
function updateObs(){$('obsBeta').textContent=fmState.beta.toFixed(2);$('obsBeta2').textContent=fmState.beta.toFixed(2);$('obsBW').textContent=fmState.bw.toFixed(0)+' Hz';$('obsBW2').textContent=fmState.bw.toFixed(0)+' Hz';$('obsNoise').textContent=fmState.noise+'%';$('obsAtt').textContent=fmState.att+'%';$('obsFm').textContent=fmState.fm+' Hz';$('obsFc').textContent=fmState.fc+' Hz';$('obsDev').textContent=fmState.dev+' Hz';}

function setupCanvas(canvas){if(!canvas)return null;const dpr=window.devicePixelRatio||1;const r=canvas.getBoundingClientRect();canvas.width=Math.max(300,r.width*dpr);canvas.height=Math.max(180,r.height*dpr);const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);return{c,w:r.width,h:r.height};}
function styleFor(){return document.body.classList.contains('dark')?{grid:'#26384b',axis:'#71869a',text:'#aebdcb',line:'#36b9ef',line2:'#a487ff'}:{grid:'#e3eaf1',axis:'#7d8d9f',text:'#5d6e81',line:'#1386dd',line2:'#7659df'};}
function drawLine(id,data,label='amplitude'){
 const canvas=$(id); if(!canvas||!data||!data.length)return;
 const {c,w,h}=setupCanvas(canvas),st=styleFor(),dark=document.body.classList.contains('dark');
 c.clearRect(0,0,w,h); c.fillStyle=dark?'#070d17':'#fbfdff'; c.fillRect(0,0,w,h);
 const pad={l:58,r:20,t:28,b:48};
 const duration=(fmState.fm?Math.max(.7,Math.min(2,4/fmState.fm)):1);
 const max=Math.max(1,...data.map(v=>Math.abs(v))); const min=-max;
 c.font='10px system-ui'; c.textAlign='center'; c.fillStyle=st.text;
 for(let i=0;i<=5;i++){
   const x=pad.l+(w-pad.l-pad.r)*i/5;
   c.strokeStyle=st.grid;c.lineWidth=1;c.beginPath();c.moveTo(x,pad.t);c.lineTo(x,h-pad.b);c.stroke();
   c.fillText((duration*i/5).toFixed(2),x,h-26);
 }
 c.textAlign='right';
 for(let i=0;i<=4;i++){
   const val=max-(2*max*i/4),y=pad.t+(h-pad.t-pad.b)*i/4;
   c.strokeStyle=st.grid;c.beginPath();c.moveTo(pad.l,y);c.lineTo(w-pad.r,y);c.stroke();
   c.fillText(val.toFixed(2),pad.l-7,y+3);
 }
 const mid=(h-pad.b+pad.t)/2;
 c.strokeStyle=st.axis;c.lineWidth=1;c.beginPath();c.moveTo(pad.l,mid);c.lineTo(w-pad.r,mid);c.stroke();
 c.strokeStyle=st.line;c.lineWidth=1.8;c.beginPath();
 data.forEach((v,i)=>{const x=pad.l+(w-pad.l-pad.r)*i/(data.length-1),y=mid-(v/max)*(h-pad.b-pad.t)*.43;i?c.lineTo(x,y):c.moveTo(x,y)});c.stroke();
 c.fillStyle=st.text;c.textAlign='left';c.font='10px system-ui';c.fillText(label,pad.l,15); if(id==='fmPlot'){c.textAlign='right';c.fillText(`fc = ${fmState.fc} Hz   |   Δf = ${fmState.dev} Hz`,w-pad.r,15);} if(id==='wFmPlot'){c.textAlign='right';c.fillText('fc = 6000 Hz   |   Δf = '+$('wDev').value+' Hz',w-pad.r,15);}
 c.save();c.translate(15,h/2);c.rotate(-Math.PI/2);c.textAlign='center';c.fillText('Amplitude',0,0);c.restore();
 c.textAlign='center';c.fillText('Time (s)',pad.l+(w-pad.l-pad.r)/2,h-8);
}
function drawSpectrum(id,sp){
 const canvas=$(id);if(!canvas||!sp||!sp.f.length)return;
 const {c,w,h}=setupCanvas(canvas),st=styleFor(),dark=document.body.classList.contains('dark');
 c.clearRect(0,0,w,h);c.fillStyle=dark?'#070d17':'#fbfdff';c.fillRect(0,0,w,h);
 const pad={l:62,r:20,t:28,b:50};
 const markerFc=id==='fftPlot'?fmState.fc:(id==='wFmFFT'?6000:null);
 const markerFm=id==='fftPlot'?fmState.fm:null;
 const markerBw=id==='fftPlot'?fmState.bw:5000;
 const maxF=Math.max(1,Math.min(sp.f[sp.f.length-1],(markerFc||fmState.fc)+markerBw*1.7));
 const vals=sp.f.map((f,i)=>({f,m:sp.m[i]})).filter(o=>o.f<=maxF);const maxM=Math.max(.0001,...vals.map(o=>o.m));
 c.font='10px system-ui';c.fillStyle=st.text;c.textAlign='center';
 for(let i=0;i<=5;i++){const f=maxF*i/5,x=pad.l+(w-pad.l-pad.r)*i/5;c.strokeStyle=st.grid;c.beginPath();c.moveTo(x,pad.t);c.lineTo(x,h-pad.b);c.stroke();c.fillText(`${f.toFixed(0)} Hz`,x,h-26)}
 c.textAlign='right';for(let i=0;i<=4;i++){const m=maxM*(1-i/4),y=pad.t+(h-pad.t-pad.b)*i/4;c.strokeStyle=st.grid;c.beginPath();c.moveTo(pad.l,y);c.lineTo(w-pad.r,y);c.stroke();c.fillText(m.toFixed(2),pad.l-7,y+3)}
 c.strokeStyle=st.line2;c.lineWidth=1.7;c.beginPath();vals.forEach((o,i)=>{const x=pad.l+(w-pad.l-pad.r)*o.f/maxF,y=h-pad.b-(o.m/maxM)*(h-pad.b-pad.t)*.9;i?c.lineTo(x,y):c.moveTo(x,y)});c.stroke();
 if(markerFc){
   const markers=[{f:markerFc,label:'fc',color:dark?'#62ddff':'#6556c9'}];
   if(markerFm) markers.unshift({f:Math.max(0,markerFc-markerFm),label:'fc−fm',color:dark?'#a98aff':'#bd5c92'}),markers.push({f:markerFc+markerFm,label:'fc+fm',color:dark?'#a98aff':'#bd5c92'});
   markers.forEach(m=>{if(m.f<0||m.f>maxF)return;const x=pad.l+(w-pad.l-pad.r)*m.f/maxF;c.save();c.setLineDash([5,4]);c.strokeStyle=m.color;c.lineWidth=1.4;c.beginPath();c.moveTo(x,pad.t);c.lineTo(x,h-pad.b);c.stroke();c.setLineDash([]);c.fillStyle=m.color;c.font='bold 9px system-ui';c.textAlign='center';c.fillText(m.label+' '+m.f.toFixed(0)+' Hz',x,pad.t+12);c.restore();});
 }
 c.fillStyle=st.text;c.textAlign='left';c.font='10px system-ui';c.fillText('Magnitude |X(f)|',pad.l,15);
 c.save();c.translate(15,h/2);c.rotate(-Math.PI/2);c.textAlign='center';c.fillText('Magnitude',0,0);c.restore();c.textAlign='center';c.fillText('Frequency (Hz)',pad.l+(w-pad.l-pad.r)/2,h-8);
}
function drawAll(){drawLine('msgPlot',fmState.msg,'amplitude');drawLine('carrierPlot',fmState.carrier,'amplitude');drawLine('fmPlot',fmState.fmSig,'FM amplitude');drawLine('receivedPlot',fmState.received,'received');drawSpectrum('fftPlot',fmState.spectrum);if(walkie.samples)processWalkie();}

function fftMagnitude(arr,duration){const N=Math.min(2048,2**Math.floor(Math.log2(arr.length)));const re=new Float64Array(N),im=new Float64Array(N);for(let i=0;i<N;i++){const v=arr[i]||0;const win=.5-.5*Math.cos(2*Math.PI*i/(N-1));re[i]=v*win;}fft(re,im);const fs=N/duration;const f=[],m=[];for(let k=0;k<N/2;k++){f.push(k*fs/N);m.push(2*Math.hypot(re[k],im[k])/N);}return{f,m};}
function fft(re,im){const n=re.length;for(let i=1,j=0;i<n;i++){let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){[re[i],re[j]]=[re[j],re[i]];[im[i],im[j]]=[im[j],im[i]];}}for(let len=2;len<=n;len<<=1){const ang=-2*Math.PI/len,wr=Math.cos(ang),wi=Math.sin(ang);for(let i=0;i<n;i+=len){let ur=1,ui=0;for(let j=0;j<len/2;j++){const p=i+j,q=p+len/2;const tr=ur*re[q]-ui*im[q],ti=ur*im[q]+ui*re[q];re[q]=re[p]-tr;im[q]=im[p]-ti;re[p]+=tr;im[p]+=ti;const nr=ur*wr-ui*wi;ui=ur*wi+ui*wr;ur=nr;}}}}


// ===== FULLSCREEN CONTROLS =====
function toggleFullscreen(el){
  // Site fullscreen: fullscreen the document root WITHOUT applying the graph-panel
  // fixed-position class. Applying that class to <html> prevents normal page scrolling.
  if(el === document.documentElement){
    if(document.fullscreenElement){
      document.exitFullscreen().catch(()=>{});
    } else if(document.documentElement.requestFullscreen){
      document.documentElement.requestFullscreen().catch(()=>{});
    }
    return;
  }
  // Individual graph fullscreen: keep it as a scrollable presentation panel.
  if(document.fullscreenElement){
    document.exitFullscreen().catch(()=>{});
    el.classList.remove('is-fullscreen-target');
  } else if(el.requestFullscreen){
    el.classList.add('is-fullscreen-target');
    el.requestFullscreen().catch(()=>el.classList.remove('is-fullscreen-target'));
  }
}
document.addEventListener('fullscreenchange',()=>{
  if(!document.fullscreenElement){
    document.querySelectorAll('.is-fullscreen-target').forEach(el=>el.classList.remove('is-fullscreen-target'));
  }
});
const siteFullscreen=$('siteFullscreen');
if(siteFullscreen)siteFullscreen.addEventListener('click',()=>toggleFullscreen(document.documentElement));
// Give every plot a presentation/fullscreen button.
document.querySelectorAll('.plot-card').forEach(card=>{
  const head=card.querySelector('div');
  if(!head || card.querySelector('.plot-fullscreen-btn')) return;
  const btn=document.createElement('button');btn.className='plot-fullscreen-btn';btn.type='button';btn.textContent='⛶';btn.title='Open graph full screen';
  btn.addEventListener('click',e=>{e.stopPropagation();toggleFullscreen(card);});head.appendChild(btn);
});
const enterWalkie=$('enterWalkie');
if(enterWalkie)enterWalkie.addEventListener('click',()=>{document.body.classList.add('walkie-entered');const v=$('walkie');if(v)v.scrollIntoView({behavior:'smooth',block:'start'});});
// Every time the Walkie-Talkie module is opened, show its cinematic intro first.
document.querySelectorAll('.side-link[data-view="walkie"], [data-jump="walkie"]').forEach(btn=>btn.addEventListener('click',()=>{document.body.classList.remove('walkie-entered');}));

const quiz=[
 ['What parameter is varied in ideal FM?',['Carrier amplitude','Instantaneous frequency','Resistor value','Sampling rate'],1],
 ['The FM modulation index for a single-tone message is:', ['Δf × f_m','f_c / f_m','Δf / f_m','f_m / Δf'],2],
 ['Carson’s approximate FM bandwidth is:', ['2(Δf + f_m)','2f_c','Δf/f_m','f_c + f_m'],0],
 ['What does an FFT provide?',['Time delay only','Frequency-domain information','Only amplitude gain','DC voltage'],1],
 ['In the walkie-talkie chain, the channel is between:', ['Audio and microphone','FM modulation and demodulation','Speaker and display','FFT and browser'],1],
 ['Attenuation mainly changes the received signal’s:', ['Amplitude','Carrier identity','Number of microphones','File format'],0]
];
function buildQuiz(){const box=$('quizBox');box.innerHTML=quiz.map((q,i)=>`<div class="quiz-q"><h3>${i+1}. ${q[0]}</h3>${q[1].map((a,j)=>`<label><input type="radio" name="q${i}" value="${j}"> ${a}</label>`).join('')}</div>`).join('')+`<button id="checkQuiz" class="primary quiz-submit">Submit answers</button><div id="quizScore"></div>`;$('checkQuiz').addEventListener('click',()=>{let score=0;quiz.forEach((q,i)=>{const a=document.querySelector(`input[name=q${i}]:checked`);if(a&&+a.value===q[2])score++;});$('quizScore').className='score-box';$('quizScore').textContent=`Score: ${score}/${quiz.length}. ${score===quiz.length?'Excellent — you have a strong grasp of the FM chain.':'Review the theory and try the experiment again.'}`;});}
buildQuiz();

// WALKIE-TALKIE
function makeDemoAudio(){const sr=16000,dur=2.5,n=Math.floor(sr*dur),x=new Float32Array(n);for(let i=0;i<n;i++){const t=i/sr;const env=Math.min(1,t/.12,(dur-t)/.25);x[i]=env*(.65*Math.sin(2*Math.PI*180*t)+.25*Math.sin(2*Math.PI*310*t)+.12*Math.sin(2*Math.PI*520*t))*(.78+.22*Math.sin(2*Math.PI*2*t));}walkie={samples:x,sr,duration:dur};$('radioStatus').textContent='Demo voice-like signal ready';$('radioMessage').textContent='Demo audio loaded. Press and hold PTT to simulate transmission.';processWalkie();}
async function loadAudio(file){if(!file)return;$('radioStatus').textContent='Decoding audio…';try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error('Web Audio unavailable');const ctx=new AC();const buf=await ctx.decodeAudioData(await file.arrayBuffer());const src=buf.getChannelData(0),target=16000,maxSec=4,n=Math.min(src.length,Math.floor(buf.sampleRate*maxSec));const outLen=Math.min(target*maxSec,Math.max(2048,Math.floor(n*target/buf.sampleRate)));const out=new Float32Array(outLen);for(let i=0;i<outLen;i++){const pos=i*(n-1)/(outLen-1),a=Math.floor(pos),b=Math.min(a+1,n-1),f=pos-a;out[i]=src[a]*(1-f)+src[b]*f;}walkie={samples:out,sr:target,duration:out.length/target};$('radioStatus').textContent='Audio loaded';$('radioMessage').textContent=`${file.name} • ${(walkie.duration).toFixed(2)} s • processed locally`;processWalkie();}catch(e){$('radioStatus').textContent='Audio decode failed';$('radioMessage').textContent='Try WAV, MP3 or OGG.';}}
function processWalkie(){if(!walkie.samples)return;const x=walkie.samples,sr=walkie.sr,dev=+$('wDev').value,noise=+$('wNoise').value/100,att=1-+$('wAtt').value/100,fc=6000;const maxN=24000,step=Math.max(1,Math.floor(x.length/maxN)),base=[];for(let i=0;i<Math.min(maxN,Math.floor(x.length/step));i++)base.push(x[Math.min(x.length-1,i*step)]);const fs=sr/step,dt=1/fs;let phase=0;const fm=[],ch=[],rec=[];for(let i=0;i<base.length;i++){const v=base[i];phase+=2*Math.PI*(fc+dev*v)*dt;const s=Math.cos(phase),n=(Math.random()*2-1)*noise*.55;fm.push(s);ch.push(att*s+n);}const win=Math.max(3,Math.floor(fs/1800)),I=[],Q=[];let si=0,sq=0;for(let i=0;i<ch.length;i++){const t=i*dt,cc=Math.cos(2*Math.PI*fc*t),ss=Math.sin(2*Math.PI*fc*t);si+=ch[i]*cc;sq+=ch[i]*ss;if(i>=win){const tt=(i-win)*dt;si-=ch[i-win]*Math.cos(2*Math.PI*fc*tt);sq-=ch[i-win]*Math.sin(2*Math.PI*fc*tt);}I.push(si/win);Q.push(sq/win);}let prev=0;for(let i=0;i<I.length;i++){let ph=Math.atan2(Q[i],I[i]),d=ph-prev;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;prev=ph;rec.push(Math.max(-1,Math.min(1,d/(2*Math.PI*dev*dt))));}drawLine('wAudioPlot',base,'audio amplitude');drawLine('wFmPlot',fm,'FM amplitude');drawLine('wChanPlot',ch,'received');drawLine('wRecPlot',rec,'recovered');drawSpectrum('wAudioFFT',fftMagnitude(base,base.length/fs));drawSpectrum('wFmFFT',fftMagnitude(fm,base.length/fs));}
function setRadio(tx){$('radioMode').textContent=tx?'TX':'RX';$('txLed').classList.toggle('on',tx);$('rxLed').classList.toggle('on',!tx);$('radioLevel').textContent=tx?'TX LIVE':'READY';$('radioStatus').textContent=tx?'Transmitting':'Receiving';$('radioMessage').textContent=tx?'TRANSMITTING • Audio → FM → Channel':'RECEIVING • Channel → Demodulator → Audio';const stage=$('walkieVisual');if(stage){stage.classList.toggle('transmitting',tx);$('linkStatusText').textContent=tx?'TRANSMITTING • FM LINK':'RECEIVER READY';}if(tx)processWalkie();}
$('audioFile').addEventListener('change',e=>loadAudio(e.target.files[0]));$('demoAudio').addEventListener('click',makeDemoAudio);['wNoise','wAtt','wDev'].forEach((id)=>$(id).addEventListener('input',()=>{const map={wNoise:['wNoiseOut','%'],wAtt:['wAttOut','%'],wDev:['wDevOut',' Hz']};$(map[id][0]).textContent=$(id).value+map[id][1];processWalkie();}));
$('ptt').addEventListener('mousedown',()=>setRadio(true));$('ptt').addEventListener('mouseup',()=>setRadio(false));$('ptt').addEventListener('mouseleave',()=>setRadio(false));$('ptt').addEventListener('touchstart',e=>{e.preventDefault();setRadio(true)});$('ptt').addEventListener('touchend',()=>setRadio(false));$('radioCh').addEventListener('change',e=>$('radioChannel').textContent=e.target.value.split('•')[0].trim());
['wNoise','wAtt','wDev'].forEach((id)=>{const map={wNoise:['wNoiseOut','%'],wAtt:['wAttOut','%'],wDev:['wDevOut',' Hz']};$(map[id][0]).textContent=$(id).value+map[id][1];});


const presentationBtn=$('presentationBtn');
if(presentationBtn)presentationBtn.addEventListener('click',()=>{document.body.classList.toggle('presentation-mode');presentationBtn.textContent=document.body.classList.contains('presentation-mode')?'▣':'▣';});
const presentationViva=$('presentationViva');
if(presentationViva)presentationViva.addEventListener('click',()=>{document.body.classList.toggle('presentation-mode');document.querySelector('[data-view="viva"]')?.click();});
const randomViva=$('randomViva');
if(randomViva)randomViva.addEventListener('click',()=>{quiz.sort(()=>Math.random()-.5);buildQuiz();});

const storySteps=[
 ['MICROPHONE','The microphone converts your voice into the electrical message signal m(t).'],
 ['FM MODULATOR','The message controls the instantaneous frequency of the carrier.'],
 ['RF CHANNEL','The FM waveform crosses the wireless channel, where noise and attenuation may act on it.'],
 ['DEMODULATOR','The receiver estimates the instantaneous frequency and reconstructs the message.'],
 ['SPEAKER','The recovered signal represents the audio that the receiver would reproduce.']
];
let storyIndex=0;
function cycleStory(){const step=storySteps[storyIndex%storySteps.length];if($('txStoryStep'))$('txStoryStep').textContent=step[0];if($('txStoryText'))$('txStoryText').textContent=step[1];storyIndex++;}
cycleStory();setInterval(cycleStory,2300);

window.addEventListener('resize',()=>drawAll());
runFM(false);makeDemoAudio();
