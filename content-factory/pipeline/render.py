"""Agent 5 — Editor (STAGE 2, scaffolded). Script -> faceless vertical mp4.

Free stack, all assembled with ffmpeg:
  voiceover  : edge-tts (Microsoft neural voices, free, no key)
  visuals    : Pexels / Pixabay stock b-roll (free API key) or Pollinations images
  captions   : Whisper transcribes the voiceover -> burned-in .srt
  assembly   : ffmpeg overlays captions on visuals, muxes the voiceover

This is intentionally a stub with the real command shape documented so turning
it on is a fill-in-the-blanks job, not a redesign. Until then the pipeline
queues text-only cards you can still review.
"""
from __future__ import annotations


def render(card: dict) -> str | None:
    """Render a card to an mp4 and return its path, or None if not enabled.

    To enable:
      1) pip install edge-tts openai-whisper requests  (+ install ffmpeg)
      2) set PEXELS_API_KEY (free at pexels.com/api)
      3) implement the four steps below.
    """
    raise NotImplementedError(
        "Editor (Stage 2) not enabled yet. Sketch:\n"
        "  1. tts: `edge-tts --text <body> --write-media vo.mp3`\n"
        "  2. broll: GET https://api.pexels.com/videos/search?query=<keyword>\n"
        "  3. captions: whisper vo.mp3 --output_format srt\n"
        "  4. ffmpeg -i broll.mp4 -i vo.mp3 -vf subtitles=cap.srt "
        "-shortest -aspect 9:16 out.mp4"
    )
