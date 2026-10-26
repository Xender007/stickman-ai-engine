#!/bin/bash
cd /d/stickman-story
FF="/c/Users/supro/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/ffmpeg.exe"
until [ -f out/store-final/ch1.mp4 ]; do sleep 5; done
for n in 2 3 4 5 6; do
  (cd clips/store-ch$n && npx hyperframes render --fps 30 --browser-gpu --quality looks -o ../../out/store-final/ch$n.mp4 > ../../scratch/render-ch$n.log 2>&1)
  echo "ch$n rendered"
done
cd out/store-final
: > list.txt; for n in 1 2 3 4 5 6; do echo "file 'ch$n.mp4'" >> list.txt; done
"$FF" -y -f concat -safe 0 -i list.txt -c copy dead-hours-full.mp4
echo FINISHED
