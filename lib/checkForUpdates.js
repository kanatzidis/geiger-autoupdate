const request = require('request');
const { autoUpdater, dialog } = require('electron');
const path = require('path');

const host = process.env.GEIGER_ENV === 'dev' ? 'http://localhost:3000' : 'https://geiger.alabastertechnologies.com';

// taken from https://github.com/sindresorhus/electron-is-dev
function isDev() {
  return process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath);
}

function check_for_updates() {
  if(!isDev()) {
    const main = path.dirname(require.main.filename);
    console.log(main);
    console.log(__dirname);
    console.log(__filename);
    const geigerPkgPath = path.join(main, 'package.json');
    const appPkgPath = path.join(main, 'app/package.json');
    
    const geigerPkg = require(geigerPkgPath);
    const pkg = require(appPkgPath);

    const linux = process.platform === 'linux';

    var updateUrl = host + '/updates/' + geigerPkg.userNs + '/' + pkg.name + '/' + pkg.version + '/' + process.platform;
    request.get(updateUrl, function(err, res, body) {
      console.log(err, body);
      if(err) throw err;
      if(typeof body === 'string') body = JSON.parse(body);
      if(res.statusCode == 200) {
        console.log(body);
        if(linux) {
          return dialog.showMessageBox({
            title: 'An update is available',
            message: 'A new version is available (' + body.version + '). You can download this update here:' + body.url,
            buttons: ['Close'],
          }, function(result) {
          });
        }
        dialog.showMessageBox({
          title: 'An update is available',
          message: 'A new version is available (' + body.version + '). Would you like to download this update?',
          buttons: ['Download', 'Skip for now'],
        }, function(result) {
          if(result == 0) {
            autoUpdater.setFeedUrl(updateUrl);
            autoUpdater.on('error', function(err) {
              dialog.showErrorBox('Update error', err);
            }).on('update-downloaded', function() {
              dialog.showMessageBox({
                title: 'Update ready to install',
                message: 'Successfully downloaded update. Click to update and restart.',
                buttons: ['Update and restart'],
              }, function(result) {
                autoUpdater.quitAndInstall();
              });
            });
          }
        });

      }
    });
  }
}

module.exports = check_for_updates;
