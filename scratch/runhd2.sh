#!/bin/bash
export TEMP="D:\tmp" TMP="D:\tmp" TMPDIR="D:\tmp" HYPERFRAMES_EXTRACT_CACHE_DIR="D:\tmp\hfcache"
cd /d/stickman-story
FF="/c/Users/supro/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/ffmpeg.exe"
for n in 2 3 4 5 6; do
  npx tsx clips/wide/build.mts $n || { echo "BUILD FAIL $n"; exit 1; }
  (cd clips/w-ch$n && npx hyperframes render --fps 30 --browser-gpu --gpu --workers 8 --quality delivery -o ../../out/store-hd/ch$n.mp4 > ../../scratch/hdrender-ch$n.log 2>&1)
  echo "ch$n rendered"
done
cd out/store-hd
: > list.txt; for n in 1 2 3 4 5 6; do echo "file 'ch$n.mp4'" >> list.txt; done
"$FF" -y -f concat -safe 0 -i list.txt -c copy oakline-after-dark-1080p.mp4 2>/dev/null
echo FINISHED
