import type { Plugin } from "vite";
/**
 * Plugin to mute warnings during the build process.  Currently used for sourcemap errors
 * @see https://github.com/vitejs/vite/issues/15012#issuecomment-1825035992
 * @param warningsToIgnore
 * @returns
 */
export const muteWarningsPlugin = (warningsToIgnore: string[][]): Plugin => {
  const mutedMessages = new Set();
  return {
    name: "mute-warnings",
    enforce: "pre",
    config: userConfig => ({
      build: {
        rollupOptions: {
          onwarn(warning, defaultHandler) {
            if (warning.code) {
              const muted = warningsToIgnore.find(([code, message]) => code == warning.code && warning.message.includes(message));

              if (muted) {
                mutedMessages.add(muted.join());
                return;
              }
            }

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
      const diff = warningsToIgnore.filter(x => !mutedMessages.has(x.join()));
      if (diff.length > 0) {
        this.warn("Some of your muted warnings never appeared during the build process:");
        diff.forEach(m => this.warn(`- ${m.join(": ")}`));
      }
    },
  };
};
