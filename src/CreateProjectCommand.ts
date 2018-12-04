/**
 * @file CreateProjectCommand.ts
 *
 * Copyright (C) 2018 | Giacomo Trudu aka `Wicker25`
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { spawn } from 'child_process';

import path = require('path');
import fs = require('fs');
import tar = require('tar');

import fetch from 'node-fetch';

import { Command } from 'commander';

const PURO_LOCAL_DIR = '.puro';
const PURO_TEMPLATE_FILENAME = 'template.tar.gz';
const PURO_DEFAULT_TEMPLATE = 'puro-framework/puro-skeleton';

const GITHUB_ARCHIVE_URL =
  'https://github.com/{template}/archive/{branch}.tar.gz';

/**
 * Command for creating a new project from a template.
 */
export class CreateProjectCommand {
  targetDir!: string;
  puroLocalDir!: string;
  archiveUrl!: string;
  archiveLocalPath!: string;

  /**
   * Constructor method.
   */
  constructor(program: Command) {
    program
      .command('create-project <targetDir>')
      .description('creates a new project from a template')
      .option('-t, --template <template>', 'which template to use')
      .action(this.exec.bind(this));
  }

  /**
   * Executes the command.
   *
   * @param {string} targetDir The target directory.
   * @param {any}    options   The command options.
   * @returns {Promise<void>}
   */
  async exec(targetDir: string, options: any) {
    this.parseTargetDir(targetDir);
    this.parsePuroLocalDir(targetDir);

    this.archiveUrl = this.getArchiveUrl(
      options.template || PURO_DEFAULT_TEMPLATE,
      'master'
    );

    this.archiveLocalPath = path.resolve(
      this.puroLocalDir,
      PURO_TEMPLATE_FILENAME
    );

    await this.downloadArchive();
    await this.extractArchive();
    await this.installDependencies();
  }

  /**
   * Builds the Puro's local directory.
   */
  private parseTargetDir(targetDir: string) {
    this.targetDir = targetDir;

    if (!fs.existsSync(this.targetDir)) {
      console.error(`(!) The directory "${targetDir}" does not exist`);
      process.exit(1);
    }
  }

  /**
   * Builds the Puro's local directory.
   */
  private parsePuroLocalDir(targetDir: string) {
    this.puroLocalDir = path.resolve(targetDir, PURO_LOCAL_DIR);

    if (!fs.existsSync(this.puroLocalDir)) {
      fs.mkdirSync(this.puroLocalDir);
    }
  }

  /**
   * Returns the archive URL for the specified template and version.
   */
  private getArchiveUrl(template: string, branch: string) {
    return GITHUB_ARCHIVE_URL.replace('{template}', template).replace(
      '{branch}',
      branch
    );
  }

  /**
   * Downloads the template archive from Github.
   */
  private async downloadArchive() {
    console.log(`Download ${this.archiveUrl} ...`);
    const response = await fetch(this.archiveUrl);

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(this.archiveLocalPath);

      response.body.pipe(output);
      response.body.on('error', err => {
        reject(err);
      });

      output.on('finish', function() {
        resolve();
      });
    });
  }

  /**
   * Extracts the template archive to the target directory.
   */
  private async extractArchive() {
    console.log('Extract template ...');

    await tar.extract({
      file: this.archiveLocalPath,
      cwd: this.targetDir,
      strip: 1
    });
  }

  /**
   * Installs the template dependencies.
   */
  private async installDependencies() {
    console.log('Install dependencies ...');

    const proc = spawn('yarn', ['install', '--cwd', this.targetDir]);

    proc.stdout.on('data', data => {
      process.stdout.write(data.toString());
    });

    proc.stderr.on('data', data => {
      process.stdout.write(data.toString());
    });

    proc.on('error', () => {
      console.error(`(!) Unable to execute "yarn"`);
      process.exit(1);
    });
  }
}
