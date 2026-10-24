"""Regenerate the four UI sound effects into engine/static/sfx (they are already shipped)."""
import numpy as np, soundfile as sf
from pathlib import Path
OUT = Path(__file__).resolve().parents[1] / 'engine/static/sfx'
sr=48000; rng=np.random.default_rng(7)
def env(n,a,d):  # attack, exp decay
    t=np.arange(n)/sr; e=np.minimum(1,t/a)*np.exp(-t/d); return e
def save(name,x,peak):
    x=x/np.max(np.abs(x))*10**(peak/20); sf.write(OUT / f'{name}.wav',np.stack([x,x],1),sr,subtype='PCM_24')
def verb(x,decays=(0.045,0.083,0.131,0.197),g=0.32):
    y=x.copy()
    for i,dl in enumerate(decays):
        k=int(dl*sr); y[k:]+=x[:-k]*(g**(i+1))
    return y
# notification: soft two-note glass ding
n=int(0.7*sr); t=np.arange(n)/sr
d1=np.sin(2*np.pi*1318.5*t)*env(n,0.004,0.16)
t2=np.clip(t-0.07,0,None); d2=np.sin(2*np.pi*1975.5*t2)*env(n,0.004,0.20)*(t>0.07)
x=d1*0.8+d2*0.6+0.15*np.sin(2*np.pi*2637*t)*env(n,0.002,0.05)
save('notify',verb(x),-6)
# click: tiny tick
n=int(0.08*sr); t=np.arange(n)/sr
x=rng.standard_normal(n)*env(n,0.0003,0.004)+0.6*np.sin(2*np.pi*2400*t)*env(n,0.0005,0.012)
save('click',x,-6)
# whoosh: band-passed noise swell
n=int(0.55*sr); t=np.arange(n)/sr
noise=rng.standard_normal(n)
from numpy.fft import rfft,irfft,rfftfreq
# time-varying filter via overlapping frames
out=np.zeros(n); win=2048; hop=512; w=np.hanning(win)
for s in range(0,n-win,hop):
    seg=noise[s:s+win]*w; F=rfft(seg); f=rfftfreq(win,1/sr)
    c=600+2600*(s/n); bw=c*0.9
    F*=np.exp(-((f-c)/bw)**2); out[s:s+win]+=irfft(F)*w
shape=np.sin(np.pi*np.clip(t/0.55,0,1))**2.2
save('whoosh',out*shape,-6)
# end accent: soft shimmer chord
n=int(2.2*sr); t=np.arange(n)/sr
x=sum(a*np.sin(2*np.pi*f*t)*env(n,0.02,0.7) for f,a in [(1046.5,0.5),(1318.5,0.4),(1568,0.35),(2093,0.2)])
x+=0.25*np.sin(2*np.pi*523.25*t)*env(n,0.03,0.9)
save('accent',verb(x,(0.06,0.11,0.17,0.25,0.34),0.4),-6)
print('ok')
