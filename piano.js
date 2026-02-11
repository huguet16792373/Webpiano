const canvas = document.getElementById("canvasArea");
const timbreSelecter= document.getElementById("timbre");
const toneDisplay=document.getElementById("toneDisplay");
let ctx=null;

let audioCtx=null;
let masterGain=null;
let timbre=null;
function getAudioCtx(){
  if(!audioCtx){
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    audioCtx = new AudioCtx();

    masterGain=audioCtx.createGain();
    masterGain.gain.value=1;
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

const wkeys=[];
const bkeys=[];
let isMouseDown=false;
let currentKey=null;
const wkeyWidth=50;
const wkeyHeight=100;
const bkeyWidth=25;
const bkeyHeight=60;

const A4=440;
const noteNames=[
  "A","A#","B","C","C#","D",
  "D#","E","F","F#","G","G#"
]

class keyObject{
  constructor(x,y,c,semitone){
    this.x=x;
    this.y=y;
    this.c=c;
    this.semitone=semitone;
    this.freq=A4*Math.pow(2,semitone/12);
    this.status="inactive";
  }
  get width(){return this.c===0?wkeyWidth:bkeyWidth};
  get height(){return this.c===0?wkeyHeight:bkeyHeight};
  draw(){
    if(this.c===0){
      switch(this.status){
        case "inactive":
          ctx.fillStyle="white";
          break;
        case "active":
          ctx.fillStyle="red";
          break;
        case "hovered":
          ctx.fillStyle="gray";
          break;
      }
      ctx.fillRect(this.x,this.y,wkeyWidth,wkeyHeight);
      ctx.strokeRect(this.x,this.y,wkeyWidth,wkeyHeight);
      
    }
    else {
      switch(this.status){
        case "inactive":
          ctx.fillStyle="black";
          break;
        case "active":
          ctx.fillStyle="red";
          break;
        case "hovered":
          ctx.fillStyle="gray";
          break;
      }
      ctx.fillRect(this.x,this.y,bkeyWidth,bkeyHeight)
    }
  };
    testHit(point){
    return (
      point.x >= this.x && point.x <= this.x + this.width
      &&
      point.y >= this.y && point.y <= this.y + this.height
    );
  }

  startSound(){
  const ctx = getAudioCtx();
  if(ctx.state === "suspended"){
    ctx.resume();
  }
  if(this.osc) return;

  const now=ctx.currentTime;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = timbre;
  osc.frequency.value = this.freq;

  osc.connect(gain);
  gain.connect(masterGain);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(1, now + 0.1);
  gain.gain.linearRampToValueAtTime(0.7, now + 0.3);
  gain.gain.linearRampToValueAtTime(0, now + 1.0);


  osc.start();
  this.osc = osc;
  this.gain = gain;
}

stopSound(){
  if(!this.osc) return;

  this.gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioCtx.currentTime + 0.05
  );
  this.osc.stop(audioCtx.currentTime + 0.05);
  this.osc = null;
}

semitoneToNote(){
  const index=((this.semitone%12)+12)%12;
  const oct=4+Math.floor((this.semitone+9)/12);
  return noteNames[index]+oct;
}

}
function findKeyAt(point){
  for(const key of bkeys){
    if(key.testHit(point))return key;
  }
  for(const key of wkeys){
    if(key.testHit(point))return key;
  }
  return null;
}
function playnote(freq,duration=0.5){
  const osc=audioCtx.createOscillator();
  const gain =audioCtx.createGain();

  osc.type=timbre;
  osc.frequency.value=freq;

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start();
  gain.gain.setValueAtTime(1,audioCtx.currentTime);
   gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioCtx.currentTime + duration
  );
  osc.stop(audioCtx.currentTime + duration);
}
function init(){
if (canvas.getContext){
  canvas.width=1600;
    canvas.height=200;
    ctx = canvas.getContext("2d");
}
getAudioCtx();
timbre=timbreSelecter.value;
const whiteSemitone=[-9,-7,-5,-4,-2,0,2];
for(let i=0;i<21;i++){
  const octave =Math.floor(i/7);
  const s=whiteSemitone[i%7]+octave*12;
  wkeys.push(new keyObject(50+50*i,50,0,s));
}
for(let i=0;i<3;i++){
  const blackSemitone=[-8,-6,-3,-1,1];
  bkeys.push(new keyObject(175/2+50*7*i,50,1,blackSemitone[0]+i*12));
  bkeys.push(new keyObject(175/2+50+50*7*i,50,1,blackSemitone[1]+i*12));
  bkeys.push(new keyObject(475/2+50*7*i,50,1,blackSemitone[2]+i*12));
  bkeys.push(new keyObject(475/2+50+50*7*i,50,1,blackSemitone[3]+i*12));
  bkeys.push(new keyObject(475/2+100+50*7*i,50,1,blackSemitone[4]+i*12));
}
for(let key of wkeys)key.draw();
for(let key of bkeys)key.draw();
}
function redraw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(let key of wkeys)key.draw();
  for(let key of bkeys)key.draw();
}
init();
canvas.addEventListener("mousedown",(e)=>{
  isMouseDown=true;
  const rect=canvas.getBoundingClientRect();

  const point={
    x:e.clientX-rect.left,
    y:e.clientY-rect.top
  };
  [...wkeys, ...bkeys].forEach(k => k.status = "inactive");
  const key=findKeyAt(point);
  if(!key)return;
  toneDisplay.textContent=key.semitoneToNote();
  currentKey=key;
  key.status="active";
  key.startSound();
  redraw();
});
window.addEventListener("mouseup",(e)=>{
  isMouseDown=false;
  if(currentKey){
    currentKey.stopSound();
    currentKey.status="inactive";
    currentKey=null;
    }
    redraw();
  });

canvas.addEventListener("mousemove",(e)=>{
  const rect=canvas.getBoundingClientRect();

  const point={
    x:e.clientX-rect.left,
    y:e.clientY-rect.top
  };
  const key =findKeyAt(point);
if(!isMouseDown){
  [...wkeys, ...bkeys].forEach(k => {
    if(k.status === "hovered") k.status = "inactive";
  });
  if(key&&key.status!=="active"){
      key.status="hovered";
    }
    redraw();
    return;
  }

  if(key !==currentKey){
    if(currentKey){
      currentKey.stopSound();
      currentKey.status="inactive";
    }  
    if(key){
      toneDisplay.textContent=key.semitoneToNote();
      key.startSound();
      key.status="active";
    }
  currentKey=key;
  redraw();
  }
})
canvas.addEventListener("mouseleave", ()=>{
  if(isMouseDown&&currentKey){
    currentKey.stopSound();
    currentKey.status="inactive";
    currentKey=null;
  }
  isMouseDown=false;
  redraw();
});

document.getElementById("mastervolume").addEventListener("input",e=>{masterGain.gain.value=e.target.value;});
timbreSelecter.addEventListener("change",e=>{timbre=e.target.value;});

