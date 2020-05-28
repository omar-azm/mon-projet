/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
"use strict";const perf=require("./vs/base/common/performance"),lp=require("./vs/base/node/languagePacks");perf.mark("main:started");const path=require("path"),fs=require("fs"),os=require("os"),bootstrap=require("./bootstrap"),paths=require("./paths"),product=require("../product.json"),{app:app,protocol:protocol}=require("electron"),portable=bootstrap.configurePortable();bootstrap.enableASARSupport();const args=parseCLIArgs(),userDataPath=getUserDataPath(args);app.setPath("userData",userDataPath),portable.isPortable&&app.setAppLogsPath(path.join(userDataPath,"logs")),setCurrentWorkingDirectory(),protocol.registerSchemesAsPrivileged([{scheme:"vscode-resource",privileges:{secure:!0,supportFetchAPI:!0,corsEnabled:!0}}]),registerListeners();const nodeCachedDataDir=getNodeCachedDir(),argvConfig=configureCommandlineSwitchesSync(args);process.env.SNAP&&(delete process.env.GDK_PIXBUF_MODULE_FILE,delete process.env.GDK_PIXBUF_MODULEDIR);let nlsConfigurationPromise=void 0
;const metaDataFile=path.join(__dirname,"nls.metadata.json"),locale=getUserDefinedLocale(argvConfig);function startup(e,r){r._languagePackSupport=!0,process.env.VSCODE_NLS_CONFIG=JSON.stringify(r),process.env.VSCODE_NODE_CACHED_DATA_DIR=e||"",perf.mark("willLoadMainBundle"),require("./bootstrap-amd").load("vs/code/electron-main/main",()=>{perf.mark("didLoadMainBundle")})}async function onReady(){perf.mark("main:appReady");try{const[e,r]=await Promise.all([nodeCachedDataDir.ensureExists(),resolveNlsConfiguration()]);startup(e,r)}catch(e){console.error(e)}}function configureCommandlineSwitchesSync(e){const r=["disable-hardware-acceleration","disable-color-correct-rendering","force-color-profile"];"linux"===process.platform&&r.push("force-renderer-accessibility");const t=readArgvConfigSync();Object.keys(t).forEach(e=>{if(-1===r.indexOf(e))return;const a=t[e]
;"force-color-profile"===e?a&&app.commandLine.appendSwitch(e,a):!0!==a&&"true"!==a||("disable-hardware-acceleration"===e?app.disableHardwareAcceleration():app.commandLine.appendSwitch(e))});const a=getJSFlags(e);return a&&app.commandLine.appendSwitch("js-flags",a),app.commandLine.appendSwitch("disable-features","LayoutNG"),t}function readArgvConfigSync(){const e=getArgvConfigPath();let r;try{r=JSON.parse(stripComments(fs.readFileSync(e).toString()))}catch(r){r&&"ENOENT"===r.code?createDefaultArgvConfigSync(e):console.warn(`Unable to read argv.json configuration file in ${e}, falling back to defaults (${r})`)}return r||(r={"disable-color-correct-rendering":!0}),r}function createDefaultArgvConfigSync(e){try{const r=path.dirname(e);fs.existsSync(r)||fs.mkdirSync(r);const t=path.join(userDataPath,"User","locale.json"),a=getLegacyUserDefinedLocaleSync(t);if(a)try{fs.unlinkSync(t)}catch(e){}
const o=["// This configuration file allows you to pass permanent command line arguments to VS Code.","// Only a subset of arguments is currently supported to reduce the likelyhood of breaking","// the installation.","//","// PLEASE DO NOT CHANGE WITHOUT UNDERSTANDING THE IMPACT","//","// NOTE: Changing this file requires a restart of VS Code.","{","\t// Use software rendering instead of hardware accelerated rendering.","\t// This can help in cases where you see rendering issues in VS Code.",'\t// "disable-hardware-acceleration": true,',"","\t// Enabled by default by VS Code to resolve color issues in the renderer","\t// See https://github.com/Microsoft/vscode/issues/51791 for details",'\t"disable-color-correct-rendering": true'];a&&(o[o.length-1]=`${o[o.length-1]},`,o.push(""),o.push("\t// Display language of VS Code"),o.push(`\t"locale": "${a}"`)),o.push("}"),fs.writeFileSync(e,o.join("\n"))}catch(r){console.error(`Unable to create argv.json configuration file in ${e}, falling back to defaults (${r})`)}}
function getArgvConfigPath(){const e=process.env.VSCODE_PORTABLE;if(e)return path.join(e,"argv.json");let r=product.dataFolderName;return process.env.VSCODE_DEV&&(r=`${r}-dev`),path.join(os.homedir(),r,"argv.json")}function getJSFlags(e){const r=[];return e["js-flags"]&&r.push(e["js-flags"]),e["max-memory"]&&!/max_old_space_size=(\d+)/g.exec(e["js-flags"])&&r.push(`--max_old_space_size=${e["max-memory"]}`),r.length>0?r.join(" "):null}function getUserDataPath(e){return portable.isPortable?path.join(portable.portableDataPath,"user-data"):path.resolve(e["user-data-dir"]||paths.getDefaultUserDataPath(process.platform))}function parseCLIArgs(){return require("minimist")(process.argv,{string:["user-data-dir","locale","js-flags","max-memory"]})}function setCurrentWorkingDirectory(){try{"win32"===process.platform?(process.env.VSCODE_CWD=process.cwd(),process.chdir(path.dirname(app.getPath("exe")))):process.env.VSCODE_CWD&&process.chdir(process.env.VSCODE_CWD)}catch(e){console.error(e)}}function registerListeners(){
const e=[];global.macOpenFiles=e,app.on("open-file",(function(r,t){e.push(t)}));const r=[],t=function(e,t){e.preventDefault(),r.push(t)};app.on("will-finish-launching",(function(){app.on("open-url",t)})),global.getOpenUrls=function(){return app.removeListener("open-url",t),r}}function getNodeCachedDir(){return new class{constructor(){this.value=this._compute()}async ensureExists(){try{return await bootstrap.mkdirp(this.value),this.value}catch(e){}}_compute(){if(process.argv.indexOf("--no-cached-data")>0)return;if(process.env.VSCODE_DEV)return;const e=product.commit;return e?path.join(userDataPath,"CachedData",e):void 0}}}async function resolveNlsConfiguration(){let e=nlsConfigurationPromise?await nlsConfigurationPromise:void 0;if(!e){let r=app.getLocale();r?(r=r.toLowerCase(),(e=await lp.getNLSConfiguration(product.commit,userDataPath,metaDataFile,r))||(e={locale:r,availableLanguages:{}})):e={locale:"en",availableLanguages:{}}}return e}function stripComments(e){
return e.replace(/("(?:[^\\"]*(?:\\.)?)*")|('(?:[^\\']*(?:\\.)?)*')|(\/\*(?:\r?\n|.)*?\*\/)|(\/{2,}.*?(?:(?:\r?\n)|$))/g,(function(e,r,t,a,o){if(a)return"";if(o){const e=o.length;return e>2&&"\n"===o[e-1]?"\r"===o[e-2]?"\r\n":"\n":""}return e}))}function getUserDefinedLocale(e){const r=args.locale;return r?r.toLowerCase():e.locale&&"string"==typeof e.locale?e.locale.toLowerCase():void 0}function getLegacyUserDefinedLocaleSync(e){try{const r=stripComments(fs.readFileSync(e).toString()),t=JSON.parse(r).locale;return t&&"string"==typeof t?t.toLowerCase():void 0}catch(e){}}locale&&(nlsConfigurationPromise=lp.getNLSConfiguration(product.commit,userDataPath,metaDataFile,locale)),app.once("ready",(function(){if(args.trace){const e=require("electron").contentTracing,r={categoryFilter:args["trace-category-filter"]||"*",traceOptions:args["trace-options"]||"record-until-full,enable-sampling"};e.startRecording(r).finally(()=>onReady())}else onReady()}));
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/5763d909d5f12fe19f215cbfdd29a91c0fa9208a/core/main.js.map
