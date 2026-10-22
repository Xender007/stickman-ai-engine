#!/bin/sh
# Synthesized placeholder sounds for scripted stories (ffmpeg only). Replace any with a library sound of the same name.
set -e
cd "$(dirname "$0")/../public/sfx"
mk() { ffmpeg -v error -y "$@" -ar 44100 -ac 1; }
# Radio static: band-limited crackle with a fast irregular flutter (loops).
mk -f lavfi -i "anoisesrc=d=3:c=white:a=0.5" -af "highpass=f=700,lowpass=f=5200,tremolo=f=13:d=0.8,tremolo=f=3.1:d=0.4,volume=0.7" static.wav
# Window glass hum before the quake (loops).
mk -f lavfi -i "sine=f=118:d=3" -f lavfi -i "sine=f=236:d=3" -filter_complex "amix=inputs=2,tremolo=f=9:d=0.6,volume=0.9" hum.wav
# Steel creak: wobbling low tone with grain, decaying.
mk -f lavfi -i "aevalsrc=0.6*sin(2*PI*(150+70*sin(2*PI*2.3*t))*t)*exp(-0.9*t):d=2.2" -af "tremolo=f=34:d=0.9,lowpass=f=1400,volume=1.4" creak.wav
# Boot on stone: short filtered thump.
mk -f lavfi -i "anoisesrc=d=0.25:c=brown:a=0.9" -af "lowpass=f=900,afade=t=out:st=0.02:d=0.2,volume=2" step.wav
# Tape/button click and the lamp shutter.
mk -f lavfi -i "aevalsrc=0.8*sin(2*PI*1700*t)*exp(-70*t):d=0.08" click.wav
mk -f lavfi -i "aevalsrc=0.7*sin(2*PI*700*t)*exp(-45*t)+0.3*sin(2*PI*2400*t)*exp(-90*t):d=0.1" shutter.wav
# Moving water below (loops): brown noise with a slow swell.
mk -f lavfi -i "anoisesrc=d=4:c=brown:a=0.6" -af "lowpass=f=650,tremolo=f=0.45:d=0.5,volume=1.2" water.wav
echo "story sfx written"
# Helicopter: rotor thump (18 beats/s) over a low engine rumble (loops).
mk -f lavfi -i "aevalsrc=0.55*sin(2*PI*62*t)*(0.35+0.65*abs(sin(2*PI*9*t))):d=4" -f lavfi -i "anoisesrc=d=4:c=brown:a=0.4" -filter_complex "[1]lowpass=f=400[n];[0][n]amix=inputs=2,volume=1.6" heli.wav
echo "heli written"
