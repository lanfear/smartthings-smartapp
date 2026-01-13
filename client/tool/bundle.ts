/// <reference types="node" />
/* eslint-disable import/order */
/* eslint-disable no-console */
import dotenv from 'dotenv';
// dotenv.config({path: './.env-sample'});
dotenv.config();
import path, {dirname} from 'path';
import fs from 'fs/promises';
import {build, type Plugin as EsBuildPlugin, type BuildOptions} from 'esbuild';
import replaceInFile from 'replace-in-file';
import {transform} from '@svgr/core';
import svgo from '@svgr/plugin-svgo';
import prettier from '@svgr/plugin-prettier';
import jsx from '@svgr/plugin-jsx';
import {dotenvRun} from '@dotenv-run/esbuild';
import {fileURLToPath} from 'url';

// Get the directory name of the current module
const localDir = dirname(fileURLToPath(import.meta.url));
const parentDir = path.join(localDir, '..');
const srcDir = path.join(parentDir, 'src');
const staticSrcDir = path.join(parentDir, 'public');
const buildDir = path.join(parentDir, 'build');
// const buildCssDir = path.join(buildDir, 'static', 'css');
const buildJsDir = path.join(buildDir, 'static', 'js');

// ***** PLUGINS *****
const svgrPlugin: EsBuildPlugin = {
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

const urlLoader = ({minify, sourceMaps}: {minify: BuildOptions['minify']; sourceMaps: BuildOptions['sourcemap']}): EsBuildPlugin => ({
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

        entryPoints: [(args.pluginData as {sourcePath: string}).sourcePath], // sourcePath is set from argsin onResolve
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
  const entryPoint = path.join(srcDir, 'index.tsx');
  const output = path.join(buildJsDir, 'index.js');

  await build({
    entryPoints: [entryPoint],
    bundle: true,
    minify: true,
    sourcemap: isLocal ? 'inline' : true,
    target: 'chrome106',
    outfile: output,
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

// const bundleWorkers = async (isLocal: boolean): Promise<void> => {
//    const workerFileNames = ['storage.worker.ts', 'other.worker.ts'];
//    const workerEntryPoints = workerFileNames.map(f => path.join(buildPaths.workerSourceDir, f));

//    await build({
//       entryPoints: workerEntryPoints,
//       bundle: true,
//       minify: true,
//       sourcemap: isLocal ? 'inline' : true,
//       target: 'chrome106',
//       outdir: buildJsDir,
//       plugins: [],
//       loader: {
//          '.png': 'binary'
//       }
//    });

//    // recording-storage-worker gets proxied off of main site, so copy it over to simulate that
//    if (isLocal) {
//       for (const workerFile of workerFileNames) {
//          const jsWorker = workerFile.replace('.ts', '.js');
//          await fs.copyFile(path.join(buildJsDir, jsWorker), path.join(distDir, jsWorker));
//       }
//    }
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

        if (!(process.env[matchIndex])) {
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
