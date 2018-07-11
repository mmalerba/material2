import {src, dest} from 'gulp';
import {join} from 'path';
import {buildConfig} from '../build-config';

// These imports lack of type definitions.
const gulpSass = require('gulp-sass');
const gulpIf = require('gulp-if');
const gulpCleanCss = require('gulp-clean-css');

const includePaths = [
  join(buildConfig.projectDir, 'node_modules/')
];

/** Create a gulp task that builds SCSS files. */
export function buildScssTask(outputDir: string, sourceDir: string, minifyOutput = false) {
  return () => {
    return src(join(sourceDir, '**/*.scss'))
      .pipe(gulpSass({includePaths})
        .on('error', gulpSass.logError))
      .pipe(gulpIf(minifyOutput, gulpCleanCss()))
      .pipe(dest(outputDir));
  };
}
