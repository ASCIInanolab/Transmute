# Transmute

**The Premium Local Media Converter.**
Open Source. Private. Blazing Fast.

![Transmute Banner](https://placehold.co/1200x600/0f172a/ffffff?text=Transmute+Preview)

## Features

- **Local First**: Files never leave your device. Powered by FFmpeg.
- **Privacy Focused**: No clouds, no tracking, complete safety.
- **Universal Support**: Convert Video, Audio, & Images with ease.
- **Batch Processing**: Drag & Drop multiple files and convert them all at once.
- **Premium Design**: A "Mac-like" deep dark mode aesthetic with fluid animations.

## Supported Formats

| Category | Formats |
|----------|---------|
| **Video** | `MP4` `MKV` `AVI` `MOV` `WEBM` `GIF` `FLV` `WMV` `3GP` `MPG` `VOB` `TS` `M2TS` |
| **Audio** | `MP3` `WAV` `FLAC` `M4A` `AAC` `OGG` `WMA` `AIFF` `ALAC` `OPUS` |
| **Image** | `PNG` `JPG` `WEBP` `AVIF` `BMP` `TIFF` `ICO` `TGA` |

## Development

This project is built with **Tauri v2**, **Rust**, and **React**.

### Prerequisites

1.  **Node.js** & **Rust** installed.
2.  **FFmpeg**: 
    -   Download the standalone executable for your OS.
    -   Place it in `src-tauri/bin/ffmpeg-<target-triple>`.
    -   *Example*: On Linux, rename `ffmpeg` to `ffmpeg-x86_64-unknown-linux-gnu`.

### Run
```bash
npm install
npm run tauri dev
```

## Contributing

We welcome contributions! Please check [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## License

MIT License. Free forever.

## Tech Stack

- **Core**: Tauri v2 (Rust)
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Conversion Engine**: FFmpeg

## License

This project is licensed under the MIT License.
