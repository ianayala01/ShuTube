#!/bin/bash

# Change to the directory containing the MP4 files
#cd /path/to/your/videos

# Loop through all .mp4 files in the directory
for video in *.mp4; do
  # Extract subtitles and save them as <video_name>.vtt
  ffmpeg -i "$video" -map 0:s:0 "${video%.mp4}.vtt"
done
