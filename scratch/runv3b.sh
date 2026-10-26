#!/bin/bash
cd /d/stickman-story
FF="/c/Users/supro/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/ffmpeg.exe"
until [ -f out/store-v3/ch3.mp4 ]; do sleep 3; done
sleep 5
for n in 4 5 6; do
  (cd clips/v3-ch$n && npx hyperframes render --fps 30 --browser-gpu --gpu --workers 6 --quality looks -o ../../out/store-v3/ch$n.mp4 > ../../scratch/v3render-ch$n.log 2>&1)
  echo "ch$n rendered"
done
cd out/store-v3
: > list.txt; for n in 1 2 3 4 5 6; do echo "file 'ch$n.mp4'" >> list.txt; done
"$FF" -y -f concat -safe 0 -i list.txt -c copy oakline-after-dark-full.mp4
echo FINISHED
