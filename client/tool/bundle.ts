/* eslint-disable no-console */
import dotenv from 'dotenv';

// dotenv.config({path: './.env-sample'});
dotenv.config();

import path from 'path';
import fs from 'fs/promises';
import {build, Plugin, BuildOptions} from 'esbuild';
import replaceInFile from 'replace-in-file';
import {transform} from '@svgr/core';
import svgo from '@svgr/plugin-svgo';
import prettier from '@svgr/plugin-prettier';
import jsx from '@svgr/plugin-jsx';
import {dotenvRun} from '@dotenv-run/esbuild';

const parentDir = path.join(__dirname, '..');
// const nodeModules = path.join(parentDir, 'node_modules');
const srcDir = path.join(parentDir, 'src');
const staticSrcDir = path.join(parentDir, 'public');
const buildDir = path.join(parentDir, 'build');
// const buildCssDir = path.join(buildDir, 'static', 'css');
const buildJsDir = path.join(buildDir, 'static', 'js');

// ***** PLUGINS *****
const svgrPlugin: Plugin = {
  name: 'svgr',
  setup: builder => {
    builder.onLoad({filter: /\.svg$/}, async args => {
      const svg = await fs.readFile(args.path, 'utf8');
      if (args.suffix === '?url') {
        return {
          contents: svg,
          loader: 'dataurl'
        };
      }
      const contents = await transform(svg, {
        plugins: [svgo, jsx, prettier]
      }, {
        filePath: args.path
      });
      return {
        contents: contents,
        loader: 'jsx'
      };
    });
  }
};

const urlLoader = ({minify, sourceMaps}: {minify: BuildOptions['minify']; sourceMaps: BuildOptions['sourcemap']}): Plugin => ({
  name: 'url-loader',
  setup: builder => {
    builder.onResolve({filter: /\?dataurl$/}, args => {
      const filePath = path.resolve(args.resolveDir, args.path.slice(0, args.path.length - '?dataurl'.length));
      // if resolving .ts, tell esbuild it is .js so that it gets the correct mimetype
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      const pathForEsbuild = filePath.endsWith('.ts') ? `${filePath.slice(0, filePath.length - 4)}.js` : filePath;
      return {path: pathForEsbuild, namespace: 'dataurl', pluginData: {sourcePath: filePath}};
    });
    builder.onLoad({filter: /.*/, namespace: 'dataurl'}, async args => {
      const res = await builder.esbuild.build({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        entryPoints: [args.pluginData.sourcePath], // sourcePath is set from argsin onResolve
        bundle: true,
        minify: minify,
        sourcemap: sourceMaps,
        target: builder.initialOptions.target,
        plugins: builder.initialOptions.plugins,
        write: false
      });

      return {
        contents: res.outputFiles[0].contents,
        loader: 'dataurl'
      };
    });
  }
});

const dotEnv = dotenvRun({
  prefix: 'SMARTAPP_BUILDTIME_'
});

// ***** STEPS *****

const bundleIndex = async (isLocal: boolean): Promise<void> => {
  const uwcEntryPoint = path.join(srcDir, 'index.tsx');
  const uwcOutput = path.join(buildJsDir, 'index.js');

  await build({
    entryPoints: [uwcEntryPoint],
    bundle: true,
    minify: true,
    sourcemap: isLocal ? 'inline' : true,
    target: 'chrome106',
    outfile: uwcOutput,
    plugins: [
      dotEnv,
      svgrPlugin,
      urlLoader({
        minify: true,
        sourceMaps: isLocal ? 'inline' : false
      })
    ]
  });
};

// const bundleUwcWorkers = async (isLocal: boolean): Promise<void> => {
//    const workerFileNames = ['recording-storage.worker.ts', 'shader-thumbnailing.worker.ts'];
//    const uwcWorkerEntryPoints = workerFileNames.map(f => path.join(buildPaths.uwcWorkerSourceDir, f));

//    await build({
//       entryPoints: uwcWorkerEntryPoints,
//       bundle: true,
//       minify: true,
//       sourcemap: isLocal ? 'inline' : true,
//       target: 'chrome106',
//       outdir: uwcDistDir,
//       plugins: [],
//       loader: {
//          '.png': 'binary'
//       }
//    });

//    // recording-storage-worker gets proxied off of main site, so copy it over to simulate that
//    if (isLocal) {
//       for (const workerFile of workerFileNames) {
//          const jsWorker = workerFile.replace('.ts', '.js');
//          await fs.copyFile(path.join(uwcDistDir, jsWorker), path.join(uwcHarnessDistDir, jsWorker));
//       }
//    }
// };

// const copyCommonCppArtifactsToDist = async (): Promise<void> => {
//    console.info('Copying luma-wasm runtime files');
//    console.info('  FROM [', lumaArtifactDir, ']');
//    console.info('  TO   [', uwcDistDir, ']');
//    const ffmpegFiles = ['libavcodec.so', 'libavformat.so', 'libavutil.so', 'libswresample.so', 'libswscale.so'];
//    const lumaFiles = ['luma.js', 'luma.wasm'];
//    await Promise.all([...lumaFiles, ...ffmpegFiles].map(async f => {
//       console.info('  - ', f);
//       await fs.copyFile(path.join(lumaArtifactDir, f), path.join(uwcDistDir, f));
//    }));
//    // copy the ai model pairs by extension
//    await Promise.all(['.json', '.bin'].map(async ext => {
//       try {
//          await fs.rm(path.join(uwcDistDir, `${modelFileDestBaseName}${ext}`));
//       } catch {
//          // don't care, workflow seemed to require deletion of these files before re-creating, but if they dont exist or otherwise fail, nbd, continue procedure
//       }
//    }));
//    console.info('  - ', `${modelFileSourceBaseName}.bin`, '->', `${modelFileDestBaseName}.bin`);
//    await fs.copyFile(path.join(lumaArtifactDir, `${modelFileSourceBaseName}.bin`), path.join(uwcDistDir, `${modelFileDestBaseName}.bin`));
//    console.info('  - ', `${modelFileSourceBaseName}.json`, '->', `${modelFileDestBaseName}.json`);
//    await fs.copyFile(path.join(lumaArtifactDir, `${modelFileSourceBaseName}.json`), path.join(uwcDistDir, `${modelFileDestBaseName}.json`));
// };

const copyStaticAssetsToDist = async (): Promise<void> => {
  const src = path.join(staticSrcDir);
  const dst = path.join(buildDir);
  console.info('copying static assets from', src, 'to', dst);
  await fs.cp(src, dst, {recursive: true});
};

const doReplacesInBundleDir = async (): Promise<void> => {
  console.info('replacing .env vars in destination .html files');
  await replaceInFile({
    files: 'build/**/*.html', // this can be a glob
    from: [
      /__PROCESSENV__\w+__/g
    ],
    to: [
      match => {
        const matchIndex = `${match.replace('__PROCESSENV__', 'SMARTAPP_RUNTIME_').replace(/__$/, '').toUpperCase()}`;
        // not sure what in the toolchain needs to change for this to be recognized
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        if (!(Object as unknown as any).hasOwn(process.env, matchIndex)) {
          console.info('  ', match, 'not defined in .env, skipping replace in .html');
          return match;
        }
        console.info('  ', match, '->', process.env[matchIndex]);
        return process.env[matchIndex];
      }
    ]
  });
};

// ***** MAIN *****

const bundle = async (isLocal: boolean): Promise<void> => {
  console.debug('isLocal:', isLocal);
  try {
    try {
      await fs.access(buildDir);
    } catch {
      await fs.mkdir(buildDir, {recursive: true});
    }

    await Promise.all([bundleIndex(isLocal)]);
    // await copyCommonCppArtifactsToDist();
    await copyStaticAssetsToDist();
    await fs.copyFile(path.join(staticSrcDir, 'index.html'), path.join(buildDir, 'index.html'));
    await doReplacesInBundleDir();
  } catch (ex) {
    console.error('Error bundling', ex);
    throw ex;
  }
};

void (async () => {
  try {
    await bundle(true);
  } catch (e) {
    console.error('Error bundling', e);
  }
})();
