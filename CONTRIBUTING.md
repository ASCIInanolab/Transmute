# Contributing to Transmute

We love your input! We want to make contributing to Transmute as easy and transparent as possible.

## Prerequisites

Before you start, ensure you have the following installed:

1.  **Node.js**: v18 or newer
2.  **Rust**: Stable release (via `rustup`)
3.  **OS Prerequisites**: Build tools for your platform (e.g., `build-essential` on Linux, Xcode on macOS).

## ⚠️ Critical: FFmpeg Sidecar Setup

Transmute relies on `ffmpeg` binary sidecars. You **MUST** manually download and place the correct binary for your system to run the app in development or build it.

1.  **Download FFmpeg**: Get the static build for your OS (e.g., from [ffmpeg.org](https://ffmpeg.org/download.html)).
2.  **Rename**: Rename the executable to match the Tauri sidecar convention:
    *   **Windows**: `ffmpeg-x86_64-pc-windows-msvc.exe`
    *   **Linux**: `ffmpeg-x86_64-unknown-linux-gnu`
    *   **macOS (Intel)**: `ffmpeg-x86_64-apple-darwin`
    *   **macOS (Silicon)**: `ffmpeg-aarch64-apple-darwin`
3.  **Place**: Move the renamed file into:
    ```
    src-tauri/bin/
    ```
    *(Create the `bin` folder if it doesn't exist)*

**Note**: The repository ignores `src-tauri/bin/` to avoid checking in large binaries. You must perform this step yourself.

## Code Style

-   **TypeScript**: We use Prettier. Run `npm run format` (if script exists) or let your IDE handle it.
-   **Rust**: We use `rustfmt`. Run `cargo fmt` in `src-tauri/`.
-   **Structure**: Keep components small and focused. Use the `src/components/ui` folder for reusable generic components.

## Submitting Changes

1.  Fork the repo and create your branch from `main`.
2.  Test your changes!
3.  Ensure the app builds: `npm run tauri build`.
4.  Submit a Pull Request.

## License

By contributing, you agree that your contributions will be licensed under its MIT License.
