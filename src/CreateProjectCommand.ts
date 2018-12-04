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

import path = require('path');
import fs = require('fs');
import tar = require('tar');

import fetch from 'node-fetch';

const PURO_LOCAL_DIR = '.puro';
const PURO_TEMPLATE_FILENAME = 'template.tar.gz';
const PURO_DEFAULT_TEMPLATE = 'puro-framework/puro-skeleton';

const GITHUB_ARCHIVE_URL =
  'https://github.com/{template}/archive/{branch}.tar.gz';

export class CreateProjectCommand {
  targetDir: string = '';
  puroLocaleDir: string = '';
  templateUrl: string = '';
  templateFilePath: string = '';

  constructor() {
    this.exec = this.exec.bind(this);
  }

  async exec(targetDir: string, cmd: any) {
    // TODO: check if the directory exists
    this.targetDir = targetDir;
    this.puroLocaleDir = path.resolve(targetDir, PURO_LOCAL_DIR);

    this.templateUrl = this.getTemplateUrl(
      cmd.template || PURO_DEFAULT_TEMPLATE,
      'master'
    );

    this.templateFilePath = path.resolve(
      this.puroLocaleDir,
      PURO_TEMPLATE_FILENAME
    );

    if (!fs.existsSync(this.puroLocaleDir)) {
      fs.mkdirSync(this.puroLocaleDir);
    }

    await this.downloadTemplate();
    await this.extractTemplate();

    // TODO; delete local directory
  }

  private getTemplateUrl(template: string, branch: string) {
    // TODO: validate template name
    return GITHUB_ARCHIVE_URL.replace('{template}', template).replace(
      '{branch}',
      branch
    );
  }

  private async downloadTemplate() {
    console.log(`Download ${this.templateUrl} ...`);

    const response = await fetch(this.templateUrl);

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(this.templateFilePath);

      response.body.pipe(output);
      response.body.on('error', err => {
        reject(err);
      });

      output.on('finish', function() {
        resolve();
      });
    });
  }

  private async extractTemplate() {
    console.log('Extract template ...');

    await tar.extract({
      file: this.templateFilePath,
      cwd: this.targetDir,
      strip: 1
    });
  }
}
