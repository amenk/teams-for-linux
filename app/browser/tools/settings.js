const instance = require('./instance');

let _Settings_config = new WeakMap();
let _Settings_ipcRenderer = new WeakMap();
class Settings {
	/**
	 * @param {object} config 
	 * @param {Electron.IpcRenderer} ipcRenderer 
	 */
	init(config, ipcRenderer) {
		_Settings_config.set(this, config);
		_Settings_ipcRenderer.set(this, ipcRenderer);
		this.ipcRenderer.on('get-teams-settings', retrieve);
		this.ipcRenderer.on('set-teams-settings', restore);
	}

	/**
	 * @type {object}
	 */
	get config() {
		return _Settings_config.get(this);
	}

	/**
	 * @type {Electron.IpcRenderer}
	 */
	get ipcRenderer() {
		return _Settings_ipcRenderer.get(this);
	}
}

/**
 * @param {Electron.IpcRendererEvent} event 
 */
async function retrieve(event) {
	const controller = await instance.whenControllerReadyAsync();
	const settings = {
		theme: controller.layoutService.getTheme(),
		chatDensity: controller.layoutService.getChatDensity(),
		devices: controller.callingService._deviceManagerService.deviceManager.getSelectedDevices()
	};
	settings.devices.camera = getDeviceLabelFromId(controller, settings.devices.camera, 1);
	settings.devices.microphone = getDeviceLabelFromId(controller, settings.devices.microphone, 2);
	settings.devices.speaker = getDeviceLabelFromId(controller, settings.devices.speaker, 3);
	event.sender.send('get-teams-settings', settings);
}

function getDeviceLabelFromId(controller, id, kind) {
	const item = controller.callingService._deviceManagerService.devices.filter(f => f.id === id && f.kind === kind)[0];
	return item ? item.label : '';
}

/**
 * @param {Electron.IpcRendererEvent} event 
 * @param {...any} args 
 */
async function restore(event, ...args) {
	const controller = await instance.whenControllerReadyAsync();
	controller.layoutService.setTheme(args[0].theme);
	controller.layoutService.setChatDensity(args[0].chatDensity);
	args[0].devices.camera = getDeviceIdFromLabel(controller,args[0].devices.camera,1);
	args[0].devices.microphone = getDeviceIdFromLabel(controller,args[0].devices.microphone,2);
	args[0].devices.speaker = getDeviceIdFromLabel(controller,args[0].devices.speaker,3);
	controller.callingService._deviceManagerService.deviceManager.selectDevices(args[0].devices);
	event.sender.send('set-teams-settings', true);
}

function getDeviceIdFromLabel(controller, label, kind) {
	const item = controller.callingService._deviceManagerService.devices.filter(f => f.label === label && f.kind === kind)[0];
	return item ? item.id : '';
}

module.exports = new Settings();