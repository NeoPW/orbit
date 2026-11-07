#!/usr/bin/env sh
# Runs `tauri android <args>` with the Android SDK and the newest NDK from ~/Android/Sdk
# and a JDK with javac, unless ANDROID_HOME / NDK_HOME / JAVA_HOME are already set.
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
if [ -z "$NDK_HOME" ]; then
  NDK_HOME="$(ls -d "$ANDROID_HOME"/ndk/* 2>/dev/null | sort -V | tail -1)"
  export NDK_HOME
fi
# Gradle needs a full JDK (javac); fall back to the one bundled with Android Studio.
if [ -z "$JAVA_HOME" ] || [ ! -x "$JAVA_HOME/bin/javac" ]; then
  if [ -x "$HOME/android-studio/jbr/bin/javac" ]; then
    export JAVA_HOME="$HOME/android-studio/jbr"
  fi
fi
export PATH="$HOME/.cargo/bin:$ANDROID_HOME/platform-tools:$PATH"
exec npx tauri android "$@"
