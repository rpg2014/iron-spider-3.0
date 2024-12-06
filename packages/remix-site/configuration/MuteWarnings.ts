import type { Plugin } from "vite";

/**
 * Plugin to mute warnings during the build process. Currently used for sourcemap errors
 * @see https://github.com/vitejs/vite/issues/15012#issuecomment-1825035992
 * @param warningsToIgnore Array of [code, message] tuples to ignore
 * @returns Vite plugin
 */
export const muteWarningsPlugin = (warningsToIgnore: string[][]): Plugin => {
  const mutedMessages = new Set<string>();
  const seenWarnings = new Set<string>();

  return {
    name: "mute-warnings",
    enforce: "pre",
    config: userConfig => ({
      build: {
        rollupOptions: {
          onwarn(warning, defaultHandler) {
            // Track all warnings we see
            if (warning.code) {
              seenWarnings.add(`${warning.code}: ${warning.message}`);
            }

            // Check if this warning should be muted
            const shouldMute = warningsToIgnore.some(([code, message]) => {
              if (!warning.code) return false;

              // Exact code match and message includes the pattern
              const codeMatches = warning.code === code;
              const messageMatches = warning.message.toLowerCase().includes(message.toLowerCase());

              if (codeMatches && messageMatches) {
                mutedMessages.add([code, message].join(": "));
                return true;
              }
              return false;
            });

            if (shouldMute) {
              return;
            }

            // Handle warning normally if not muted
            if (userConfig.build?.rollupOptions?.onwarn) {
              userConfig.build.rollupOptions.onwarn(warning, defaultHandler);
            } else {
              defaultHandler(warning);
            }
          },
        },
      },
    }),
    closeBundle() {
      // Check which warnings we wanted to mute but never saw
      const unmutedWarnings = warningsToIgnore.filter(([code, message]) => !mutedMessages.has([code, message].join(": ")));

      if (unmutedWarnings.length > 0) {
        this.info("Some of your muted warnings never appeared during the build process:");
        unmutedWarnings.forEach(w => this.info(`- ${w.join(": ")}`));
        if (seenWarnings.size > 0) {
          this.info("\nWarnings that were seen during build:");
          seenWarnings.forEach(warning => this.info(`- ${warning}`));
        }
      }
    },
  };
};
