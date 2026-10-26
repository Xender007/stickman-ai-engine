#!/bin/bash
cd /d/stickman-story
FF="/c/Users/supro/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/ffmpeg.exe"
for n in 1 2 3 4 5 6; do
  until grep -q "done: chapter $n " scratch/narr4.log; do sleep 5; done
  npx tsx clips/wide/score.mts $n && npx tsx clips/wide/build.mts $n || { echo "BUILD FAIL $n"; exit 1; }
  (cd clips/w-ch$n && npx hyperframes render --fps 30 --browser-gpu --gpu --workers 5 --quality looks -o ../../out/store-wide/ch$n.mp4 > ../../scratch/wrender-ch$n.log 2>&1)
  echo "ch$n rendered"
done
cd out/store-wide
: > list.txt; for n in 1 2 3 4 5 6; do echo "file 'ch$n.mp4'" >> list.txt; done
"$FF" -y -f concat -safe 0 -i list.txt -c copy oakline-after-dark-16x9.mp4 2>/dev/null
echo FINISHED
